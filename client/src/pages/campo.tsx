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
import { Package, LogOut, QrCode, Loader2, CheckCircle, Plus, Wheat, Hash, Calendar, Zap, Lightbulb, Tag, MapPin, Printer } from "lucide-react";
import logoProgresso from "/favicon.png";
import { z } from "zod";
import type { Bale } from "@shared/schema";
import { TALHOES_INFO } from "@shared/talhoes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Footer } from "@/components/footer";

const batchCreateSchema = z.object({
  talhao: z.string().min(1, "Talhão é obrigatório"),
  quantidade: z.number().min(1, "Quantidade deve ser maior que 0").max(1000, "Máximo 1000 fardos por vez"),
});

const singleCreateSchema = z.object({
  talhao: z.string().min(1, "Talhão é obrigatório"),
  numero: z.string().min(1, "Número é obrigatório").regex(/^\d{5}$/, "Número deve ter 5 dígitos"),
});

type BatchCreateForm = z.infer<typeof batchCreateSchema>;
type SingleCreateForm = z.infer<typeof singleCreateSchema>;

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

  const singleForm = useForm<SingleCreateForm>({
    resolver: zodResolver(singleCreateSchema),
    defaultValues: {
      talhao: "",
      numero: "",
    },
  });

  const handleCreateSingle = async (data: SingleCreateForm) => {
    setIsCreating(true);
    setCreatedBales([]);
    
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
      const baleId = `S${defaultSafra}-T${data.talhao}-${data.numero}`;
      
      const payload = {
        id: baleId,
        qrCode: baleId,
        safra: defaultSafra,
        talhao: data.talhao,
        numero: data.numero,
        userId: user?.id ? String(user.id) : undefined,
      };

      const response = await fetch("/api/bales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || "Erro ao criar fardo");
      }

      const bale = await response.json();
      setCreatedBales([bale]);

      await queryClient.invalidateQueries({ queryKey: ["/api/bales"] });

      toast({
        title: "Fardo criado com sucesso",
        description: `Fardo ${baleId} criado no talhão ${data.talhao}`,
      });

      // Resetar form
      singleForm.reset();

    } catch (error) {
      console.error("Erro ao criar fardo:", error);
      toast({
        variant: "destructive",
        title: "Erro ao criar fardo",
        description: error instanceof Error ? error.message : "Tente novamente.",
      });
    } finally {
      setIsCreating(false);
    }
  };

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
        userId: user?.id ? String(user.id) : undefined,
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

      const result = await response.json();
      
      // A resposta agora contém: { created, requested, skipped, bales }
      const bales = result.bales || result; // Compatibilidade com resposta antiga
      const created = result.created || bales.length;
      const skipped = result.skipped || 0;
      
      setCreatedBales(bales);

      // Invalidar cache para garantir que a página de etiquetas veja os novos fardos
      await queryClient.invalidateQueries({ queryKey: ["/api/bales"] });

      // Mensagem diferenciada se houver fardos pulados
      if (skipped > 0) {
        toast({
          title: "Fardos criados com avisos",
          description: `${created} fardo(s) criado(s), ${skipped} pulado(s) (já existiam) no talhão ${data.talhao}`,
        });
      } else {
        toast({
          title: "Fardos criados com sucesso",
          description: `${created} fardo(s) criado(s) no talhão ${data.talhao}`,
        });
      }

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
      <header className="mobile-header backdrop-blur-md bg-background/95 border-b">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-between gap-3 py-3">
            <div className="flex items-center gap-3 flex-1 min-w-0 animate-fade-in-up">
              <img 
                src={logoProgresso} 
                alt="Grupo Progresso" 
                className="h-8 sm:h-10 w-auto shrink-0 transition-transform hover:scale-110 duration-300"
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
              className="shrink-0 transition-all hover:scale-110 duration-300"
            >
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="mobile-content bg-gradient-to-br from-background via-muted/10 to-background">
        <div className="container mx-auto px-4 py-6 max-w-2xl space-y-5">
          
          {/* Formulário de Cadastro */}
          <Card className="shadow-xl border-2 animate-fade-in-up overflow-hidden" style={{ animationDelay: '0.1s' }}>
            {/* Header com gradiente */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 pb-8 relative overflow-hidden">
              {/* Padrão decorativo de fundo */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
              </div>
              
              <div className="relative">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-white font-bold">Criar Fardos</CardTitle>
                    <CardDescription className="text-white/90 text-sm mt-0.5">
                      Sistema inteligente de cadastro
                    </CardDescription>
                  </div>
                </div>
              </div>
            </div>

            <CardContent className="pt-6 -mt-4 relative">
              {/* Exibir safra atual - Card flutuante */}
              {defaultSafra && (
                <div className="mb-6 p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30 rounded-2xl shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl duration-300 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground font-medium mb-1">Safra Ativa</p>
                        <p className="text-lg font-bold text-primary">{defaultSafra}</p>
                      </div>
                    </div>
                    <div className="px-3 py-1.5 bg-primary/20 rounded-full">
                      <span className="text-xs font-semibold text-primary">ATIVA</span>
                    </div>
                  </div>
                </div>
              )}

              <Tabs defaultValue="lote" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 p-1 bg-muted/50 rounded-xl h-12">
                  <TabsTrigger 
                    value="lote" 
                    className="rounded-lg transition-all hover:scale-105 duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    <span className="font-semibold">Em Lote</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="individual" 
                    className="rounded-lg transition-all hover:scale-105 duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    <span className="font-semibold">Individual</span>
                  </TabsTrigger>
                </TabsList>

                {/* Tab: Criar em Lote */}
                <TabsContent value="lote">
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateBatch)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="talhao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold flex items-center gap-2">
                          <Wheat className="w-4 h-4 text-primary" />
                          Talhão de Produção
                        </FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={isCreating}
                        >
                          <FormControl>
                            <SelectTrigger className="h-12 rounded-xl border-2 hover:border-primary/50 transition-all" data-testid="select-talhao">
                              <SelectValue placeholder="Selecione o talhão de algodão" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl">
                            {TALHOES_INFO.map((talhao) => (
                              <SelectItem 
                                key={talhao.id} 
                                value={talhao.nome}
                                className="rounded-lg my-0.5"
                              >
                                <div className="flex items-center justify-between gap-3 w-full">
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-3.5 h-3.5 text-primary" />
                                    <span className="font-semibold">{talhao.nome}</span>
                                  </div>
                                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                    {talhao.hectares} ha
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription className="flex items-center gap-1.5 text-xs">
                          <Lightbulb className="w-3.5 h-3.5" />
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
                        <FormLabel className="text-sm font-semibold flex items-center gap-2">
                          <Package className="w-4 h-4 text-primary" />
                          Quantidade de Fardos
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="1000"
                            placeholder="Digite a quantidade (Ex: 50)"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            disabled={isCreating}
                            data-testid="input-quantidade"
                            className="h-12 rounded-xl border-2 hover:border-primary/50 transition-all focus:scale-[1.01] duration-300 text-base"
                          />
                        </FormControl>
                        <FormDescription className="flex items-center gap-1.5 text-xs">
                          <Zap className="w-3.5 h-3.5" />
                          Crie até 1000 fardos de uma só vez
                        </FormDescription>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full h-13 rounded-xl shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl duration-300 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-base font-bold"
                    disabled={isCreating}
                    data-testid="button-create-batch"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Criando {form.watch("quantidade")} fardo(s)...
                      </>
                    ) : (
                      <>
                        <Package className="w-5 h-5 mr-2" />
                        Criar Lote de Fardos
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>

              {/* Tab: Criar Individual */}
              <TabsContent value="individual">
                <Form {...singleForm}>
                  <form onSubmit={singleForm.handleSubmit(handleCreateSingle)} className="space-y-5">
                    <FormField
                      control={singleForm.control}
                      name="talhao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold flex items-center gap-2">
                            <Wheat className="w-4 h-4 text-primary" />
                            Talhão de Produção
                          </FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={isCreating}
                          >
                            <FormControl>
                              <SelectTrigger className="h-12 rounded-xl border-2 hover:border-primary/50 transition-all">
                                <SelectValue placeholder="Selecione o talhão de algodão" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-xl">
                              {TALHOES_INFO.map((talhao) => (
                                <SelectItem 
                                  key={talhao.id} 
                                  value={talhao.nome}
                                  className="rounded-lg my-0.5"
                                >
                                  <div className="flex items-center justify-between gap-3 w-full">
                                    <div className="flex items-center gap-2">
                                      <MapPin className="w-3.5 h-3.5 text-primary" />
                                      <span className="font-semibold">{talhao.nome}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                      {talhao.hectares} ha
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription className="flex items-center gap-1.5 text-xs">
                            <Lightbulb className="w-3.5 h-3.5" />
                            A numeração continuará de onde parou neste talhão
                          </FormDescription>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={singleForm.control}
                      name="numero"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold flex items-center gap-2">
                            <Hash className="w-4 h-4 text-primary" />
                            Número do Fardo
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="Ex: 00001"
                              maxLength={5}
                              {...field}
                              disabled={isCreating}
                              className="h-12 rounded-xl border-2 hover:border-primary/50 transition-all focus:scale-[1.01] duration-300 text-base"
                            />
                          </FormControl>
                          <FormDescription className="flex items-center gap-1.5 text-xs">
                            <Tag className="w-3.5 h-3.5" />
                            Digite o número de 5 dígitos (Ex: 00001, 00042)
                          </FormDescription>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full h-13 rounded-xl shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl duration-300 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-base font-bold"
                      disabled={isCreating}
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Criando fardo...
                        </>
                      ) : (
                        <>
                          <Package className="w-5 h-5 mr-2" />
                          Criar Fardo Individual
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
            </CardContent>
          </Card>

          {/* Resultado da criação */}
          {createdBales.length > 0 && (
            <Card className="shadow-xl border-2 border-green-200 animate-fade-in-up overflow-hidden" style={{ animationDelay: '0.2s' }}>
              {/* Header com gradiente de sucesso */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-5 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
                </div>
                <div className="relative flex items-center gap-3">
                  <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl animate-bounce-gentle">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-white font-bold flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Sucesso!
                    </CardTitle>
                    <p className="text-white/90 text-sm">Fardos criados e prontos para impressão</p>
                  </div>
                </div>
              </div>
              
              <CardContent className="space-y-5 pt-6">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-2xl p-5 border-2 border-green-200/50">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="transition-transform hover:scale-110 duration-300">
                      <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        {createdBales.length}
                      </div>
                      <p className="text-xs text-muted-foreground font-medium mt-1 flex items-center justify-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                        Fardos Criados
                      </p>
                    </div>
                    <div className="transition-transform hover:scale-110 duration-300">
                      <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        {createdBales[0].talhao}
                      </div>
                      <p className="text-xs text-muted-foreground font-medium mt-1 flex items-center justify-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-green-600" />
                        Talhão
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/30 rounded-2xl p-5 space-y-3 border-2 border-muted">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">Numeração Gerada:</span>
                    <div className="flex-1 h-px bg-border"></div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {createdBales.slice(0, 10).map((bale, index) => (
                      <span 
                        key={bale.id} 
                        className="px-3 py-2 bg-white dark:bg-background rounded-xl text-sm font-mono font-bold animate-fade-in-up transition-all hover:scale-110 hover:shadow-lg duration-300 border-2 border-green-200"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        {bale.numero}
                      </span>
                    ))}
                    {createdBales.length > 10 && (
                      <span className="px-3 py-2 bg-muted rounded-xl text-sm font-mono text-muted-foreground font-semibold animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                        +{createdBales.length - 10} mais
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  onClick={handlePrintLabels}
                  className="w-full h-13 rounded-xl shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl duration-300 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-base font-bold"
                  data-testid="button-print-labels"
                >
                  <Printer className="w-5 h-5 mr-2" />
                  Imprimir Todas as Etiquetas
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Card de Instruções */}
          <Card className="bg-muted/50 border-muted animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
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

      {/* Footer */}
      <Footer />
    </div>
  );
}