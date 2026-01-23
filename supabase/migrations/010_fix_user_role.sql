-- 010_fix_user_role.sql
-- Fix empty role issue for new users
-- PostgREST requires a valid role to be set

begin;

-- Fix any existing users with empty roles
update auth.users set role = 'authenticated' where role is null or role = '';

-- Create trigger function to set role on new user creation
create or replace function auth.set_user_role()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.role is null or new.role = '' then
    new.role := 'authenticated';
  end if;
  return new;
end;
$$;

-- Drop existing trigger if exists
drop trigger if exists on_auth_user_created_set_role on auth.users;

-- Create trigger that fires before insert to set role
create trigger on_auth_user_created_set_role
  before insert on auth.users
  for each row
  execute function auth.set_user_role();

-- Also create an update trigger to prevent empty roles
create or replace function auth.ensure_user_role()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.role is null or new.role = '' then
    new.role := 'authenticated';
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_updated_ensure_role on auth.users;

create trigger on_auth_user_updated_ensure_role
  before update on auth.users
  for each row
  execute function auth.ensure_user_role();

-- Set default value for role column
alter table auth.users alter column role set default 'authenticated';

commit;
