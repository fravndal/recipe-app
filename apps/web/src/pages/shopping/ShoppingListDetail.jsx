import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Check,
  RotateCcw,
  ChefHat,
  Package,
  Trash2,
} from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { EmptyState } from "@/components/layout/EmptyState";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { OfflineIndicator } from "@/components/ui/offline-indicator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { formatQuantity } from "@/lib/utils";

export function ShoppingListDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isOnline, isSyncing, pendingCount, cacheList } = useOfflineSync();
  const [list, setList] = useState(null);
  const [items, setItems] = useState([]);
  const [pantryItems, setPantryItems] = useState([]);
  const [pantryLoaded, setPantryLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

  // Add recipe dialog
  const [showRecipeDialog, setShowRecipeDialog] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const [recipeSearch, setRecipeSearch] = useState("");
  const [addingRecipe, setAddingRecipe] = useState(false);

  // Remove recipe dialog
  const [showRemoveRecipeDialog, setShowRemoveRecipeDialog] = useState(false);
  const [removingRecipe, setRemovingRecipe] = useState(false);

  // Track if we've done the initial pantry auto-check
  const hasAutoCheckedRef = useRef(false);
  const itemsRef = useRef([]);
  const pantryItemsRef = useRef([]);

  // Keep refs updated
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    pantryItemsRef.current = pantryItems;
  }, [pantryItems]);

  useEffect(() => {
    // Reset auto-check flag when navigating to this page
    // location.key changes on every navigation, ensuring we reload when returning
    hasAutoCheckedRef.current = false;
    setPantryLoaded(false);
    loadList();
    loadRecipes();
    loadPantryItems();
  }, [id, location.key]);

  // Re-check items against pantry when page becomes visible (e.g., returning from pantry page)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && !loading) {
        // Reload pantry items
        const { data } = await supabase
          .from("pantry_items")
          .select(`
            *,
            ingredients(id, name)
          `);
        
        if (data) {
          setPantryItems(data);
          pantryItemsRef.current = data;

          const currentItems = itemsRef.current;

          // Find unchecked items that should be checked (have sufficient pantry)
          const itemsToCheck = currentItems.filter((item) => {
            if (item.checked) return false;

            const pantryItem = data.find((p) => p.ingredient_id === item.ingredient_id);
            if (!pantryItem) return false;

            const pantryQty = Number(pantryItem.quantity) || 0;
            if (pantryQty <= 0) return false;

            const itemQty = Number(item.quantity) || 0;
            if (itemQty <= 0) return true;

            return pantryQty >= itemQty;
          });

          // Find checked items that should be unchecked (no longer have sufficient pantry)
          const itemsToUncheck = currentItems.filter((item) => {
            if (!item.checked) return false;

            const pantryItem = data.find((p) => p.ingredient_id === item.ingredient_id);
            
            // If no pantry item exists, uncheck it
            if (!pantryItem) return true;

            const pantryQty = Number(pantryItem.quantity) || 0;
            // If pantry quantity is 0 or negative, uncheck it
            if (pantryQty <= 0) return true;

            const itemQty = Number(item.quantity) || 0;
            // If item has no quantity, keep it checked (any pantry amount is sufficient)
            if (itemQty <= 0) return false;

            // If pantry doesn't have enough, uncheck it
            return pantryQty < itemQty;
          });

          // Update items that should be checked
          if (itemsToCheck.length > 0) {
            const idsToCheck = itemsToCheck.map((i) => i.id);
            
            await supabase
              .from("shopping_list_items")
              .update({ checked: true })
              .in("id", idsToCheck);

            setItems((prev) =>
              prev.map((item) =>
                idsToCheck.includes(item.id) ? { ...item, checked: true } : item
              )
            );
          }

          // Update items that should be unchecked
          if (itemsToUncheck.length > 0) {
            const idsToUncheck = itemsToUncheck.map((i) => i.id);
            
            await supabase
              .from("shopping_list_items")
              .update({ checked: false })
              .in("id", idsToUncheck);

            setItems((prev) =>
              prev.map((item) =>
                idsToUncheck.includes(item.id) ? { ...item, checked: false } : item
              )
            );
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [loading]);

  // Auto-check items that are available in pantry on initial load
  useEffect(() => {
    // Wait for both loading to complete and pantry to be loaded
    if (loading || !pantryLoaded) {
      return;
    }

    // Only run once per list
    if (hasAutoCheckedRef.current) {
      return;
    }

    hasAutoCheckedRef.current = true;

    const autoCheckItems = async () => {
      const currentItems = itemsRef.current;
      const currentPantryItems = pantryItemsRef.current;

      if (currentItems.length === 0) {
        return;
      }

      // Find unchecked items that should be checked (have sufficient pantry)
      const itemsToCheck = currentItems.filter((item) => {
        // Skip already checked items
        if (item.checked) return false;

        // Find matching pantry item by ingredient_id
        const pantryItem = currentPantryItems.find((p) => p.ingredient_id === item.ingredient_id);
        if (!pantryItem) return false;

        const pantryQty = Number(pantryItem.quantity) || 0;
        if (pantryQty <= 0) return false;

        // If shopping list item has no quantity, any pantry amount counts
        const itemQty = Number(item.quantity) || 0;
        if (itemQty <= 0) return true;

        // Check if pantry has enough
        return pantryQty >= itemQty;
      });

      // Find checked items that should be unchecked (no longer have sufficient pantry)
      const itemsToUncheck = currentItems.filter((item) => {
        if (!item.checked) return false;

        const pantryItem = currentPantryItems.find((p) => p.ingredient_id === item.ingredient_id);
        
        // If no pantry item exists, uncheck it
        if (!pantryItem) return true;

        const pantryQty = Number(pantryItem.quantity) || 0;
        // If pantry quantity is 0 or negative, uncheck it
        if (pantryQty <= 0) return true;

        const itemQty = Number(item.quantity) || 0;
        // If item has no quantity, keep it checked (any pantry amount is sufficient)
        if (itemQty <= 0) return false;

        // If pantry doesn't have enough, uncheck it
        return pantryQty < itemQty;
      });

      // Update items that should be checked
      if (itemsToCheck.length > 0) {
        const idsToCheck = itemsToCheck.map((i) => i.id);
        
        // Update database first
        await supabase
          .from("shopping_list_items")
          .update({ checked: true })
          .in("id", idsToCheck);

        // Then update local state
        setItems((prev) =>
          prev.map((item) =>
            idsToCheck.includes(item.id) ? { ...item, checked: true } : item
          )
        );
      }

      // Update items that should be unchecked
      if (itemsToUncheck.length > 0) {
        const idsToUncheck = itemsToUncheck.map((i) => i.id);
        
        await supabase
          .from("shopping_list_items")
          .update({ checked: false })
          .in("id", idsToUncheck);

        setItems((prev) =>
          prev.map((item) =>
            idsToUncheck.includes(item.id) ? { ...item, checked: false } : item
          )
        );
      }
    };

    autoCheckItems();
  }, [loading, pantryLoaded]);

  // Cache items for offline use when they change
  useEffect(() => {
    if (items.length > 0 && id) {
      cacheList(id, items);
    }
  }, [items, id, cacheList]);

  const loadList = async () => {
    const { data: listData } = await supabase
      .from("shopping_lists")
      .select("*")
      .eq("id", id)
      .single();

    if (listData) setList(listData);

    const { data: itemsData } = await supabase
      .from("shopping_list_items")
      .select(`
        *,
        ingredients(id, name, category),
        recipes:recipe_source_id(id, title)
      `)
      .eq("shopping_list_id", id)
      .order("checked", { ascending: true });

    if (itemsData) setItems(itemsData);
    setLoading(false);
  };

  const loadRecipes = async () => {
    const { data } = await supabase
      .from("recipes")
      .select(`
        id,
        title,
        recipe_ingredients(
          id,
          ingredient_id,
          quantity,
          unit,
          ingredients(id, name, category, default_unit)
        )
      `)
      .order("title");
    if (data) setRecipes(data);
  };

  const loadPantryItems = async () => {
    const { data } = await supabase
      .from("pantry_items")
      .select(`
        *,
        ingredients(id, name)
      `);
    if (data) setPantryItems(data);
    setPantryLoaded(true);
  };

  // Get pantry info for an ingredient
  const getPantryInfo = (ingredientId) => {
    return pantryItems.find((p) => p.ingredient_id === ingredientId);
  };

  // Helper to check if an item should be auto-completed based on pantry
  const shouldAutoComplete = (item) => {
    const pantryItem = pantryItems.find((p) => p.ingredient_id === item.ingredient_id);
    if (!pantryItem) return false;

    const pantryQty = Number(pantryItem.quantity) || 0;
    if (pantryQty <= 0) return false;

    const itemQty = Number(item.quantity) || 0;
    if (itemQty <= 0) return true;

    return pantryQty >= itemQty;
  };

  const toggleItem = async (itemId, checked) => {
    // Optimistic update
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, checked } : item))
    );

    await supabase
      .from("shopping_list_items")
      .update({ checked })
      .eq("id", itemId);
  };

  const addRecipeToList = async (recipe) => {
    if (!recipe.recipe_ingredients || recipe.recipe_ingredients.length === 0) {
      return;
    }
    setAddingRecipe(true);

    // Prepare items from recipe ingredients
    const newItems = recipe.recipe_ingredients.map((ri) => ({
      user_id: user.id,
      shopping_list_id: id,
      ingredient_id: ri.ingredient_id,
      quantity: ri.quantity || 1,
      unit: ri.unit || ri.ingredients?.default_unit || null,
      checked: false,
      recipe_source_id: recipe.id,
    }));

    const { data, error } = await supabase
      .from("shopping_list_items")
      .insert(newItems)
      .select(`
        *,
        ingredients(id, name, category),
        recipes:recipe_source_id(id, title)
      `);

    if (!error && data) {
      // Check which new items should be auto-completed based on pantry
      const itemsWithPantryCheck = data.map((item) => ({
        ...item,
        checked: shouldAutoComplete(item),
      }));

      // Update database for items that should be checked
      const itemsToCheck = itemsWithPantryCheck.filter((item) => item.checked);
      if (itemsToCheck.length > 0) {
        const idsToCheck = itemsToCheck.map((i) => i.id);
        await supabase
          .from("shopping_list_items")
          .update({ checked: true })
          .in("id", idsToCheck);
      }

      setItems((prev) => [...prev, ...itemsWithPantryCheck]);
    }

    setShowRecipeDialog(false);
    setRecipeSearch("");
    setAddingRecipe(false);
  };

  const updateStatus = async (status) => {
    // Update list status
    await supabase.from("shopping_lists").update({ status }).eq("id", id);
    setList((prev) => ({ ...prev, status }));

    if (status === "completed") {
      // When completing: check all items
      const uncheckedItems = items.filter((item) => !item.checked);
      if (uncheckedItems.length > 0) {
        const idsToCheck = uncheckedItems.map((i) => i.id);
        
        await supabase
          .from("shopping_list_items")
          .update({ checked: true })
          .in("id", idsToCheck);

        setItems((prev) =>
          prev.map((item) => ({ ...item, checked: true }))
        );
      }
    } else if (status === "active") {
      // When reopening: uncheck items, except those with sufficient pantry stock
      const itemsToUncheck = items.filter((item) => {
        if (!item.checked) return false;
        // Keep checked if item has sufficient pantry stock
        return !shouldAutoComplete(item);
      });

      if (itemsToUncheck.length > 0) {
        const idsToUncheck = itemsToUncheck.map((i) => i.id);
        
        await supabase
          .from("shopping_list_items")
          .update({ checked: false })
          .in("id", idsToUncheck);

        setItems((prev) =>
          prev.map((item) =>
            idsToUncheck.includes(item.id) ? { ...item, checked: false } : item
          )
        );
      }
    }
  };

  // Get recipes that have items in this shopping list
  const recipesInList = items
    .filter((item) => item.recipe_source_id && item.recipes?.title)
    .reduce((acc, item) => {
      const recipeId = item.recipe_source_id;
      if (!acc.find((r) => r.id === recipeId)) {
        acc.push({
          id: recipeId,
          title: item.recipes.title,
          itemCount: items.filter((i) => i.recipe_source_id === recipeId).length,
        });
      }
      return acc;
    }, []);

  const removeRecipeFromList = async (recipeId) => {
    setRemovingRecipe(true);

    // Get all item IDs for this recipe
    const itemsToRemove = items.filter((item) => item.recipe_source_id === recipeId);
    const idsToRemove = itemsToRemove.map((i) => i.id);

    // Update local state
    setItems((prev) => prev.filter((item) => item.recipe_source_id !== recipeId));

    // Delete from database
    await supabase
      .from("shopping_list_items")
      .delete()
      .in("id", idsToRemove);

    setRemovingRecipe(false);
    setShowRemoveRecipeDialog(false);
  };

  const filteredRecipes = recipes.filter((r) =>
    r.title.toLowerCase().includes(recipeSearch.toLowerCase())
  );

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    const category = item.ingredients?.category || "Annet";
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  const categories = Object.keys(groupedItems).sort();
  const checkedCount = items.filter((i) => i.checked).length;

  if (loading) {
    return (
      <Shell title="Handleliste" showBack>
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </Shell>
    );
  }

  if (!list) {
    return (
      <Shell title="Handleliste" showBack>
        <div className="p-4 text-center text-muted-foreground">
          Listen ble ikke funnet
        </div>
      </Shell>
    );
  }

  return (
    <Shell title={list.name} showBack>
      <OfflineIndicator
        isOnline={isOnline}
        isSyncing={isSyncing}
        pendingCount={pendingCount}
      />
      <div className="p-4 max-w-lg mx-auto space-y-4">
        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setShowRecipeDialog(true)}
          >
            <ChefHat className="h-4 w-4 mr-2" />
            Legg til oppskrift
          </Button>
          {recipesInList.length > 0 && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowRemoveRecipeDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Fjern oppskrift
            </Button>
          )}
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {checkedCount}/{items.length} varer krysset av
          </div>
          <div className="flex gap-2">
            {list.status === "active" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateStatus("completed")}
              >
                <Check className="h-4 w-4 mr-1" />
                Fullfør
              </Button>
            )}
            {list.status === "completed" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateStatus("active")}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Gjenåpne
              </Button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {items.length > 0 && (
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${(checkedCount / items.length) * 100}%` }}
            />
          </div>
        )}

        {/* Items */}
        {items.length === 0 ? (
          <EmptyState
            title="Tom liste"
            description="Legg til oppskrifter i handlelisten"
            action={
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowRecipeDialog(true)}>
                  <ChefHat className="h-4 w-4 mr-2" />
                  Legg til oppskrift
                </Button>
              </div>
            }
          />
        ) : (
          <div className="space-y-6">
            {categories.map((category) => (
              <div key={category}>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  {category}
                </h3>
                <div className="space-y-1">
                  {groupedItems[category].map((item) => {
                    const pantryInfo = getPantryInfo(item.ingredient_id);
                    const hasPantry = pantryInfo && pantryInfo.quantity > 0;

                    return (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                          item.checked ? "bg-muted/50 opacity-60" : "bg-card hover:bg-accent/50"
                        }`}
                        onClick={() => toggleItem(item.id, !item.checked)}
                      >
                        <Checkbox
                          checked={item.checked}
                          onCheckedChange={() => {}}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1 min-w-0">
                          <div className={item.checked ? "line-through" : ""}>
                            <span>{item.ingredients?.name}</span>
                            {(item.quantity || item.unit) && (
                              <span className="text-muted-foreground">
                                {" "}({item.quantity && formatQuantity(item.quantity)}{item.quantity && item.unit && " "}{item.unit})
                              </span>
                            )}
                          </div>
                          
                          {/* Recipe source */}
                          {item.recipes?.title && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              Fra: {item.recipes.title}
                            </div>
                          )}
                          
                          {/* Pantry info */}
                          {hasPantry && (
                            <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                              <Package className="h-3 w-3" />
                              Har {formatQuantity(pantryInfo.quantity)} {pantryInfo.unit} på lager
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add recipe dialog */}
      <Dialog open={showRecipeDialog} onOpenChange={setShowRecipeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Legg til oppskrift</DialogTitle>
          </DialogHeader>

          <Input
            placeholder="Søk oppskrifter..."
            value={recipeSearch}
            onChange={(e) => setRecipeSearch(e.target.value)}
            autoFocus
          />
          <div className="max-h-80 overflow-auto space-y-1">
            {filteredRecipes.map((recipe) => {
              const ingredientCount = recipe.recipe_ingredients?.length || 0;
              return (
                <button
                  key={recipe.id}
                  className="w-full text-left px-3 py-3 rounded-lg hover:bg-accent transition-colors border"
                  onClick={() => addRecipeToList(recipe)}
                  disabled={addingRecipe || ingredientCount === 0}
                >
                  <div className="font-medium">{recipe.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {ingredientCount === 0 
                      ? "Ingen ingredienser" 
                      : `${ingredientCount} ingrediens${ingredientCount !== 1 ? "er" : ""}`
                    }
                  </div>
                </button>
              );
            })}
            {filteredRecipes.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Ingen oppskrifter funnet
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRecipeDialog(false);
                setRecipeSearch("");
              }}
            >
              Lukk
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove recipe dialog */}
      <Dialog open={showRemoveRecipeDialog} onOpenChange={setShowRemoveRecipeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fjern oppskrift</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            Velg en oppskrift for å fjerne alle ingrediensene fra handlelisten.
          </p>

          <div className="max-h-80 overflow-auto space-y-1">
            {recipesInList.map((recipe) => (
              <button
                key={recipe.id}
                className="w-full text-left px-3 py-3 rounded-lg hover:bg-destructive/10 transition-colors border"
                onClick={() => removeRecipeFromList(recipe.id)}
                disabled={removingRecipe}
              >
                <div className="font-medium">{recipe.title}</div>
                <div className="text-sm text-muted-foreground">
                  {recipe.itemCount} ingrediens{recipe.itemCount !== 1 ? "er" : ""}
                </div>
              </button>
            ))}
            {recipesInList.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Ingen oppskrifter i listen
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRemoveRecipeDialog(false)}
            >
              Lukk
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
