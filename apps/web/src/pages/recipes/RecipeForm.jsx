import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, X, ChevronLeft } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Select, SelectWrapper } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

const CATEGORIES = [
  "Grønnsaker",
  "Frukt",
  "Kjøtt",
  "Fisk og sjømat",
  "Meieriprodukter",
  "Egg",
  "Korn og kornprodukter",
  "Belgfrukter",
  "Poteter og rotfrukter",
  "Nøtter og frø",
  "Krydder og urter",
  "Oljer og fett",
  "Søtning og sukker",
  "Sauser og dressinger",
  "Plantebaserte alternativer",
];

const UNITS = [
  "stk",
  "skive",
  "bit",
  "filet",
  "porsjon",
  "g",
  "kg",
  "mg",
  "ml",
  "dl",
  "l",
  "ts",
  "ss",
  "klype",
  "kopp",
  "bunt",
  "håndfull",
  "pose",
  "pakke",
  "boks",
  "glass",
  "beger",
  "tube",
  "kartong",
];

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  instructions: z.string().optional(),
  servings: z.coerce.number().min(1).optional().nullable(),
  ingredients: z
    .array(
      z.object({
        ingredient_id: z.string().min(1, "Select an ingredient"),
        quantity: z.coerce.number().optional().nullable(),
        unit: z.string().optional(),
      })
    )
    .optional(),
});

