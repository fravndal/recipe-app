-- 006_drop_recipe_ingredient_note.sql
-- Remove the note column from recipe_ingredients table

begin;

alter table public.recipe_ingredients drop column if exists note;

commit;
