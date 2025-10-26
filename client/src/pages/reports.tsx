import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileDown, 
  FileSpreadsheet, 
  Loader2, 
  Calendar,
  Filter,
  Download,
  Eye,
  TrendingUp,
  BarChart3,
  Clock,
  Image,
  Settings,
  FileText,
  Package,
  Truck,
  CheckCircle,
  MapPin,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Bale } from "@shared/schema";
import { NavSidebar } from "@/components/nav-sidebar";
import { Footer } from "@/components/footer";
import { BackButton } from "@/components/back-button";
import logoProgresso from "/favicon.png";

interface ReportFilters {
  startDate: string;
  endDate: string;
  status: string[];
  talhao: string[];
  safra: string;
}

interface ReportPreview {
  totalFardos: number;
  pesoBrutoTotal: number;
  pesoLiquidoTotal: number;
  porStatus: Record<string, number>;
  porTalhao: Record<string, number>;
}

export default function ReportsPage() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: "",
    endDate: "",
    status: [],
    talhao: [],
    safra: "",
  });

  const [reportOptions, setReportOptions] = useState({
    includeCharts: true,
    includeTimeline: true,
    groupByTalhao: true,
    groupBySafra: false,
    detailedView: true,
  });

  const { data: bales = [] } = useQuery<Bale[]>({
    queryKey: ["/api/bales"],
  });

  // Extrair valores únicos para filtros
  const uniqueTalhoes = Array.from(new Set(bales.map(b => b.talhao).filter(Boolean))).sort();
  const uniqueSafras = Array.from(new Set(bales.map(b => b.safra).filter(Boolean))).sort();

  // Filtrar dados para preview
  const filteredBales = bales.filter(bale => {
    if (filters.startDate && new Date(bale.createdAt) < new Date(filters.startDate)) return false;
    if (filters.endDate && new Date(bale.createdAt) > new Date(filters.endDate)) return false;
    if (filters.status.length > 0 && !filters.status.includes(bale.status)) return false;
    if (filters.talhao.length > 0 && bale.talhao && !filters.talhao.includes(bale.talhao)) return false;
    if (filters.safra && bale.safra !== filters.safra) return false;
    return true;
  });

  // Calcular preview
  const preview: ReportPreview = {
    totalFardos: filteredBales.length,
    pesoBrutoTotal: 0, // Campo peso_bruto não existe no schema atual
    pesoLiquidoTotal: 0, // Campo peso_liquido não existe no schema atual
    porStatus: filteredBales.reduce((acc, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    porTalhao: filteredBales.reduce((acc, b) => {
      if (b.talhao) acc[b.talhao] = (acc[b.talhao] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  const toggleStatus = (status: string) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status]
    }));
  };

  const toggleTalhao = (talhao: string) => {
    setFilters(prev => ({
      ...prev,
      talhao: prev.talhao.includes(talhao)
        ? prev.talhao.filter(t => t !== talhao)
        : [...prev.talhao, talhao]
    }));
  };

  const toggleAllTalhoes = () => {
    setFilters(prev => ({
      ...prev,
      talhao: prev.talhao.length === uniqueTalhoes.length ? [] : [...uniqueTalhoes]
    }));
  };

  async function downloadReport(type: "pdf" | "excel") {
    setIsGenerating(true);
    
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.status.length > 0) params.append("status", filters.status.join(","));
      if (filters.talhao.length > 0) params.append("talhao", filters.talhao.join(","));
      if (filters.safra) params.append("safra", filters.safra);
      
      // Opções do relatório
      params.append("includeCharts", reportOptions.includeCharts.toString());
      params.append("includeTimeline", reportOptions.includeTimeline.toString());
      params.append("groupByTalhao", reportOptions.groupByTalhao.toString());
      params.append("groupBySafra", reportOptions.groupBySafra.toString());
      params.append("detailedView", reportOptions.detailedView.toString());
      
      const endpoint = type === "pdf" ? "/api/reports/pdf" : "/api/reports/excel";
      const response = await fetch(`${endpoint}?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Erro ao gerar relatório");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      const timestamp = format(new Date(), "yyyy-MM-dd-HHmmss");
      const filename = `relatorio-cotton-${timestamp}.${type === "pdf" ? "pdf" : "xlsx"}`;
      a.download = filename;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Relatório gerado com sucesso!",
        description: `${preview.totalFardos} fardos incluídos no relatório ${type.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar relatório",
        description: "Não foi possível gerar o relatório. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
      <NavSidebar />
      
      <div className="flex-1 lg:ml-64">
        <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-7xl pb-20 lg:pb-8">
          {/* Header */}
          <div className="mb-6 sm:mb-8 animate-fade-in-up">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                <img 
                  src={logoProgresso} 
                  alt="Grupo Progresso" 
                  className="h-8 w-8 sm:h-10 sm:w-10 transition-transform hover:scale-110 duration-300"
                />
                Relatórios
              </h1>
              <BackButton className="hidden sm:flex" />
            </div>
            <p className="text-sm sm:text-base text-muted-foreground">
              Configure e gere relatórios personalizados em PDF ou Excel
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Painel de Filtros */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <Card className="shadow-xl border-0 animate-fade-in-up hover-elevate transition-all duration-300 overflow-hidden" style={{ animationDelay: '0.1s' }}>
                <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white pb-6">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold">
                    <Filter className="h-6 w-6" />
                    Filtros de Dados
                  </CardTitle>
                  <CardDescription className="text-green-50 text-sm">
                    Selecione os critérios para filtrar os dados do relatório
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6 bg-white dark:bg-gray-900">
                  {/* Período */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-date" className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
                        <Calendar className="h-4 w-4 text-green-600" />
                        Data Inicial
                      </Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        className="transition-all focus:scale-[1.02] border-2 focus:border-green-500 h-11 shadow-sm hover:shadow-md"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="end-date" className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
                        <Calendar className="h-4 w-4 text-green-600" />
                        Data Final
                      </Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        className="transition-all focus:scale-[1.02] border-2 focus:border-green-500 h-11 shadow-sm hover:shadow-md"
                      />
                    </div>
                  </div>

                  {/* Safra */}
                  <div className="space-y-2">
                    <Label htmlFor="safra" className="font-semibold text-gray-900 dark:text-gray-100">Safra</Label>
                    <Select 
                      value={filters.safra || "todas"} 
                      onValueChange={(value) => setFilters({ ...filters, safra: value === "todas" ? "" : value })}
                    >
                      <SelectTrigger className="transition-all focus:scale-[1.02] h-11 border-2 shadow-sm hover:shadow-md">
                        <SelectValue placeholder="Todas as safras" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas as safras</SelectItem>
                        {uniqueSafras.map(safra => (
                          <SelectItem key={safra} value={safra}>{safra}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status */}
                  <div className="space-y-3">
                    <Label className="font-semibold text-gray-900 dark:text-gray-100">Status dos Fardos</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div 
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg ${
                          filters.status.includes("campo") 
                            ? "border-green-500 bg-green-50 dark:bg-green-900/20 shadow-lg scale-105 ring-2 ring-green-500/20" 
                            : "border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 hover:scale-105"
                        }`}
                        onClick={() => toggleStatus("campo")}
                      >
                        <Checkbox
                          id="status-campo"
                          checked={filters.status.includes("campo")}
                          onCheckedChange={() => toggleStatus("campo")}
                          className="data-[state=checked]:bg-green-600 w-5 h-5"
                        />
                        <div className="flex items-center gap-2 flex-1">
                          <Package className="h-5 w-5 text-green-600" />
                          <label
                            htmlFor="status-campo"
                            className="text-sm font-semibold cursor-pointer flex-1"
                          >
                            Campo
                          </label>
                        </div>
                      </div>

                      <div 
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg ${
                          filters.status.includes("patio") 
                            ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 shadow-lg scale-105 ring-2 ring-yellow-500/20" 
                            : "border-gray-200 dark:border-gray-700 hover:border-yellow-300 dark:hover:border-yellow-600 hover:scale-105"
                        }`}
                        onClick={() => toggleStatus("patio")}
                      >
                        <Checkbox
                          id="status-patio"
                          checked={filters.status.includes("patio")}
                          onCheckedChange={() => toggleStatus("patio")}
                          className="data-[state=checked]:bg-yellow-600 w-5 h-5"
                        />
                        <div className="flex items-center gap-2 flex-1">
                          <Truck className="h-5 w-5 text-yellow-600" />
                          <label
                            htmlFor="status-patio"
                            className="text-sm font-semibold cursor-pointer flex-1"
                          >
                            Pátio
                          </label>
                        </div>
                      </div>

                      <div 
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg ${
                          filters.status.includes("beneficiado") 
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg scale-105 ring-2 ring-blue-500/20" 
                            : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:scale-105"
                        }`}
                        onClick={() => toggleStatus("beneficiado")}
                      >
                        <Checkbox
                          id="status-beneficiado"
                          checked={filters.status.includes("beneficiado")}
                          onCheckedChange={() => toggleStatus("beneficiado")}
                          className="data-[state=checked]:bg-blue-600 w-5 h-5"
                        />
                        <div className="flex items-center gap-2 flex-1">
                          <CheckCircle className="h-5 w-5 text-blue-600" />
                          <label
                            htmlFor="status-beneficiado"
                            className="text-sm font-semibold cursor-pointer flex-1"
                          >
                            Beneficiado
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Talhões */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-green-600" />
                        Talhões
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={toggleAllTalhoes}
                        className="text-xs h-8 hover:bg-green-100 dark:hover:bg-green-900/20 font-semibold text-green-600 hover:text-green-700"
                      >
                        {filters.talhao.length === uniqueTalhoes.length ? "Desmarcar" : "Marcar"} Todos
                      </Button>
                    </div>
                    <div className="max-h-48 overflow-y-auto bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border-2 shadow-sm">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {uniqueTalhoes.map(talhao => (
                          <div 
                            key={talhao} 
                            className={`flex items-center space-x-2 p-3 rounded-lg transition-all duration-200 cursor-pointer border ${
                              filters.talhao.includes(talhao)
                                ? "bg-green-100 dark:bg-green-900/30 border-green-500 shadow-sm"
                                : "hover:bg-white dark:hover:bg-gray-800 border-transparent hover:border-gray-300"
                            }`}
                            onClick={() => toggleTalhao(talhao)}
                          >
                            <Checkbox
                              id={`talhao-${talhao}`}
                              checked={filters.talhao.includes(talhao)}
                              onCheckedChange={() => toggleTalhao(talhao)}
                              className="data-[state=checked]:bg-green-600"
                            />
                            <label
                              htmlFor={`talhao-${talhao}`}
                              className="text-sm font-medium leading-none cursor-pointer capitalize flex-1"
                            >
                              {talhao}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Opções do Relatório */}
              <Card className="shadow-xl border-0 animate-fade-in-up hover-elevate transition-all duration-300 overflow-hidden" style={{ animationDelay: '0.2s' }}>
                <CardHeader className="bg-gradient-to-r from-blue-500 to-sky-600 text-white pb-6">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold">
                    <Settings className="h-6 w-6" />
                    Opções do Relatório
                  </CardTitle>
                  <CardDescription className="text-blue-50 text-sm">
                    Personalize o conteúdo e formato do relatório
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 bg-white dark:bg-gray-900">
                  <Tabs defaultValue="content" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-blue-50 to-sky-50 dark:bg-gray-800 p-1 h-12">
                      <TabsTrigger value="content" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-md gap-2 font-semibold">
                        <FileText className="h-4 w-4" />
                        Conteúdo
                      </TabsTrigger>
                      <TabsTrigger value="format" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-md gap-2 font-semibold">
                        <Settings className="h-4 w-4" />
                        Formatação
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="content" className="space-y-3 mt-4">
                      <div className="flex items-center space-x-3 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all hover:scale-[1.02] cursor-pointer bg-white dark:bg-gray-800 shadow-sm hover:shadow-md">
                        <Checkbox
                          id="include-charts"
                          checked={reportOptions.includeCharts}
                          onCheckedChange={(checked) => 
                            setReportOptions({ ...reportOptions, includeCharts: checked as boolean })
                          }
                          className="data-[state=checked]:bg-blue-600 w-5 h-5"
                        />
                        <label htmlFor="include-charts" className="text-sm font-semibold cursor-pointer flex items-center gap-2 flex-1">
                          <BarChart3 className="h-5 w-5 text-blue-600" />
                          Incluir gráficos e estatísticas
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-3 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all hover:scale-[1.02] cursor-pointer bg-white dark:bg-gray-800 shadow-sm hover:shadow-md">
                        <Checkbox
                          id="include-timeline"
                          checked={reportOptions.includeTimeline}
                          onCheckedChange={(checked) => 
                            setReportOptions({ ...reportOptions, includeTimeline: checked as boolean })
                          }
                          className="data-[state=checked]:bg-blue-600 w-5 h-5"
                        />
                        <label htmlFor="include-timeline" className="text-sm font-semibold cursor-pointer flex items-center gap-2 flex-1">
                          <Clock className="h-5 w-5 text-blue-600" />
                          Incluir linha do tempo
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-3 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all hover:scale-[1.02] cursor-pointer bg-white dark:bg-gray-800 shadow-sm hover:shadow-md">
                        <Checkbox
                          id="detailed-view"
                          checked={reportOptions.detailedView}
                          onCheckedChange={(checked) => 
                            setReportOptions({ ...reportOptions, detailedView: checked as boolean })
                          }
                          className="data-[state=checked]:bg-blue-600 w-5 h-5"
                        />
                        <label htmlFor="detailed-view" className="text-sm font-semibold cursor-pointer flex items-center gap-2 flex-1">
                          <FileText className="h-5 w-5 text-blue-600" />
                          Visão detalhada (todos os campos)
                        </label>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="format" className="space-y-4 mt-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="group-talhao"
                          checked={reportOptions.groupByTalhao}
                          onCheckedChange={(checked) => 
                            setReportOptions({ ...reportOptions, groupByTalhao: checked as boolean })
                          }
                        />
                        <label htmlFor="group-talhao" className="text-sm font-medium cursor-pointer">
                          Agrupar por talhão
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="group-safra"
                          checked={reportOptions.groupBySafra}
                          onCheckedChange={(checked) => 
                            setReportOptions({ ...reportOptions, groupBySafra: checked as boolean })
                          }
                        />
                        <label htmlFor="group-safra" className="text-sm font-medium cursor-pointer">
                          Agrupar por safra
                        </label>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Preview e Ações */}
            <div className="space-y-4 sm:space-y-6">
              {/* Preview Card */}
              <Card className="shadow-xl border-0 sticky top-6 animate-fade-in-up hover-elevate transition-all duration-300 overflow-hidden" style={{ animationDelay: '0.3s' }}>
                <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white pb-6">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold">
                    <Eye className="h-6 w-6" />
                    Preview
                  </CardTitle>
                  <CardDescription className="text-purple-50 text-sm">
                    Resumo dos dados filtrados
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-6 bg-white dark:bg-gray-900">
                  <div className="text-center p-8 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 rounded-2xl border-2 border-green-300 dark:border-green-700 shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
                    <Package className="h-10 w-10 mx-auto mb-3 text-green-600 opacity-70" />
                    <div className="text-6xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2 animate-pulse">
                      {preview.totalFardos}
                    </div>
                    <div className="text-sm font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">
                      Fardos no relatório
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-700 rounded-xl border-2 border-green-200 dark:border-green-800 hover:scale-[1.02] transition-all duration-200 shadow-sm hover:shadow-md">
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        Total de Fardos
                      </span>
                      <span className="font-black text-xl text-green-600">
                        {preview.totalFardos}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-semibold">Por Status</Label>
                    {Object.entries(preview.porStatus).map(([status, count]) => (
                      <div key={status} className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200">
                        <span className="capitalize flex items-center gap-2">
                          {status === "campo" && <Package className="h-3 w-3 text-green-600" />}
                          {status === "patio" && <Truck className="h-3 w-3 text-yellow-600" />}
                          {status === "beneficiado" && <CheckCircle className="h-3 w-3 text-blue-600" />}
                          {status}
                        </span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>

                  {Object.keys(preview.porTalhao).length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Top 5 Talhões</Label>
                      {Object.entries(preview.porTalhao)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 5)
                        .map(([talhao, count]) => (
                          <div key={talhao} className="flex justify-between items-center text-sm">
                            <span>{talhao}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Ações */}
              <Card className="shadow-xl animate-fade-in-up hover-elevate transition-all duration-300 border-0 overflow-hidden" style={{ animationDelay: '0.4s' }}>
                <CardHeader className="bg-gradient-to-r from-orange-500 to-amber-600 text-white pb-6">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold">
                    <Download className="h-6 w-6" />
                    Gerar Relatório
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6 bg-white dark:bg-gray-900">
                  <Button
                    onClick={() => downloadReport("pdf")}
                    disabled={isGenerating || preview.totalFardos === 0}
                    className="w-full h-14 text-base font-bold bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 shadow-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 rounded-xl"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Gerando PDF...
                      </>
                    ) : (
                      <>
                        <FileDown className="w-5 h-5 mr-2" />
                        Baixar PDF
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={() => downloadReport("excel")}
                    disabled={isGenerating || preview.totalFardos === 0}
                    className="w-full h-14 text-base font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 rounded-xl"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Gerando Excel...
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet className="w-5 h-5 mr-2" />
                        Baixar Excel
                      </>
                    )}
                  </Button>

                  {preview.totalFardos === 0 && (
                    <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-xl mt-4 shadow-sm">
                      <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0" />
                      <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">
                        Ajuste os filtros para incluir dados no relatório
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Estatísticas Rápidas */}
              <Card className="shadow-xl animate-fade-in-up hover-elevate transition-all duration-300 border-0 overflow-hidden" style={{ animationDelay: '0.5s' }}>
                <CardHeader className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white pb-6">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold">
                    <TrendingUp className="h-6 w-6" />
                    Estatísticas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-6 bg-white dark:bg-gray-900">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl border-2 border-indigo-200 dark:border-indigo-800 hover:scale-[1.02] transition-all duration-200 shadow-sm hover:shadow-md">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-indigo-600" />
                      Talhões únicos
                    </span>
                    <span className="font-black text-xl text-indigo-600">
                      {Object.keys(preview.porTalhao).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800 hover:scale-[1.02] transition-all duration-200 shadow-sm hover:shadow-md">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      Média por talhão
                    </span>
                    <span className="font-black text-xl text-blue-600">
                      {Object.keys(preview.porTalhao).length > 0
                        ? Math.round(preview.totalFardos / Object.keys(preview.porTalhao).length)
                        : 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}
