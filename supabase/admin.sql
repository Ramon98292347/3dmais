-- Acesso administrativo seguro ao catálogo e upload de imagens.
-- Execute depois de supabase/catalog.sql no SQL Editor do Supabase.
-- Não crie uma política de escrita para anon: todas as operações exigem um
-- usuário autenticado que esteja explicitamente listado em catalog_admins.

begin;

create table if not exists public.catalog_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.catalog_admins enable row level security;
revoke all on table public.catalog_admins from public, anon, authenticated;
grant all on table public.catalog_admins to service_role;

create or replace function public.is_catalog_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.catalog_admins as admins
    where admins.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_catalog_admin() from public, anon;
grant execute on function public.is_catalog_admin() to authenticated, service_role;

-- Permite que a tela de login saiba se deve oferecer o cadastro inicial.
create or replace function public.catalog_has_admins()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.catalog_admins);
$$;

revoke all on function public.catalog_has_admins() from public;
grant execute on function public.catalog_has_admins() to anon, authenticated, service_role;

-- A trava transacional garante que apenas uma conta consiga reivindicar a
-- instalação quando dois cadastros iniciais acontecerem ao mesmo tempo.
create or replace function public.claim_first_catalog_admin()
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    return false;
  end if;

  perform pg_advisory_xact_lock(724190381);

  if exists (select 1 from public.catalog_admins) then
    return exists (
      select 1 from public.catalog_admins where user_id = current_user_id
    );
  end if;

  insert into public.catalog_admins (user_id) values (current_user_id);
  return true;
end;
$$;

revoke all on function public.claim_first_catalog_admin() from public, anon;
grant execute on function public.claim_first_catalog_admin() to authenticated, service_role;

create or replace function public.admin_list_products()
returns setof public.products
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_catalog_admin() then
    raise exception 'Administrator access required';
  end if;
  return query
    select p.* from public.products as p order by p.created_at desc;
end;
$$;

revoke all on function public.admin_list_products() from public, anon;
grant execute on function public.admin_list_products() to authenticated, service_role;

grant insert, update, delete on table public.categories to authenticated;
grant insert, update, delete on table public.products to authenticated;
grant insert, update, delete on table public.product_images to authenticated;
grant insert, update, delete on table public.product_options to authenticated;

drop policy if exists categories_admin_read on public.categories;
create policy categories_admin_read on public.categories
  for select to authenticated using ((select public.is_catalog_admin()));
drop policy if exists products_admin_read on public.products;
create policy products_admin_read on public.products
  for select to authenticated using ((select public.is_catalog_admin()));
drop policy if exists product_images_admin_read on public.product_images;
create policy product_images_admin_read on public.product_images
  for select to authenticated using ((select public.is_catalog_admin()));
drop policy if exists product_options_admin_read on public.product_options;
create policy product_options_admin_read on public.product_options
  for select to authenticated using ((select public.is_catalog_admin()));

drop policy if exists categories_admin_insert on public.categories;
create policy categories_admin_insert on public.categories
  for insert to authenticated with check ((select public.is_catalog_admin()));
drop policy if exists categories_admin_update on public.categories;
create policy categories_admin_update on public.categories
  for update to authenticated
  using ((select public.is_catalog_admin()))
  with check ((select public.is_catalog_admin()));
drop policy if exists categories_admin_delete on public.categories;
create policy categories_admin_delete on public.categories
  for delete to authenticated using ((select public.is_catalog_admin()));

drop policy if exists products_admin_insert on public.products;
create policy products_admin_insert on public.products
  for insert to authenticated with check ((select public.is_catalog_admin()));
drop policy if exists products_admin_update on public.products;
create policy products_admin_update on public.products
  for update to authenticated
  using ((select public.is_catalog_admin()))
  with check ((select public.is_catalog_admin()));
drop policy if exists products_admin_delete on public.products;
create policy products_admin_delete on public.products
  for delete to authenticated using ((select public.is_catalog_admin()));

drop policy if exists product_images_admin_insert on public.product_images;
create policy product_images_admin_insert on public.product_images
  for insert to authenticated with check ((select public.is_catalog_admin()));
drop policy if exists product_images_admin_update on public.product_images;
create policy product_images_admin_update on public.product_images
  for update to authenticated
  using ((select public.is_catalog_admin()))
  with check ((select public.is_catalog_admin()));
drop policy if exists product_images_admin_delete on public.product_images;
create policy product_images_admin_delete on public.product_images
  for delete to authenticated using ((select public.is_catalog_admin()));

drop policy if exists product_options_admin_insert on public.product_options;
create policy product_options_admin_insert on public.product_options
  for insert to authenticated with check ((select public.is_catalog_admin()));
drop policy if exists product_options_admin_update on public.product_options;
create policy product_options_admin_update on public.product_options
  for update to authenticated
  using ((select public.is_catalog_admin()))
  with check ((select public.is_catalog_admin()));
drop policy if exists product_options_admin_delete on public.product_options;
create policy product_options_admin_delete on public.product_options
  for delete to authenticated using ((select public.is_catalog_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists product_images_public_read on storage.objects;
create policy product_images_public_read on storage.objects
  for select to public using (bucket_id = 'product-images');
drop policy if exists product_images_admin_upload on storage.objects;
create policy product_images_admin_upload on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'product-images'
    and (select public.is_catalog_admin())
  );
drop policy if exists product_images_admin_update on storage.objects;
create policy product_images_admin_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'product-images'
    and (select public.is_catalog_admin())
  )
  with check (
    bucket_id = 'product-images'
    and (select public.is_catalog_admin())
  );
drop policy if exists product_images_admin_delete on storage.objects;
create policy product_images_admin_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'product-images'
    and (select public.is_catalog_admin())
  );

commit;

-- Com a tabela vazia, acesse /admin e crie/confirme a primeira conta pela tela.
-- A primeira conta confirmada que concluir a ativação será o administrador inicial.
