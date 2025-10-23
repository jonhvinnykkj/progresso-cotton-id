import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { useServiceWorker } from "@/lib/use-service-worker";
import { Badge } from "@/components/ui/badge";

export function OfflineIndicator() {
  const { isOnline, hasPendingSync } = useServiceWorker();

  if (isOnline && !hasPendingSync) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {!isOnline && (
        <Badge variant="destructive" className="gap-2" data-testid="badge-offline">
          <CloudOff className="w-4 h-4" />
          Offline
        </Badge>
      )}
      {hasPendingSync && (
        <Badge variant="secondary" className="gap-2 mt-2" data-testid="badge-pending-sync">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Sincronizando...
        </Badge>
      )}
    </div>
  );
}
