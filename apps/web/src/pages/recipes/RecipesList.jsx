import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, BookOpen, Search } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { EmptyState } from "@/components/layout/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/lib/supabase";

export function RecipesList() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    const { data, error } = await supabase
      .from("recipes")
      .select(`
        *,
        recipe_tags(
          tags(id, name, color)
        )
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setRecipes(data);
    }
    setLoading(false);
  };

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Shell title="Recipes">
      <div className="p-4 max-w-lg mx-auto space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search recipes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : filteredRecipes.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={search ? "No recipes found" : "No recipes yet"}
            description={
              search
                ? "Try a different search term"
                : "Create your first recipe to get started"
            }
            action={
              !search && (
                <Button asChild>
                  <Link to="/recipes/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Recipe
                  </Link>
                </Button>
              )
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredRecipes.map((recipe) => (
              <Link key={recipe.id} to={`/recipes/${recipe.id}`}>
                <Card className="hover:bg-accent/50 transition-colors">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{recipe.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {recipe.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {recipe.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {recipe.recipe_tags?.map(({ tags }) => (
                        <Badge
                          key={tags.id}
                          variant="secondary"
                          style={{
                            backgroundColor: tags.color
                              ? `${tags.color}20`
                              : undefined,
                            color: tags.color || undefined,
                          }}
                        >
                          {tags.name}
                        </Badge>
                      ))}
                      {recipe.servings && (
                        <Badge variant="outline">
                          {recipe.servings} servings
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* FAB */}
        <Link
          to="/recipes/new"
          className="fixed right-4 bottom-24 z-40 inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-6 w-6" />
        </Link>
      </div>
    </Shell>
  );
}
