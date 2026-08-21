-- Trigger: handle_new_user
-- Plan 01 · Identity module
--
-- Automatically inserts a row into public.users when a record is created
-- in auth.users (signup or creation via service role).
-- Default role is 'client' if not specified in raw_user_meta_data.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (auth_id, email, first_name, last_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'client')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
