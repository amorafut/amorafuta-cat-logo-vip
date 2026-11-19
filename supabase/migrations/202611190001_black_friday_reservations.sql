-- Amora Fut | Black Friday 2026 | ambiente de TESTE
-- Aplicar somente no projeto Supabase de teste:
-- fdkvghcxfjqtiwwfjkjz
-- Esta migration usa amora_products.stock como JSONB: {"P":2,"M":1,...}
-- Não executar no projeto de produção.

create table if not exists public.amora_bf_orders (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'reserved' check (status in ('reserved','confirmed','expired','cancelled')),
  customer_name text,
  customer_phone text,
  shipping_method text,
  shipping_amount numeric(10,2) not null default 0,
  products_subtotal numeric(10,2) not null default 0,
  order_total numeric(10,2) not null default 0,
  whatsapp_message text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '3 hours',
  confirmed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.amora_bf_reservations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.amora_bf_orders(id) on delete cascade,
  product_id text not null,
  size text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  status text not null default 'reserved' check (status in ('reserved','confirmed','expired','cancelled'))
);

create index if not exists amora_bf_orders_status_expiry_idx
  on public.amora_bf_orders(status, expires_at);
create index if not exists amora_bf_reservations_order_idx
  on public.amora_bf_reservations(order_id);
create index if not exists amora_bf_reservations_product_size_idx
  on public.amora_bf_reservations(product_id, size, status);

alter table public.amora_bf_orders enable row level security;
alter table public.amora_bf_reservations enable row level security;

-- Nenhum acesso direto anônimo às tabelas; operações passam pelas RPCs abaixo.
revoke all on public.amora_bf_orders from anon, authenticated;
revoke all on public.amora_bf_reservations from anon, authenticated;

create or replace function public.amora_bf_expire_reservations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  restored integer := 0;
  old_qty integer;
  current_stock jsonb;
begin
  for r in
    select id, order_id, product_id, size, quantity
    from public.amora_bf_reservations
    where status = 'reserved' and expires_at <= now()
    for update
  loop
    select stock into current_stock
    from public.amora_products
    where id = r.product_id
    for update;

    if found then
      old_qty := coalesce((current_stock ->> r.size)::integer, 0);
      update public.amora_products
      set stock = jsonb_set(coalesce(stock, '{}'::jsonb), array[r.size],
                            to_jsonb(old_qty + r.quantity), true)
      where id = r.product_id;
    end if;

    update public.amora_bf_reservations set status = 'expired' where id = r.id;
    restored := restored + 1;
  end loop;

  update public.amora_bf_orders o
  set status = 'expired', updated_at = now()
  where o.status = 'reserved'
    and o.expires_at <= now()
    and not exists (
      select 1 from public.amora_bf_reservations x
      where x.order_id = o.id and x.status = 'reserved'
    );

  return restored;
end;
$$;

