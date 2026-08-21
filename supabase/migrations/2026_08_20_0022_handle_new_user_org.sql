-- Fix: handle_new_user trigger should pass through organization_id
-- from raw_user_meta_data so that clients created via service role
-- (with org in metadata) don't violate chk_client_has_org.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (auth_id, email, first_name, last_name, role, organization_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'client'),
    nullif(new.raw_user_meta_data->>'organization_id', '')::uuid
  );
  return new;
end;
$$;
