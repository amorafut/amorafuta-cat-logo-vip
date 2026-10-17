-- Amora Fut: catálogo no Supabase
-- Execute no SQL Editor do projeto clvhacmmmnltnzlkfcwd.
-- O bucket amora-product-images já foi criado no painel.

create table if not exists public.amora_admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.amora_products (
  id text primary key,
  name text not null,
  team text not null default '',
  category text not null default 'Brasileiras',
  version text not null default 'Torcedor',
  price numeric(10,2) not null default 0,
  old_price numeric(10,2),
  badge text not null default '',
  description text not null default '',
  published boolean not null default true,
  sold_out boolean not null default false,
  stock jsonb not null default '{"P":0,"M":0,"G":0,"GG":0,"3G":0}'::jsonb,
  images jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.amora_admin_users enable row level security;
alter table public.amora_products enable row level security;

drop policy if exists "Amora admins can read own access" on public.amora_admin_users;
create policy "Amora admins can read own access"
on public.amora_admin_users for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Amora public reads published products" on public.amora_products;
create policy "Amora public reads published products"
on public.amora_products for select to anon, authenticated
using (published = true);

drop policy if exists "Amora admins manage products" on public.amora_products;
create policy "Amora admins manage products"
on public.amora_products for all to authenticated
using (exists (
  select 1 from public.amora_admin_users a
  where a.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.amora_admin_users a
  where a.user_id = (select auth.uid())
));

-- Leitura pública das imagens do bucket.
drop policy if exists "Amora public reads product images" on storage.objects;
create policy "Amora public reads product images"
on storage.objects for select to anon, authenticated
using (bucket_id = 'amora-product-images');

-- Upload, edição e exclusão de imagens apenas para administradores autorizados.
drop policy if exists "Amora admins upload product images" on storage.objects;
create policy "Amora admins upload product images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'amora-product-images'
  and exists (select 1 from public.amora_admin_users a where a.user_id = (select auth.uid()))
);

drop policy if exists "Amora admins update product images" on storage.objects;
create policy "Amora admins update product images"
on storage.objects for update to authenticated
using (
  bucket_id = 'amora-product-images'
  and exists (select 1 from public.amora_admin_users a where a.user_id = (select auth.uid()))
)
with check (
  bucket_id = 'amora-product-images'
  and exists (select 1 from public.amora_admin_users a where a.user_id = (select auth.uid()))
);

drop policy if exists "Amora admins delete product images" on storage.objects;
create policy "Amora admins delete product images"
on storage.objects for delete to authenticated
using (
  bucket_id = 'amora-product-images'
  and exists (select 1 from public.amora_admin_users a where a.user_id = (select auth.uid()))
);
