import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import {
  Package,
  Truck,
  CheckCircle,
  LogOut,
  ArrowLeft,
  Wheat,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import logoProgresso from "/favicon.png";
import { Progress } from "@/components/ui/progress";

interface TalhaoStats {
  talhao: string;
  campo: number;
  patio: number;
  beneficiado: number;
  total: number;
}

export default function TalhaoStats() {
  const [, setLocation] = useLocation();
  const { logout, user } = useAuth();

  const { data: talhaoStats = [], isLoading } = useQuery<TalhaoStats[]>({
    queryKey: ["/api/bales/stats-by-talhao"],
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
          {/* Summary Card */}
          <Card className="brand-gradient text-white shadow-md" data-testid="card-summary">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
              <CardTitle className="text-base">Resumo Geral</CardTitle>
              <BarChart3 className="w-5 h-5 shrink-0" data-testid="icon-summary" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div data-testid="summary-talhoes">
                  <p className="text-xs text-white/80">Total de Talhões</p>
                  <p className="text-2xl font-bold" data-testid="text-total-talhoes">{talhaoStats.length}</p>
                </div>
                <div data-testid="summary-total">
                  <p className="text-xs text-white/80">Total de Fardos</p>
                  <p className="text-2xl font-bold" data-testid="text-total-fardos">{globalStats?.total || 0}</p>
                </div>
                <div data-testid="summary-campo">
                  <p className="text-xs text-white/80">No Campo</p>
                  <p className="text-2xl font-bold" data-testid="text-total-campo">{globalStats?.campo || 0}</p>
                </div>
                <div data-testid="summary-beneficiado">
                  <p className="text-xs text-white/80">Beneficiados</p>
                  <p className="text-2xl font-bold" data-testid="text-total-beneficiado">{globalStats?.beneficiado || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

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
          ) : talhaoStats.length === 0 ? (
            <Card className="p-12" data-testid="card-empty-state">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center" data-testid="icon-empty">
                  <Wheat className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-base font-semibold" data-testid="text-empty-title">Nenhum talhão cadastrado</h3>
                  <p className="text-sm text-muted-foreground mt-1" data-testid="text-empty-description">
                    Cadastre o primeiro fardo para visualizar estatísticas
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {talhaoStats.map((stat) => {
                const progressCampo = (stat.campo / stat.total) * 100;
                const progressPatio = (stat.patio / stat.total) * 100;
                const progressBeneficiado = (stat.beneficiado / stat.total) * 100;

                return (
                  <Card
                    key={stat.talhao}
                    className="hover-elevate smooth-transition shadow-sm"
                    data-testid={`card-talhao-${stat.talhao}`}
                  >
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Wheat className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-lg truncate" data-testid={`text-talhao-name-${stat.talhao}`}>{stat.talhao}</CardTitle>
                          <p className="text-xs text-muted-foreground" data-testid={`text-talhao-subtitle-${stat.talhao}`}>
                            {stat.total} {stat.total === 1 ? "fardo" : "fardos"}
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
        </div>
      </main>
    </div>
  );
}
