-- 006_categories_units.sql
-- Categories and units as database tables

BEGIN;

-- CATEGORIES table
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS categories_sort_order_idx ON public.categories(sort_order);

-- UNITS table
CREATE TABLE IF NOT EXISTS public.units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  unit_type text NOT NULL CHECK (unit_type IN ('count', 'weight', 'volume', 'kitchen', 'package')),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS units_type_idx ON public.units(unit_type);
CREATE INDEX IF NOT EXISTS units_sort_order_idx ON public.units(sort_order);

-- Seed categories (Norwegian)
INSERT INTO public.categories (name, sort_order) VALUES
  ('Grønnsaker', 1),
  ('Frukt', 2),
  ('Kjøtt', 3),
  ('Fisk og sjømat', 4),
  ('Meieriprodukter', 5),
  ('Egg', 6),
  ('Korn og kornprodukter', 7),
  ('Belgfrukter', 8),
  ('Poteter og rotfrukter', 9),
  ('Nøtter og frø', 10),
  ('Krydder og urter', 11),
  ('Oljer og fett', 12),
  ('Søtning og sukker', 13),
  ('Sauser og dressinger', 14),
  ('Plantebaserte alternativer', 15),
  ('Drikke', 16)
ON CONFLICT (name) DO NOTHING;

-- Seed units (Norwegian)
INSERT INTO public.units (name, unit_type, sort_order) VALUES
  -- Antall (count)
  ('stk', 'count', 1),
  ('skive', 'count', 2),
  ('bit', 'count', 3),
  ('filet', 'count', 4),
  ('porsjon', 'count', 5),
  -- Vekt (weight)
  ('g', 'weight', 10),
  ('kg', 'weight', 11),
  ('mg', 'weight', 12),
  -- Volum (volume)
  ('ml', 'volume', 20),
  ('dl', 'volume', 21),
  ('l', 'volume', 22),
  -- Kjøkkenmål (kitchen)
  ('ts', 'kitchen', 30),
  ('ss', 'kitchen', 31),
  ('klype', 'kitchen', 32),
  ('kopp', 'kitchen', 33),
  -- Pakning (package)
  ('bunt', 'package', 40),
  ('håndfull', 'package', 41),
  ('pose', 'package', 42),
  ('pakke', 'package', 43),
  ('boks', 'package', 44),
  ('glass', 'package', 45),
  ('beger', 'package', 46),
  ('tube', 'package', 47),
  ('kartong', 'package', 48),
  ('flaske', 'package', 49)
ON CONFLICT (name) DO NOTHING;

-- Create roles if they don't exist, then grant
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
END
$$;

GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.units TO anon, authenticated;

COMMIT;
