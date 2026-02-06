-- Auto-create profiles row after auth signup

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  role_text text;
begin
  role_text := coalesce(new.raw_user_meta_data->>'role', 'azubi');

  insert into public.profiles (user_id, role)
  values (new.id, role_text::public.user_role)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();
