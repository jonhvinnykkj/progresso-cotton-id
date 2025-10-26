import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BaleCard } from "@/components/bale-card";
import { NavSidebar } from "@/components/nav-sidebar";
import { Footer } from "@/components/footer";
import { BackButton } from "@/components/back-button";
import { useAuth } from "@/lib/auth-context";
import type { Bale, BaleStatus } from "@shared/schema";
import {
  Package,
  Truck,
  CheckCircle,
  Search,
  Filter,
  BarChart3,
  TrendingUp,
  CalendarDays,
  LogOut,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import logoProgresso from "/favicon.png";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<BaleStatus | "all">("all");

  const { data: bales = [], isLoading } = useQuery<Bale[]>({
    queryKey: ["/api/bales"],
  });

  const { data: stats } = useQuery<{
    campo: number;
    patio: number;
    beneficiado: number;
    total: number;
  }>({
    queryKey: ["/api/bales/stats"],
  });

  const filteredBales = bales.filter((bale) => {
    const matchesSearch =
      bale.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (bale.numero && bale.numero.toString().includes(searchQuery)) ||
      (bale.talhao && bale.talhao.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "all" || bale.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calcular estatísticas adicionais
  const uniqueTalhoesCount = new Set(bales.map(b => b.talhao)).size;
  const uniqueSafrasCount = new Set(bales.map(b => b.safra)).size;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const balesToday = bales.filter(b => {
    const baleDate = new Date(b.createdAt);
    baleDate.setHours(0, 0, 0, 0);
    return baleDate.getTime() === today.getTime();
  }).length;

  // Calcular produtividade total em @/ha
  // Área total dos 9 talhões de algodão: 4938 ha
  const areaTotalHectares = 4938;
  const totalFardos = stats?.total || 0;
  const fardosPorHectare = areaTotalHectares > 0 ? totalFardos / areaTotalHectares : 0;
  const arrobasPorHectare = fardosPorHectare * 66.67; // 1 fardo = 2000kg = 66.67@

  const progressPercent = stats?.total ? ((stats.beneficiado / stats.total) * 100).toFixed(1) : "0";


  const statusCards = [
    {
      status: "campo" as BaleStatus,
      label: "No Campo",
      icon: Package,
      color: "text-bale-campo",
      bgColor: "bg-bale-campo/10",
      count: stats?.campo || 0,
    },
    {
      status: "patio" as BaleStatus,
      label: "No Pátio",
      icon: Truck,
      color: "text-bale-patio",
      bgColor: "bg-bale-patio/10",
      count: stats?.patio || 0,
    },
    {
      status: "beneficiado" as BaleStatus,
      label: "Beneficiado",
      icon: CheckCircle,
      color: "text-bale-beneficiado",
      bgColor: "bg-bale-beneficiado/10",
      count: stats?.beneficiado || 0,
    },
  ];

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
      <NavSidebar />
      
      <div className="flex-1 lg:ml-64 flex flex-col">
        {/* Conteúdo principal */}
        <main className="flex-1 container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-7xl pb-20 lg:pb-8">
          {/* Header com título e estatísticas rápidas */}
          <div className="mb-6 sm:mb-8 animate-fade-in-up">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                <img 
                  src={logoProgresso} 
                  alt="Grupo Progresso" 
                  className="h-8 w-8 sm:h-10 sm:w-10 transition-transform hover:scale-110 duration-300"
                />
                Dashboard
              </h1>
              <div className="flex items-center gap-2">
                <BackButton className="hidden sm:flex" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="shrink-0 transition-all hover:scale-110 duration-300"
                >
                  <LogOut className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Sair</span>
                </Button>
              </div>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground">
              Visão geral da produção de algodão
            </p>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {/* Resumo Geral da Safra - Agora vem primeiro */}
            <Card className="brand-gradient text-white shadow-xl animate-fade-in-up border-0" style={{ animationDelay: '0.1s' }}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
                <CardTitle className="text-base sm:text-lg font-bold">Resumo Geral da Safra</CardTitle>
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                  <div className="transition-transform hover:scale-110 duration-300 text-center p-3 sm:p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                    <Package className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-80" />
                    <p className="text-xs text-white/80 mb-1">Total de Fardos</p>
                    <p className="text-2xl sm:text-3xl font-bold">{stats?.total || 0}</p>
                  </div>
                  <div className="transition-transform hover:scale-110 duration-300 text-center p-3 sm:p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                    <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-80" />
                    <p className="text-xs text-white/80 mb-1">Talhões Ativos</p>
                    <p className="text-2xl sm:text-3xl font-bold">{uniqueTalhoesCount}</p>
                  </div>
                  <div className="transition-transform hover:scale-110 duration-300 text-center p-3 sm:p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                    <CalendarDays className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-80" />
                    <p className="text-xs text-white/80 mb-1">Criados Hoje</p>
                    <p className="text-2xl sm:text-3xl font-bold">{balesToday}</p>
                  </div>
                  <div className="transition-transform hover:scale-110 duration-300 text-center p-3 sm:p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                    <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-80" />
                    <p className="text-xs text-white/80 mb-1">% Beneficiados</p>
                    <p className="text-2xl sm:text-3xl font-bold">{progressPercent}%</p>
                  </div>
                </div>
                
                {/* Barra de progresso */}
                <div className="mt-6">
                  <div className="flex justify-between text-xs mb-2">
                    <span>Progresso de Beneficiamento</span>
                    <span>{stats?.beneficiado || 0} de {stats?.total || 0}</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-white h-full rounded-full transition-all duration-1000 shadow-lg"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Cards - Grid responsivo com melhor visual */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">{statusCards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <Card
                    key={card.status}
                    className={`hover-elevate cursor-pointer shadow-lg smooth-transition animate-fade-in-up border-2 ${
                      statusFilter === card.status 
                        ? "ring-2 ring-green-500 border-green-300" 
                        : "border-transparent hover:border-green-200"
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                    onClick={() =>
                      setStatusFilter(statusFilter === card.status ? "all" : card.status)
                    }
                    data-testid={`card-stats-${card.status}`}
                  >
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {card.label}
                      </CardTitle>
                      <div className={`w-12 h-12 rounded-xl ${card.bgColor} flex items-center justify-center shrink-0 transition-transform hover:scale-110 duration-300 shadow-md`}>
                        <Icon className={`w-6 h-6 ${card.color}`} />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        {card.count}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {card.count === 1 ? "fardo" : "fardos"}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Filtros e busca com melhor design */}
            <div className="space-y-3 sm:space-y-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <div className="relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Buscar por ID, número, talhão..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 sm:pl-12 h-10 sm:h-12 text-sm sm:text-base shadow-sm transition-all focus:scale-[1.01] focus:shadow-md duration-300 border-2"
                  data-testid="input-search"
                />
              </div>

              <div className="flex gap-2 flex-wrap items-center">
                <span className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
                  Filtrar:
                </span>
                <Badge
                  variant={statusFilter === "all" ? "default" : "outline"}
                  className="cursor-pointer hover-elevate px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm transition-all hover:scale-105 duration-300"
                  onClick={() => setStatusFilter("all")}
                  data-testid="filter-all"
                >
                  Todos ({bales.length})
                </Badge>
                {statusCards.map((card) => (
                  <Badge
                    key={card.status}
                    variant={statusFilter === card.status ? "default" : "outline"}
                    className="cursor-pointer hover-elevate px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm transition-all hover:scale-105 duration-300"
                    onClick={() => setStatusFilter(card.status)}
                    data-testid={`filter-${card.status}`}
                  >
                    {card.label} ({card.count})
                  </Badge>
                ))}
              </div>
            </div>

            {/* Lista de Fardos com melhor espaçamento */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="space-y-2 pb-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-6 bg-muted rounded w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="h-4 bg-muted rounded w-full" />
                      <div className="h-4 bg-muted rounded w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredBales.length === 0 ? (
              <Card className="p-8 sm:p-12 animate-fade-in-up shadow-lg">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center animate-bounce-gentle">
                    <Package className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Nenhum fardo encontrado
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                      {searchQuery || statusFilter !== "all"
                        ? "Tente ajustar os filtros de busca"
                        : "Cadastre o primeiro fardo no sistema"}
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {filteredBales.map((bale, index) => (
                  <div
                    key={bale.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${(index % 9) * 0.05}s` }}
                  >
                    <BaleCard
                      bale={bale}
                      onClick={() => setLocation(`/bale/${encodeURIComponent(bale.id)}`)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
