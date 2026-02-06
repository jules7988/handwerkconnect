-- =========================
-- HandwerkConnect MVP v0
-- Schema + RLS + RPC
-- =========================

create extension if not exists pgcrypto;
create extension if not exists citext;

do $$ begin
  create type public.user_role as enum ('azubi', 'betrieb', 'admin');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.account_status as enum ('active', 'blocked');
exception when duplicate_object then null;
end $$;

-- Admins
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql stable
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

-- Common updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Profiles
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null,
  status public.account_status not null default 'active',
  created_at timestamptz not null default now()
);

-- Trades
create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Postal codes (DE) with coordinates
create table if not exists public.postal_codes_de (
  plz text primary key,
  city text,
  lat double precision not null,
  lng double precision not null
);

-- Azubi Profiles
create table if not exists public.azubi_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,

  first_name text not null,
  last_name text not null,

  street text not null,
  house_no text not null,
  plz text not null,
  city text not null,

  trade_id uuid not null references public.trades(id),

  email citext,
  whatsapp_link text,

  consent_terms boolean not null default false,
  consent_terms_at timestamptz,
  consent_privacy boolean not null default false,
  consent_privacy_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.azubi_profiles
  drop constraint if exists chk_azubi_contact;

alter table public.azubi_profiles
  add constraint chk_azubi_contact
  check (
    (email is not null and length(email) > 3)
    or
    (whatsapp_link is not null and length(whatsapp_link) > 10)
  );

create index if not exists idx_azubi_trade on public.azubi_profiles(trade_id);
create index if not exists idx_azubi_plz on public.azubi_profiles(plz);

drop trigger if exists trg_azubi_updated_at on public.azubi_profiles;
create trigger trg_azubi_updated_at
before update on public.azubi_profiles
for each row execute procedure public.set_updated_at();

-- Companies
create table if not exists public.companies (
  user_id uuid primary key references auth.users(id) on delete cascade,

  company_name text not null,
  contact_person text not null,
  phone text not null,
  website text,

  plz text not null,
  city text not null,

  verified boolean not null default false,
  verified_at timestamptz,

  consent_terms boolean not null default false,
  consent_terms_at timestamptz,
  consent_privacy boolean not null default false,
  consent_privacy_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_companies_updated_at on public.companies;
create trigger trg_companies_updated_at
before update on public.companies
for each row execute procedure public.set_updated_at();

-- Company trades (multi-select)
create table if not exists public.company_trades (
  company_id uuid not null,
  trade_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (company_id, trade_id),
  constraint fk_company_trades_company foreign key (company_id) references public.companies(user_id) on delete cascade,
  constraint fk_company_trades_trade foreign key (trade_id) references public.trades(id) on delete cascade
);

-- Distance calculation (Haversine)
create or replace function public.haversine_km(
  lat1 double precision, lon1 double precision,
  lat2 double precision, lon2 double precision
) returns double precision
language sql immutable as $$
  select 6371 * 2 * asin(
    sqrt(
      power(sin(radians((lat2 - lat1) / 2)), 2)
      + cos(radians(lat1)) * cos(radians(lat2))
      * power(sin(radians((lon2 - lon1) / 2)), 2)
    )
  );
$$;

-- View: company ↔ azubi matches
create or replace view public.v_company_azubi_matches as
select
  c.user_id as company_user_id,
  a.user_id as azubi_user_id,
  a.first_name,
  a.last_name,
  a.city as azubi_city,
  a.plz as azubi_plz,
  a.trade_id,
  t.name as trade_name,
  a.email,
  a.whatsapp_link,
  public.haversine_km(pc_c.lat, pc_c.lng, pc_a.lat, pc_a.lng) as distance_km
from public.companies c
join public.postal_codes_de pc_c on pc_c.plz = c.plz
join public.azubi_profiles a on true
join public.postal_codes_de pc_a on pc_a.plz = a.plz
join public.trades t on t.id = a.trade_id
where t.active = true;

-- RPC: verified company gets azubis sorted by distance
create or replace function public.get_company_azubis(
  radius_km double precision default 50,
  trade_ids uuid[] default null
)
returns table (
  azubi_user_id uuid,
  first_name text,
  last_name text,
  trade_id uuid,
  trade_name text,
  azubi_plz text,
  azubi_city text,
  email citext,
  whatsapp_link text,
  distance_km double precision
)
language plpgsql
security definer
as $$
declare
  is_verified boolean;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select c.verified into is_verified
  from public.companies c
  where c.user_id = auth.uid();

  if is_verified is distinct from true then
    raise exception 'company not verified';
  end if;

  return query
  select
    v.azubi_user_id,
    v.first_name,
    v.last_name,
    v.trade_id,
    v.trade_name,
    v.azubi_plz,
    v.azubi_city,
    v.email,
    v.whatsapp_link,
    v.distance_km
  from public.v_company_azubi_matches v
  join public.profiles p_a on p_a.user_id = v.azubi_user_id
  where v.company_user_id = auth.uid()
    and p_a.status = 'active'
    and v.distance_km <= radius_km
    and (trade_ids is null or v.trade_id = any(trade_ids))
  order by v.distance_km asc;
end;
$$;

revoke all on function public.get_company_azubis(double precision, uuid[]) from public;
grant execute on function public.get_company_azubis(double precision, uuid[]) to authenticated;

-- =========================
-- RLS Policies
-- =========================

alter table public.trades enable row level security;

create policy "trades_read_all"
on public.trades for select
to authenticated
using (true);

create policy "trades_admin_write"
on public.trades for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

alter table public.profiles enable row level security;

create policy "profiles_self_read"
on public.profiles for select
to authenticated
using (user_id = auth.uid());

create policy "profiles_self_insert"
on public.profiles for insert
to authenticated
with check (user_id = auth.uid());

create policy "profiles_admin_all"
on public.profiles for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

alter table public.azubi_profiles enable row level security;

create policy "azubi_self_read"
on public.azubi_profiles for select
to authenticated
using (user_id = auth.uid());

create policy "azubi_self_insert"
on public.azubi_profiles for insert
to authenticated
with check (user_id = auth.uid());

create policy "azubi_self_update"
on public.azubi_profiles for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "azubi_self_delete"
on public.azubi_profiles for delete
to authenticated
using (user_id = auth.uid());

create policy "azubi_admin_all"
on public.azubi_profiles for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

alter table public.companies enable row level security;

create policy "company_self_read"
on public.companies for select
to authenticated
using (user_id = auth.uid());

create policy "company_self_insert"
on public.companies for insert
to authenticated
with check (user_id = auth.uid());

create policy "company_self_update"
on public.companies for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "company_self_delete"
on public.companies for delete
to authenticated
using (user_id = auth.uid());

create policy "company_admin_all"
on public.companies for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

alter table public.company_trades enable row level security;

create policy "company_trades_self_all"
on public.company_trades for all
to authenticated
using (company_id = auth.uid() or public.is_admin())
with check (company_id = auth.uid() or public.is_admin());
