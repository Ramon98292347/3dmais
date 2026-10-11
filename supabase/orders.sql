-- Histórico de pedidos recebidos pelo catálogo.
-- Execute depois de catalog.sql e admin.sql no SQL Editor do Supabase.

begin;

create table if not exists public.catalog_orders (
  order_id uuid primary key,
  created_at timestamptz not null default now(),
  customer jsonb not null,
  items jsonb not null,
  notes text not null default '',
  subtotal numeric(12, 2) not null check (subtotal >= 0)
);

create index if not exists catalog_orders_created_at_idx
  on public.catalog_orders (created_at desc);

alter table public.catalog_orders enable row level security;
revoke all on table public.catalog_orders from public, anon, authenticated;
grant select on table public.catalog_orders to authenticated;

drop policy if exists catalog_orders_admin_read on public.catalog_orders;
create policy catalog_orders_admin_read on public.catalog_orders
  for select to authenticated using ((select public.is_catalog_admin()));

create or replace function public.record_catalog_order(p_order jsonb)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_order_id uuid;
  order_customer jsonb;
  order_items jsonb;
  order_notes text;
  order_subtotal numeric(12, 2);
  item jsonb;
  item_quantity integer;
  item_price numeric(12, 2);
  item_subtotal numeric(12, 2);
  calculated_subtotal numeric(12, 2) := 0;
begin
  if p_order is null
     or jsonb_typeof(p_order) <> 'object'
     or pg_column_size(p_order) > 131072 then
    raise exception 'Invalid order payload';
  end if;

  begin
    current_order_id := (p_order ->> 'orderId')::uuid;
    order_customer := p_order -> 'customer';
    order_items := p_order -> 'items';
    order_notes := coalesce(p_order ->> 'notes', '');
    order_subtotal := (p_order ->> 'subtotal')::numeric(12, 2);
  exception when others then
    raise exception 'Invalid order fields';
  end;

  if jsonb_typeof(order_customer) is distinct from 'object'
     or jsonb_typeof(order_items) is distinct from 'array' then
    raise exception 'Invalid order details';
  end if;

  if length(btrim(coalesce(order_customer ->> 'name', ''))) < 3
     or length(coalesce(order_customer ->> 'name', '')) > 150
     or length(regexp_replace(coalesce(order_customer ->> 'whatsapp', ''), '[^0-9]', '', 'g')) not between 10 and 13
     or length(btrim(coalesce(order_customer ->> 'city', ''))) not between 1 and 150
     or coalesce(order_customer ->> 'state', '') !~ '^[A-Z]{2}$'
     or length(coalesce(order_notes, '')) > 1000
     or order_subtotal < 0
     or jsonb_array_length(order_items) not between 1 and 25 then
    raise exception 'Invalid order details';
  end if;

  for item in select value from jsonb_array_elements(order_items)
  loop
    begin
      if jsonb_typeof(item) <> 'object'
         or length(btrim(coalesce(item ->> 'productId', ''))) not between 1 and 100
         or length(btrim(coalesce(item ->> 'name', ''))) not between 1 and 160
         or jsonb_typeof(item -> 'selectedOptions') is distinct from 'object' then
        raise exception 'Invalid order item';
      end if;

      item_quantity := (item ->> 'quantity')::integer;
      item_price := (item ->> 'unitPrice')::numeric(12, 2);
      item_subtotal := (item ->> 'subtotal')::numeric(12, 2);
      if item_quantity not between 1 and 99
         or item_price < 0
         or item_subtotal < 0
         or abs((item_quantity * item_price) - item_subtotal) > 0.01 then
        raise exception 'Invalid order item totals';
      end if;
      calculated_subtotal := calculated_subtotal + item_subtotal;
    exception when others then
      raise exception 'Invalid order item';
    end;
  end loop;

  if abs(calculated_subtotal - order_subtotal) > 0.01 then
    raise exception 'Invalid order subtotal';
  end if;

  insert into public.catalog_orders (order_id, customer, items, notes, subtotal)
  values (current_order_id, order_customer, order_items, order_notes, order_subtotal)
  on conflict (order_id) do nothing;

  return current_order_id;
end;
$$;

revoke all on function public.record_catalog_order(jsonb) from public;
grant execute on function public.record_catalog_order(jsonb) to anon, authenticated, service_role;

commit;