create or replace function public.amora_bf_reserve_order(
  p_items jsonb,
  p_shipping_method text default null,
  p_shipping_amount numeric default 0,
  p_customer_name text default null,
  p_customer_phone text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid := gen_random_uuid();
  v_item jsonb;
  v_product public.amora_products%rowtype;
  v_size text;
  v_qty integer;
  v_stock integer;
  v_unit numeric(10,2);
  v_subtotal numeric(10,2) := 0;
  v_expires timestamptz := now() + interval '3 hours';
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Carrinho vazio.';
  end if;
  if coalesce(p_shipping_amount, 0) < 0 then
    raise exception 'Valor de frete inválido.';
  end if;

  perform public.amora_bf_expire_reservations();

  insert into public.amora_bf_orders(
    id, customer_name, customer_phone, shipping_method, shipping_amount,
    products_subtotal, order_total, expires_at
  ) values (
    v_order_id, p_customer_name, p_customer_phone, p_shipping_method,
    coalesce(p_shipping_amount,0), 0, 0, v_expires
  );

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_size := upper(coalesce(v_item->>'size',''));
    v_qty := greatest(1, coalesce((v_item->>'quantity')::integer, 1));
    if v_size not in ('P','M','G','GG','3G') then
      raise exception 'Tamanho inválido: %', v_size;
    end if;

    select * into v_product
    from public.amora_products
    where id = v_item->>'product_id' and published = true
    for update;

    if not found then
      raise exception 'Produto não encontrado ou indisponível.';
    end if;

    v_stock := coalesce((v_product.stock ->> v_size)::integer, 0);
    if v_stock < v_qty then
      raise exception 'O produto % no tamanho % não está mais disponível.', v_product.name, v_size;
    end if;

    v_unit := coalesce((v_item->>'unit_price')::numeric, 0);
    if v_unit < 0 then raise exception 'Preço inválido.'; end if;

    update public.amora_products
    set stock = jsonb_set(coalesce(stock, '{}'::jsonb), array[v_size],
                          to_jsonb(v_stock - v_qty), true)
    where id = v_product.id;

    insert into public.amora_bf_reservations(
      order_id, product_id, size, quantity, unit_price, expires_at
    ) values (
      v_order_id, v_product.id, v_size, v_qty, v_unit, v_expires
    );

    v_subtotal := v_subtotal + (v_unit * v_qty);
  end loop;

  update public.amora_bf_orders
  set products_subtotal = v_subtotal,
      order_total = v_subtotal + coalesce(p_shipping_amount,0),
      updated_at = now()
  where id = v_order_id;

  return jsonb_build_object(
    'order_id', v_order_id,
    'status', 'reserved',
    'expires_at', v_expires,
    'products_subtotal', v_subtotal,
    'shipping_amount', coalesce(p_shipping_amount,0),
    'order_total', v_subtotal + coalesce(p_shipping_amount,0)
  );
exception when others then
  -- A exceção reverte toda a transação, inclusive o estoque já alterado.
  raise;
end;
$$;

create or replace function public.amora_bf_confirm_order(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.amora_bf_orders%rowtype;
begin
  if auth.uid() is null or not exists (
    select 1 from public.amora_admin_users where user_id = auth.uid()
  ) then
    raise exception 'Acesso administrativo necessário.';
  end if;

  select * into v_order from public.amora_bf_orders
  where id = p_order_id for update;

  if not found or v_order.status <> 'reserved' or v_order.expires_at <= now() then
    raise exception 'Reserva não está mais ativa.';
  end if;

  update public.amora_bf_reservations
  set status = 'confirmed'
  where order_id = p_order_id and status = 'reserved';

  update public.amora_bf_orders
  set status = 'confirmed', confirmed_at = now(), updated_at = now()
  where id = p_order_id;

  return jsonb_build_object('order_id', p_order_id, 'status', 'confirmed');
end;
$$;

create or replace function public.amora_bf_update_shipping(
  p_order_id uuid,
  p_shipping_method text,
  p_shipping_amount numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.amora_bf_orders%rowtype;
begin
  if auth.uid() is null or not exists (
    select 1 from public.amora_admin_users where user_id = auth.uid()
  ) then
    raise exception 'Acesso administrativo necessário.';
  end if;
  if p_shipping_amount < 0 then raise exception 'Valor de frete inválido.'; end if;

  select * into v_order from public.amora_bf_orders
  where id = p_order_id for update;
  if not found then raise exception 'Pedido não encontrado.'; end if;

  update public.amora_bf_orders
  set shipping_method = p_shipping_method,
      shipping_amount = p_shipping_amount,
      order_total = products_subtotal + p_shipping_amount,
      updated_at = now()
  where id = p_order_id;

  return jsonb_build_object(
    'order_id', p_order_id,
    'products_subtotal', v_order.products_subtotal,
    'shipping_amount', p_shipping_amount,
    'order_total', v_order.products_subtotal + p_shipping_amount
  );
end;
$$;

revoke all on function public.amora_bf_reserve_order(jsonb,text,numeric,text,text) from public;
revoke all on function public.amora_bf_confirm_order(uuid) from public, anon;
revoke all on function public.amora_bf_update_shipping(uuid,text,numeric) from public, anon;
revoke all on function public.amora_bf_expire_reservations() from public, anon, authenticated;
grant execute on function public.amora_bf_reserve_order(jsonb,text,numeric,text,text) to anon, authenticated;
grant execute on function public.amora_bf_confirm_order(uuid) to authenticated;
grant execute on function public.amora_bf_update_shipping(uuid,text,numeric) to authenticated;


-- Leitura dos pedidos e reservas somente por administradores autenticados.
drop policy if exists "bf orders admin read" on public.amora_bf_orders;
create policy "bf orders admin read" on public.amora_bf_orders
for select to authenticated
using (exists (select 1 from public.amora_admin_users a where a.user_id = auth.uid()));

drop policy if exists "bf reservations admin read" on public.amora_bf_reservations;
create policy "bf reservations admin read" on public.amora_bf_reservations
for select to authenticated
using (exists (select 1 from public.amora_admin_users a where a.user_id = auth.uid()));

-- Agendamento automático: executa a cada minuto se pg_cron já estiver habilitado.
do $
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid)
    from cron.job
    where jobname = 'amora-bf-expire-every-minute';
    perform cron.schedule(
      'amora-bf-expire-every-minute',
      '* * * * *',
      'select public.amora_bf_expire_reservations();'
    );
  end if;
exception when undefined_table or undefined_function then
  raise notice 'pg_cron não está habilitado. Ative a extensão pg_cron no Supabase de teste para expiração automática pontual.';
end $;

-- Expiração é executada quando uma nova reserva é solicitada.
-- A expiração automática exata depende de pg_cron estar habilitado no projeto.
