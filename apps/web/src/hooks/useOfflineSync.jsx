import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  getPendingOps,
  clearPendingOps,
  addPendingOp,
  cacheShoppingItems,
  getCachedShoppingItems,
  updateCachedItem,
} from "@/lib/db";

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const isSyncingRef = useRef(false);

  // Sync pending operations to server
  const syncPendingOps = useCallback(async () => {
    if (isSyncingRef.current || !navigator.onLine) return;

    isSyncingRef.current = true;
    setIsSyncing(true);
    
    try {
      const ops = await getPendingOps();
      if (ops.length === 0) {
        setIsSyncing(false);
        isSyncingRef.current = false;
        return;
      }

      for (const op of ops) {
        try {
          switch (op.type) {
            case "update_item":
              await supabase
                .from("shopping_list_items")
                .update(op.data)
                .eq("id", op.itemId);
              break;
            case "delete_item":
              await supabase
                .from("shopping_list_items")
                .delete()
                .eq("id", op.itemId);
              break;
            case "insert_item":
              await supabase.from("shopping_list_items").insert(op.data);
              break;
          }
        } catch (e) {
          console.error("Failed to sync operation:", op, e);
        }
      }

      await clearPendingOps();
      setPendingCount(0);
    } catch (e) {
      console.error("Sync failed:", e);
    }
    
    setIsSyncing(false);
    isSyncingRef.current = false;
  }, []);

  // Check pending operations count
  const checkPendingOps = useCallback(async () => {
    try {
      const ops = await getPendingOps();
      setPendingCount(ops.length);
    } catch (e) {
      console.error("Failed to check pending ops:", e);
    }
  }, []);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingOps();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncPendingOps]);

  // Check pending ops on mount (separate effect to avoid setState in effect warning)
  useEffect(() => {
    let mounted = true;
    getPendingOps().then((ops) => {
      if (mounted) {
        setPendingCount(ops.length);
      }
    }).catch(console.error);
    return () => { mounted = false; };
  }, []);

  // Queue an operation for later sync
  const queueOperation = useCallback(async (operation) => {
    await addPendingOp(operation);
    setPendingCount((c) => c + 1);

    // Try to sync immediately if online
    if (navigator.onLine) {
      syncPendingOps();
    }
  }, [syncPendingOps]);

  // Cache shopping list items for offline use
  const cacheList = useCallback(async (listId, items) => {
    try {
      await cacheShoppingItems(listId, items);
    } catch (e) {
      console.error("Failed to cache list:", e);
    }
  }, []);

  // Get cached items (for offline mode)
  const getCachedItems = useCallback(async (listId) => {
    try {
      return await getCachedShoppingItems(listId);
    } catch (e) {
      console.error("Failed to get cached items:", e);
      return [];
    }
  }, []);

  // Update item locally (optimistic update + queue sync)
  const updateItemOffline = useCallback(async (item, changes) => {
    const updatedItem = { ...item, ...changes };

    // Update local cache
    try {
      await updateCachedItem(updatedItem);
    } catch (e) {
      console.error("Failed to update cache:", e);
    }

    // Queue for sync
    await queueOperation({
      type: "update_item",
      itemId: item.id,
      data: changes,
    });

    return updatedItem;
  }, [queueOperation]);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    queueOperation,
    syncPendingOps,
    cacheList,
    getCachedItems,
    updateItemOffline,
  };
}
