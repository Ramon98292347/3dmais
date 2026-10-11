-- Esquema inicial do catálogo 3D Mais para Supabase/PostgreSQL.
-- Execute no SQL Editor do projeto Supabase beqcmzhyfqadcblxqdru.
-- Seguro para reexecutar neste esquema: cria tabelas/índices se faltarem e
-- recria apenas as políticas e triggers definidos abaixo.
-- Não insere os produtos, preços ou imagens demonstrativos do frontend.

begin;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 100),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_slug_key unique (slug)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(btrim(name)) between 1 and 160),
  short_description text not null default '',
  description text not null default '',
  price numeric(12, 2) not null check (price >= 0),
  compare_at_price numeric(12, 2),
  is_active boolean not null default false,
  is_featured boolean not null default false,
  badge text,
  material text,
  dimensions text,
  production_time text,
  features text[] not null default '{}',
  notes text,
  keywords text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_slug_key unique (slug),
  constraint products_compare_at_price_check
    check (compare_at_price is null or compare_at_price >= price)
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null check (length(btrim(url)) > 0),
  alt text not null default '',
  sort_order integer not null default 0 check (sort_order between 0 and 9),
  is_cover boolean not null default false,
  created_at timestamptz not null default now(),
  constraint product_images_product_sort_key unique (product_id, sort_order)
);

create table if not exists public.product_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  option_key text not null check (option_key ~ '^[a-z][a-z0-9_]*$'),
  label text not null check (length(btrim(label)) between 1 and 120),
  option_type text not null check (option_type in ('text', 'select', 'textarea')),
  option_values text[] not null default '{}',
  is_required boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint product_options_product_key_key unique (product_id, option_key),
  constraint product_options_select_values_check
    check (option_type <> 'select' or cardinality(option_values) > 0)
);

create unique index if not exists product_images_one_cover_per_product
  on public.product_images (product_id)
  where is_cover;

create index if not exists categories_active_sort_idx
  on public.categories (sort_order, name)
  where is_active;

create index if not exists products_active_category_idx
  on public.products (category_id, name)
  where is_active;

create index if not exists products_featured_idx
  on public.products (created_at desc)
  where is_active and is_featured;

create index if not exists product_images_product_sort_idx
  on public.product_images (product_id, sort_order);

create index if not exists product_options_product_sort_idx
  on public.product_options (product_id, sort_order);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_options enable row level security;

drop policy if exists categories_public_read on public.categories;
create policy categories_public_read
  on public.categories for select to anon, authenticated
  using (is_active);

drop policy if exists products_public_read on public.products;
create policy products_public_read
  on public.products for select to anon, authenticated
  using (
    is_active
    and exists (
      select 1
      from public.categories c
      where c.id = products.category_id
        and c.is_active
    )
  );

drop policy if exists product_images_public_read on public.product_images;
create policy product_images_public_read
  on public.product_images for select to anon, authenticated
  using (
    exists (
      select 1
      from public.products p
      where p.id = product_images.product_id
        and p.is_active
    )
  );

drop policy if exists product_options_public_read on public.product_options;
create policy product_options_public_read
  on public.product_options for select to anon, authenticated
  using (
    exists (
      select 1
      from public.products p
      where p.id = product_options.product_id
        and p.is_active
    )
  );

revoke all on table public.categories from public, anon, authenticated;
revoke all on table public.products from public, anon, authenticated;
revoke all on table public.product_images from public, anon, authenticated;
revoke all on table public.product_options from public, anon, authenticated;

grant select on table public.categories to anon, authenticated;
grant select on table public.products to anon, authenticated;
grant select on table public.product_images to anon, authenticated;
grant select on table public.product_options to anon, authenticated;
grant all on table public.categories to service_role;
grant all on table public.products to service_role;
grant all on table public.product_images to service_role;
grant all on table public.product_options to service_role;

comment on table public.categories is 'Categorias públicas do catálogo.';
comment on table public.products is 'Produtos do catálogo; produtos inativos não são públicos.';
comment on table public.product_images is 'Imagens e ordem da galeria de cada produto.';
comment on table public.product_options is 'Campos de personalização disponíveis por produto.';

commit;
