import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { getCurrentPosition } from "@/lib/geolocation";
import { Package, LogOut, QrCode, MapPin, Loader2 } from "lucide-react";
import logoProgresso from "/favicon.png";
import { z } from "zod";
import { nanoid } from "nanoid";

// Schema para criação completa do fardo
const createBaleSchema = z.object({
  talhao: z.string().min(1, "Talhão é obrigatório"),
  numero: z.string().min(1, "Número é obrigatório"),
  safra: z.string().optional(),
});

type CreateBaleForm = z.infer<typeof createBaleSchema>;

export default function Campo() {
  const [, setLocation] = useLocation();
  const { logout, user } = useAuth();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  // Buscar safra padrão das configurações
  const { data: defaultSafraData } = useQuery<{ value: string }>({
    queryKey: ["/api/settings/default-safra"],
  });

  const defaultSafra = defaultSafraData?.value || "";

  const form = useForm<CreateBaleForm>({
    resolver: zodResolver(createBaleSchema),
    defaultValues: {
      talhao: "",
      numero: "",
      safra: "",
    },
  });

  // Atualizar campo safra quando safra padrão for carregada
  useEffect(() => {
    if (defaultSafra) {
      form.setValue("safra", defaultSafra);
    }
  }, [defaultSafra, form]);

  const handleCreateBale = async (data: CreateBaleForm) => {
    setIsCreating(true);
    
    try {
      // Gerar ID único para o fardo
      const baleId = nanoid(12);
      
      // Tentar capturar localização GPS com timeout de 2 segundos
      let location = { latitude: "", longitude: "" };
      try {
        const gpsPromise = getCurrentPosition();
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error("GPS timeout")), 2000)
        );
        location = await Promise.race([gpsPromise, timeoutPromise]);
        console.log("GPS capturado:", location);
      } catch (gpsError) {
        console.warn("GPS não disponível, continuando sem localização:", gpsError);
        // Continua sem GPS - não é crítico
      }
      
      // Criar fardo completo no backend (com safra do formulário)
      console.log("Enviando requisição para criar fardo...");
      const response = await fetch("/api/bales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: baleId,
          qrCode: baleId,
          safra: data.safra || undefined,
          talhao: data.talhao,
          numero: data.numero,
          latitude: location.latitude || undefined,
          longitude: location.longitude || undefined,
        }),
      });

      console.log("Resposta recebida:", response.status);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || "Erro ao criar fardo");
      }

      const createdBale = await response.json();
      console.log("Fardo criado:", createdBale);

      toast({
        title: "Fardo criado com sucesso",
        description: `Talhão: ${data.talhao}, Número: ${data.numero}`,
      });

      // Resetar formulário mantendo safra padrão
      form.reset({
        talhao: "",
        numero: "",
        safra: defaultSafra,
      });

      // Redirecionar para página de impressão da etiqueta
      console.log("Redirecionando para:", `/etiqueta?baleId=${baleId}`);
      setLocation(`/etiqueta?baleId=${baleId}`);
    } catch (error) {
      console.error("Erro ao criar fardo:", error);
      toast({
        variant: "destructive",
        title: "Erro ao criar fardo",
        description: error instanceof Error ? error.message : "Tente novamente.",
      });
    } finally {
      // Sempre resetar isCreating, mesmo após redirecionamento bem-sucedido
      // (importante caso o usuário volte via navegação do navegador)
      setIsCreating(false);
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
                <h1 className="text-base sm:text-xl font-semibold truncate">Cadastro de Fardo</h1>
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
          
          {/* Formulário de Cadastro */}
          <Card className="shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="w-5 h-5 text-primary shrink-0" />
                Novo Fardo
              </CardTitle>
              <CardDescription className="text-sm">
                Preencha as informações do fardo para gerar a etiqueta QR
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateBale)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="talhao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Talhão</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: T-01"
                            {...field}
                            disabled={isCreating}
                            data-testid="input-talhao"
                            className="h-11"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="numero"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Número do Fardo</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: 001"
                            {...field}
                            disabled={isCreating}
                            data-testid="input-numero"
                            className="h-11"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="safra"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Safra {defaultSafra && <span className="text-xs text-muted-foreground ml-1">(configurado pelo admin)</span>}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Não configurado"
                            {...field}
                            disabled={true}
                            readOnly
                            data-testid="input-safra"
                            className="h-11 bg-muted cursor-not-allowed"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <div className="text-sm text-muted-foreground">
                        A localização GPS será capturada automaticamente ao gerar a etiqueta
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 shadow"
                    disabled={isCreating}
                    data-testid="button-create-bale"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Criando fardo e gerando etiqueta...
                      </>
                    ) : (
                      <>
                        <QrCode className="w-4 h-4 mr-2" />
                        Gerar Etiqueta QR
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Card de Instruções */}
          <Card className="bg-muted/50 border-muted">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Como funciona</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Preencha o talhão e número do fardo</li>
                <li>Clique em "Gerar Etiqueta QR"</li>
                <li>O sistema capturará a localização GPS automaticamente</li>
                <li>Imprima a etiqueta na impressora móvel</li>
                <li>Cole a etiqueta no fardo físico</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
