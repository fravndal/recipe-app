-- 004_shopping_lists.sql
-- Shopping lists and pantry tracking

begin;

-- SHOPPING_LISTS table
create table if not exists public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shopping_lists_user_id_idx on public.shopping_lists(user_id);
create index if not exists shopping_lists_status_idx on public.shopping_lists(user_id, status);

drop trigger if exists shopping_lists_set_updated_at on public.shopping_lists;
create trigger shopping_lists_set_updated_at
before update on public.shopping_lists
for each row execute function public.set_updated_at();

-- SHOPPING_LIST_ITEMS table
create table if not exists public.shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  shopping_list_id uuid not null references public.shopping_lists(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  quantity numeric(12,3) null check (quantity is null or quantity >= 0),
  unit text null,
  checked boolean not null default false,
  -- Track which recipe this item came from (for reference)
  recipe_source_id uuid null references public.recipes(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shopping_list_items_list_id_idx on public.shopping_list_items(shopping_list_id);
create index if not exists shopping_list_items_ingredient_id_idx on public.shopping_list_items(ingredient_id);
create index if not exists shopping_list_items_checked_idx on public.shopping_list_items(shopping_list_id, checked);

drop trigger if exists shopping_list_items_set_updated_at on public.shopping_list_items;
create trigger shopping_list_items_set_updated_at
before update on public.shopping_list_items
for each row execute function public.set_updated_at();

-- PANTRY_ITEMS table (what you have at home)
create table if not exists public.pantry_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  quantity numeric(12,3) null check (quantity is null or quantity >= 0),
  unit text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- One pantry entry per ingredient per user
  constraint pantry_items_user_ingredient_unique unique (user_id, ingredient_id)
);

create index if not exists pantry_items_user_id_idx on public.pantry_items(user_id);
create index if not exists pantry_items_ingredient_id_idx on public.pantry_items(ingredient_id);

drop trigger if exists pantry_items_set_updated_at on public.pantry_items;
create trigger pantry_items_set_updated_at
before update on public.pantry_items
for each row execute function public.set_updated_at();

commit;
