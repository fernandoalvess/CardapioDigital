-- Hardening enxuto para a demo pública da FB Burguer.

-- Produtos ocultos não devem ser acessíveis via publishable key.
drop policy if exists "public can read products" on public.products;
create policy "public can read products"
on public.products for select
using (
  (
    is_active = true
    and exists (
      select 1
      from public.businesses b
      where b.id = products.business_id
        and b.is_active = true
    )
  )
  or public.is_business_member(business_id)
);

-- Rate limit compartilhado entre instâncias serverless da Vercel.
create table if not exists public.rate_limit_buckets (
  scope text not null,
  identifier_hash text not null,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0),
  primary key (scope, identifier_hash)
);

alter table public.rate_limit_buckets enable row level security;
revoke all on table public.rate_limit_buckets from public, anon, authenticated;

create index if not exists idx_rate_limit_buckets_window
  on public.rate_limit_buckets(window_started_at);

create or replace function public.check_rate_limit(
  p_scope text,
  p_identifier_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  bucket public.rate_limit_buckets;
  now_at timestamptz := now();
begin
  if p_scope is null
     or length(p_scope) < 1
     or p_identifier_hash is null
     or length(p_identifier_hash) < 16
     or p_limit < 1
     or p_window_seconds < 1 then
    return false;
  end if;

  perform pg_advisory_xact_lock(hashtext(p_scope || ':' || p_identifier_hash)::bigint);

  select * into bucket
  from public.rate_limit_buckets
  where scope = p_scope
    and identifier_hash = p_identifier_hash
  for update;

  if bucket.scope is null
     or bucket.window_started_at + make_interval(secs => p_window_seconds) <= now_at then
    insert into public.rate_limit_buckets (scope, identifier_hash, window_started_at, request_count)
    values (p_scope, p_identifier_hash, now_at, 1)
    on conflict (scope, identifier_hash) do update
      set window_started_at = excluded.window_started_at,
          request_count = 1;
    return true;
  end if;

  if bucket.request_count >= p_limit then
    return false;
  end if;

  update public.rate_limit_buckets
  set request_count = request_count + 1
  where scope = p_scope
    and identifier_hash = p_identifier_hash;

  return true;
end;
$$;

revoke all on function public.check_rate_limit(text,text,integer,integer)
from public, anon, authenticated;
grant execute on function public.check_rate_limit(text,text,integer,integer)
to service_role;
