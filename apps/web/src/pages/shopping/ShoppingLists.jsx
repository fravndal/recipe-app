import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Plus, ShoppingCart, Check, Clock, Archive, Trash2 } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { EmptyState } from "@/components/layout/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
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

const STATUS_CONFIG = {
  draft: { label: "Utkast", icon: Clock, color: "text-muted-foreground" },
  active: { label: "Aktiv", icon: ShoppingCart, color: "text-primary" },
  completed: { label: "Fullført", icon: Check, color: "text-green-600" },
};

export function ShoppingLists() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleteList, setDeleteList] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadLists();
  }, [location.key]);

  const loadLists = async () => {
    // Load lists with full item details and pantry items in parallel
    const [listsRes, pantryRes] = await Promise.all([
      supabase
        .from("shopping_lists")
        .select(`
          *,
          shopping_list_items(id, checked, ingredient_id, quantity)
        `)
        .order("created_at", { ascending: false }),
      supabase
        .from("pantry_items")
        .select("ingredient_id, quantity"),
    ]);

    if (listsRes.error || !listsRes.data) {
      setLoading(false);
      return;
    }

    const pantryItems = pantryRes.data || [];

    // Helper to check if an item should be auto-completed based on pantry
    const shouldAutoComplete = (item) => {
      const pantryItem = pantryItems.find((p) => p.ingredient_id === item.ingredient_id);
      if (!pantryItem) return false;

      const pantryQty = Number(pantryItem.quantity) || 0;
      if (pantryQty <= 0) return false;

      const itemQty = Number(item.quantity) || 0;
      if (itemQty <= 0) return true;

      return pantryQty >= itemQty;
    };

    // Find all items across all lists that need to be checked or unchecked
    const itemsToCheck = [];
    const itemsToUncheck = [];

    for (const list of listsRes.data) {
      for (const item of list.shopping_list_items || []) {
        const shouldBeChecked = shouldAutoComplete(item);
        
        if (!item.checked && shouldBeChecked) {
          itemsToCheck.push(item.id);
        } else if (item.checked && !shouldBeChecked) {
          itemsToUncheck.push(item.id);
        }
      }
    }

    // Update items in database
    if (itemsToCheck.length > 0) {
      await supabase
        .from("shopping_list_items")
        .update({ checked: true })
        .in("id", itemsToCheck);
    }

    if (itemsToUncheck.length > 0) {
      await supabase
        .from("shopping_list_items")
        .update({ checked: false })
        .in("id", itemsToUncheck);
    }

    // Update local state with the new checked values
    const updatedLists = listsRes.data.map((list) => ({
      ...list,
      shopping_list_items: (list.shopping_list_items || []).map((item) => ({
        ...item,
        checked: itemsToCheck.includes(item.id)
          ? true
          : itemsToUncheck.includes(item.id)
          ? false
          : item.checked,
      })),
    }));

    setLists(updatedLists);
    setLoading(false);
  };

  const createList = async () => {
    if (!newListName.trim()) return;
    setCreating(true);

    const { data, error } = await supabase
      .from("shopping_lists")
      .insert({
        user_id: user.id,
        name: newListName.trim(),
        status: "active",
      })
      .select()
      .single();

    if (!error && data) {
      navigate(`/shopping/${data.id}`);
    }
    setCreating(false);
  };

  const getItemStats = (list) => {
    const items = list.shopping_list_items || [];
    const total = items.length;
    const checked = items.filter((i) => i.checked).length;
    return { total, checked };
  };

  const handleDelete = async () => {
    if (!deleteList) return;
    setDeleting(true);

    // Delete the list (items will cascade delete due to foreign key)
    const { error } = await supabase
      .from("shopping_lists")
      .delete()
      .eq("id", deleteList.id);

    if (!error) {
      setLists((prev) => prev.filter((l) => l.id !== deleteList.id));
    }

    setDeleting(false);
    setDeleteList(null);
  };

  return (
    <Shell title="Handlelister">
      <div className="p-4 max-w-lg mx-auto space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : lists.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="Ingen handlelister"
            description="Opprett en handleliste for å legge til varer"
            action={
              <Button onClick={() => setShowNewDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ny liste
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {lists.map((list) => {
              const { total, checked } = getItemStats(list);
              const StatusIcon = STATUS_CONFIG[list.status]?.icon || Clock;

              return (
                <Card key={list.id} className="hover:bg-accent/50 transition-colors">
                  <Link to={`/shopping/${list.id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{list.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={STATUS_CONFIG[list.status]?.color}
                          >
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {STATUS_CONFIG[list.status]?.label}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-sm text-muted-foreground">
                        {total === 0 ? (
                          "Ingen varer"
                        ) : (
                          <>
                            {checked}/{total} varer krysset av
                            <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{
                                  width: `${(checked / total) * 100}%`,
                                }}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Link>
                  <div className="px-6 pb-4 pt-0 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeleteList(list);
                      }}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* FAB */}
        <button
          onClick={() => setShowNewDialog(true)}
          className="fixed right-4 bottom-24 z-40 inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      {/* New list dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ny handleliste</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="list-name">Navn på listen</Label>
            <Input
              id="list-name"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="f.eks. Ukens handling"
              className="mt-2"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") createList();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Avbryt
            </Button>
            <Button onClick={createList} disabled={creating || !newListName.trim()}>
              {creating ? <Spinner size="sm" className="mr-2" /> : null}
              Opprett
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteList} onOpenChange={(open) => !open && setDeleteList(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Slett handleliste</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Er du sikker på at du vil slette «{deleteList?.name}»? Dette vil også slette alle varene i listen.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteList(null)}>
              Avbryt
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
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
