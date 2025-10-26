import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import type { Bale } from "@shared/schema";
import { TALHOES_INFO } from "@shared/talhoes";
import {
  Package,
  Truck,
  CheckCircle,
  LogOut,
  ArrowLeft,
  Wheat,
  BarChart3,
  TrendingUp,
  Search,
  Calendar,
  Layers,
  Activity,
  MapPin,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import logoProgresso from "/favicon.png";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TalhaoMap } from "@/components/talhao-map";
import { InteractiveTalhaoMap } from "@/components/interactive-talhao-map";

interface TalhaoStats {
  talhao: string;
  campo: number;
  patio: number;
  beneficiado: number;
  total: number;
}

interface SafraStats {
  safra: string;
  campo: number;
  patio: number;
  beneficiado: number;
  total: number;
}

export default function TalhaoStats() {
  const [, setLocation] = useLocation();
  const { logout, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTalhao, setSelectedTalhao] = useState<string | null>(null);

  const { data: talhaoStatsData, isLoading } = useQuery<Record<string, TalhaoStats>>({
    queryKey: ["/api/bales/stats-by-talhao"],
  });

  // Convert object to array
  const talhaoStats = talhaoStatsData ? Object.values(talhaoStatsData) : [];

  const { data: safraStats = [] } = useQuery<SafraStats[]>({
    queryKey: ["/api/bales/stats-by-safra"],
  });

  const { data: allBales = [] } = useQuery<Bale[]>({
    queryKey: ["/api/bales"],
  });

  const { data: globalStats } = useQuery<{
    campo: number;
    patio: number;
    beneficiado: number;
    total: number;
  }>({
    queryKey: ["/api/bales/stats"],
  });

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const getStatusColor = (status: "campo" | "patio" | "beneficiado") => {
    switch (status) {
      case "campo":
        return "text-bale-campo";
      case "patio":
        return "text-bale-patio";
      case "beneficiado":
        return "text-bale-beneficiado";
    }
  };

  const getStatusBgColor = (status: "campo" | "patio" | "beneficiado") => {
    switch (status) {
      case "campo":
        return "bg-bale-campo/10";
      case "patio":
        return "bg-bale-patio/10";
      case "beneficiado":
        return "bg-bale-beneficiado/10";
    }
  };

  // Filtrar talhões por busca
  const filteredTalhaoStats = talhaoStats.filter((stat) =>
    stat.talhao.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Obter informações completas do talhão
  const getTalhaoInfo = (nome: string) => {
    return TALHOES_INFO.find(t => t.nome === nome);
  };

  // Obter dados do talhão selecionado
  const selectedTalhaoData = selectedTalhao 
    ? talhaoStats.find(t => t.talhao === selectedTalhao)
    : null;
  const selectedTalhaoInfo = selectedTalhao ? getTalhaoInfo(selectedTalhao) : null;

  // Calcular fardos/hectare para talhão selecionado
  const fardosPorHectare = (() => {
    if (!selectedTalhaoData || selectedTalhaoData.total === 0) return '0.00';
    if (!selectedTalhaoInfo || !selectedTalhaoInfo.hectares) return '0.00';
    
    const hectares = parseFloat(selectedTalhaoInfo.hectares);
    if (isNaN(hectares) || hectares === 0) return '0.00';
    
    return (selectedTalhaoData.total / hectares).toFixed(2);
  })();

  // Calcular produtividade em arrobas (@) por hectare
  // 1 fardo = 2000kg = 66.67 arrobas (1 arroba = 30kg)
  const produtividadeArrobas = (() => {
    if (!selectedTalhaoData || selectedTalhaoData.total === 0) return '0.00';
    if (!selectedTalhaoInfo || !selectedTalhaoInfo.hectares) return '0.00';
    
    const hectares = parseFloat(selectedTalhaoInfo.hectares);
    if (isNaN(hectares) || hectares === 0) return '0.00';
    
    const fardosPorHa = selectedTalhaoData.total / hectares;
    const arrobasPorHa = fardosPorHa * 66.67; // 1 fardo = 2000kg = 66.67@
    return arrobasPorHa.toFixed(2);
  })();

  // Calcular métricas adicionais
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const balesToday = allBales.filter(b => {
    const baleDate = new Date(b.createdAt);
    baleDate.setHours(0, 0, 0, 0);
    return baleDate.getTime() === today.getTime();
  }).length;

  const thisWeek = new Date();
  thisWeek.setDate(thisWeek.getDate() - 7);
  const balesThisWeek = allBales.filter(b => new Date(b.createdAt) >= thisWeek).length;

  // Calcular total de hectares
  const totalHectares = TALHOES_INFO.reduce((acc, t) => acc + parseFloat(t.hectares), 0);

  // Calcular média de fardos por hectare (geral)
  const avgFardosPorHectare = (() => {
    if (!globalStats?.total || totalHectares === 0) return '0.00';
    return (globalStats.total / totalHectares).toFixed(2);
  })();

  // Calcular média de produtividade em arrobas (@) por hectare
  const avgArrobasPorHectare = (() => {
    if (!globalStats?.total || totalHectares === 0) return '0.00';
    const fardosPorHa = globalStats.total / totalHectares;
    const arrobasPorHa = fardosPorHa * 66.67; // 1 fardo = 2000kg = 66.67@
    return arrobasPorHa.toFixed(2);
  })();
  
  const avgBalesPerTalhao = talhaoStats.length > 0 
    ? (globalStats?.total || 0) / talhaoStats.length 
    : 0;

  const progressPercent = globalStats?.total 
    ? ((globalStats.beneficiado / globalStats.total) * 100).toFixed(1) 
    : "0";

  return (
    <div className="mobile-page">
      {/* Header */}
      <header className="mobile-header">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation("/dashboard")}
                data-testid="button-back"
                className="h-9 shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <img 
                src={logoProgresso} 
                alt="Grupo Progresso" 
                className="h-8 sm:h-10 w-auto shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-lg font-semibold truncate" data-testid="text-page-title">
                  Fardos por Talhão
                </h1>
                <p className="text-xs text-muted-foreground truncate" data-testid="text-username">
                  {user?.username}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              data-testid="button-logout"
              className="h-9 shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mobile-content">
        <div className="container mx-auto px-4 py-6 max-w-7xl space-y-5">
          {/* KPIs Cards - Métricas Principais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="shadow-sm">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Total de Fardos</p>
                    <Package className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-3xl font-bold text-primary">{globalStats?.total || 0}</p>
                  <p className="text-xs text-muted-foreground">
                    {totalHectares} ha • {avgFardosPorHectare} fardos/ha
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Criados Hoje</p>
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-blue-600">{balesToday}</p>
                  <p className="text-xs text-muted-foreground">
                    {balesThisWeek} esta semana
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Média/Talhão</p>
                    <Activity className="w-4 h-4 text-purple-600" />
                  </div>
                  <p className="text-3xl font-bold text-purple-600">{avgBalesPerTalhao.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">
                    fardos por talhão
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Progresso</p>
                    <CheckCircle className="w-4 h-4 text-bale-beneficiado" />
                  </div>
                  <p className="text-3xl font-bold text-bale-beneficiado">{progressPercent}%</p>
                  <p className="text-xs text-muted-foreground">
                    {globalStats?.beneficiado || 0} beneficiados
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Card com Status */}
          <Card className="brand-gradient text-white shadow-md" data-testid="card-summary">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Distribuição por Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <Package className="w-6 h-6 mx-auto mb-1 text-white/80" />
                  <p className="text-xs text-white/80">No Campo</p>
                  <p className="text-2xl font-bold">{globalStats?.campo || 0}</p>
                  <Progress value={globalStats?.total ? (globalStats.campo / globalStats.total) * 100 : 0} className="h-1 mt-2 bg-white/20 [&>div]:bg-white" />
                </div>
                <div>
                  <Truck className="w-6 h-6 mx-auto mb-1 text-white/80" />
                  <p className="text-xs text-white/80">No Pátio</p>
                  <p className="text-2xl font-bold">{globalStats?.patio || 0}</p>
                  <Progress value={globalStats?.total ? (globalStats.patio / globalStats.total) * 100 : 0} className="h-1 mt-2 bg-white/20 [&>div]:bg-white" />
                </div>
                <div>
                  <CheckCircle className="w-6 h-6 mx-auto mb-1 text-white/80" />
                  <p className="text-xs text-white/80">Beneficiados</p>
                  <p className="text-2xl font-bold">{globalStats?.beneficiado || 0}</p>
                  <Progress value={globalStats?.total ? (globalStats.beneficiado / globalStats.total) * 100 : 0} className="h-1 mt-2 bg-white/20 [&>div]:bg-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs para diferentes visões */}
          <Tabs defaultValue="talhao" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="talhao">Por Talhão</TabsTrigger>
              <TabsTrigger value="safra">Por Safra</TabsTrigger>
              <TabsTrigger value="mapa">Mapa</TabsTrigger>
            </TabsList>

            {/* Tab: Por Talhão */}
            <TabsContent value="talhao" className="space-y-4 mt-4">
              {/* Campo de busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Buscar talhão..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11"
                  data-testid="input-search-talhao"
                />
              </div>

              {/* Stats by Talhao */}
              {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse" data-testid={`skeleton-talhao-${i}`}>
                  <CardHeader className="space-y-2 pb-2">
                    <div className="h-5 bg-muted rounded w-1/2" data-testid={`skeleton-title-${i}`} />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="h-4 bg-muted rounded w-full" data-testid={`skeleton-row1-${i}`} />
                    <div className="h-4 bg-muted rounded w-3/4" data-testid={`skeleton-row2-${i}`} />
                    <div className="h-4 bg-muted rounded w-2/3" data-testid={`skeleton-row3-${i}`} />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredTalhaoStats.length === 0 ? (
            <Card className="p-12" data-testid="card-empty-state">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center" data-testid="icon-empty">
                  <Wheat className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-base font-semibold" data-testid="text-empty-title">
                    {searchQuery ? "Nenhum talhão encontrado" : "Nenhum talhão cadastrado"}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1" data-testid="text-empty-description">
                    {searchQuery 
                      ? "Tente buscar por outro termo" 
                      : "Cadastre o primeiro fardo para visualizar estatísticas"}
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTalhaoStats.map((stat) => {
                const progressCampo = stat.total > 0 ? (stat.campo / stat.total) * 100 : 0;
                const progressPatio = stat.total > 0 ? (stat.patio / stat.total) * 100 : 0;
                const progressBeneficiado = stat.total > 0 ? (stat.beneficiado / stat.total) * 100 : 0;
                
                // Calcular produtividade do talhão
                const talhaoInfo = getTalhaoInfo(stat.talhao);
                const produtividade = talhaoInfo 
                  ? (stat.total / parseFloat(talhaoInfo.hectares)).toFixed(2)
                  : '0.00';

                return (
                  <Card
                    key={stat.talhao}
                    className="hover-elevate smooth-transition shadow-sm cursor-pointer"
                    data-testid={`card-talhao-${stat.talhao}`}
                    onClick={() => setSelectedTalhao(stat.talhao)}
                  >
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Wheat className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg truncate" data-testid={`text-talhao-name-${stat.talhao}`}>{stat.talhao}</CardTitle>
                            <Info className="w-4 h-4 text-muted-foreground shrink-0" />
                          </div>
                          <p className="text-xs text-muted-foreground" data-testid={`text-talhao-subtitle-${stat.talhao}`}>
                            {getTalhaoInfo(stat.talhao)?.hectares || '0'} ha • {stat.total} {stat.total === 1 ? "fardo" : "fardos"} • {produtividade} f/ha
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="shrink-0" data-testid={`badge-total-${stat.talhao}`}>
                        <TrendingUp className="w-3 h-3 mr-1" />
                        <span data-testid={`text-badge-total-${stat.talhao}`}>{stat.total}</span>
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Campo */}
                      <div className="space-y-2" data-testid={`stats-campo-${stat.talhao}`}>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Package className={`w-4 h-4 ${getStatusColor("campo")}`} data-testid={`icon-campo-${stat.talhao}`} />
                            <span className="font-medium">Campo</span>
                          </div>
                          <span className="text-muted-foreground" data-testid={`text-campo-count-${stat.talhao}`}>
                            {stat.campo} ({progressCampo.toFixed(0)}%)
                          </span>
                        </div>
                        <Progress 
                          value={progressCampo} 
                          className="h-2"
                          data-testid={`progress-campo-${stat.talhao}`}
                        />
                      </div>

                      {/* Pátio */}
                      <div className="space-y-2" data-testid={`stats-patio-${stat.talhao}`}>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Truck className={`w-4 h-4 ${getStatusColor("patio")}`} data-testid={`icon-patio-${stat.talhao}`} />
                            <span className="font-medium">Pátio</span>
                          </div>
                          <span className="text-muted-foreground" data-testid={`text-patio-count-${stat.talhao}`}>
                            {stat.patio} ({progressPatio.toFixed(0)}%)
                          </span>
                        </div>
                        <Progress 
                          value={progressPatio} 
                          className="h-2 [&>div]:bg-bale-patio"
                          data-testid={`progress-patio-${stat.talhao}`}
                        />
                      </div>

                      {/* Beneficiado */}
                      <div className="space-y-2" data-testid={`stats-beneficiado-${stat.talhao}`}>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <CheckCircle className={`w-4 h-4 ${getStatusColor("beneficiado")}`} data-testid={`icon-beneficiado-${stat.talhao}`} />
                            <span className="font-medium">Beneficiado</span>
                          </div>
                          <span className="text-muted-foreground" data-testid={`text-beneficiado-count-${stat.talhao}`}>
                            {stat.beneficiado} ({progressBeneficiado.toFixed(0)}%)
                          </span>
                        </div>
                        <Progress 
                          value={progressBeneficiado} 
                          className="h-2 [&>div]:bg-bale-beneficiado"
                          data-testid={`progress-beneficiado-${stat.talhao}`}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              </div>
            )}
            </TabsContent>

            {/* Tab: Por Safra */}
            <TabsContent value="safra" className="space-y-4 mt-4">
              {safraStats.length === 0 ? (
                <Card className="p-12">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                      <Layers className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold">Nenhuma safra registrada</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Crie fardos para visualizar estatísticas por safra
                      </p>
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {safraStats.map((stat) => {
                    const progressCampo = stat.total > 0 ? (stat.campo / stat.total) * 100 : 0;
                    const progressPatio = stat.total > 0 ? (stat.patio / stat.total) * 100 : 0;
                    const progressBeneficiado = stat.total > 0 ? (stat.beneficiado / stat.total) * 100 : 0;

                    return (
                      <Card
                        key={stat.safra}
                        className="hover-elevate smooth-transition shadow-sm"
                      >
                        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <Calendar className="w-5 h-5 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <CardTitle className="text-lg truncate">Safra {stat.safra}</CardTitle>
                              <p className="text-xs text-muted-foreground">
                                {stat.total} {stat.total === 1 ? "fardo" : "fardos"}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="shrink-0">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            <span>{stat.total}</span>
                          </Badge>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Campo */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <Package className={`w-4 h-4 ${getStatusColor("campo")}`} />
                                <span className="font-medium">Campo</span>
                              </div>
                              <span className="text-muted-foreground">
                                {stat.campo} ({progressCampo.toFixed(0)}%)
                              </span>
                            </div>
                            <Progress value={progressCampo} className="h-2" />
                          </div>

                          {/* Pátio */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <Truck className={`w-4 h-4 ${getStatusColor("patio")}`} />
                                <span className="font-medium">Pátio</span>
                              </div>
                              <span className="text-muted-foreground">
                                {stat.patio} ({progressPatio.toFixed(0)}%)
                              </span>
                            </div>
                            <Progress value={progressPatio} className="h-2 [&>div]:bg-bale-patio" />
                          </div>

                          {/* Beneficiado */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <CheckCircle className={`w-4 h-4 ${getStatusColor("beneficiado")}`} />
                                <span className="font-medium">Beneficiado</span>
                              </div>
                              <span className="text-muted-foreground">
                                {stat.beneficiado} ({progressBeneficiado.toFixed(0)}%)
                              </span>
                            </div>
                            <Progress value={progressBeneficiado} className="h-2 [&>div]:bg-bale-beneficiado" />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Tab: Mapa */}
            <TabsContent value="mapa" className="mt-4">
              <InteractiveTalhaoMap 
                selectedTalhao={selectedTalhao || undefined}
                onTalhaoClick={(talhao) => setSelectedTalhao(talhao)}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Modal de Detalhes do Talhão */}
      <Dialog open={!!selectedTalhao} onOpenChange={() => setSelectedTalhao(null)}>
        <DialogContent className="max-w-2xl z-[9999]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <MapPin className="w-6 h-6 text-primary" />
              Talhão {selectedTalhao}
            </DialogTitle>
            <DialogDescription>
              Informações detalhadas e métricas de produtividade
            </DialogDescription>
          </DialogHeader>

          {selectedTalhaoData && selectedTalhaoInfo && (
            <div className="space-y-6">
              {/* Informações Gerais */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-1">
                      <MapPin className="w-5 h-5 mx-auto text-primary mb-2" />
                      <p className="text-xs text-muted-foreground">Área</p>
                      <p className="text-2xl font-bold text-primary">{selectedTalhaoInfo.hectares}</p>
                      <p className="text-xs text-muted-foreground">hectares</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-1">
                      <Package className="w-5 h-5 mx-auto text-blue-600 mb-2" />
                      <p className="text-xs text-muted-foreground">Total Fardos</p>
                      <p className="text-2xl font-bold text-blue-600">{selectedTalhaoData.total}</p>
                      <p className="text-xs text-muted-foreground">fardos</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-1">
                      <Activity className="w-5 h-5 mx-auto text-purple-600 mb-2" />
                      <p className="text-xs text-muted-foreground">Produtividade</p>
                      <p className="text-xl font-bold text-purple-600">{produtividadeArrobas} @/ha</p>
                      <p className="text-sm text-purple-600/70">{fardosPorHectare} f/ha</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-1">
                      <CheckCircle className="w-5 h-5 mx-auto text-green-600 mb-2" />
                      <p className="text-xs text-muted-foreground">Concluídos</p>
                      <p className="text-2xl font-bold text-green-600">{selectedTalhaoData.beneficiado}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedTalhaoData.total > 0 
                          ? ((selectedTalhaoData.beneficiado / selectedTalhaoData.total) * 100).toFixed(0) 
                          : 0}%
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Distribuição por Status */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Distribuição por Status</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-bale-campo" />
                        <span>Campo</span>
                      </div>
                      <span className="font-medium">{selectedTalhaoData.campo} fardos</span>
                    </div>
                    <Progress 
                      value={(selectedTalhaoData.campo / selectedTalhaoData.total) * 100} 
                      className="h-2"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-bale-patio" />
                        <span>Pátio</span>
                      </div>
                      <span className="font-medium">{selectedTalhaoData.patio} fardos</span>
                    </div>
                    <Progress 
                      value={(selectedTalhaoData.patio / selectedTalhaoData.total) * 100} 
                      className="h-2 [&>div]:bg-bale-patio"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-bale-beneficiado" />
                        <span>Beneficiado</span>
                      </div>
                      <span className="font-medium">{selectedTalhaoData.beneficiado} fardos</span>
                    </div>
                    <Progress 
                      value={(selectedTalhaoData.beneficiado / selectedTalhaoData.total) * 100} 
                      className="h-2 [&>div]:bg-bale-beneficiado"
                    />
                  </div>
                </div>
              </div>

              {/* Métricas Comparativas */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="text-sm font-semibold mb-3">Comparativo com Média Geral</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Produtividade deste talhão</p>
                    <p className="text-xl font-bold text-primary">{produtividadeArrobas} @/ha</p>
                    <p className="text-sm text-muted-foreground">{fardosPorHectare} fardos/ha</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Média geral</p>
                    <p className="text-xl font-bold">{avgArrobasPorHectare} @/ha</p>
                    <p className="text-sm text-muted-foreground">{avgFardosPorHectare} fardos/ha</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Estilos para garantir que o Dialog fique acima do mapa */}
      <style>{`
        [data-radix-dialog-overlay] {
          z-index: 9998 !important;
        }
        [data-radix-dialog-content] {
          z-index: 9999 !important;
        }
      `}</style>
    </div>
  );
}
