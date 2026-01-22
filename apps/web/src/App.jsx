import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui/spinner";

// Auth pages
import { Login } from "@/pages/auth/Login";
import { Register } from "@/pages/auth/Register";

// Main pages (will be created in Phase 2+)
import { RecipesList } from "@/pages/recipes/RecipesList";
import { RecipeDetail } from "@/pages/recipes/RecipeDetail";
import { RecipeForm } from "@/pages/recipes/RecipeForm";
import { IngredientsList } from "@/pages/ingredients/IngredientsList";
import { IngredientForm } from "@/pages/ingredients/IngredientForm";
import { ShoppingLists } from "@/pages/shopping/ShoppingLists";
import { ShoppingListDetail } from "@/pages/shopping/ShoppingListDetail";
import { PantryList } from "@/pages/pantry/PantryList";

// Protected route wrapper
function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

// Public route wrapper (redirects to app if logged in)
function PublicRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/recipes" replace />;
  }

  return <Outlet />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        {/* Recipes */}
        <Route path="/recipes" element={<RecipesList />} />
        <Route path="/recipes/new" element={<RecipeForm />} />
        <Route path="/recipes/:id" element={<RecipeDetail />} />
        <Route path="/recipes/:id/edit" element={<RecipeForm />} />

        {/* Ingredients */}
        <Route path="/ingredients" element={<IngredientsList />} />
        <Route path="/ingredients/new" element={<IngredientForm />} />
        <Route path="/ingredients/:id/edit" element={<IngredientForm />} />

        {/* Shopping */}
        <Route path="/shopping" element={<ShoppingLists />} />
        <Route path="/shopping/:id" element={<ShoppingListDetail />} />

        {/* Pantry */}
        <Route path="/pantry" element={<PantryList />} />
      </Route>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/recipes" replace />} />
      <Route path="*" element={<Navigate to="/recipes" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
