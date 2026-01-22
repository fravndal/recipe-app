import { WifiOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function OfflineIndicator({ isOnline, isSyncing, pendingCount }) {
  if (isOnline && pendingCount === 0) return null;

  return (
    <div
      className={cn(
        "fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-sm font-medium shadow-lg flex items-center gap-2",
        isOnline
          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      )}
    >
      {!isOnline ? (
        <>
          <WifiOff className="h-4 w-4" />
          Offline mode
        </>
      ) : isSyncing ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          Syncing...
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4" />
          {pendingCount} pending
        </>
      )}
    </div>
  );
}
