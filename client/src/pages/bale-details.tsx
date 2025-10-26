import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { BaleTimeline } from "@/components/bale-timeline";
import type { Bale } from "@shared/schema";
import { ArrowLeft, Hash, Wheat, QrCode, Calendar, Loader2, User, Users, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Footer } from "@/components/footer";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useState } from "react";

export default function BaleDetails() {
  const [, params] = useRoute("/bale/:id");
  const [, setLocation] = useLocation();
  const { selectedRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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
  const { data: users = [] } = useQuery<Array<{ id: string; displayName: string }>>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users", {
        credentials: "include",
      });
      if (!response.ok) {
        return [];
      }
      return response.json();
    },
  });

  // Helper function to get user display name by ID
  const getUserDisplayName = (userId: string | null | undefined): string => {
    if (!userId) return "Não identificado";
    const user = users.find(u => String(u.id) === String(userId));
    return user?.displayName || `Usuário #${userId}`;
  };

  // Mutation para excluir fardo
  const deleteBaleMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/bales/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Erro ao excluir fardo");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bales"] });
      toast({
        title: "Fardo excluído!",
        description: "O fardo foi removido do sistema com sucesso.",
      });
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir fardo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground font-semibold">Carregando detalhes do fardo...</p>
        </div>
      </div>
    );
  }

  if (!bale) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background flex items-center justify-center p-4">
        <Card className="max-w-md shadow-xl border-2 rounded-2xl overflow-hidden animate-fade-in-up">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
            </div>
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl w-fit mx-auto mb-3">
              <Hash className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardContent className="pt-6 text-center space-y-4 p-6">
            <div>
              <h2 className="text-xl font-bold">Fardo não encontrado</h2>
              <p className="text-sm text-muted-foreground mt-2">
                O fardo solicitado não existe no sistema
              </p>
            </div>
            <Button 
              onClick={() => setLocation("/dashboard")}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 font-bold"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => setLocation("/dashboard")}
            className="mb-3 hover:scale-105 transition-transform duration-300"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-yellow-600 bg-clip-text text-transparent">
                Detalhes do Fardo
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Rastreabilidade completa
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={bale.status} size="lg" />
              {selectedRole === "superadmin" && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  className="h-10 rounded-xl hover:scale-105 transition-all duration-300 font-semibold"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
        {/* Basic Information */}
        <Card className="shadow-xl border-2 rounded-2xl overflow-hidden animate-fade-in-up">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 pb-8 relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
            </div>
            
            <div className="relative">
              <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl w-fit mb-3">
                <Hash className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-xl text-white font-bold">
                Informações Básicas
              </CardTitle>
            </div>
          </div>
          
          <CardContent className="space-y-5 p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border-2 border-primary/20 hover:scale-[1.02] transition-transform duration-300">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2 font-semibold">
                  <Hash className="w-4 h-4" />
                  Número do Fardo
                </div>
                <p className="text-2xl font-bold text-primary" data-testid="text-numero">
                  {bale.numero}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border-2 border-primary/20 hover:scale-[1.02] transition-transform duration-300">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2 font-semibold">
                  <Wheat className="w-4 h-4" />
                  Talhão
                </div>
                <p className="text-2xl font-bold text-primary" data-testid="text-talhao">
                  {bale.talhao}
                </p>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl border-2 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2 font-semibold">
                <QrCode className="w-4 h-4 text-green-600" />
                ID / QR Code
              </div>
              <p className="font-mono text-sm bg-white dark:bg-background p-3 rounded-lg break-all border" data-testid="text-qrcode">
                {bale.id}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t-2">
              <div className="p-3 rounded-xl bg-muted/50">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5 font-semibold">
                  <Calendar className="w-3.5 h-3.5" />
                  Criado em
                </div>
                <p className="text-sm font-bold">
                  {format(new Date(bale.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-muted/50">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5 font-semibold">
                  <Calendar className="w-3.5 h-3.5" />
                  Última Atualização
                </div>
                <p className="text-sm font-bold">
                  {format(new Date(bale.updatedAt), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Histórico de Rastreabilidade com Usuários */}
        <Card className="shadow-xl border-2 rounded-2xl overflow-hidden animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 pb-8 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
            </div>
            
            <div className="relative">
              <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl w-fit mb-3">
                <Users className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-xl text-white font-bold flex items-center gap-2">
                Histórico de Rastreabilidade
              </CardTitle>
            </div>
          </div>
          
          <CardContent className="p-6">
            <BaleTimeline bale={bale} getUserDisplayName={getUserDisplayName} />
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <Footer />

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-2xl border-2">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive text-xl font-bold">
              <div className="p-2 bg-destructive/10 rounded-xl">
                <Trash2 className="h-6 w-6" />
              </div>
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 text-base pt-2">
              <p>
                Tem certeza que deseja excluir o fardo <strong className="text-foreground font-bold">{bale.id}</strong>?
              </p>
              <div className="p-4 bg-destructive/10 border-2 border-destructive/30 rounded-xl">
                <p className="text-destructive font-bold text-sm">
                  Esta ação não pode ser desfeita e todos os dados do fardo serão permanentemente removidos.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel className="h-11 rounded-xl border-2 hover:scale-105 transition-all duration-300 font-semibold">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteBaleMutation.mutate(bale.id)}
              className="h-11 rounded-xl bg-destructive hover:bg-destructive/90 hover:scale-105 transition-all duration-300 font-bold"
              disabled={deleteBaleMutation.isPending}
            >
              {deleteBaleMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir Fardo"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
