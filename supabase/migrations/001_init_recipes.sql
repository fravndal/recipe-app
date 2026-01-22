-- 001_init_recipes.sql
-- Core tables: ingredients, recipes, recipe_ingredients
-- Designed for Supabase (auth.users) + Postgres

begin;

-- Use UUIDs
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- Updated-at trigger helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- INGREDIENTS
create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),

  -- who owns this ingredient (per-user ingredient library)
  user_id uuid not null references auth.users(id) on delete cascade,

  name text not null,
  -- optional: e.g. "produce", "dairy", "spices"
  category text null,
  -- optional: e.g. "g", "ml", "pcs"
  default_unit text null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- avoid duplicates per user: "Milk" & "milk" treated same
  constraint ingredients_user_name_unique unique (user_id, name)
);

create index if not exists ingredients_user_id_idx on public.ingredients(user_id);
create index if not exists ingredients_name_idx on public.ingredients using gin (name gin_trgm_ops);

create trigger ingredients_set_updated_at
before update on public.ingredients
for each row execute function public.set_updated_at();


-- RECIPES
create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,

  title text not null,
  description text null,

  -- steps as free text for MVP; later you can move to a steps table or jsonb
  instructions text null,

  -- optional
  servings integer null check (servings is null or servings > 0),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recipes_user_id_idx on public.recipes(user_id);
create index if not exists recipes_title_idx on public.recipes using gin (title gin_trgm_ops);

create trigger recipes_set_updated_at
before update on public.recipes
for each row execute function public.set_updated_at();


-- RECIPE_INGREDIENTS (join + quantities)
create table if not exists public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,

  recipe_id uuid not null references public.recipes(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete restrict,

  -- quantity can be decimal (e.g. 0.5)
  quantity numeric(12,3) null check (quantity is null or quantity >= 0),

  -- unit for this usage (can override ingredient default)
  unit text null,

  -- free text note (e.g. "chopped", "to taste")
  note text null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- prevent same ingredient repeated twice in same recipe
  constraint recipe_ingredients_unique unique (recipe_id, ingredient_id)
);

create index if not exists recipe_ingredients_user_id_idx on public.recipe_ingredients(user_id);
create index if not exists recipe_ingredients_recipe_id_idx on public.recipe_ingredients(recipe_id);
create index if not exists recipe_ingredients_ingredient_id_idx on public.recipe_ingredients(ingredient_id);

create trigger recipe_ingredients_set_updated_at
before update on public.recipe_ingredients
for each row execute function public.set_updated_at();


-- Ensure user_id consistency (optional but useful):
-- The app should always set user_id = auth.uid(), but this helps catch mistakes.
create or replace function public.assert_user_id_matches()
returns trigger
language plpgsql
as $$
begin
  if new.user_id is distinct from auth.uid() then
    raise exception 'user_id must match auth.uid()';
  end if;
  return new;
end;
$$;

-- Enable triggers only when requests go through Supabase with auth.
-- If you run SQL manually in psql as postgres, auth.uid() is null.
-- So we DO NOT attach this trigger by default.
-- (If you want strict enforcement later, tell me and we’ll do it safely.)

commit;

-- NOTE:
-- We used gin_trgm_ops indexes. That needs pg_trgm extension.
-- If you want those (recommended for search), uncomment:
-- create extension if not exists pg_trgm;
--
-- If you keep the gin_trgm_ops indexes, you must enable pg_trgm.