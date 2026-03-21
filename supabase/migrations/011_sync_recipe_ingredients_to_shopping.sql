-- 011_sync_recipe_ingredients_to_shopping.sql
-- Automatically sync recipe ingredient changes to shopping lists

BEGIN;

-- Function to add new recipe ingredients to shopping lists
CREATE OR REPLACE FUNCTION public.sync_recipe_ingredient_to_shopping()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When a new ingredient is added to a recipe,
  -- add it to all shopping lists that have this recipe
  INSERT INTO public.shopping_list_items (
    user_id,
    shopping_list_id,
    ingredient_id,
    quantity,
    unit,
    checked,
    recipe_source_id
  )
  SELECT DISTINCT
    sli.user_id,
    sli.shopping_list_id,
    NEW.ingredient_id,
    NEW.quantity,
    NEW.unit,
    false,
    NEW.recipe_id
  FROM public.shopping_list_items sli
  INNER JOIN public.shopping_lists sl ON sl.id = sli.shopping_list_id
  WHERE sli.recipe_source_id = NEW.recipe_id
    -- Only add to active/draft lists, not completed ones
    AND sl.status IN ('draft', 'active')
    -- Avoid duplicates: don't add if this ingredient already exists in this list from this recipe
    AND NOT EXISTS (
      SELECT 1 FROM public.shopping_list_items existing
      WHERE existing.shopping_list_id = sli.shopping_list_id
        AND existing.ingredient_id = NEW.ingredient_id
        AND existing.recipe_source_id = NEW.recipe_id
    );

  RETURN NEW;
END;
$$;

-- Trigger: when a recipe ingredient is added
DROP TRIGGER IF EXISTS recipe_ingredient_added_sync ON public.recipe_ingredients;
CREATE TRIGGER recipe_ingredient_added_sync
AFTER INSERT ON public.recipe_ingredients
FOR EACH ROW
EXECUTE FUNCTION public.sync_recipe_ingredient_to_shopping();


-- Function to remove recipe ingredients from shopping lists
CREATE OR REPLACE FUNCTION public.sync_recipe_ingredient_removal_to_shopping()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When an ingredient is removed from a recipe,
  -- remove it from all shopping lists that have this recipe (but only unchecked items)
  DELETE FROM public.shopping_list_items sli
  USING public.shopping_lists sl
  WHERE sli.shopping_list_id = sl.id
    AND sli.recipe_source_id = OLD.recipe_id
    AND sli.ingredient_id = OLD.ingredient_id
    -- Only remove from active/draft lists
    AND sl.status IN ('draft', 'active')
    -- Only remove if not checked (user hasn't interacted with it)
    AND sli.checked = false;

  RETURN OLD;
END;
$$;

-- Trigger: when a recipe ingredient is removed
DROP TRIGGER IF EXISTS recipe_ingredient_removed_sync ON public.recipe_ingredients;
CREATE TRIGGER recipe_ingredient_removed_sync
AFTER DELETE ON public.recipe_ingredients
FOR EACH ROW
EXECUTE FUNCTION public.sync_recipe_ingredient_removal_to_shopping();


-- Function to update recipe ingredient changes in shopping lists
CREATE OR REPLACE FUNCTION public.sync_recipe_ingredient_update_to_shopping()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When a recipe ingredient quantity/unit is updated,
  -- update it in shopping lists (but only unchecked items)
  UPDATE public.shopping_list_items sli
  SET
    quantity = NEW.quantity,
    unit = NEW.unit,
    updated_at = now()
  FROM public.shopping_lists sl
  WHERE sli.shopping_list_id = sl.id
    AND sli.recipe_source_id = NEW.recipe_id
    AND sli.ingredient_id = NEW.ingredient_id
    -- Only update in active/draft lists
    AND sl.status IN ('draft', 'active')
    -- Only update if not checked (user hasn't interacted with it)
    AND sli.checked = false;

  RETURN NEW;
END;
$$;

-- Trigger: when a recipe ingredient quantity/unit is updated
DROP TRIGGER IF EXISTS recipe_ingredient_updated_sync ON public.recipe_ingredients;
CREATE TRIGGER recipe_ingredient_updated_sync
AFTER UPDATE OF quantity, unit ON public.recipe_ingredients
FOR EACH ROW
WHEN (OLD.quantity IS DISTINCT FROM NEW.quantity OR OLD.unit IS DISTINCT FROM NEW.unit)
EXECUTE FUNCTION public.sync_recipe_ingredient_update_to_shopping();

COMMIT;
