-- Amora Fut | Black Friday 2026 | cancelamento manual de reservas
-- Aplicar SOMENTE no Supabase de TESTE: fdkvghcxfjqtiwwfjkjz
-- Devolve ao estoque as quantidades reservadas e impede confirmação posterior.

alter table public.amora_bf_orders
  add column if not exists cancelled_at timestamptz;

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
  v_old_qty integer;
  v_restored integer := 0;
begin
  if auth.uid() is null or not exists (
    select 1
    from public.amora_admin_users
    where user_id = auth.uid()
  ) then
    raise exception 'Acesso administrativo necessário.';
  end if;

  -- Bloqueia o pedido para impedir duas ações administrativas simultâneas.
  select *
    into v_order
  from public.amora_bf_orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Pedido não encontrado.';
  end if;

  if v_order.status <> 'reserved' then
    raise exception 'Somente reservas ativas podem ser canceladas. Status atual: %.', v_order.status;
  end if;

  -- Se já venceu, a rotina automática de expiração deve ser responsável
  -- pela devolução, evitando que o estoque seja contado duas vezes.
  if v_order.expires_at <= now() then
    raise exception 'Esta reserva já expirou. Atualize a lista para ver o status atualizado.';
  end if;

  for r in
    select id, product_id, size, quantity
    from public.amora_bf_reservations
    where order_id = p_order_id
      and status = 'reserved'
    order by product_id, size, id
    for update
  loop
    select stock
      into v_stock
    from public.amora_products
    where id = r.product_id
    for update;

    if not found then
      raise exception 'Produto % não encontrado; cancelamento interrompido para preservar a consistência do estoque.', r.product_id;
    end if;

    v_old_qty := coalesce((v_stock ->> r.size)::integer, 0);

    update public.amora_products
    set stock = jsonb_set(
      coalesce(stock, '{}'::jsonb),
      array[r.size],
      to_jsonb(v_old_qty + r.quantity),
      true
    )
    where id = r.product_id;

    update public.amora_bf_reservations
    set status = 'cancelled'
    where id = r.id
      and status = 'reserved';

    v_restored := v_restored + r.quantity;
  end loop;

  if v_restored = 0 then
    raise exception 'Nenhum item reservado foi encontrado para devolver ao estoque.';
  end if;

  update public.amora_bf_orders
  set status = 'cancelled',
      cancelled_at = now(),
      updated_at = now()
  where id = p_order_id
    and status = 'reserved';

  if not found then
    raise exception 'Não foi possível concluir o cancelamento do pedido.';
  end if;

  return jsonb_build_object(
    'order_id', p_order_id,
    'status', 'cancelled',
    'restored_units', v_restored,
    'cancelled_at', now()
  );
end;
$$;

revoke all on function public.amora_bf_cancel_order(uuid) from public, anon;
grant execute on function public.amora_bf_cancel_order(uuid) to authenticated;
