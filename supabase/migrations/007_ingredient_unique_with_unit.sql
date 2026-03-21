-- 007_ingredient_unique_with_unit.sql
-- Make ingredients unique by (user_id, name, default_unit) instead of just (user_id, name)
-- This allows the same ingredient name with different units (e.g., "ost" in "pose" vs "pakke")

begin;

-- Drop the old constraint
alter table public.ingredients drop constraint if exists ingredients_user_name_unique;

-- Drop the new constraint too (idempotent re-run)
alter table public.ingredients drop constraint if exists ingredients_user_name_unit_unique;

-- Add new constraint including default_unit
alter table public.ingredients add constraint ingredients_user_name_unit_unique
  unique (user_id, name, default_unit);

commit;
