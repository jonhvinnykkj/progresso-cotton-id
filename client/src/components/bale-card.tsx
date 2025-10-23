import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "./status-badge";
import type { Bale } from "@shared/schema";
import { MapPin, Hash, Wheat } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCoordinates } from "@/lib/geolocation";

interface BaleCardProps {
  bale: Bale;
  onClick?: () => void;
}

export function BaleCard({ bale, onClick }: BaleCardProps) {
  return (
    <Card
      className="hover-elevate active-elevate-2 cursor-pointer transition-all"
      onClick={onClick}
      data-testid={`card-bale-${bale.id}`}
    >
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Hash className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="font-semibold text-base truncate">{bale.numero}</span>
        </div>
        <StatusBadge status={bale.status} size="sm" />
      </CardHeader>
      <CardContent className="space-y-2.5">
        <div className="flex items-center gap-2 text-sm">
          <Wheat className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">Talhão:</span>
          <span className="font-medium truncate">{bale.talhao}</span>
        </div>

        {bale.latitude && bale.longitude && (
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <span className="font-mono text-xs text-muted-foreground break-all leading-snug">
              {formatCoordinates(bale.latitude, bale.longitude)}
            </span>
          </div>
        )}

        <div className="text-xs text-muted-foreground pt-1 border-t">
          Atualizado {format(new Date(bale.updatedAt), "dd/MM/yy", { locale: ptBR })}
        </div>
      </CardContent>
    </Card>
  );
}
