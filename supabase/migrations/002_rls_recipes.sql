begin;

-- Enable RLS
alter table public.ingredients enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;

-- INGREDIENTS policies
create policy "Ingredients are readable by owner"
on public.ingredients for select
using (auth.uid() = user_id);

create policy "Ingredients are insertable by owner"
on public.ingredients for insert
with check (auth.uid() = user_id);

create policy "Ingredients are updatable by owner"
on public.ingredients for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Ingredients are deletable by owner"
on public.ingredients for delete
using (auth.uid() = user_id);

-- RECIPES policies
create policy "Recipes are readable by owner"
on public.recipes for select
using (auth.uid() = user_id);

create policy "Recipes are insertable by owner"
on public.recipes for insert
with check (auth.uid() = user_id);

create policy "Recipes are updatable by owner"
on public.recipes for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Recipes are deletable by owner"
on public.recipes for delete
using (auth.uid() = user_id);

-- RECIPE_INGREDIENTS policies
create policy "Recipe ingredients are readable by owner"
on public.recipe_ingredients for select
using (auth.uid() = user_id);

create policy "Recipe ingredients are insertable by owner"
on public.recipe_ingredients for insert
with check (auth.uid() = user_id);

create policy "Recipe ingredients are updatable by owner"
on public.recipe_ingredients for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Recipe ingredients are deletable by owner"
on public.recipe_ingredients for delete
using (auth.uid() = user_id);

commit;