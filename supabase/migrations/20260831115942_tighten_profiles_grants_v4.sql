begin;

-- =========================================================
-- AzuConnect Feature V4
-- Tighten direct grants on public.profiles
-- =========================================================

revoke all
on table public.profiles
from anon, authenticated;

grant select
on table public.profiles
to authenticated;

commit;