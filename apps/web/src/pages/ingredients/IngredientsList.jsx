import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Carrot, Search, Trash2, Edit } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { EmptyState } from "@/components/layout/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";

export function IngredientsList() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteRecipeCount, setDeleteRecipeCount] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [checkingUsage, setCheckingUsage] = useState(false);

  useEffect(() => {
    loadIngredients();
  }, []);

  const loadIngredients = async () => {
    const { data, error } = await supabase
      .from("ingredients")
      .select("*")
      .order("name");

    if (!error && data) {
      setIngredients(data);
    }
    setLoading(false);
  };

  const openDeleteDialog = async (ingredient) => {
    setDeleteTarget(ingredient);
    setDeleteError("");
    setCheckingUsage(true);

    // Check how many recipes use this ingredient
    const { count } = await supabase
      .from("recipe_ingredients")
      .select("*", { count: "exact", head: true })
      .eq("ingredient_id", ingredient.id);

    setDeleteRecipeCount(count || 0);
    setCheckingUsage(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");

    const { error } = await supabase
      .from("ingredients")
      .delete()
      .eq("id", deleteTarget.id);

    if (error) {
      setDeleteError(error.message);
      setDeleting(false);
      return;
    }

    setIngredients((prev) =>
      prev.filter((ing) => ing.id !== deleteTarget.id)
    );
    setDeleting(false);
    setDeleteTarget(null);
  };

  const closeDeleteDialog = () => {
    setDeleteTarget(null);
    setDeleteError("");
    setDeleteRecipeCount(0);
  };

  const filteredIngredients = ingredients.filter((ing) =>
    ing.name.toLowerCase().includes(search.toLowerCase())
  );

  // Group by category
  const grouped = filteredIngredients.reduce((acc, ing) => {
    const cat = ing.category || "Uncategorized";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(ing);
    return acc;
  }, {});

  const categories = Object.keys(grouped).sort();

  return (
    <Shell title="Ingredients">
      <div className="p-4 max-w-lg mx-auto space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search ingredients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : filteredIngredients.length === 0 ? (
          <EmptyState
            icon={Carrot}
            title={search ? "No ingredients found" : "No ingredients yet"}
            description={
              search
                ? "Try a different search term"
                : "Add ingredients to use in your recipes"
            }
            action={
              !search && (
                <Button asChild>
                  <Link to="/ingredients/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Ingredient
                  </Link>
                </Button>
              )
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
                  {grouped[category].map((ing) => (
                    <div
                      key={ing.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div>
                        <div className="font-medium">
                          {ing.name}
                          {ing.default_unit && (
                            <span className="text-muted-foreground font-normal"> ({ing.default_unit})</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/ingredients/${ing.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(ing)}
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
        <Link
          to="/ingredients/new"
          className="fixed right-4 bottom-24 z-40 inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-6 w-6" />
        </Link>
      </div>

      {/* Delete confirmation */}
      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={closeDeleteDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Slett ingrediens</DialogTitle>
            <DialogDescription>
              Er du sikker på at du vil slette "{deleteTarget?.name}"?
            </DialogDescription>
          </DialogHeader>
          
          {checkingUsage ? (
            <div className="flex justify-center py-4">
              <Spinner size="sm" />
            </div>
          ) : (
            <>
              {deleteRecipeCount > 0 && (
                <div className="rounded-lg bg-amber-500/10 text-amber-600 text-sm p-3">
                  <strong>Advarsel:</strong> Denne ingrediensen brukes i {deleteRecipeCount} oppskrift{deleteRecipeCount !== 1 ? "er" : ""}. 
                  Sletting vil fjerne ingrediensen fra alle disse oppskriftene.
                </div>
              )}
              {deleteError && (
                <div className="rounded-lg bg-destructive/10 text-destructive text-sm p-3">
                  {deleteError}
                </div>
              )}
            </>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={closeDeleteDialog}>
              Avbryt
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting || checkingUsage}
            >
              {deleting ? <Spinner size="sm" className="mr-2" /> : null}
              Slett
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
