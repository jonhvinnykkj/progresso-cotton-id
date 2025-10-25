import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Package, LogOut, QrCode, Loader2, CheckCircle } from "lucide-react";
import logoProgresso from "/favicon.png";
import { z } from "zod";
import type { Bale } from "@shared/schema";
import { TALHOES_INFO } from "@shared/talhoes";

const batchCreateSchema = z.object({
  talhao: z.string().min(1, "Talhão é obrigatório"),
  quantidade: z.number().min(1, "Quantidade deve ser maior que 0").max(1000, "Máximo 1000 fardos por vez"),
});

type BatchCreateForm = z.infer<typeof batchCreateSchema>;

export default function Campo() {
  const [, setLocation] = useLocation();
  const { logout, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [createdBales, setCreatedBales] = useState<Bale[]>([]);

  // Buscar safra padrão das configurações
  const { data: defaultSafraData } = useQuery<{ value: string }>({
    queryKey: ["/api/settings/default-safra"],
  });

  const defaultSafra = defaultSafraData?.value || "";

  const form = useForm<BatchCreateForm>({
    resolver: zodResolver(batchCreateSchema),
    defaultValues: {
      talhao: "",
      quantidade: 1,
    },
  });

  const handleCreateBatch = async (data: BatchCreateForm) => {
    setIsCreating(true);
    setCreatedBales([]);
    
    // Validar se há safra configurada
    if (!defaultSafra) {
      toast({
        variant: "destructive",
        title: "Safra não configurada",
        description: "O administrador precisa configurar a safra padrão nas configurações.",
      });
      setIsCreating(false);
      return;
    }
    
    try {
      // Incluir safra automaticamente do settings
      const payload = {
        ...data,
        safra: defaultSafra,
      };

      const response = await fetch("/api/bales/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || "Erro ao criar fardos");
      }

      const bales = await response.json();
      setCreatedBales(bales);

      // Invalidar cache para garantir que a página de etiquetas veja os novos fardos
      await queryClient.invalidateQueries({ queryKey: ["/api/bales"] });

      toast({
        title: "Fardos criados com sucesso",
        description: `${bales.length} fardo(s) criado(s) no talhão ${data.talhao}`,
      });

      // Resetar apenas quantidade
      form.setValue("quantidade", 1);

    } catch (error) {
      console.error("Erro ao criar fardos:", error);
      toast({
        variant: "destructive",
        title: "Erro ao criar fardos",
        description: error instanceof Error ? error.message : "Tente novamente.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handlePrintLabels = () => {
    if (createdBales.length === 0) return;
    
    // Redirecionar para página de impressão em lote
    const baleIds = createdBales.map(b => b.id).join(',');
    setLocation(`/etiqueta?baleIds=${baleIds}`);
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
                <h1 className="text-base sm:text-xl font-semibold truncate">Cadastro de Fardos</h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  Operador: {user?.username}
                </p>
              </div>
            </div>
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
      </header>

      {/* Conteúdo principal */}
      <main className="mobile-content">
        <div className="container mx-auto px-4 py-6 max-w-2xl space-y-5">
          
          {/* Formulário de Cadastro em Lote */}
          <Card className="shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="w-5 h-5 text-primary shrink-0" />
                Criar Fardos em Lote
              </CardTitle>
              <CardDescription className="text-sm">
                Gere múltiplos fardos de uma vez com numeração sequencial automática
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Exibir safra atual (somente leitura) */}
              {defaultSafra && (
                <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-xs text-muted-foreground">Safra Atual</p>
                  <p className="text-sm font-semibold text-primary">{defaultSafra}</p>
                </div>
              )}
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateBatch)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="talhao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Talhão</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={isCreating}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11" data-testid="select-talhao">
                              <SelectValue placeholder="Selecione o talhão" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TALHOES_INFO.map((talhao) => (
                              <SelectItem key={talhao.id} value={talhao.nome}>
                                <div className="flex items-center justify-between gap-3">
                                  <span className="font-medium">{talhao.nome}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {talhao.hectares} ha
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          A numeração continuará de onde parou neste talhão
                        </FormDescription>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quantidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Quantidade</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="1000"
                            placeholder="Ex: 50"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            disabled={isCreating}
                            data-testid="input-quantidade"
                            className="h-11"
                          />
                        </FormControl>
                        <FormDescription>
                          Quantos fardos deseja criar? (máximo: 1000)
                        </FormDescription>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full h-11 shadow"
                    disabled={isCreating}
                    data-testid="button-create-batch"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Criando {form.watch("quantidade")} fardo(s)...
                      </>
                    ) : (
                      <>
                        <QrCode className="w-4 h-4 mr-2" />
                        Gerar Etiquetas QR
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Resultado da criação */}
          {createdBales.length > 0 && (
            <Card className="shadow-md border-primary/20">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                  Fardos Criados com Sucesso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-primary/10 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-primary">{createdBales.length}</p>
                      <p className="text-xs text-muted-foreground">Fardos Criados</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary">{createdBales[0].talhao}</p>
                      <p className="text-xs text-muted-foreground">Talhão</p>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium">Numeração gerada:</p>
                  <div className="flex flex-wrap gap-2">
                    {createdBales.slice(0, 10).map((bale) => (
                      <span key={bale.id} className="px-2 py-1 bg-background rounded text-xs font-mono">
                        {bale.numero}
                      </span>
                    ))}
                    {createdBales.length > 10 && (
                      <span className="px-2 py-1 bg-background rounded text-xs font-mono text-muted-foreground">
                        +{createdBales.length - 10} mais
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  onClick={handlePrintLabels}
                  className="w-full h-11 shadow"
                  data-testid="button-print-labels"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Imprimir Todas as Etiquetas
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Card de Instruções */}
          <Card className="bg-muted/50 border-muted">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Como funciona</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Digite o código do talhão (ex: T-01)</li>
                <li>Informe quantos fardos deseja criar</li>
                <li>Os números serão gerados automaticamente: 00001, 00002, 00003...</li>
                <li>A numeração continua de onde parou em cada talhão</li>
                <li>Imprima todas as etiquetas de uma vez</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}