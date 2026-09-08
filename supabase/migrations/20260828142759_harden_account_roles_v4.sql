begin;

-- =========================================================
-- AzuConnect Feature V4
-- Harden signup roles, profiles permissions and role tables
-- =========================================================

-- ---------------------------------------------------------
-- 1. Harden signup trigger:
--    only allow explicit public roles azubi / betrieb.
--    No fallback. Never accept admin from client metadata.
-- ---------------------------------------------------------

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  role_text text;
begin
  role_text := new.raw_user_meta_data->>'role';

  if role_text is null or role_text = '' then
    raise exception 'SIGNUP_ROLE_REQUIRED';
  end if;

  if role_text not in ('azubi', 'betrieb') then
    raise exception 'SIGNUP_ROLE_INVALID';
  end if;

  insert into public.profiles (
    user_id,
    role,
    privacy_accepted_at,
    privacy_version
  )
  values (
    new.id,
    role_text::public.user_role,
    nullif(new.raw_user_meta_data->>'privacy_accepted_at', '')::timestamptz,
    new.raw_user_meta_data->>'privacy_version'
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;


-- ---------------------------------------------------------
-- 2. Harden public.profiles
--    Client must not INSERT / UPDATE / DELETE.
--    Authenticated users may only SELECT their own row.
--    Existing admin policy is intentionally kept.
-- ---------------------------------------------------------

revoke insert, update, delete
on table public.profiles
from anon, authenticated;

revoke select
on table public.profiles
from anon;

grant select
on table public.profiles
to authenticated;


drop policy if exists profiles_insert_own
on public.profiles;

drop policy if exists profiles_self_insert
on public.profiles;

drop policy if exists profiles_update_own
on public.profiles;

drop policy if exists profiles_select_own
on public.profiles;

drop policy if exists profiles_self_read
on public.profiles;


create policy profiles_select_own
on public.profiles
for select
to authenticated
using (
  user_id = auth.uid()
);


-- ---------------------------------------------------------
-- 3. Harden azubi_profiles
--    Only the authenticated owner with profiles.role=azubi
--    may INSERT or UPDATE.
--    A user must not simultaneously own a company row.
-- ---------------------------------------------------------

drop policy if exists azubi_self_insert
on public.azubi_profiles;

drop policy if exists azubi_self_update
on public.azubi_profiles;

drop policy if exists azubi_self_delete
on public.azubi_profiles;


create policy azubi_self_insert
on public.azubi_profiles
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'azubi'::public.user_role
  )
  and not exists (
    select 1
    from public.companies c
    where c.user_id = auth.uid()
  )
);


create policy azubi_self_update
on public.azubi_profiles
for update
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'azubi'::public.user_role
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'azubi'::public.user_role
  )
  and not exists (
    select 1
    from public.companies c
    where c.user_id = auth.uid()
  )
);


-- ---------------------------------------------------------
-- 4. Harden companies
--    Only the authenticated owner with profiles.role=betrieb
--    may INSERT or UPDATE.
--    A user must not simultaneously own an azubi profile.
-- ---------------------------------------------------------

drop policy if exists company_self_insert
on public.companies;

drop policy if exists company_self_update
on public.companies;

drop policy if exists company_self_delete
on public.companies;


create policy company_self_insert
on public.companies
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'betrieb'::public.user_role
  )
  and not exists (
    select 1
    from public.azubi_profiles a
    where a.user_id = auth.uid()
  )
);


create policy company_self_update
on public.companies
for update
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'betrieb'::public.user_role
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'betrieb'::public.user_role
  )
  and not exists (
    select 1
    from public.azubi_profiles a
    where a.user_id = auth.uid()
  )
);


-- ---------------------------------------------------------
-- 5. Enforce role consistency at database level
--    This protects the invariant even when RLS is bypassed
--    by privileged server-side operations.
-- ---------------------------------------------------------

create or replace function public.enforce_account_role_consistency()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_role public.user_role;
begin
  -- Serialize changes for the same user inside the transaction.
  -- This prevents concurrent creation of both role profiles.
  perform pg_advisory_xact_lock(
    hashtextextended(new.user_id::text, 0)
  );

  select p.role
    into profile_role
  from public.profiles p
  where p.user_id = new.user_id;

  if profile_role is null then
    raise exception 'PROFILE_ROLE_MISSING';
  end if;

  if tg_table_name = 'azubi_profiles' then

    if profile_role <> 'azubi'::public.user_role then
      raise exception 'ROLE_MISMATCH_AZUBI';
    end if;

    if exists (
      select 1
      from public.companies c
      where c.user_id = new.user_id
    ) then
      raise exception 'ROLE_PROFILE_CONFLICT';
    end if;

  elsif tg_table_name = 'companies' then

    if profile_role <> 'betrieb'::public.user_role then
      raise exception 'ROLE_MISMATCH_COMPANY';
    end if;

    if exists (
      select 1
      from public.azubi_profiles a
      where a.user_id = new.user_id
    ) then
      raise exception 'ROLE_PROFILE_CONFLICT';
    end if;

  end if;

  return new;
end;
$$;


drop trigger if exists enforce_azubi_profile_role
on public.azubi_profiles;

create trigger enforce_azubi_profile_role
before insert or update
on public.azubi_profiles
for each row
execute function public.enforce_account_role_consistency();


drop trigger if exists enforce_company_profile_role
on public.companies;

create trigger enforce_company_profile_role
before insert or update
on public.companies
for each row
execute function public.enforce_account_role_consistency();


commit;