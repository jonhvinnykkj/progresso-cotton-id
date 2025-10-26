import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Bale, UpdateBaleStatus } from "@shared/schema";
import { offlineStorage } from "./offline-storage";
import { queryClient, apiRequest } from "./queryClient";
import { useToast } from "@/hooks/use-toast";

export function useOfflineBales() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const { toast } = useToast();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      console.log("🌐 Voltou online - sincronizando dados...");
      setIsOnline(true);
      syncPendingUpdates();
    };
    
    const handleOffline = () => {
      console.log("📴 Ficou offline - usando cache local");
      setIsOnline(false);
      toast({
        title: "Modo Offline",
        description: "Você está offline. Os dados serão sincronizados quando voltar online.",
        variant: "default",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Fetch bales with offline support
  const { data: bales = [], isLoading, error } = useQuery<Bale[]>({
    queryKey: ["/api/bales"],
    queryFn: async () => {
      if (!isOnline) {
        // Load from offline storage
        console.log("📴 Offline - carregando do cache");
        return await offlineStorage.getAllBales();
      }

      try {
        // Try to fetch from API
        const response = await fetch("/api/bales");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Save to offline storage for future offline use
        await offlineStorage.saveBales(data);
        
        return data;
      } catch (error) {
        console.error("❌ Erro ao buscar dados online, usando cache:", error);
        // Fallback to offline storage
        return await offlineStorage.getAllBales();
      }
    },
    staleTime: isOnline ? 30000 : Infinity, // 30s when online, never stale offline
    gcTime: Infinity, // Keep in memory
    retry: isOnline ? 3 : 0, // Retry only when online
    refetchOnWindowFocus: isOnline,
    refetchOnReconnect: true,
  });

  // Update bale status with offline support
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateBaleStatus }) => {
      if (!isOnline) {
        // Update offline storage
        console.log(`📴 Offline - salvando atualização localmente: ${id} → ${data.status}`);
        await offlineStorage.updateBaleStatus(id, data.status);
        
        toast({
          title: "Atualização salva localmente",
          description: "Será sincronizada quando você voltar online.",
        });
        
        return { id, ...data, _offlineUpdate: true } as any;
      }

      // Update via API
      const encodedId = encodeURIComponent(id);
      return apiRequest("PATCH", `/api/bales/${encodedId}/status`, data);
    },
    onSuccess: (data, variables) => {
      if ((data as any)._offlineUpdate) {
        // Offline update - update local cache
        queryClient.setQueryData(["/api/bales"], (old: Bale[] = []) => {
          return old.map((bale) =>
            bale.id === variables.id
              ? { ...bale, status: variables.data.status }
              : bale
          );
        });
      } else {
        // Online update successful
        queryClient.invalidateQueries({ queryKey: ["/api/bales"] });
        queryClient.invalidateQueries({ queryKey: ["/api/bales/stats"] });
      }
    },
  });

  // Sync pending updates when back online
  const syncPendingUpdates = async () => {
    if (!isOnline || syncInProgress) return;

    setSyncInProgress(true);
    try {
      const pending = await offlineStorage.getPendingUpdates();
      
      if (pending.length === 0) {
        console.log("✅ Nenhuma atualização pendente");
        // Just refresh data from server
        queryClient.invalidateQueries({ queryKey: ["/api/bales"] });
        setSyncInProgress(false);
        return;
      }

      console.log(`🔄 Sincronizando ${pending.length} atualizações pendentes...`);
      
      let successCount = 0;
      let errorCount = 0;

      for (const update of pending) {
        try {
          const encodedId = encodeURIComponent(update.id);
          await apiRequest("PATCH", `/api/bales/${encodedId}/status`, {
            status: update.status as any,
          });
          
          await offlineStorage.clearPendingUpdate(update.id);
          successCount++;
          console.log(`✅ Sincronizado: ${update.id} → ${update.status}`);
        } catch (error) {
          errorCount++;
          console.error(`❌ Erro ao sincronizar ${update.id}:`, error);
        }
      }

      if (successCount > 0) {
        toast({
          title: "Sincronização concluída",
          description: `${successCount} atualizações sincronizadas${errorCount > 0 ? `, ${errorCount} falharam` : ""}.`,
        });
        
        // Refresh data from server
        queryClient.invalidateQueries({ queryKey: ["/api/bales"] });
      }
    } catch (error) {
      console.error("❌ Erro na sincronização:", error);
      toast({
        variant: "destructive",
        title: "Erro na sincronização",
        description: "Não foi possível sincronizar todas as atualizações.",
      });
    } finally {
      setSyncInProgress(false);
    }
  };

  return {
    bales,
    isLoading,
    error,
    isOnline,
    syncInProgress,
    updateStatus: updateStatusMutation.mutate,
    isUpdating: updateStatusMutation.isPending,
    syncPendingUpdates,
  };
}
