import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, ShoppingCart, Check, Clock, Archive } from "lucide-react";
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
  const { user } = useAuth();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    const { data, error } = await supabase
      .from("shopping_lists")
      .select(`
        *,
        shopping_list_items(id, checked)
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setLists(data);
    }
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
                <Link key={list.id} to={`/shopping/${list.id}`}>
                  <Card className="hover:bg-accent/50 transition-colors">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{list.name}</CardTitle>
                        <Badge
                          variant="outline"
                          className={STATUS_CONFIG[list.status]?.color}
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {STATUS_CONFIG[list.status]?.label}
                        </Badge>
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
                  </Card>
                </Link>
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
    </Shell>
  );
}
