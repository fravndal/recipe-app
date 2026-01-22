import { NavLink } from "react-router-dom";
import {
  BookOpen,
  Carrot,
  ShoppingCart,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/recipes", icon: BookOpen, label: "Recipes" },
  { to: "/ingredients", icon: Carrot, label: "Ingredients" },
  { to: "/shopping", icon: ShoppingCart, label: "Shopping" },
  { to: "/pantry", icon: Package, label: "Pantry" },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t safe-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center py-2 px-4 min-w-[64px] min-h-[56px] transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              <IconComponent className="h-6 w-6" />
              <span className="text-xs mt-1">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