export function RecipeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [allIngredients, setAllIngredients] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [showIngredientPicker, setShowIngredientPicker] = useState(false);
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [showNewIngredientForm, setShowNewIngredientForm] = useState(false);
  const [newIngredient, setNewIngredient] = useState({ name: "", category: "", default_unit: "" });
  const [creatingIngredient, setCreatingIngredient] = useState(false);
  const [ingredientError, setIngredientError] = useState("");

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      instructions: "",
      servings: null,
      ingredients: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "ingredients",
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    // Load all ingredients
    const { data: ingredients } = await supabase
      .from("ingredients")
      .select("id, name, category, default_unit")
      .order("name");

    if (ingredients) setAllIngredients(ingredients);

    // Load all tags
    const { data: tags } = await supabase
      .from("tags")
      .select("id, name, color")
      .order("name");

    if (tags) setAllTags(tags);

    // If editing, load recipe
    if (id) {
      const { data: recipe } = await supabase
        .from("recipes")
        .select(`
          *,
          recipe_ingredients(
            ingredient_id,
            quantity,
            unit
          ),
          recipe_tags(tag_id)
        `)
        .eq("id", id)
        .single();

      if (recipe) {
        reset({
          title: recipe.title,
          description: recipe.description || "",
          instructions: recipe.instructions || "",
          servings: recipe.servings,
          ingredients: recipe.recipe_ingredients || [],
        });
        setSelectedTags(recipe.recipe_tags?.map((rt) => rt.tag_id) || []);
      }
    }
    setLoading(false);
  };

  const onSubmit = async (data) => {
    setSaving(true);

    const recipeData = {
      user_id: user.id,
      title: data.title,
      description: data.description || null,
      instructions: data.instructions || null,
      servings: data.servings || null,
    };

    let recipeId = id;

    if (isEditing) {
      const { error } = await supabase
        .from("recipes")
        .update(recipeData)
        .eq("id", id);
      if (error) {
        setSaving(false);
        return;
      }
    } else {
      const { data: newRecipe, error } = await supabase
        .from("recipes")
        .insert(recipeData)
        .select()
        .single();
      if (error) {
        setSaving(false);
        return;
      }
      recipeId = newRecipe.id;
    }

    // Update ingredients
    await supabase
      .from("recipe_ingredients")
      .delete()
      .eq("recipe_id", recipeId);

    if (data.ingredients && data.ingredients.length > 0) {
      const ingredientData = data.ingredients.map((ing) => ({
        user_id: user.id,
        recipe_id: recipeId,
        ingredient_id: ing.ingredient_id,
        quantity: ing.quantity || 1,
        unit: ing.unit || null,
      }));

      await supabase.from("recipe_ingredients").insert(ingredientData);
    }

    // Update tags
    await supabase.from("recipe_tags").delete().eq("recipe_id", recipeId);

    if (selectedTags.length > 0) {
      const tagData = selectedTags.map((tagId) => ({
        recipe_id: recipeId,
        tag_id: tagId,
      }));

      await supabase.from("recipe_tags").insert(tagData);
    }

    navigate(`/recipes/${recipeId}`);
  };

  const toggleTag = (tagId) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const addIngredient = (ingredient) => {
    append({
      ingredient_id: ingredient.id,
      quantity: 1,
      unit: ingredient.default_unit || "",
    });
    setShowIngredientPicker(false);
    setIngredientSearch("");
    setShowNewIngredientForm(false);
    setNewIngredient({ name: "", category: "", default_unit: "" });
  };

  const openNewIngredientForm = () => {
    setNewIngredient({ name: ingredientSearch, category: "", default_unit: "" });
    setShowNewIngredientForm(true);
  };

  const createAndAddIngredient = async () => {
    if (!newIngredient.name.trim()) return;
    
    setCreatingIngredient(true);
    setIngredientError("");
    
    const { data, error } = await supabase
      .from("ingredients")
      .insert({
        user_id: user.id,
        name: newIngredient.name.trim(),
        category: newIngredient.category || null,
        default_unit: newIngredient.default_unit || null,
      })
      .select()
      .single();
    
    if (error) {
      if (error.code === "23505") {
        setIngredientError("En ingrediens med dette navnet og enheten finnes allerede");
      } else {
        setIngredientError(error.message);
      }
      setCreatingIngredient(false);
      return;
    }
    
    if (data) {
      setAllIngredients((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      addIngredient(data);
    }
    
    setCreatingIngredient(false);
  };

  const filteredIngredients = allIngredients.filter(
    (ing) =>
      ing.name.toLowerCase().includes(ingredientSearch.toLowerCase()) &&
      !fields.some((f) => f.ingredient_id === ing.id)
  );

  const getIngredientDisplay = (ingredientId) => {
    const ing = allIngredients.find((i) => i.id === ingredientId);
    if (!ing) return "";
    return ing.default_unit ? `${ing.name} (${ing.default_unit})` : ing.name;
  };

  if (loading) {
    return (
      <Shell title={isEditing ? "Edit Recipe" : "New Recipe"} showBack>
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </Shell>
    );
  }

  return (
    <Shell
      title={isEditing ? "Edit Recipe" : "New Recipe"}
      showBack
      showNav={false}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="p-4 max-w-lg mx-auto">
        <div className="space-y-6">
          {/* Basic info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="Recipe name"
                className="mt-1"
              />
              {errors.title && (
                <p className="text-sm text-destructive mt-1">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Brief description"
                rows={2}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="servings">Servings</Label>
              <Input
                id="servings"
                type="number"
                min="1"
                {...register("servings")}
                placeholder="4"
                className="mt-1"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {allTags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                  className="cursor-pointer"
                  style={
                    selectedTags.includes(tag.id) && tag.color
                      ? { backgroundColor: tag.color }
                      : {}
                  }
                  onClick={() => toggleTag(tag.id)}
                >
                  {tag.name}
                </Badge>
              ))}
              {allTags.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No tags yet. Create tags in settings.
                </p>
              )}
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Ingredients</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowIngredientPicker(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            {fields.length > 0 ? (
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex items-start gap-2 p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="font-medium">
                        {getIngredientDisplay(field.ingredient_id)}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Qty"
                          {...register(`ingredients.${index}.quantity`)}
                          className="w-20"
                        />
                        <Input
                          placeholder="Unit"
                          {...register(`ingredients.${index}.unit`)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No ingredients added yet
              </p>
            )}
          </div>

          {/* Instructions */}
          <div>
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              {...register("instructions")}
              placeholder="Step by step instructions..."
              rows={8}
              className="mt-1"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? <Spinner size="sm" className="mr-2" /> : null}
              {isEditing ? "Save Changes" : "Create Recipe"}
            </Button>
          </div>
        </div>
      </form>

      {/* Ingredient picker dialog */}
      <Dialog
        open={showIngredientPicker}
        onOpenChange={(open) => {
          setShowIngredientPicker(open);
          if (!open) {
            setShowNewIngredientForm(false);
            setNewIngredient({ name: "", category: "", default_unit: "" });
            setIngredientSearch("");
            setIngredientError("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <DialogTitle>
                {showNewIngredientForm ? (
                  <button
                    type="button"
                    className="flex items-center gap-1 hover:text-muted-foreground"
                    onClick={() => {
                      setShowNewIngredientForm(false);
                      setIngredientError("");
                    }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Ny ingrediens
                  </button>
                ) : (
                  "Legg til ingrediens"
                )}
              </DialogTitle>
              {!showNewIngredientForm && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNewIngredient({ name: "", category: "", default_unit: "" });
                    setShowNewIngredientForm(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Ny
                </Button>
              )}
            </div>
          </DialogHeader>
          
          {showNewIngredientForm ? (
            <div className="space-y-4">
              {ingredientError && (
                <div className="rounded-lg bg-destructive/10 text-destructive text-sm p-3">
                  {ingredientError}
                </div>
              )}
              <div>
                <Label htmlFor="new-ing-name">Navn *</Label>
                <Input
                  id="new-ing-name"
                  value={newIngredient.name}
                  onChange={(e) => {
                    setNewIngredient((prev) => ({ ...prev, name: e.target.value }));
                    setIngredientError("");
                  }}
                  placeholder="Ingrediensnavn"
                  className="mt-1"
                  autoFocus
                />
              </div>
              <div>
                <Label htmlFor="new-ing-category">Kategori</Label>
                <SelectWrapper className="mt-1">
                  <Select
                    id="new-ing-category"
                    value={newIngredient.category}
                    onValueChange={(val) => setNewIngredient((prev) => ({ ...prev, category: val }))}
                  >
                    <option value="">Velg kategori...</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </Select>
                </SelectWrapper>
              </div>
              <div>
                <Label htmlFor="new-ing-unit">Standard enhet</Label>
                <SelectWrapper className="mt-1">
                  <Select
                    id="new-ing-unit"
                    value={newIngredient.default_unit}
                    onValueChange={(val) => setNewIngredient((prev) => ({ ...prev, default_unit: val }))}
                  >
                    <option value="">Velg enhet...</option>
                    {UNITS.map((unit) => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </Select>
                </SelectWrapper>
              </div>
              <Button
                type="button"
                className="w-full"
                disabled={!newIngredient.name.trim() || creatingIngredient}
                onClick={createAndAddIngredient}
              >
                {creatingIngredient ? <Spinner size="sm" className="mr-2" /> : null}
                Opprett og legg til
              </Button>
            </div>
          ) : (
            <>
              <Input
                placeholder="Søk ingredienser..."
                value={ingredientSearch}
                onChange={(e) => setIngredientSearch(e.target.value)}
                autoFocus
              />
              <div className="max-h-64 overflow-auto space-y-1">
                {ingredientSearch && (
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent transition-colors border border-dashed border-muted-foreground/50"
                    onClick={openNewIngredientForm}
                  >
                    <div className="font-medium flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Opprett "{ingredientSearch}"
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Legg til ny ingrediens
                    </div>
                  </button>
                )}
                {filteredIngredients.map((ing) => (
                  <button
                    key={ing.id}
                    type="button"
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent transition-colors"
                    onClick={() => addIngredient(ing)}
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
                {filteredIngredients.length === 0 && !ingredientSearch && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Alle ingredienser er allerede lagt til
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
