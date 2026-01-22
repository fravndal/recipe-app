# Database Schema Reference

## Tables

### auth.users (Supabase managed)
```sql
id          uuid PRIMARY KEY
email       text
role        text  -- 'authenticated' for logged-in users
created_at  timestamptz
```

---

### ingredients
User's ingredient library.

```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
name         text NOT NULL
category     text NULL      -- e.g., "Grønnsaker", "Kjøtt"
default_unit text NULL      -- e.g., "g", "stk", "dl"
created_at   timestamptz NOT NULL DEFAULT now()
updated_at   timestamptz NOT NULL DEFAULT now()

UNIQUE (user_id, name)
```

**Categories (Norwegian):**
- Grønnsaker, Frukt, Kjøtt, Fisk og sjømat, Meieriprodukter, Egg
- Korn og kornprodukter, Belgfrukter, Poteter og rotfrukter
- Nøtter og frø, Krydder og urter, Oljer og fett
- Søtning og sukker, Sauser og dressinger, Plantebaserte alternativer

**Units (Norwegian):**
- Antall: stk, skive, bit, filet, porsjon
- Vekt: g, kg, mg
- Volum: ml, dl, l
- Kjøkkenmål: ts, ss, klype, kopp
- Pakning: bunt, håndfull, pose, pakke, boks, glass, beger, tube, kartong

---

### recipes
Recipe definitions.

```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
title        text NOT NULL
description  text NULL
instructions text NULL       -- Free text instructions
servings     integer NULL CHECK (servings > 0)
created_at   timestamptz NOT NULL DEFAULT now()
updated_at   timestamptz NOT NULL DEFAULT now()
```

---

### recipe_ingredients
Junction table linking recipes to ingredients with quantities.

```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
recipe_id     uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE
ingredient_id uuid NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT
quantity      numeric(12,3) NULL CHECK (quantity >= 0)
unit          text NULL
note          text NULL      -- e.g., "hakket", "romtemperert"
created_at    timestamptz NOT NULL DEFAULT now()
updated_at    timestamptz NOT NULL DEFAULT now()

UNIQUE (recipe_id, ingredient_id)
```

---

### tags
Recipe tags for categorization.

```sql
id         uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
name       text NOT NULL
color      text NULL       -- Hex color code
created_at timestamptz NOT NULL DEFAULT now()
updated_at timestamptz NOT NULL DEFAULT now()

UNIQUE (user_id, name)
```

---

### recipe_tags
Junction table for recipe-tag relationships.

```sql
id         uuid PRIMARY KEY DEFAULT gen_random_uuid()
recipe_id  uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE
tag_id     uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE
created_at timestamptz NOT NULL DEFAULT now()

UNIQUE (recipe_id, tag_id)
```

---

### shopping_lists
Shopping list metadata.

```sql
id         uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
name       text NOT NULL
status     text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed'))
created_at timestamptz NOT NULL DEFAULT now()
updated_at timestamptz NOT NULL DEFAULT now()
```

---

### shopping_list_items
Items in a shopping list.

```sql
id               uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
shopping_list_id uuid NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE
ingredient_id    uuid NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE
quantity         numeric(12,3) NULL CHECK (quantity >= 0)
unit             text NULL
checked          boolean NOT NULL DEFAULT false
recipe_source_id uuid NULL REFERENCES recipes(id) ON DELETE SET NULL  -- Which recipe added this
created_at       timestamptz NOT NULL DEFAULT now()
updated_at       timestamptz NOT NULL DEFAULT now()
```

---

### pantry_items
What the user has at home.

```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
ingredient_id uuid NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE
quantity      numeric(12,3) NULL CHECK (quantity >= 0)
unit          text NULL
created_at    timestamptz NOT NULL DEFAULT now()
updated_at    timestamptz NOT NULL DEFAULT now()

UNIQUE (user_id, ingredient_id)
```

---

## Row Level Security (RLS)

All tables have RLS enabled with policies ensuring users can only access their own data:

```sql
-- Example policy pattern
CREATE POLICY "Users can only see own data"
ON public.table_name FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert own data"
ON public.table_name FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update own data"
ON public.table_name FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only delete own data"
ON public.table_name FOR DELETE
USING (auth.uid() = user_id);
```

---

## Common Queries

### Get ingredients with category
```sql
SELECT * FROM ingredients 
WHERE user_id = auth.uid() 
ORDER BY name;
```

### Get recipe with all ingredients
```sql
SELECT 
  r.*,
  ri.quantity, ri.unit, ri.note,
  i.name as ingredient_name, i.category
FROM recipes r
LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
LEFT JOIN ingredients i ON ri.ingredient_id = i.id
WHERE r.id = $1;
```

### Get shopping list with pantry comparison
```sql
SELECT 
  sli.*,
  i.name, i.category,
  pi.quantity as pantry_quantity, pi.unit as pantry_unit
FROM shopping_list_items sli
JOIN ingredients i ON sli.ingredient_id = i.id
LEFT JOIN pantry_items pi ON sli.ingredient_id = pi.ingredient_id 
  AND pi.user_id = auth.uid()
WHERE sli.shopping_list_id = $1;
```

---

## Error Codes

| Code  | Meaning                           |
|-------|-----------------------------------|
| 23503 | Foreign key constraint violation  |
| 23505 | Unique constraint violation       |
| 42501 | RLS policy violation              |
