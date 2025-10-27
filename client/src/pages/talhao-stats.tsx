import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnimatedCounter } from "@/components/animated-counter";
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
  Clock,
  Filter,
} from "lucide-react";
import { Footer } from "@/components/footer";
import { NavSidebar } from "@/components/nav-sidebar";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import logoProgresso from "/favicon.png";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [chartFilter, setChartFilter] = useState<"all" | "campo" | "patio" | "beneficiado">("all");
  const [timeFilter, setTimeFilter] = useState<"7d" | "30d" | "all">("30d");

  const { data: talhaoStatsData, isLoading } = useQuery<Record<string, TalhaoStats>>({
    queryKey: ["/api/bales/stats-by-talhao"],
    staleTime: 60000, // Stats são mais estáveis - 1 minuto
  });

  // Convert object to array
  const talhaoStats = talhaoStatsData ? Object.values(talhaoStatsData) : [];

  const { data: safraStats = [] } = useQuery<SafraStats[]>({
    queryKey: ["/api/bales/stats-by-safra"],
    staleTime: 60000,
  });

  const { data: allBales = [] } = useQuery<Bale[]>({
    queryKey: ["/api/bales"],
    staleTime: 30000,
  });

  const { data: globalStats } = useQuery<{
    campo: number;
    patio: number;
    beneficiado: number;
    total: number;
  }>({
    queryKey: ["/api/bales/stats"],
    staleTime: 30000,
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
    <div className="flex min-h-screen bg-gradient-to-br from-green-50/30 via-yellow-50/20 to-green-50/40 dark:from-gray-900 dark:to-gray-800 overflow-x-hidden">
      <NavSidebar />

      <div className="flex-1 lg:ml-64 flex flex-col overflow-x-hidden">
        <main className="flex-1 container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-7xl pb-20 lg:pb-8 overflow-x-hidden">
          {/* Header modernizado com gradiente verde/amarelo */}
          <div className="mb-6 sm:mb-8 animate-fade-in-up">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <img
                    src={logoProgresso}
                    alt="Grupo Progresso"
                    className="h-8 w-8 sm:h-10 sm:w-10 brightness-0 invert"
                  />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 via-green-500 to-yellow-600 bg-clip-text text-transparent">
                    Estatísticas por Talhão
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Análise detalhada da produção por talhão de algodão
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation("/dashboard")}
                  className="hidden sm:flex transition-all hover:scale-105 duration-300 rounded-xl border-2 border-green-300 hover:border-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-950 font-bold text-green-700 hover:text-yellow-700"
                >
                  Voltar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="shrink-0 transition-all hover:scale-105 duration-300 rounded-xl border-2 border-green-300 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-950 font-bold text-green-700 hover:text-red-600"
                >
                  Sair
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Card de Produtividade - DESTAQUE moderno */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-green-500 via-green-600 to-yellow-500 text-white shadow-2xl border-0 rounded-3xl animate-fade-in-up">
              {/* Decoração de fundo */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-300 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
              </div>
              <CardContent className="pt-8 pb-8 relative">
                <div className="text-center space-y-4">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl w-fit mx-auto shadow-lg">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-sm sm:text-base font-bold text-white uppercase tracking-wide">Produtividade Média Total</p>
                  <div className="flex items-baseline justify-center gap-3">
                    <p className="text-6xl sm:text-7xl font-bold drop-shadow-lg">{avgArrobasPorHectare}</p>
                    <p className="text-3xl sm:text-4xl font-bold text-white/90">@/ha</p>
                  </div>
                  <div className="flex items-center justify-center gap-6 text-sm sm:text-base text-white font-bold bg-white/10 backdrop-blur-sm rounded-2xl py-3 px-6 w-fit mx-auto border border-white/20">
                    <span className="flex items-center gap-2">
                      <div className="p-1.5 bg-white/20 rounded-lg">
                        <Layers className="w-4 h-4" />
                      </div>
                      {totalHectares} ha
                    </span>
                    <span className="text-white/50">•</span>
                    <span className="flex items-center gap-2">
                      <div className="p-1.5 bg-white/20 rounded-lg">
                        <Package className="w-4 h-4" />
                      </div>
                      {avgFardosPorHectare} f/ha
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

          {/* KPIs Cards - Métricas Principais com design verde/amarelo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <Card className="group relative overflow-hidden shadow-lg border-2 border-green-100 hover:border-yellow-300 rounded-2xl hover:scale-[1.02] transition-all duration-300 animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
              <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-yellow-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="pt-6 relative">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-green-700 font-bold">Total de Fardos</p>
                    <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                      <Package className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent">
                    <AnimatedCounter value={globalStats?.total || 0} />
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-12 rounded-full bg-green-300 group-hover:bg-yellow-400 transition-colors"></div>
                    <p className="text-xs text-green-700 font-semibold">
                      {totalHectares} ha • {avgFardosPorHectare} f/ha
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-2 rounded-xl hover:scale-[1.02] transition-all duration-300 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground font-semibold">Criados Hoje</p>
                    <div className="p-2 bg-blue-100 dark:bg-blue-950 rounded-lg">
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-blue-600">
                    <AnimatedCounter value={balesToday} />
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">
                    <AnimatedCounter value={balesThisWeek} /> esta semana
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-2 rounded-xl hover:scale-[1.02] transition-all duration-300 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground font-semibold">Média/Talhão</p>
                    <div className="p-2 bg-purple-100 dark:bg-purple-950 rounded-lg">
                      <Activity className="w-4 h-4 text-purple-600" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-purple-600">
                    <AnimatedCounter value={avgBalesPerTalhao} decimals={0} />
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">
                    fardos por talhão
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-2 rounded-xl hover:scale-[1.02] transition-all duration-300 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground font-semibold">Progresso</p>
                    <div className="p-2 bg-bale-beneficiado/10 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-bale-beneficiado" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-bale-beneficiado">
                    <AnimatedCounter value={parseFloat(progressPercent)} decimals={1} />%
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">
                    <AnimatedCounter value={globalStats?.beneficiado || 0} /> beneficiados
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Card com Status */}
          <Card className="brand-gradient text-white shadow-xl rounded-2xl border-0 overflow-hidden animate-fade-in-up" style={{ animationDelay: "0.25s" }} data-testid="card-summary">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
            </div>
            <CardHeader className="pb-4 relative">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="text-lg font-bold">
                  Distribuição por Status
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg w-fit mx-auto mb-2">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-xs text-white/90 font-semibold mb-1">No Campo</p>
                  <p className="text-3xl font-bold mb-2">
                    <AnimatedCounter value={globalStats?.campo || 0} />
                  </p>
                  <Progress value={globalStats?.total ? (globalStats.campo / globalStats.total) * 100 : 0} className="h-2 bg-white/20 [&>div]:bg-white rounded-full" />
                </div>
                <div>
                  <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg w-fit mx-auto mb-2">
                    <Truck className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-xs text-white/90 font-semibold mb-1">No Pátio</p>
                  <p className="text-3xl font-bold mb-2">
                    <AnimatedCounter value={globalStats?.patio || 0} />
                  </p>
                  <Progress value={globalStats?.total ? (globalStats.patio / globalStats.total) * 100 : 0} className="h-2 bg-white/20 [&>div]:bg-white rounded-full" />
                </div>
                <div>
                  <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg w-fit mx-auto mb-2">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-xs text-white/90 font-semibold mb-1">Beneficiados</p>
                  <p className="text-3xl font-bold mb-2">
                    <AnimatedCounter value={globalStats?.beneficiado || 0} />
                  </p>
                  <Progress value={globalStats?.total ? (globalStats.beneficiado / globalStats.total) * 100 : 0} className="h-2 bg-white/20 [&>div]:bg-white rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs para diferentes visões */}
          <Tabs defaultValue="talhao" className="w-full animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <TabsList className="grid w-full grid-cols-4 p-1 bg-muted/50 rounded-xl h-12">
              <TabsTrigger value="talhao" className="rounded-lg transition-all hover:scale-105 duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-semibold">
                Por Talhão
              </TabsTrigger>
              <TabsTrigger value="safra" className="rounded-lg transition-all hover:scale-105 duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-semibold">
                Por Safra
              </TabsTrigger>
              <TabsTrigger value="graficos" className="rounded-lg transition-all hover:scale-105 duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-semibold">
                Gráficos
              </TabsTrigger>
              <TabsTrigger value="mapa" className="rounded-lg transition-all hover:scale-105 duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-semibold">
                Mapa
              </TabsTrigger>
            </TabsList>

            {/* Tab: Por Talhão */}
            <TabsContent value="talhao" className="space-y-4 mt-4">
              {/* Campo de busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Buscar talhão..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-12 rounded-xl border-2 hover:border-primary/50 transition-all text-base"
                  data-testid="input-search-talhao"
                />
              </div>

              {/* Stats by Talhao */}
              {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse shadow-lg border-2 rounded-xl" data-testid={`skeleton-talhao-${i}`}>
                  <CardHeader className="space-y-2 pb-2">
                    <div className="h-6 bg-muted rounded-lg w-1/2" data-testid={`skeleton-title-${i}`} />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="h-4 bg-muted rounded-lg w-full" data-testid={`skeleton-row1-${i}`} />
                    <div className="h-4 bg-muted rounded-lg w-3/4" data-testid={`skeleton-row2-${i}`} />
                    <div className="h-4 bg-muted rounded-lg w-2/3" data-testid={`skeleton-row3-${i}`} />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredTalhaoStats.length === 0 ? (
            <Card className="p-12 shadow-xl border-2 rounded-2xl" data-testid="card-empty-state">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center" data-testid="icon-empty">
                  <Wheat className="w-10 h-10 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-bold" data-testid="text-empty-title">
                    {searchQuery ? "Nenhum talhão encontrado" : "Nenhum talhão cadastrado"}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2" data-testid="text-empty-description">
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
                const produtividade = (() => {
                  if (!talhaoInfo || !talhaoInfo.hectares) return '0.00';
                  const hectares = parseFloat(talhaoInfo.hectares);
                  if (isNaN(hectares) || hectares === 0) return '0.00';
                  return (stat.total / hectares).toFixed(2);
                })();

                return (
                  <Card
                    key={stat.talhao}
                    className="bg-card shadow-lg border-2 rounded-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                    data-testid={`card-talhao-${stat.talhao}`}
                    onClick={() => setSelectedTalhao(stat.talhao)}
                  >
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0">
                          <Wheat className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg font-bold truncate" data-testid={`text-talhao-name-${stat.talhao}`}>{stat.talhao}</CardTitle>
                            <Info className="w-4 h-4 text-primary/60 shrink-0 hover:text-primary transition-colors" />
                          </div>
                          <p className="text-sm text-muted-foreground font-medium" data-testid={`text-talhao-subtitle-${stat.talhao}`}>
                            {getTalhaoInfo(stat.talhao)?.hectares || '0'} ha • {stat.total} {stat.total === 1 ? "fardo" : "fardos"} • {produtividade} f/ha
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="shrink-0 border-2 px-3 py-1.5 rounded-lg font-bold" data-testid={`badge-total-${stat.talhao}`}>
                        <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
                        <span data-testid={`text-badge-total-${stat.talhao}`}>{stat.total}</span>
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Campo */}
                      <div className="space-y-2" data-testid={`stats-campo-${stat.talhao}`}>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-bale-campo/10 rounded-lg">
                              <Package className="w-4 h-4 text-bale-campo" data-testid={`icon-campo-${stat.talhao}`} />
                            </div>
                            <span className="font-semibold">Campo</span>
                          </div>
                          <span className="font-bold text-foreground" data-testid={`text-campo-count-${stat.talhao}`}>
                            {stat.campo} <span className="text-muted-foreground font-medium">({progressCampo.toFixed(0)}%)</span>
                          </span>
                        </div>
                        <Progress 
                          value={progressCampo} 
                          className="h-2.5 rounded-full"
                          data-testid={`progress-campo-${stat.talhao}`}
                        />
                      </div>

                      {/* Pátio */}
                      <div className="space-y-2" data-testid={`stats-patio-${stat.talhao}`}>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-bale-patio/10 rounded-lg">
                              <Truck className="w-4 h-4 text-bale-patio" data-testid={`icon-patio-${stat.talhao}`} />
                            </div>
                            <span className="font-semibold">Pátio</span>
                          </div>
                          <span className="font-bold text-foreground" data-testid={`text-patio-count-${stat.talhao}`}>
                            {stat.patio} <span className="text-muted-foreground font-medium">({progressPatio.toFixed(0)}%)</span>
                          </span>
                        </div>
                        <Progress 
                          value={progressPatio} 
                          className="h-2.5 rounded-full [&>div]:bg-bale-patio"
                          data-testid={`progress-patio-${stat.talhao}`}
                        />
                      </div>

                      {/* Beneficiado */}
                      <div className="space-y-2" data-testid={`stats-beneficiado-${stat.talhao}`}>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-bale-beneficiado/10 rounded-lg">
                              <CheckCircle className="w-4 h-4 text-bale-beneficiado" data-testid={`icon-beneficiado-${stat.talhao}`} />
                            </div>
                            <span className="font-semibold">Beneficiado</span>
                          </div>
                          <span className="font-bold text-foreground" data-testid={`text-beneficiado-count-${stat.talhao}`}>
                            {stat.beneficiado} <span className="text-muted-foreground font-medium">({progressBeneficiado.toFixed(0)}%)</span>
                          </span>
                        </div>
                        <Progress 
                          value={progressBeneficiado} 
                          className="h-2.5 rounded-full [&>div]:bg-bale-beneficiado"
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
                <Card className="p-12 shadow-xl border-2 rounded-2xl">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                      <Layers className="w-10 h-10 text-muted-foreground" />
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
                        className="bg-card shadow-lg border-2 rounded-xl hover:scale-[1.02] transition-all duration-300"
                      >
                        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 flex items-center justify-center shrink-0">
                              <Calendar className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <CardTitle className="text-lg font-bold truncate">Safra {stat.safra}</CardTitle>
                              <p className="text-sm text-muted-foreground font-medium">
                                {stat.total} {stat.total === 1 ? "fardo" : "fardos"}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="shrink-0 border-2 px-3 py-1.5 rounded-lg font-bold">
                            <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
                            <span>{stat.total}</span>
                          </Badge>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Campo */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-bale-campo/10 rounded-lg">
                                  <Package className="w-4 h-4 text-bale-campo" />
                                </div>
                                <span className="font-semibold">Campo</span>
                              </div>
                              <span className="font-bold text-foreground">
                                {stat.campo} <span className="text-muted-foreground font-medium">({progressCampo.toFixed(0)}%)</span>
                              </span>
                            </div>
                            <Progress value={progressCampo} className="h-2.5 rounded-full" />
                          </div>

                          {/* Pátio */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-bale-patio/10 rounded-lg">
                                  <Truck className="w-4 h-4 text-bale-patio" />
                                </div>
                                <span className="font-semibold">Pátio</span>
                              </div>
                              <span className="font-bold text-foreground">
                                {stat.patio} <span className="text-muted-foreground font-medium">({progressPatio.toFixed(0)}%)</span>
                              </span>
                            </div>
                            <Progress value={progressPatio} className="h-2.5 rounded-full [&>div]:bg-bale-patio" />
                          </div>

                          {/* Beneficiado */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-bale-beneficiado/10 rounded-lg">
                                  <CheckCircle className="w-4 h-4 text-bale-beneficiado" />
                                </div>
                                <span className="font-semibold">Beneficiado</span>
                              </div>
                              <span className="font-bold text-foreground">
                                {stat.beneficiado} <span className="text-muted-foreground font-medium">({progressBeneficiado.toFixed(0)}%)</span>
                              </span>
                            </div>
                            <Progress value={progressBeneficiado} className="h-2.5 rounded-full [&>div]:bg-bale-beneficiado" />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Tab: Gráficos Interativos */}
            <TabsContent value="graficos" className="space-y-6 mt-4">
              {/* Filtros */}
              <Card className="shadow-lg border-2 rounded-xl overflow-hidden">
                <CardContent className="pt-6 pb-6 space-y-4">
                  {/* Título dos Filtros */}
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 rounded-lg">
                      <Filter className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm font-bold">Filtros:</span>
                  </div>
                  
                  {/* Filtros de Tempo */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Período</label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        size="sm"
                        variant={timeFilter === "7d" ? "default" : "outline"}
                        onClick={() => setTimeFilter("7d")}
                        className="rounded-lg font-semibold text-[10px] sm:text-xs h-9 px-2"
                      >
                        7 dias
                      </Button>
                      <Button
                        size="sm"
                        variant={timeFilter === "30d" ? "default" : "outline"}
                        onClick={() => setTimeFilter("30d")}
                        className="rounded-lg font-semibold text-[10px] sm:text-xs h-9 px-2"
                      >
                        30 dias
                      </Button>
                      <Button
                        size="sm"
                        variant={timeFilter === "all" ? "default" : "outline"}
                        onClick={() => setTimeFilter("all")}
                        className="rounded-lg font-semibold text-[10px] sm:text-xs h-9 px-2"
                      >
                        Todos
                      </Button>
                    </div>
                  </div>

                  {/* Filtros de Status */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant={chartFilter === "all" ? "default" : "outline"}
                        onClick={() => setChartFilter("all")}
                        className="rounded-lg font-semibold text-[10px] sm:text-xs h-9 px-2"
                      >
                        Todos
                      </Button>
                      <Button
                        size="sm"
                        variant={chartFilter === "campo" ? "default" : "outline"}
                        onClick={() => setChartFilter("campo")}
                        className={chartFilter === "campo" ? "bg-bale-campo hover:bg-bale-campo/90 rounded-lg font-semibold text-[10px] sm:text-xs h-9 px-2" : "rounded-lg font-semibold text-[10px] sm:text-xs h-9 px-2"}
                      >
                        Campo
                      </Button>
                      <Button
                        size="sm"
                        variant={chartFilter === "patio" ? "default" : "outline"}
                        onClick={() => setChartFilter("patio")}
                        className={chartFilter === "patio" ? "bg-bale-patio hover:bg-bale-patio/90 rounded-lg font-semibold text-[10px] sm:text-xs h-9 px-2" : "rounded-lg font-semibold text-[10px] sm:text-xs h-9 px-2"}
                      >
                        Pátio
                      </Button>
                      <Button
                        size="sm"
                        variant={chartFilter === "beneficiado" ? "default" : "outline"}
                        onClick={() => setChartFilter("beneficiado")}
                        className={chartFilter === "beneficiado" ? "bg-bale-beneficiado hover:bg-bale-beneficiado/90 rounded-lg font-semibold text-[10px] sm:text-xs h-9 px-2" : "rounded-lg font-semibold text-[10px] sm:text-xs h-9 px-2"}
                      >
                        Beneficiado
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Gráfico de Produção por Talhão */}
              <Card className="shadow-xl border-2 rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
                  </div>
                  <CardTitle className="flex items-center gap-2 relative text-base sm:text-lg">
                    <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                      <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    Produção por Talhão
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 px-1 sm:px-6 overflow-x-auto">
                  <ResponsiveContainer width="100%" height={300} minWidth={300}>
                    <BarChart
                      data={talhaoStats.map(stat => ({
                        talhao: stat.talhao,
                        campo: chartFilter === "all" || chartFilter === "campo" ? stat.campo : 0,
                        patio: chartFilter === "all" || chartFilter === "patio" ? stat.patio : 0,
                        beneficiado: chartFilter === "all" || chartFilter === "beneficiado" ? stat.beneficiado : 0,
                        total: stat.total,
                      }))}
                      margin={{ top: 5, right: 5, left: -10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="talhao" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <RechartsTooltip />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      {(chartFilter === "all" || chartFilter === "campo") && (
                        <Bar dataKey="campo" fill="#22c55e" name="Campo" />
                      )}
                      {(chartFilter === "all" || chartFilter === "patio") && (
                        <Bar dataKey="patio" fill="#f59e0b" name="Pátio" />
                      )}
                      {(chartFilter === "all" || chartFilter === "beneficiado") && (
                        <Bar dataKey="beneficiado" fill="#3b82f6" name="Beneficiado" />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Grid com 2 gráficos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de Produtividade em Arrobas (@) por Talhão */}
                <Card className="shadow-xl border-2 rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    </div>
                    <CardTitle className="flex items-center gap-2 relative text-sm sm:text-base">
                      <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                        <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                      </div>
                      <span className="line-clamp-2">Produtividade em Arrobas (@/ha)</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 px-1 sm:px-6 overflow-x-auto">
                    <ResponsiveContainer width="100%" height={300} minWidth={300}>
                      <BarChart
                        data={talhaoStats
                          .map(stat => {
                            const talhaoInfo = TALHOES_INFO.find(t => t.id === stat.talhao);
                            const hectares = talhaoInfo ? parseFloat(talhaoInfo.hectares.replace(",", ".")) : 0;
                            const fardosPorHectare = hectares > 0 ? stat.total / hectares : 0;
                            const arrobasPorHectare = fardosPorHectare * 66.67;
                            
                            return {
                              talhao: stat.talhao,
                              arrobas: arrobasPorHectare,
                              fardos: stat.total,
                              hectares: hectares,
                            };
                          })
                          .sort((a, b) => b.arrobas - a.arrobas)
                        }
                        margin={{ top: 5, right: 5, left: -10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="talhao" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <RechartsTooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white p-3 border rounded-lg shadow-lg">
                                  <p className="font-semibold text-sm">Talhão {data.talhao}</p>
                                  <p className="text-xs text-emerald-600 font-medium">
                                    {data.arrobas.toFixed(2)} @/ha
                                  </p>
                                  <p className="text-[10px] text-muted-foreground">
                                    {data.fardos} fardos • {data.hectares} ha
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="arrobas" fill="#10b981" name="@/ha" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Gráfico de Produtividade em Fardos por Talhão */}
                <Card className="shadow-xl border-2 rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    </div>
                    <CardTitle className="flex items-center gap-2 relative text-sm sm:text-base">
                      <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                        <Package className="w-3 h-3 sm:w-4 sm:h-4" />
                      </div>
                      <span className="line-clamp-2">Produtividade em Fardos (f/ha)</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 px-1 sm:px-6 overflow-x-auto">
                    <ResponsiveContainer width="100%" height={300} minWidth={300}>
                      <BarChart
                        data={talhaoStats
                          .map(stat => {
                            const talhaoInfo = TALHOES_INFO.find(t => t.id === stat.talhao);
                            const hectares = talhaoInfo ? parseFloat(talhaoInfo.hectares.replace(",", ".")) : 0;
                            const fardosPorHectare = hectares > 0 ? stat.total / hectares : 0;
                            
                            return {
                              talhao: stat.talhao,
                              fardosPorHa: fardosPorHectare,
                              fardos: stat.total,
                              hectares: hectares,
                            };
                          })
                          .sort((a, b) => b.fardosPorHa - a.fardosPorHa)
                        }
                        margin={{ top: 5, right: 5, left: -10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="talhao" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <RechartsTooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white p-3 border rounded-lg shadow-lg">
                                  <p className="font-semibold text-sm">Talhão {data.talhao}</p>
                                  <p className="text-xs text-blue-600 font-medium">
                                    {data.fardosPorHa.toFixed(3)} f/ha
                                  </p>
                                  <p className="text-[10px] text-muted-foreground">
                                    {data.fardos} fardos • {data.hectares} ha
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="fardosPorHa" fill="#3b82f6" name="fardos/ha" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Card Criativo de Tempo Médio de Beneficiamento */}
              <Card className="shadow-xl border-2 rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-green-600 to-yellow-600 text-white relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
                  </div>
                  <CardTitle className="flex items-center gap-2 relative text-base sm:text-lg">
                    <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <span className="line-clamp-2">Tempo Médio: Pátio → Beneficiado</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 px-4 sm:px-6">
                  {(() => {
                    const talhaoTempos: Record<string, { total: number; count: number; tempos: number[] }> = {};
                    
                    allBales
                      .filter(b => b.status === "beneficiado" && b.statusHistory)
                      .forEach(bale => {
                        try {
                          const history = JSON.parse(bale.statusHistory!);
                          const patioEvent = history.find((h: any) => h.status === "patio");
                          const beneficiadoEvent = history.find((h: any) => h.status === "beneficiado");
                          
                          if (patioEvent && beneficiadoEvent) {
                            const patioTime = new Date(patioEvent.timestamp).getTime();
                            const beneficiadoTime = new Date(beneficiadoEvent.timestamp).getTime();
                            const hoursToProcess = (beneficiadoTime - patioTime) / (1000 * 60 * 60);
                            
                            if (!talhaoTempos[bale.talhao]) {
                              talhaoTempos[bale.talhao] = { total: 0, count: 0, tempos: [] };
                            }
                            talhaoTempos[bale.talhao].total += hoursToProcess;
                            talhaoTempos[bale.talhao].count += 1;
                            talhaoTempos[bale.talhao].tempos.push(hoursToProcess);
                          }
                        } catch (e) {
                          // Ignora erros de parsing
                        }
                      });
                    
                    // Calcular tempo médio geral
                    const totalHoras = Object.values(talhaoTempos).reduce((sum, t) => sum + t.total, 0);
                    const totalFardos = Object.values(talhaoTempos).reduce((sum, t) => sum + t.count, 0);
                    const tempoMedioGeral = totalFardos > 0 ? totalHoras / totalFardos : 0;
                    const dias = Math.floor(tempoMedioGeral / 24);
                    const horas = Math.floor(tempoMedioGeral % 24);
                    const minutos = Math.floor((tempoMedioGeral % 1) * 60);
                    
                    if (totalFardos === 0) {
                      return (
                        <div className="text-center py-12 text-muted-foreground">
                          <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p>Nenhum fardo beneficiado ainda</p>
                          <p className="text-xs mt-1">Os dados aparecerão quando fardos forem movidos do pátio para beneficiado</p>
                        </div>
                      );
                    }
                    
                    // Calcular percentual para o relógio (0-100%, máximo 7 dias)
                    const maxHours = 24 * 7; // 7 dias
                    const percentage = Math.min((tempoMedioGeral / maxHours) * 100, 100);
                    const strokeDasharray = 2 * Math.PI * 90; // Circunferência do círculo
                    const strokeDashoffset = strokeDasharray - (strokeDasharray * percentage) / 100;
                    
                    return (
                      <div className="space-y-6">
                        {/* Relógio Circular */}
                        <div className="flex flex-col items-center justify-center py-4">
                          <div className="relative w-48 h-48">
                            {/* Círculo de fundo */}
                            <svg className="w-full h-full transform -rotate-90">
                              <circle
                                cx="96"
                                cy="96"
                                r="90"
                                fill="none"
                                stroke="#e5e7eb"
                                strokeWidth="12"
                              />
                              {/* Círculo de progresso */}
                              <circle
                                cx="96"
                                cy="96"
                                r="90"
                                fill="none"
                                stroke="url(#gradient)"
                                strokeWidth="12"
                                strokeDasharray={strokeDasharray}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                style={{
                                  transition: 'stroke-dashoffset 1s ease-in-out'
                                }}
                              />
                              <defs>
                                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#16a34a" />
                                  <stop offset="100%" stopColor="#eab308" />
                                </linearGradient>
                              </defs>
                            </svg>
                            
                            {/* Ícone e tempo no centro */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <Clock className="w-8 h-8 text-orange-500 mb-2" />
                              <div className="text-center">
                                <div className="text-3xl font-bold text-gray-800">
                                  {dias > 0 && <span>{dias}<span className="text-lg">d</span> </span>}
                                  {horas}<span className="text-lg">h</span>
                                </div>
                                {minutos > 0 && (
                                  <div className="text-sm text-gray-500">
                                    {minutos} min
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Descrição */}
                          <div className="text-center mt-4 space-y-1">
                            <p className="text-sm font-medium text-gray-700">
                              Tempo médio de processamento
                            </p>
                            <p className="text-xs text-gray-500">
                              Baseado em {totalFardos} fardo{totalFardos !== 1 ? 's' : ''} beneficiado{totalFardos !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        
                        {/* Lista de talhões (compacta) */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {Object.entries(talhaoTempos)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([talhao, data]) => {
                              const media = data.total / data.count;
                              const d = Math.floor(media / 24);
                              const h = Math.floor(media % 24);
                              
                              return (
                                <div 
                                  key={talhao}
                                  className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow"
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="w-6 h-6 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center">
                                      {talhao.slice(0, 2)}
                                    </div>
                                    <span className="font-semibold text-sm text-gray-700">{talhao}</span>
                                  </div>
                                  <div className="text-orange-600 font-bold text-sm">
                                    {d > 0 ? `${d}d ` : ''}{h}h
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {data.count} fardo{data.count !== 1 ? 's' : ''}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Mapa */}
            <TabsContent value="mapa" className="mt-4">
              <Card className="shadow-xl border-2 rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
                  </div>
                  <CardTitle className="flex items-center gap-2 relative">
                    <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                      <MapPin className="w-5 h-5" />
                    </div>
                    Mapa Interativo dos Talhões
                  </CardTitle>
                  <p className="text-sm text-white/90 relative">Clique em um talhão para ver detalhes</p>
                </CardHeader>
                <CardContent className="p-0">
                  <InteractiveTalhaoMap 
                    selectedTalhao={selectedTalhao || undefined}
                    onTalhaoClick={(talhao) => setSelectedTalhao(talhao)}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          </div>
      </main>

      {/* Modal de Detalhes do Talhão */}
      <Dialog open={!!selectedTalhao} onOpenChange={() => setSelectedTalhao(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto z-[9999] rounded-2xl border-2">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-xl font-bold">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              Talhão {selectedTalhao}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm font-medium">
              Informações detalhadas e métricas de produtividade
            </DialogDescription>
          </DialogHeader>

          {selectedTalhaoData && selectedTalhaoInfo && (
            <div className="space-y-4 sm:space-y-6">
              {/* Informações Gerais */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 rounded-xl">
                  <CardContent className="pt-4 sm:pt-6 pb-3 sm:pb-4">
                    <div className="text-center space-y-0.5 sm:space-y-1">
                      <div className="p-1.5 bg-primary/20 rounded-lg w-fit mx-auto mb-1 sm:mb-2">
                        <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold">Área</p>
                      <p className="text-xl sm:text-2xl font-bold text-primary">{selectedTalhaoInfo.hectares}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">hectares</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-2 border-yellow-200 dark:border-yellow-800 rounded-xl">
                  <CardContent className="pt-4 sm:pt-6 pb-3 sm:pb-4">
                    <div className="text-center space-y-0.5 sm:space-y-1">
                      <div className="p-1.5 bg-yellow-500/20 rounded-lg w-fit mx-auto mb-1 sm:mb-2">
                        <Package className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-500" />
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold">Total Fardos</p>
                      <p className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-500">{selectedTalhaoData.total}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">fardos</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-2 border-emerald-200 dark:border-emerald-800 rounded-xl">
                  <CardContent className="pt-4 sm:pt-6 pb-3 sm:pb-4">
                    <div className="text-center space-y-0.5 sm:space-y-1">
                      <div className="p-1.5 bg-emerald-500/20 rounded-lg w-fit mx-auto mb-1 sm:mb-2">
                        <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-500" />
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold">Produtividade</p>
                      <p className="text-base sm:text-xl font-bold text-emerald-600 dark:text-emerald-500">{produtividadeArrobas} @/ha</p>
                      <p className="text-xs sm:text-sm text-emerald-600/70 dark:text-emerald-500/70">{fardosPorHectare} f/ha</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-2 border-green-200 dark:border-green-800 rounded-xl">
                  <CardContent className="pt-4 sm:pt-6 pb-3 sm:pb-4">
                    <div className="text-center space-y-0.5 sm:space-y-1">
                      <div className="p-1.5 bg-green-500/20 rounded-lg w-fit mx-auto mb-1 sm:mb-2">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-500" />
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold">Concluídos</p>
                      <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-500">{selectedTalhaoData.beneficiado}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
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
                <h4 className="text-xs sm:text-sm font-bold mb-2 sm:mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Distribuição por Status
                </h4>
                <div className="space-y-2 sm:space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs sm:text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-bale-campo/10 rounded">
                          <Package className="w-3 h-3 sm:w-4 sm:h-4 text-bale-campo" />
                        </div>
                        <span className="font-semibold">Campo</span>
                      </div>
                      <span className="font-bold">{selectedTalhaoData.campo} fardos</span>
                    </div>
                    <Progress 
                      value={(selectedTalhaoData.campo / selectedTalhaoData.total) * 100} 
                      className="h-2 sm:h-2.5 rounded-full"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs sm:text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-bale-patio/10 rounded">
                          <Truck className="w-3 h-3 sm:w-4 sm:h-4 text-bale-patio" />
                        </div>
                        <span className="font-semibold">Pátio</span>
                      </div>
                      <span className="font-bold">{selectedTalhaoData.patio} fardos</span>
                    </div>
                    <Progress 
                      value={(selectedTalhaoData.patio / selectedTalhaoData.total) * 100} 
                      className="h-2 sm:h-2.5 rounded-full [&>div]:bg-bale-patio"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs sm:text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-bale-beneficiado/10 rounded">
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-bale-beneficiado" />
                        </div>
                        <span className="font-semibold">Beneficiado</span>
                      </div>
                      <span className="font-bold">{selectedTalhaoData.beneficiado} fardos</span>
                    </div>
                    <Progress 
                      value={(selectedTalhaoData.beneficiado / selectedTalhaoData.total) * 100} 
                      className="h-2 sm:h-2.5 rounded-full [&>div]:bg-bale-beneficiado"
                    />
                  </div>
                </div>
              </div>

              {/* Métricas Comparativas */}
              <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl p-3 sm:p-4 border-2">
                <h4 className="text-xs sm:text-sm font-bold mb-2 sm:mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Comparativo com Média Geral
                </h4>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1 sm:space-y-2">
                    <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold">Produtividade deste talhão</p>
                    <p className="text-lg sm:text-xl font-bold text-primary">{produtividadeArrobas} @/ha</p>
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium">{fardosPorHectare} fardos/ha</p>
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold">Média geral</p>
                    <p className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-500">{avgArrobasPorHectare} @/ha</p>
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium">{avgFardosPorHectare} fardos/ha</p>
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
        
        <Footer />
      </div>
    </div>
  );
}
