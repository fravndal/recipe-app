-- 008_ingredient_cascade_delete.sql
-- Change recipe_ingredients foreign key to cascade on ingredient delete
-- This allows deleting ingredients that are used in recipes

begin;

-- Drop the existing foreign key constraint
alter table public.recipe_ingredients 
  drop constraint if exists recipe_ingredients_ingredient_id_fkey;

-- Add new foreign key with ON DELETE CASCADE
alter table public.recipe_ingredients 
  add constraint recipe_ingredients_ingredient_id_fkey 
  foreign key (ingredient_id) 
  references public.ingredients(id) 
  on delete cascade;

-- Also update pantry_items to cascade delete
alter table public.pantry_items 
  drop constraint if exists pantry_items_ingredient_id_fkey;

alter table public.pantry_items 
  add constraint pantry_items_ingredient_id_fkey 
  foreign key (ingredient_id) 
  references public.ingredients(id) 
  on delete cascade;

-- Also update shopping_list_items to cascade delete
alter table public.shopping_list_items 
  drop constraint if exists shopping_list_items_ingredient_id_fkey;

alter table public.shopping_list_items 
  add constraint shopping_list_items_ingredient_id_fkey 
  foreign key (ingredient_id) 
  references public.ingredients(id) 
  on delete cascade;

commit;
