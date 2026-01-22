import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Check,
  Plus,
  Trash2,
  RotateCcw,
  ChefHat,
  Package,
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
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { formatQuantity } from "@/lib/utils";

export function ShoppingListDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isOnline, isSyncing, pendingCount, cacheList } = useOfflineSync();
  const [list, setList] = useState(null);
  const [items, setItems] = useState([]);
  const [pantryItems, setPantryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Add ingredient dialog
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [ingredients, setIngredients] = useState([]);
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [addQuantity, setAddQuantity] = useState("");
  const [addUnit, setAddUnit] = useState("");
  const [adding, setAdding] = useState(false);

  // Add recipe dialog
  const [showRecipeDialog, setShowRecipeDialog] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const [recipeSearch, setRecipeSearch] = useState("");
  const [addingRecipe, setAddingRecipe] = useState(false);

  useEffect(() => {
    loadList();
    loadIngredients();
    loadRecipes();
    loadPantryItems();
  }, [id]);

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

  const loadIngredients = async () => {
    const { data } = await supabase
      .from("ingredients")
      .select("id, name, category, default_unit")
      .order("name");
    if (data) setIngredients(data);
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
  };

  // Get pantry info for an ingredient
  const getPantryInfo = (ingredientId) => {
    return pantryItems.find((p) => p.ingredient_id === ingredientId);
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

  const deleteItem = async (itemId) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
    await supabase.from("shopping_list_items").delete().eq("id", itemId);
  };

  const addItem = async () => {
    if (!selectedIngredient) return;
    setAdding(true);

    const { data, error } = await supabase
      .from("shopping_list_items")
      .insert({
        user_id: user.id,
        shopping_list_id: id,
        ingredient_id: selectedIngredient.id,
        quantity: addQuantity ? parseFloat(addQuantity) : null,
        unit: addUnit || null,
        checked: false,
      })
      .select(`
        *,
        ingredients(id, name, category)
      `)
      .single();

    if (!error && data) {
      setItems((prev) => [...prev, data]);
    }

    setShowAddDialog(false);
    setSelectedIngredient(null);
    setAddQuantity("");
    setAddUnit("");
    setIngredientSearch("");
    setAdding(false);
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
      quantity: ri.quantity,
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
      setItems((prev) => [...prev, ...data]);
    }

    setShowRecipeDialog(false);
    setRecipeSearch("");
    setAddingRecipe(false);
  };

  const updateStatus = async (status) => {
    await supabase.from("shopping_lists").update({ status }).eq("id", id);
    setList((prev) => ({ ...prev, status }));
  };

  const clearChecked = async () => {
    const checkedIds = items.filter((i) => i.checked).map((i) => i.id);
    if (checkedIds.length === 0) return;

    setItems((prev) => prev.filter((item) => !item.checked));
    await supabase
      .from("shopping_list_items")
      .delete()
      .in("id", checkedIds);
  };

  const filteredIngredients = ingredients.filter((ing) =>
    ing.name.toLowerCase().includes(ingredientSearch.toLowerCase())
  );

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
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Legg til vare
          </Button>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {checkedCount}/{items.length} varer krysset av
          </div>
          <div className="flex gap-2">
            {checkedCount > 0 && (
              <Button variant="outline" size="sm" onClick={clearChecked}>
                <Trash2 className="h-4 w-4 mr-1" />
                Fjern kryssede
              </Button>
            )}
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
            description="Legg til oppskrifter eller enkeltvarer i handlelisten"
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
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                          item.checked ? "bg-muted/50 opacity-60" : "bg-card"
                        }`}
                      >
                        <Checkbox
                          checked={item.checked}
                          onCheckedChange={(checked) =>
                            toggleItem(item.id, checked)
                          }
                        />
                        <div className="flex-1 min-w-0">
                          <div className={item.checked ? "line-through" : ""}>
                            {item.quantity && (
                              <span className="font-medium">
                                {formatQuantity(item.quantity)}
                              </span>
                            )}{" "}
                            {item.unit && <span>{item.unit}</span>}{" "}
                            {item.ingredients?.name}
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          onClick={() => deleteItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FAB */}
        <button
          onClick={() => setShowAddDialog(true)}
          className="fixed right-4 bottom-24 z-40 inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      {/* Add item dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Legg til vare</DialogTitle>
          </DialogHeader>

          {!selectedIngredient ? (
            <>
              <Input
                placeholder="Søk ingredienser..."
                value={ingredientSearch}
                onChange={(e) => setIngredientSearch(e.target.value)}
                autoFocus
              />
              <div className="max-h-64 overflow-auto space-y-1">
                {filteredIngredients.map((ing) => (
                  <button
                    key={ing.id}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent transition-colors"
                    onClick={() => {
                      setSelectedIngredient(ing);
                      setAddUnit(ing.default_unit || "");
                    }}
                  >
                    <div className="font-medium">{ing.name}</div>
                    {ing.category && (
                      <div className="text-sm text-muted-foreground">
                        {ing.category}
                      </div>
                    )}
                  </button>
                ))}
                {filteredIngredients.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Ingen ingredienser funnet
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">{selectedIngredient.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedIngredient(null)}
                >
                  Endre
                </Button>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="quantity">Mengde</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.1"
                    value={addQuantity}
                    onChange={(e) => setAddQuantity(e.target.value)}
                    placeholder="1"
                    className="mt-1"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="unit">Enhet</Label>
                  <Input
                    id="unit"
                    value={addUnit}
                    onChange={(e) => setAddUnit(e.target.value)}
                    placeholder="stk"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setSelectedIngredient(null);
                setIngredientSearch("");
              }}
            >
              Avbryt
            </Button>
            {selectedIngredient && (
              <Button onClick={addItem} disabled={adding}>
                {adding ? <Spinner size="sm" className="mr-2" /> : null}
                Legg til
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </Shell>
  );
}
