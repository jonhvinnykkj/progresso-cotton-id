import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  async function requestPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      toast({
        title: "Não suportado",
        description: "Seu navegador não suporta notificações",
        variant: "destructive",
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        toast({
          title: "Permissão concedida",
          description: "Você receberá notificações de atualizações importantes",
        });
        return true;
      } else if (result === "denied") {
        toast({
          title: "Permissão negada",
          description: "Você não receberá notificações do sistema",
          variant: "destructive",
        });
      }
      return false;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }

  async function subscribe(): Promise<boolean> {
    if (!("serviceWorker" in navigator)) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      const permission = await requestPermission();
      if (!permission) {
        return false;
      }

      // For demonstration purposes, we'll just mark as subscribed
      // In production, you would subscribe to a push service here
      setIsSubscribed(true);
      
      // Store subscription preference
      localStorage.setItem("pushNotificationsEnabled", "true");
      
      toast({
        title: "Notificações ativadas",
        description: "Você receberá alertas sobre novos fardos e atualizações",
      });

      return true;
    } catch (error) {
      console.error("Error subscribing to push:", error);
      toast({
        title: "Erro",
        description: "Não foi possível ativar as notificações",
        variant: "destructive",
      });
      return false;
    }
  }

  async function unsubscribe(): Promise<boolean> {
    try {
      setIsSubscribed(false);
      localStorage.removeItem("pushNotificationsEnabled");
      
      toast({
        title: "Notificações desativadas",
        description: "Você não receberá mais alertas do sistema",
      });

      return true;
    } catch (error) {
      console.error("Error unsubscribing from push:", error);
      return false;
    }
  }

  async function sendNotification(title: string, body: string, data?: any) {
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    const enabled = localStorage.getItem("pushNotificationsEnabled") === "true";
    if (!enabled) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      await registration.showNotification(title, {
        body,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        data,
        tag: data?.tag || "default",
      });
    } catch (error) {
      console.error("Error showing notification:", error);
    }
  }

  // Check initial subscription state
  useEffect(() => {
    const enabled = localStorage.getItem("pushNotificationsEnabled") === "true";
    if (enabled && Notification.permission === "granted") {
      setIsSubscribed(true);
    }
  }, []);

  return {
    permission,
    isSubscribed,
    subscribe,
    unsubscribe,
    sendNotification,
  };
}
