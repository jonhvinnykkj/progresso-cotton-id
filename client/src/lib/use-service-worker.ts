import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "./queryClient";

export function useServiceWorker() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasPendingSync, setHasPendingSync] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registered:", registration);

          // Listen for updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  toast({
                    title: "Atualização disponível",
                    description: "Uma nova versão está pronta. Recarregue para atualizar.",
                    duration: 10000,
                  });
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });

      // Listen for sync messages from service worker
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data.type === "SYNC_SUCCESS") {
          toast({
            title: "Sincronização concluída",
            description: `Operação offline sincronizada com sucesso`,
          });
          checkPendingSync();

          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ["/api/bales"] });
          queryClient.invalidateQueries({ queryKey: ["/api/bales/stats"] });
        } else if (event.data.type === "REQUEST_QUEUED") {
          setHasPendingSync(true);
          toast({
            title: "Operação salva",
            description: "A operação será sincronizada quando a conexão retornar.",
          });
        }
      });
    }

    // Handle online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Conexão restaurada",
        description: "Você está online novamente. Sincronizando dados...",
      });

      // Trigger sync
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: "TRIGGER_SYNC" });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Modo offline",
        description: "Você está offline. As operações serão sincronizadas quando a conexão retornar.",
        variant: "destructive",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check for pending sync on mount
    checkPendingSync().then(() => {
      // If online and has pending items, trigger sync immediately
      checkAndTriggerSync();
    });

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [toast]);

  async function checkAndTriggerSync() {
    if (navigator.onLine) {
      try {
        const db = await openDB();
        const tx = db.transaction("offline-queue", "readonly");
        const store = tx.objectStore("offline-queue");
        const countRequest = store.count();
        
        const count = await new Promise<number>((resolve, reject) => {
          countRequest.onsuccess = () => resolve(countRequest.result);
          countRequest.onerror = () => reject(countRequest.error);
        });
        
        if (count > 0 && "serviceWorker" in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: "TRIGGER_SYNC" });
        }
      } catch (error) {
        console.error("Error checking for pending sync:", error);
      }
    }
  }

  async function checkPendingSync() {
    try {
      const db = await openDB();
      const tx = db.transaction("offline-queue", "readonly");
      const store = tx.objectStore("offline-queue");
      const countRequest = store.count();
      
      const count = await new Promise<number>((resolve, reject) => {
        countRequest.onsuccess = () => resolve(countRequest.result);
        countRequest.onerror = () => reject(countRequest.error);
      });
      
      setHasPendingSync(count > 0);
    } catch (error) {
      console.error("Error checking pending sync:", error);
    }
  }

  function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("bale-tracker-offline", 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains("offline-queue")) {
          db.createObjectStore("offline-queue", { keyPath: "id", autoIncrement: true });
        }
      };
    });
  }

  return {
    isOnline,
    hasPendingSync,
  };
}
