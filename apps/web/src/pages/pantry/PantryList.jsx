import { useState, useEffect } from "react";
import { Plus, Package, Trash2, Edit } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { EmptyState } from "@/components/layout/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { formatQuantity } from "@/lib/utils";

export function PantryList() {
  const { user } = useAuth();
  const [pantryItems, setPantryItems] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [pantryRes, ingredientsRes] = await Promise.all([
      supabase
        .from("pantry_items")
        .select(`
          *,
          ingredients(id, name, category, default_unit)
        `)
        .order("created_at", { ascending: false }),
      supabase
        .from("ingredients")
        .select("id, name, category, default_unit")
        .order("name"),
    ]);

    if (pantryRes.data) setPantryItems(pantryRes.data);
    if (ingredientsRes.data) setIngredients(ingredientsRes.data);
    setLoading(false);
  };

  const saveItem = async () => {
    if (!selectedIngredient) return;
    setSaving(true);

    const itemData = {
      user_id: user.id,
      ingredient_id: selectedIngredient.id,
      quantity: quantity ? parseFloat(quantity) : 1,
      unit: unit || null,
    };

    if (editingItem) {
      const { error } = await supabase
        .from("pantry_items")
        .update(itemData)
        .eq("id", editingItem.id);

      if (!error) {
        setPantryItems((prev) =>
          prev.map((item) =>
            item.id === editingItem.id
              ? { ...item, ...itemData, ingredients: selectedIngredient }
              : item
          )
        );
      }
    } else {
      const { data, error } = await supabase
        .from("pantry_items")
        .insert(itemData)
        .select(`
          *,
          ingredients(id, name, category, default_unit)
        `)
        .single();

      if (!error && data) {
        setPantryItems((prev) => [data, ...prev]);
      }
    }

    closeDialog();
    setSaving(false);
  };

  const deleteItem = async (itemId) => {
    setPantryItems((prev) => prev.filter((item) => item.id !== itemId));
    await supabase.from("pantry_items").delete().eq("id", itemId);
  };

  const openEditDialog = (item) => {
    setEditingItem(item);
    setSelectedIngredient(item.ingredients);
    setQuantity(item.quantity?.toString() || "");
    setUnit(item.unit || "");
    setShowAddDialog(true);
  };

  const closeDialog = () => {
    setShowAddDialog(false);
    setEditingItem(null);
    setSelectedIngredient(null);
    setQuantity("");
    setUnit("");
    setIngredientSearch("");
  };

  const filteredIngredients = ingredients.filter(
    (ing) =>
      ing.name.toLowerCase().includes(ingredientSearch.toLowerCase()) &&
      !pantryItems.some((p) => p.ingredient_id === ing.id && !editingItem)
  );

  // Group by category
  const grouped = pantryItems.reduce((acc, item) => {
    const category = item.ingredients?.category || "Other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  const categories = Object.keys(grouped).sort();

  return (
    <Shell title="Pantry">
      <div className="p-4 max-w-lg mx-auto space-y-4">
        <p className="text-sm text-muted-foreground">
          Track what you have at home. These items will be subtracted when
          adding recipes to your shopping list.
        </p>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : pantryItems.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Your pantry is empty"
            description="Add items you already have at home"
            action={
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            }
          />
        ) : (
          <div className="space-y-6">
            {categories.map((category) => (
              <div key={category}>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  {category}
                </h3>
                <div className="space-y-2">
                  {grouped[category].map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div>
                        <div className="font-medium">
                          {item.ingredients?.name}
                          {item.ingredients?.default_unit && (
                            <span className="text-muted-foreground font-normal"> ({item.ingredients.default_unit})</span>
                          )}
                        </div>
                        {(item.quantity || item.unit) && (
                          <div className="text-sm text-muted-foreground">
                            {item.quantity && formatQuantity(item.quantity)}{" "}
                            {item.unit}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
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

      {/* Add/Edit dialog */}
      <Dialog open={showAddDialog} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Pantry Item" : "Add to Pantry"}
            </DialogTitle>
          </DialogHeader>

          {!selectedIngredient ? (
            <>
              <Input
                placeholder="Search ingredients..."
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
                      setQuantity("1");
                      setUnit(ing.default_unit || "");
                    }}
                  >
                    <div className="font-medium">
                      {ing.name}
                      {ing.default_unit && (
                        <span className="text-muted-foreground font-normal"> ({ing.default_unit})</span>
                      )}
                    </div>
                    {ing.category && (
                      <div className="text-sm text-muted-foreground">
                        {ing.category}
                      </div>
                    )}
                  </button>
                ))}
                {filteredIngredients.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No ingredients found
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {selectedIngredient.name}
                  {selectedIngredient.default_unit && (
                    <span className="text-muted-foreground font-normal"> ({selectedIngredient.default_unit})</span>
                  )}
                </span>
                {!editingItem && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedIngredient(null)}
                  >
                    Change
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="quantity">Quantity (optional)</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="1"
                    className="mt-1"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="unit">Unit (optional)</Label>
                  <Input
                    id="unit"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="kg"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            {selectedIngredient && (
              <Button onClick={saveItem} disabled={saving}>
                {saving ? <Spinner size="sm" className="mr-2" /> : null}
                {editingItem ? "Save" : "Add"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
