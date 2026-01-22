-- 003_tags.sql
-- Recipe tagging system

begin;

-- TAGS table
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text null, -- hex color e.g. "#ef4444"
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- Unique tag names per user
  constraint tags_user_name_unique unique (user_id, name)
);

create index if not exists tags_user_id_idx on public.tags(user_id);

create trigger tags_set_updated_at
before update on public.tags
for each row execute function public.set_updated_at();

-- RECIPE_TAGS join table
create table if not exists public.recipe_tags (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  
  -- Prevent duplicate tag assignments
  constraint recipe_tags_unique unique (recipe_id, tag_id)
);

create index if not exists recipe_tags_recipe_id_idx on public.recipe_tags(recipe_id);
create index if not exists recipe_tags_tag_id_idx on public.recipe_tags(tag_id);

-- RLS for tags
alter table public.tags enable row level security;

create policy "Tags are readable by owner"
on public.tags for select
using (auth.uid() = user_id);

create policy "Tags are insertable by owner"
on public.tags for insert
with check (auth.uid() = user_id);

create policy "Tags are updatable by owner"
on public.tags for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Tags are deletable by owner"
on public.tags for delete
using (auth.uid() = user_id);

-- RLS for recipe_tags (based on recipe ownership)
alter table public.recipe_tags enable row level security;

create policy "Recipe tags are readable by recipe owner"
on public.recipe_tags for select
using (
  exists (
    select 1 from public.recipes
    where recipes.id = recipe_tags.recipe_id
    and recipes.user_id = auth.uid()
  )
);

create policy "Recipe tags are insertable by recipe owner"
on public.recipe_tags for insert
with check (
  exists (
    select 1 from public.recipes
    where recipes.id = recipe_tags.recipe_id
    and recipes.user_id = auth.uid()
  )
);

create policy "Recipe tags are deletable by recipe owner"
on public.recipe_tags for delete
using (
  exists (
    select 1 from public.recipes
    where recipes.id = recipe_tags.recipe_id
    and recipes.user_id = auth.uid()
  )
);

commit;
