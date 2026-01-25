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

// Unit type labels in Norwegian
const UNIT_TYPE_LABELS = {
  count: "Antall",
  weight: "Vekt",
  volume: "Volum",
  kitchen: "Kjøkkenmål",
  package: "Pakning",
};

const schema = z.object({
  name: z.string().min(1, "Navn er påkrevd"),
  category: z.string().optional(),
  default_unit: z.string().optional(),
});

export function IngredientForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);

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
    loadFormData();
  }, [id]);

  const loadFormData = async () => {
    // Load categories, units, and optionally the ingredient in parallel
    const promises = [
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("units").select("*").order("sort_order"),
    ];

    if (id) {
      promises.push(
        supabase.from("ingredients").select("*").eq("id", id).single()
      );
    }

    const results = await Promise.all(promises);

    const [categoriesRes, unitsRes, ingredientRes] = results;

    if (categoriesRes.data) {
      setCategories(categoriesRes.data);
    }

    if (unitsRes.data) {
      setUnits(unitsRes.data);
    }

    if (ingredientRes?.data) {
      reset({
        name: ingredientRes.data.name,
        category: ingredientRes.data.category || "",
        default_unit: ingredientRes.data.default_unit || "",
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
          setError("En ingrediens med dette navnet finnes allerede");
        } else {
          setError(error.message);
        }
        setSaving(false);
        return;
      }
    }

    navigate("/ingredients");
  };

  // Group units by type for better display
  const groupedUnits = units.reduce((acc, unit) => {
    if (!acc[unit.unit_type]) {
      acc[unit.unit_type] = [];
    }
    acc[unit.unit_type].push(unit);
    return acc;
  }, {});

  if (loading) {
    return (
      <Shell
        title={isEditing ? "Rediger ingrediens" : "Ny ingrediens"}
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
      title={isEditing ? "Rediger ingrediens" : "Ny ingrediens"}
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
            <Label htmlFor="name">Navn *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="f.eks. Kyllingfilet"
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
            <Label htmlFor="category">Kategori</Label>
            <SelectWrapper className="mt-1">
              <Select
                id="category"
                value={category}
                onValueChange={(val) => setValue("category", val)}
              >
                <option value="">Velg kategori...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </Select>
            </SelectWrapper>
          </div>

          <div>
            <Label htmlFor="default_unit">Standard enhet</Label>
            <SelectWrapper className="mt-1">
              <Select
                id="default_unit"
                value={defaultUnit}
                onValueChange={(val) => setValue("default_unit", val)}
              >
                <option value="">Velg enhet...</option>
                {Object.entries(groupedUnits).map(([type, typeUnits]) => (
                  <optgroup key={type} label={UNIT_TYPE_LABELS[type] || type}>
                    {typeUnits.map((unit) => (
                      <option key={unit.id} value={unit.name}>
                        {unit.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </Select>
            </SelectWrapper>
            <p className="text-sm text-muted-foreground mt-1">
              Forhåndsutfylles når du legger til ingrediensen i oppskrifter
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => navigate(-1)}
            >
              Avbryt
            </Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? <Spinner size="sm" className="mr-2" /> : null}
              {isEditing ? "Lagre endringer" : "Opprett ingrediens"}
            </Button>
          </div>
        </div>
      </form>
    </Shell>
  );
}
