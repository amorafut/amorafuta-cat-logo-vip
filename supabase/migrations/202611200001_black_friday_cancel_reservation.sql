-- Cancelamento administrativo de reservas Black Friday com devolução segura do estoque.
create or replace function public.amora_bf_cancel_order(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.amora_bf_orders%rowtype;
  r record;
  v_stock jsonb;
  v_qty integer;
  v_restored integer := 0;
begin
  if auth.uid() is null or not exists (
    select 1 from public.amora_admin_users where user_id = auth.uid()
  ) then
    raise exception 'Acesso administrativo necessário.';
  end if;

  select * into v_order
  from public.amora_bf_orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Pedido não encontrado.';
  end if;
  if v_order.status <> 'reserved' then
    raise exception 'Somente reservas ativas podem ser canceladas. Status atual: %.', v_order.status;
  end if;

  -- Lock e devolução das unidades ainda reservadas. A transação evita devolução parcial.
  for r in
    select id, product_id, size, quantity
    from public.amora_bf_reservations
    where order_id = p_order_id and status = 'reserved'
    for update
  loop
    select stock into v_stock
    from public.amora_products
    where id = r.product_id
    for update;

    if found then
      v_qty := coalesce((v_stock ->> r.size)::integer, 0);
      update public.amora_products
      set stock = jsonb_set(coalesce(stock, '{}'::jsonb), array[r.size],
                            to_jsonb(v_qty + r.quantity), true)
      where id = r.product_id;
    end if;

    update public.amora_bf_reservations
    set status = 'cancelled'
    where id = r.id and status = 'reserved';
    v_restored := v_restored + r.quantity;
  end loop;

  update public.amora_bf_orders
  set status = 'cancelled', updated_at = now()
  where id = p_order_id;

  return jsonb_build_object(
    'order_id', p_order_id,
    'status', 'cancelled',
    'restored_units', v_restored
  );
end;
$$;

revoke all on function public.amora_bf_cancel_order(uuid) from public, anon;
grant execute on function public.amora_bf_cancel_order(uuid) to authenticated;
