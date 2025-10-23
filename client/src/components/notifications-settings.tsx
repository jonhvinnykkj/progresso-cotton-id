import { usePushNotifications } from "@/lib/use-push-notifications";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, BellOff } from "lucide-react";
import { useState } from "react";

export function NotificationsSettings() {
  const [open, setOpen] = useState(false);
  const { permission, isSubscribed, subscribe, unsubscribe } = usePushNotifications();

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      await subscribe();
    } else {
      await unsubscribe();
    }
  };

  const getPermissionText = () => {
    switch (permission) {
      case "granted":
        return "Permissão concedida";
      case "denied":
        return "Permissão negada - ative nas configurações do navegador";
      default:
        return "Permissão não solicitada";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" data-testid="button-notifications-settings">
          {isSubscribed ? (
            <Bell className="w-5 h-5" />
          ) : (
            <BellOff className="w-5 h-5 text-muted-foreground" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configurações de Notificações</DialogTitle>
          <DialogDescription>
            Gerencie como você recebe alertas sobre atualizações do sistema
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-notifications">Notificações Push</Label>
              <p className="text-sm text-muted-foreground">
                Receba alertas sobre novos fardos e atualizações de status
              </p>
            </div>
            <Switch
              id="push-notifications"
              checked={isSubscribed}
              onCheckedChange={handleToggle}
              disabled={permission === "denied"}
              data-testid="switch-push-notifications"
            />
          </div>
          
          <div className="rounded-lg border p-3 bg-muted/50">
            <p className="text-sm font-medium mb-1">Status da Permissão</p>
            <p className="text-sm text-muted-foreground">{getPermissionText()}</p>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium">Você receberá notificações para:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Novos fardos cadastrados no sistema</li>
              <li>Atualizações de status (Campo → Pátio → Beneficiado)</li>
              <li>Alertas e eventos importantes</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
