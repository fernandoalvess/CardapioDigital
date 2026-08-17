create extension if not exists pgcrypto;

do $$ begin
  create type public.business_role as enum ('owner', 'manager', 'kitchen', 'delivery');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.order_status as enum (
    'pending',
    'accepted',
    'preparing',
    'ready',
    'out_for_delivery',
    'completed',
    'cancelled'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  address text,
  phone text,
  whatsapp text,
  timezone text not null default 'America/Fortaleza',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_members (
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.business_role not null default 'manager',
  created_at timestamptz not null default now(),
  primary key (business_id, user_id)
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  slug text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, slug)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null,
  slug text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  image_url text,
  is_available boolean not null default true,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, slug)
);

create table if not exists public.business_hours (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  opens_at time,
  closes_at time,
  is_closed boolean not null default false,
  unique (business_id, weekday)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete restrict,
  customer_name text not null,
  customer_phone text not null,
  address_text text not null,
  payment_method text not null check (payment_method in ('pix', 'cash', 'card_on_delivery')),
  notes text,
  subtotal numeric(10,2) not null check (subtotal >= 0),
  delivery_fee numeric(10,2) not null default 0 check (delivery_fee >= 0),
  discount numeric(10,2) not null default 0 check (discount >= 0),
  total numeric(10,2) not null check (total >= 0),
  status public.order_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name_snapshot text not null,
  unit_price numeric(10,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0 and quantity <= 100),
  total numeric(10,2) not null check (total >= 0)
);

create index if not exists idx_categories_business on public.categories(business_id, sort_order);
create index if not exists idx_products_business_category on public.products(business_id, category_id, sort_order);
create index if not exists idx_orders_business_created on public.orders(business_id, created_at desc);
create index if not exists idx_orders_business_status on public.orders(business_id, status);

create or replace function public.is_business_member(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_members bm
    where bm.business_id = target_business_id
      and bm.user_id = auth.uid()
  );
$$;

create or replace function public.has_business_role(
  target_business_id uuid,
  allowed_roles public.business_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_members bm
    where bm.business_id = target_business_id
      and bm.user_id = auth.uid()
      and bm.role = any(allowed_roles)
  );
$$;

alter table public.businesses enable row level security;
alter table public.business_members enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.business_hours enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "public can read active businesses" on public.businesses;
create policy "public can read active businesses"
on public.businesses for select
using (is_active = true or public.is_business_member(id));

drop policy if exists "owners and managers update businesses" on public.businesses;
create policy "owners and managers update businesses"
on public.businesses for update
to authenticated
using (public.has_business_role(id, array['owner','manager']::public.business_role[]))
with check (public.has_business_role(id, array['owner','manager']::public.business_role[]));

drop policy if exists "members can read membership" on public.business_members;
create policy "members can read membership"
on public.business_members for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "public can read active categories" on public.categories;
create policy "public can read active categories"
on public.categories for select
using (is_active = true or public.is_business_member(business_id));

drop policy if exists "managers manage categories" on public.categories;
create policy "managers manage categories"
on public.categories for all
to authenticated
using (public.has_business_role(business_id, array['owner','manager']::public.business_role[]))
with check (public.has_business_role(business_id, array['owner','manager']::public.business_role[]));

drop policy if exists "public can read products" on public.products;
create policy "public can read products"
on public.products for select
using (
  exists (
    select 1 from public.businesses b
    where b.id = products.business_id and b.is_active = true
  )
  or public.is_business_member(business_id)
);

drop policy if exists "managers manage products" on public.products;
create policy "managers manage products"
on public.products for all
to authenticated
using (public.has_business_role(business_id, array['owner','manager']::public.business_role[]))
with check (public.has_business_role(business_id, array['owner','manager']::public.business_role[]));

drop policy if exists "public can read business hours" on public.business_hours;
create policy "public can read business hours"
on public.business_hours for select
using (
  exists (
    select 1 from public.businesses b
    where b.id = business_hours.business_id and b.is_active = true
  )
  or public.is_business_member(business_id)
);

drop policy if exists "managers manage business hours" on public.business_hours;
create policy "managers manage business hours"
on public.business_hours for all
to authenticated
using (public.has_business_role(business_id, array['owner','manager']::public.business_role[]))
with check (public.has_business_role(business_id, array['owner','manager']::public.business_role[]));

drop policy if exists "members read orders" on public.orders;
create policy "members read orders"
on public.orders for select
to authenticated
using (public.is_business_member(business_id));

drop policy if exists "staff update orders" on public.orders;
create policy "staff update orders"
on public.orders for update
to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

drop policy if exists "members read order items" on public.order_items;
create policy "members read order items"
on public.order_items for select
to authenticated
using (
  exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and public.is_business_member(o.business_id)
  )
);

grant usage on schema public to anon, authenticated;
grant select on public.businesses, public.categories, public.products, public.business_hours to anon, authenticated;
grant select on public.business_members, public.orders, public.order_items to authenticated;
grant update on public.businesses, public.orders to authenticated;
grant insert, update, delete on public.categories, public.products, public.business_hours to authenticated;
