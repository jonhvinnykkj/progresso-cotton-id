import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BaleCard } from "@/components/bale-card";
import { ReportsDialog } from "@/components/reports-dialog";
import { useAuth } from "@/lib/auth-context";
import type { Bale, BaleStatus } from "@shared/schema";
import {
  Package,
  Truck,
  CheckCircle,
  Search,
  LogOut,
  Filter,
  BarChart3,
  Settings,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import logoProgresso from "/favicon.png";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { logout, user } = useAuth();
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

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

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

  return (
    <div className="mobile-page">
      {/* Header sticky mobile-first */}
      <header className="mobile-header">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <img 
                src={logoProgresso} 
                alt="Grupo Progresso" 
                className="h-8 sm:h-10 w-auto shrink-0"
              />
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-semibold truncate">Dashboard</h1>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.username} {user?.role && <span className="ml-1 px-2 py-0.5 bg-primary/10 rounded text-primary font-medium">({user.role})</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {user?.role === "superadmin" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation("/users")}
                  data-testid="button-user-management"
                  className="h-9 w-9 p-0 flex items-center justify-center"
                  title="Gestão de Usuários"
                >
                  <Users className="w-4 h-4" />
                </Button>
              )}
              {user?.role === "admin" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation("/talhao-stats")}
                    data-testid="button-talhao-stats"
                    className="h-9 w-9 p-0 flex items-center justify-center"
                    title="Dashboard por Talhão"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation("/settings")}
                    data-testid="button-settings"
                    className="h-9 w-9 p-0"
                    title="Configurações"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </>
              )}
              <ReportsDialog />
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                data-testid="button-logout"
                className="h-9 w-9 p-0"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo principal mobile-first */}
      <main className="mobile-content">
        <div className="container mx-auto px-4 py-6 max-w-7xl space-y-5">
          {/* Stats Cards - Grid responsivo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {statusCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card
                  key={card.status}
                  className={`hover-elevate cursor-pointer shadow-sm smooth-transition ${
                    statusFilter === card.status ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() =>
                    setStatusFilter(statusFilter === card.status ? "all" : card.status)
                  }
                  data-testid={`card-stats-${card.status}`}
                >
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-xs font-medium">{card.label}</CardTitle>
                    <div className={`w-8 h-8 rounded-full ${card.bgColor} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4 h-4 ${card.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="text-2xl font-bold">{card.count}</div>
                    <p className="text-xs text-muted-foreground">
                      {card.count === 1 ? "fardo" : "fardos"}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Total Stats Card - Destaque com gradiente */}
          <Card className="brand-gradient text-white shadow-md">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
              <CardTitle className="text-base">Resumo Geral</CardTitle>
              <BarChart3 className="w-5 h-5 shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-xs text-white/80 mb-1">Total de Fardos</p>
                  <p className="text-2xl font-bold">{stats?.total || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-white/80 mb-1">Talhões Ativos</p>
                  <p className="text-2xl font-bold">{uniqueTalhoesCount}</p>
                </div>
                <div>
                  <p className="text-xs text-white/80 mb-1">Criados Hoje</p>
                  <p className="text-2xl font-bold">{balesToday}</p>
                </div>
                <div>
                  <p className="text-xs text-white/80 mb-1">Beneficiados</p>
                  <p className="text-2xl font-bold">{progressPercent}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filtros mobile-first */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Buscar por ID, número, talhão ou QR..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
                data-testid="input-search"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <Badge
                variant={statusFilter === "all" ? "default" : "outline"}
                className="cursor-pointer hover-elevate px-3 py-1.5 text-xs"
                onClick={() => setStatusFilter("all")}
                data-testid="filter-all"
              >
                <Filter className="w-3 h-3 mr-1" />
                Todos
              </Badge>
              {statusCards.map((card) => (
                <Badge
                  key={card.status}
                  variant={statusFilter === card.status ? "default" : "outline"}
                  className="cursor-pointer hover-elevate px-3 py-1.5 text-xs"
                  onClick={() => setStatusFilter(card.status)}
                  data-testid={`filter-${card.status}`}
                >
                  {card.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Lista de Fardos */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
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
            <Card className="p-8 sm:p-12">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                  <Package className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">Nenhum fardo encontrado</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchQuery || statusFilter !== "all"
                      ? "Tente ajustar os filtros de busca"
                      : "Cadastre o primeiro fardo no sistema"}
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredBales.map((bale) => (
                <BaleCard
                  key={bale.id}
                  bale={bale}
                  onClick={() => setLocation(`/bale/${encodeURIComponent(bale.id)}`)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
