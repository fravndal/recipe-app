-- 005_rls_shopping.sql
-- Row Level Security for shopping lists and pantry

begin;

-- SHOPPING_LISTS RLS
alter table public.shopping_lists enable row level security;

create policy "Shopping lists are readable by owner"
on public.shopping_lists for select
using (auth.uid() = user_id);

create policy "Shopping lists are insertable by owner"
on public.shopping_lists for insert
with check (auth.uid() = user_id);

create policy "Shopping lists are updatable by owner"
on public.shopping_lists for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Shopping lists are deletable by owner"
on public.shopping_lists for delete
using (auth.uid() = user_id);

-- SHOPPING_LIST_ITEMS RLS
alter table public.shopping_list_items enable row level security;

create policy "Shopping list items are readable by owner"
on public.shopping_list_items for select
using (auth.uid() = user_id);

create policy "Shopping list items are insertable by owner"
on public.shopping_list_items for insert
with check (auth.uid() = user_id);

create policy "Shopping list items are updatable by owner"
on public.shopping_list_items for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Shopping list items are deletable by owner"
on public.shopping_list_items for delete
using (auth.uid() = user_id);

-- PANTRY_ITEMS RLS
alter table public.pantry_items enable row level security;

create policy "Pantry items are readable by owner"
on public.pantry_items for select
using (auth.uid() = user_id);

create policy "Pantry items are insertable by owner"
on public.pantry_items for insert
with check (auth.uid() = user_id);

create policy "Pantry items are updatable by owner"
on public.pantry_items for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Pantry items are deletable by owner"
on public.pantry_items for delete
using (auth.uid() = user_id);

commit;
