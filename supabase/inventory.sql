-- Controle de estoque e movimentações do catálogo.
-- Execute depois de catalog.sql, admin.sql e orders.sql.

begin;

alter table public.products
  add column if not exists track_stock boolean not null default false;
alter table public.products
  add column if not exists stock_quantity integer not null default 0;
alter table public.products
  add column if not exists low_stock_threshold integer not null default 3;

-- Os dados de estoque são privados e ficam disponíveis apenas pelo painel admin.
revoke select on table public.products from anon, authenticated;
grant select (
  id, category_id, slug, name, short_description, description, price,
  compare_at_price, is_active, is_featured, badge, material, dimensions,
  production_time, features, notes, keywords, created_at
) on table public.products to anon, authenticated;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.products'::regclass
      and conname = 'products_stock_quantity_check'
  ) then
    alter table public.products
      add constraint products_stock_quantity_check check (stock_quantity >= 0);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.products'::regclass
      and conname = 'products_low_stock_threshold_check'
  ) then
    alter table public.products
      add constraint products_low_stock_threshold_check check (low_stock_threshold >= 0);
  end if;
end;
$$;

create table if not exists public.catalog_inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  product_name text not null,
  order_id uuid references public.catalog_orders(order_id) on delete set null,
  quantity_change integer not null check (quantity_change <> 0),
  reason text not null check (reason in ('manual_adjustment', 'order_started', 'order_cancelled')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create index if not exists catalog_inventory_movements_created_idx
  on public.catalog_inventory_movements (created_at desc);
create index if not exists catalog_inventory_movements_product_idx
  on public.catalog_inventory_movements (product_id, created_at desc);

alter table public.catalog_inventory_movements enable row level security;
revoke all on table public.catalog_inventory_movements from public, anon, authenticated;
grant select on table public.catalog_inventory_movements to authenticated;

drop policy if exists catalog_inventory_movements_admin_read
  on public.catalog_inventory_movements;
create policy catalog_inventory_movements_admin_read
  on public.catalog_inventory_movements for select to authenticated
  using ((select public.is_catalog_admin()));

create or replace function public.adjust_catalog_stock(
  p_product_id uuid,
  p_new_quantity integer
)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_quantity integer;
  product_name text;
  difference integer;
begin
  if not public.is_catalog_admin() then
    raise exception 'Administrator access required';
  end if;
  if p_new_quantity is null or p_new_quantity < 0 then
    raise exception 'Stock quantity must be zero or greater';
  end if;

  select p.stock_quantity, p.name
    into current_quantity, product_name
    from public.products as p
    where p.id = p_product_id
    for update;
  if not found then
    raise exception 'Product not found';
  end if;

  difference := p_new_quantity - current_quantity;
  if difference <> 0 then
    update public.products set stock_quantity = p_new_quantity where id = p_product_id;
    insert into public.catalog_inventory_movements
      (product_id, product_name, quantity_change, reason, created_by)
    values
      (p_product_id, product_name, difference, 'manual_adjustment', auth.uid());
  end if;
  return p_new_quantity;
end;
$$;

create or replace function public.set_catalog_order_status(
  p_order_id uuid,
  p_status text
)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_status text;
  order_items jsonb;
  item jsonb;
  item_product_id uuid;
  item_quantity integer;
  product_name text;
  current_quantity integer;
  stock_is_tracked boolean;
  should_move_stock boolean;
  movement_reason text;
  quantity_delta integer;
begin
  if not public.is_catalog_admin() then
    raise exception 'Administrator access required';
  end if;
  if p_status not in ('received', 'processing', 'ready', 'completed', 'cancelled') then
    raise exception 'Invalid order status';
  end if;

  select o.status, o.items
    into current_status, order_items
    from public.catalog_orders as o
    where o.order_id = p_order_id
    for update;
  if not found then
    raise exception 'Order not found';
  end if;
  if current_status = p_status then
    return p_status;
  end if;

  if current_status = 'received' and p_status = 'processing' then
    movement_reason := 'order_started';
    quantity_delta := -1;
  elsif current_status in ('processing', 'ready') and p_status = 'cancelled' then
    movement_reason := 'order_cancelled';
    quantity_delta := 1;
  elsif current_status = 'processing' and p_status = 'ready'
     or current_status = 'ready' and p_status = 'completed'
     or current_status = 'received' and p_status = 'cancelled' then
    movement_reason := null;
    quantity_delta := 0;
  else
    raise exception 'Invalid order status transition from % to %', current_status, p_status;
  end if;

  if quantity_delta <> 0 then
    for item in select value from jsonb_array_elements(order_items)
    loop
      item_product_id := (item ->> 'productId')::uuid;
      item_quantity := (item ->> 'quantity')::integer;

      select p.name, p.stock_quantity, p.track_stock
        into product_name, current_quantity, stock_is_tracked
        from public.products as p
        where p.id = item_product_id
        for update;
      if not found then
        raise exception 'Product from order was not found';
      end if;

      should_move_stock := stock_is_tracked;
      if quantity_delta > 0 then
        select exists (
          select 1 from public.catalog_inventory_movements as movement
          where movement.order_id = p_order_id
            and movement.product_id = item_product_id
            and movement.reason = 'order_started'
        ) into should_move_stock;
      end if;

      if should_move_stock then
        if quantity_delta < 0 and current_quantity < item_quantity then
          raise exception 'Not enough stock for product %', product_name;
        end if;
        update public.products
          set stock_quantity = current_quantity + (quantity_delta * item_quantity)
          where id = item_product_id;
        insert into public.catalog_inventory_movements
          (product_id, product_name, order_id, quantity_change, reason, created_by)
        values
          (item_product_id, product_name, p_order_id,
           quantity_delta * item_quantity, movement_reason, auth.uid());
      end if;
    end loop;
  end if;

  update public.catalog_orders set status = p_status where order_id = p_order_id;
  return p_status;
end;
$$;

revoke all on function public.adjust_catalog_stock(uuid, integer) from public, anon;
grant execute on function public.adjust_catalog_stock(uuid, integer)
  to authenticated, service_role;
create or replace function public.catalog_inventory_summary()
returns table (
  product_id uuid,
  product_name text,
  stock_quantity integer,
  low_stock_threshold integer,
  net_units_out bigint
)
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
    select p.id, p.name, p.stock_quantity, p.low_stock_threshold,
      coalesce(sum(-movement.quantity_change) filter (
        where movement.reason in ('order_started', 'order_cancelled')
      ), 0)::bigint
    from public.products as p
    left join public.catalog_inventory_movements as movement
      on movement.product_id = p.id
    where p.track_stock
    group by p.id, p.name, p.stock_quantity, p.low_stock_threshold
    order by p.name;
end;
$$;

revoke all on function public.set_catalog_order_status(uuid, text) from public, anon;
grant execute on function public.set_catalog_order_status(uuid, text)
  to authenticated, service_role;
revoke all on function public.catalog_inventory_summary() from public, anon;
grant execute on function public.catalog_inventory_summary()
  to authenticated, service_role;

commit;
