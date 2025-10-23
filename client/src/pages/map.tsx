import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BalesMap } from "@/components/bales-map";
import { useAuth } from "@/lib/auth-context";
import type { Bale } from "@shared/schema";
import { ArrowLeft, Map as MapIcon } from "lucide-react";

export default function MapPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const { data: bales = [], isLoading } = useQuery<Bale[]>({
    queryKey: ["/api/bales"],
  });

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Apenas administradores podem acessar o mapa.</p>
            <Button onClick={() => setLocation("/dashboard")} className="mt-4">
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const balesWithLocation = bales.filter(
    (bale) =>
      bale.campoLatitude ||
      bale.patioLatitude ||
      bale.beneficiadoLatitude
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/dashboard")}
              data-testid="button-back-to-dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <MapIcon className="w-6 h-6" />
                Mapa de Rastreamento
              </h1>
              <p className="text-sm text-muted-foreground">
                {balesWithLocation.length} fardos com localização
              </p>
            </div>
          </div>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-48" data-testid="select-map-status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="campo">Campo</SelectItem>
              <SelectItem value="patio">Pátio</SelectItem>
              <SelectItem value="beneficiado">Beneficiado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Trajetórias dos Fardos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-[500px]">
                <p className="text-muted-foreground">Carregando mapa...</p>
              </div>
            ) : balesWithLocation.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[500px] gap-2">
                <MapIcon className="w-12 h-12 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Nenhum fardo com localização GPS cadastrada
                </p>
              </div>
            ) : (
              <BalesMap bales={bales} selectedStatus={selectedStatus} />
            )}
          </CardContent>
        </Card>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-bale-campo" />
                Campo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Localização inicial do cadastro
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-bale-patio" />
                Pátio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Localização durante transporte
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-bale-beneficiado" />
                Beneficiado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Localização final do processamento
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
