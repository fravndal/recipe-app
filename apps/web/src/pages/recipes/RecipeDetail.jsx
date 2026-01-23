import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Edit, Trash2, ShoppingCart, Users, Plus, Check } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { formatQuantity } from "@/lib/utils";

export function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showShoppingDialog, setShowShoppingDialog] = useState(false);
  const [servingsMultiplier, setServingsMultiplier] = useState(1);
  const [addingToShopping, setAddingToShopping] = useState(false);
  const [shoppingLists, setShoppingLists] = useState([]);
  const [selectedListId, setSelectedListId] = useState(null);
  const [newListName, setNewListName] = useState("");
  const [creatingNewList, setCreatingNewList] = useState(false);

  useEffect(() => {
    loadRecipe();
  }, [id]);

  const loadRecipe = async () => {
    const { data, error } = await supabase
      .from("recipes")
      .select(`
        *,
        recipe_ingredients(
          id,
          quantity,
          unit,
          ingredients(id, name, category)
        ),
        recipe_tags(
          tags(id, name, color)
        )
      `)
      .eq("id", id)
      .single();

    if (!error && data) {
      setRecipe(data);
      setServingsMultiplier(data.servings || 1);
    }
    setLoading(false);
  };

  const loadShoppingLists = async () => {
    const { data } = await supabase
      .from("shopping_lists")
      .select("id, name, status")
      .order("created_at", { ascending: false });
    
    if (data) {
      setShoppingLists(data);
      // Pre-select the first active list if available
      const activeList = data.find((l) => l.status === "active");
      if (activeList) {
        setSelectedListId(activeList.id);
      } else if (data.length > 0) {
        setSelectedListId(data[0].id);
      }
    }
  };

  const handleOpenShoppingDialog = () => {
    loadShoppingLists();
    setShowShoppingDialog(true);
    setCreatingNewList(false);
    setNewListName("");
  };

  const handleCreateNewList = async () => {
    if (!newListName.trim()) return;
    
    const { data, error } = await supabase
      .from("shopping_lists")
      .insert({ user_id: user.id, name: newListName.trim(), status: "active" })
      .select()
      .single();
    
    if (!error && data) {
      setShoppingLists((prev) => [data, ...prev]);
      setSelectedListId(data.id);
      setCreatingNewList(false);
      setNewListName("");
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await supabase.from("recipes").delete().eq("id", id);
    if (!error) {
      navigate("/recipes");
    }
    setDeleting(false);
  };

  const handleAddToShopping = async () => {
    if (!selectedListId) return;
    setAddingToShopping(true);

    const listId = selectedListId;

    // Calculate multiplier
    const multiplier = recipe.servings
      ? servingsMultiplier / recipe.servings
      : 1;

    // Add ingredients to shopping list
    const items = recipe.recipe_ingredients.map((ri) => ({
      user_id: user.id,
      shopping_list_id: listId,
      ingredient_id: ri.ingredients.id,
      quantity: ri.quantity ? ri.quantity * multiplier : null,
      unit: ri.unit,
      recipe_source_id: recipe.id,
    }));

    // Use upsert to merge duplicates
    for (const item of items) {
      // Check if item exists
      const { data: existing } = await supabase
        .from("shopping_list_items")
        .select("id, quantity")
        .eq("shopping_list_id", listId)
        .eq("ingredient_id", item.ingredient_id)
        .eq("unit", item.unit || "")
        .maybeSingle();

      if (existing) {
        // Update quantity
        await supabase
          .from("shopping_list_items")
          .update({
            quantity: (existing.quantity || 0) + (item.quantity || 0),
          })
          .eq("id", existing.id);
      } else {
        // Insert new
        await supabase.from("shopping_list_items").insert(item);
      }
    }

    setAddingToShopping(false);
    setShowShoppingDialog(false);
    navigate(`/shopping/${listId}`);
  };

  if (loading) {
    return (
      <Shell title="Recipe" showBack>
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </Shell>
    );
  }

  if (!recipe) {
    return (
      <Shell title="Recipe" showBack>
        <div className="p-4 text-center text-muted-foreground">
          Recipe not found
        </div>
      </Shell>
    );
  }

  return (
    <Shell title={recipe.title} showBack>
      <div className="p-4 max-w-lg mx-auto space-y-6">
        {/* Header info */}
        <div>
          <div className="flex flex-wrap gap-2 mb-3">
            {recipe.recipe_tags?.map(({ tags }) => (
              <Badge
                key={tags.id}
                style={{
                  backgroundColor: tags.color ? `${tags.color}20` : undefined,
                  color: tags.color || undefined,
                }}
              >
                {tags.name}
              </Badge>
            ))}
            {recipe.servings && (
              <Badge variant="outline">
                <Users className="h-3 w-3 mr-1" />
                {recipe.servings} servings
              </Badge>
            )}
          </div>
          {recipe.description && (
            <p className="text-muted-foreground">{recipe.description}</p>
          )}
        </div>

        {/* Ingredients */}
        <div>
          <h2 className="font-semibold mb-3">Ingredients</h2>
          {recipe.recipe_ingredients?.length > 0 ? (
            <ul className="space-y-2">
              {recipe.recipe_ingredients.map((ri) => (
                <li key={ri.id} className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    {ri.quantity && (
                      <span className="font-medium">
                        {formatQuantity(ri.quantity)}
                      </span>
                    )}{" "}
                    {ri.unit && <span>{ri.unit}</span>}{" "}
                    <span>{ri.ingredients.name}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No ingredients added yet
            </p>
          )}
        </div>

        {/* Instructions */}
        {recipe.instructions && (
          <div>
            <h2 className="font-semibold mb-3">Instructions</h2>
            <div className="prose prose-sm max-w-none whitespace-pre-wrap">
              {recipe.instructions}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-4">
          <Button onClick={handleOpenShoppingDialog}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Shopping List
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" asChild>
              <Link to={`/recipes/${id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
            <Button
              variant="outline"
              className="flex-1 text-destructive hover:text-destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Recipe</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{recipe.title}"? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? <Spinner size="sm" className="mr-2" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add to shopping dialog */}
      <Dialog open={showShoppingDialog} onOpenChange={setShowShoppingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Shopping List</DialogTitle>
            <DialogDescription>
              Choose a shopping list and number of servings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Shopping list selection */}
            <div>
              <Label>Shopping List</Label>
              <div className="mt-2 space-y-2 max-h-48 overflow-auto">
                {shoppingLists.map((list) => (
                  <button
                    key={list.id}
                    type="button"
                    className={`w-full text-left px-3 py-2 rounded-lg border transition-colors flex items-center justify-between ${
                      selectedListId === list.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-accent"
                    }`}
                    onClick={() => setSelectedListId(list.id)}
                  >
                    <span>{list.name}</span>
                    {selectedListId === list.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                ))}
                {shoppingLists.length === 0 && !creatingNewList && (
                  <p className="text-sm text-muted-foreground">
                    No shopping lists yet
                  </p>
                )}
              </div>
              
              {/* Create new list */}
              {creatingNewList ? (
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="List name..."
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateNewList();
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateNewList}
                    disabled={!newListName.trim()}
                  >
                    Create
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCreatingNewList(false);
                      setNewListName("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setCreatingNewList(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  New List
                </Button>
              )}
            </div>

            {/* Servings */}
            <div>
              <Label htmlFor="servings">Servings</Label>
              <Input
                id="servings"
                type="number"
                min="1"
                value={servingsMultiplier}
                onChange={(e) =>
                  setServingsMultiplier(parseInt(e.target.value) || 1)
                }
                className="mt-2"
              />
              {recipe.servings && (
                <p className="text-sm text-muted-foreground mt-2">
                  Recipe makes {recipe.servings} servings. Quantities will be
                  multiplied by {(servingsMultiplier / recipe.servings).toFixed(1)}
                  x.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowShoppingDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddToShopping}
              disabled={addingToShopping || !selectedListId}
            >
              {addingToShopping ? <Spinner size="sm" className="mr-2" /> : null}
              Add to List
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
