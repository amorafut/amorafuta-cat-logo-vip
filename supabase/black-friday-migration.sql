-- Amora Fut | Black Friday
-- Execute uma única vez no Supabase: SQL Editor > New query > Run.
alter table public.amora_products
  add column if not exists bf_mode text not null default 'bf1',
  add column if not exists bf2_price numeric(10,2);
update public.amora_products set bf_mode='bf1' where bf_mode is null or bf_mode not in ('bf1','bf2');
alter table public.amora_products drop constraint if exists amora_products_bf_mode_check;
alter table public.amora_products add constraint amora_products_bf_mode_check check (bf_mode in ('bf1','bf2'));
alter table public.amora_products drop constraint if exists amora_products_bf2_price_check;
alter table public.amora_products add constraint amora_products_bf2_price_check check (bf_mode <> 'bf2' or (bf2_price is not null and bf2_price > 0));
