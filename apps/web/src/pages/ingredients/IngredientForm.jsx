import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectWrapper } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
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
  // Antall
  "stk",
  "skive",
  "bit",
  "filet",
  "porsjon",
  // Vekt
  "g",
  "kg",
  "mg",
  // Volum
  "ml",
  "dl",
  "l",
  // Kjøkkenmål
  "ts",
  "ss",
  "klype",
  "kopp",
  // Mengde / pakning
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
  name: z.string().min(1, "Name is required"),
  category: z.string().optional(),
  default_unit: z.string().optional(),
});

export function IngredientForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      category: "",
      default_unit: "",
    },
  });

  const category = watch("category");
  const defaultUnit = watch("default_unit");

  useEffect(() => {
    if (id) {
      loadIngredient();
    }
  }, [id]);

  const loadIngredient = async () => {
    const { data, error } = await supabase
      .from("ingredients")
      .select("*")
      .eq("id", id)
      .single();

    if (!error && data) {
      reset({
        name: data.name,
        category: data.category || "",
        default_unit: data.default_unit || "",
      });
    }
    setLoading(false);
  };

  const onSubmit = async (data) => {
    setSaving(true);
    setError("");

    const ingredientData = {
      user_id: user.id,
      name: data.name.trim(),
      category: data.category || null,
      default_unit: data.default_unit || null,
    };

    if (isEditing) {
      const { error } = await supabase
        .from("ingredients")
        .update(ingredientData)
        .eq("id", id);

      if (error) {
        setError(error.message);
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from("ingredients")
        .insert(ingredientData);

      if (error) {
        if (error.code === "23505") {
          setError("An ingredient with this name already exists");
        } else {
          setError(error.message);
        }
        setSaving(false);
        return;
      }
    }

    navigate("/ingredients");
  };

  if (loading) {
    return (
      <Shell
        title={isEditing ? "Edit Ingredient" : "New Ingredient"}
        showBack
        showNav={false}
      >
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </Shell>
    );
  }

  return (
    <Shell
      title={isEditing ? "Edit Ingredient" : "New Ingredient"}
      showBack
      showNav={false}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="p-4 max-w-lg mx-auto">
        <div className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 text-destructive text-sm p-3">
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="e.g., Chicken Breast"
              className="mt-1"
              autoFocus
            />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <SelectWrapper className="mt-1">
              <Select
                id="category"
                value={category}
                onValueChange={(val) => setValue("category", val)}
              >
                <option value="">Select category...</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>
            </SelectWrapper>
          </div>

          <div>
            <Label htmlFor="default_unit">Default Unit</Label>
            <SelectWrapper className="mt-1">
              <Select
                id="default_unit"
                value={defaultUnit}
                onValueChange={(val) => setValue("default_unit", val)}
              >
                <option value="">Select unit...</option>
                {UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </Select>
            </SelectWrapper>
            <p className="text-sm text-muted-foreground mt-1">
              This will be pre-filled when adding this ingredient to recipes
            </p>
          </div>

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
              {isEditing ? "Save Changes" : "Create Ingredient"}
            </Button>
          </div>
        </div>
      </form>
    </Shell>
  );
}
