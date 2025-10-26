import { useState } from "react";
import { useLocation, Redirect } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Footer } from "@/components/footer";
import { Settings, LogOut, Save, Loader2, Trash2, AlertTriangle } from "lucide-react";
import logoProgresso from "/favicon.png";
import { z } from "zod";

const safraSettingsSchema = z.object({
  safra: z.string().min(1, "Safra é obrigatória"),
});

type SafraSettingsForm = z.infer<typeof safraSettingsSchema>;

export default function SettingsPage() {
  const [, setLocation] = useLocation();
  const { logout, user, selectedRole } = useAuth();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Verificar se é admin
  if (selectedRole !== "admin") {
    return <Redirect to="/dashboard" />;
  }

  // Buscar safra padrão atual
  const { data: defaultSafraData, isLoading } = useQuery<{ value: string }>({
    queryKey: ["/api/settings/default-safra"],
  });

  const form = useForm<SafraSettingsForm>({
    resolver: zodResolver(safraSettingsSchema),
    values: {
      safra: defaultSafraData?.value || "",
    },
  });

  // Mutation para atualizar safra padrão
  const updateSafraMutation = useMutation({
    mutationFn: async (data: SafraSettingsForm) => {
      const response = await fetch("/api/settings/default-safra", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: data.safra }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao atualizar safra");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/default-safra"] });
      toast({
        title: "Configurações salvas",
        description: "Safra padrão atualizada com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message,
      });
    },
  });

  const handleSave = (data: SafraSettingsForm) => {
    updateSafraMutation.mutate(data);
  };

  const handleDeleteAllBales = async () => {
    setIsDeleting(true);
    try {
      const response = await apiRequest("DELETE", "/api/bales/all", {
        confirm: "DELETE_ALL_BALES",
      });

      const data = await response.json() as { message?: string; deletedCount: number };

      toast({
        title: "Fardos deletados",
        description: data.message || `${data.deletedCount} fardo(s) deletado(s) com sucesso`,
      });

      // Invalidate all bale-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/bales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bales/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bales/stats-by-talhao"] });

      setShowDeleteDialog(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao deletar fardos",
        description: error instanceof Error ? error.message : "Tente novamente.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <div className="mobile-page">
      {/* Header */}
      <header className="mobile-header">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-between gap-3 py-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <img 
                src={logoProgresso} 
                alt="Grupo Progresso" 
                className="h-8 sm:h-10 w-auto shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-xl font-semibold truncate">Configurações</h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  Administrador: {user?.username}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation("/dashboard")}
                data-testid="button-back-dashboard"
                className="shrink-0"
              >
                Dashboard
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                data-testid="button-logout"
                className="shrink-0"
              >
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="mobile-content">
        <div className="container mx-auto px-4 py-6 max-w-2xl space-y-5">
          
          {/* Configuração de Safra Padrão */}
          <Card className="shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings className="w-5 h-5 text-primary shrink-0" />
                Safra Padrão
              </CardTitle>
              <CardDescription className="text-sm">
                Defina qual safra será incluída automaticamente em todos os novos fardos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="safra"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Safra</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: 2024/2025"
                              data-testid="input-safra"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Esta safra será automaticamente incluída em todos os QR codes gerados pelos operadores de campo
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={updateSafraMutation.isPending}
                      data-testid="button-save-settings"
                    >
                      {updateSafraMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Salvar Configurações
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>

          {/* Informações Adicionais */}
          <Card className="shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Como funciona</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                • A safra definida aqui será automaticamente incluída em todos os fardos criados pelos operadores de campo
              </p>
              <p>
                • Os operadores não precisam informar a safra manualmente - ela virá pré-definida
              </p>
              <p>
                • A safra aparecerá nos QR codes e etiquetas dos fardos
              </p>
              <p>
                • Você pode alterar a safra padrão a qualquer momento (afetará apenas fardos novos)
              </p>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-destructive text-base">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                Zona de Perigo
              </CardTitle>
              <CardDescription>
                Ações irreversíveis que afetam permanentemente os dados do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Delete All Bales */}
              <div className="flex items-start justify-between gap-4 p-4 border rounded-lg">
                <div className="flex-1 space-y-1">
                  <h3 className="font-semibold text-sm">Deletar Todos os Fardos</h3>
                  <p className="text-sm text-muted-foreground">
                    Remove permanentemente todos os fardos cadastrados do banco de dados de
                    produção. Esta ação não pode ser desfeita.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  data-testid="button-delete-all-bales"
                  className="shrink-0"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Deletar
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent data-testid="dialog-confirm-delete">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p className="font-semibold">
                Você está prestes a deletar TODOS os fardos do banco de dados de produção.
              </p>
              <p>Esta ação é <strong>PERMANENTE</strong> e <strong>IRREVERSÍVEL</strong>.</p>
              <p>Todos os fardos cadastrados serão perdidos.</p>
              <p className="text-destructive font-semibold">Tem certeza que deseja continuar?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              data-testid="button-cancel-delete"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllBales}
              disabled={isDeleting}
              data-testid="button-confirm-delete"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deletando..." : "Sim, Deletar Tudo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Footer */}
      <Footer />
    </div>
  );
}
