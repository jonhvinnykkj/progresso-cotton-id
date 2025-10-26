import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { BaleTimeline } from "@/components/bale-timeline";
import type { Bale } from "@shared/schema";
import { ArrowLeft, Hash, Wheat, QrCode, Calendar, Loader2, User, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function BaleDetails() {
  const [, params] = useRoute("/bale/:id");
  const [, setLocation] = useLocation();
  const baleId = params?.id ? decodeURIComponent(params.id) : undefined;

  const { data: bale, isLoading } = useQuery<Bale>({
    queryKey: ["/api/bales", baleId],
    queryFn: async () => {
      const response = await fetch(`/api/bales/${encodeURIComponent(baleId!)}`);
      if (!response.ok) {
        throw new Error("Fardo não encontrado");
      }
      return response.json();
    },
    enabled: !!baleId,
  });

  // Fetch users to map IDs to display names
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<Array<{ id: string; displayName: string }>>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users", {
        credentials: "include",
      });
      if (!response.ok) {
        console.error('Erro ao buscar usuários:', response.status);
        return [];
      }
      const data = await response.json();
      console.log('👥 Usuários carregados:', data);
      return data;
    },
  });

  // Helper function to get user display name by ID
  const getUserDisplayName = (userId: string | null | undefined): string => {
    if (!userId) return "Não identificado";
    console.log('🔍 Buscando usuário com ID:', userId, 'na lista:', users);
    const user = users.find(u => u.id === userId);
    const result = user?.displayName || `ID: ${userId}`;
    console.log('✅ Resultado:', result);
    return result;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Carregando detalhes do fardo...</p>
        </div>
      </div>
    );
  }

  if (!bale) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
              <Hash className="w-8 h-8 text-destructive" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Fardo não encontrado</h2>
              <p className="text-sm text-muted-foreground mt-1">
                O fardo solicitado não existe no sistema
              </p>
            </div>
            <Button onClick={() => setLocation("/dashboard")}>
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => setLocation("/dashboard")}
            className="mb-2"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Detalhes do Fardo</h1>
              <p className="text-sm text-muted-foreground">
                Rastreabilidade completa
              </p>
            </div>
            <StatusBadge status={bale.status} size="lg" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Hash className="w-4 h-4" />
                  Número do Fardo
                </div>
                <p className="text-lg font-semibold" data-testid="text-numero">
                  {bale.numero}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Wheat className="w-4 h-4" />
                  Talhão
                </div>
                <p className="text-lg font-semibold" data-testid="text-talhao">
                  {bale.talhao}
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <QrCode className="w-4 h-4" />
                ID / QR Code
              </div>
              <p className="font-mono text-sm bg-muted p-3 rounded-lg break-all" data-testid="text-qrcode">
                {bale.id}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Calendar className="w-4 h-4" />
                  Criado em
                </div>
                <p className="text-sm font-medium">
                  {format(new Date(bale.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Calendar className="w-4 h-4" />
                  Última Atualização
                </div>
                <p className="text-sm font-medium">
                  {format(new Date(bale.updatedAt), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Tracking Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Rastreamento de Usuários
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Criado por */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="mt-0.5">
                <User className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Criado por</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  <span className="font-medium">{getUserDisplayName(bale.createdBy)}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(bale.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>

            {/* Transportado por */}
            {bale.status !== "campo" && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="mt-0.5">
                  <User className="w-4 h-4 text-yellow-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Transportado por</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    <span className="font-medium">{getUserDisplayName(bale.transportedBy)}</span>
                  </p>
                  {bale.transportedAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(bale.transportedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Processado por */}
            {bale.status === "beneficiado" && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="mt-0.5">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Processado por</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    <span className="font-medium">{getUserDisplayName(bale.processedBy)}</span>
                  </p>
                  {bale.processedAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(bale.processedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Informação complementar */}
            {bale.updatedBy && (
              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground">
                  Última atualização por: <span className="font-medium">{getUserDisplayName(bale.updatedBy)}</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Rastreabilidade</CardTitle>
          </CardHeader>
          <CardContent>
            <BaleTimeline bale={bale} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
