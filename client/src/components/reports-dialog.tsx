import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileDown, FileSpreadsheet, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ReportFilters {
  startDate: string;
  endDate: string;
  status: string;
  talhao: string;
}

export function ReportsDialog() {
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: "",
    endDate: "",
    status: "",
    talhao: "",
  });

  async function downloadReport(type: "pdf" | "excel") {
    setIsGenerating(true);
    
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.status) params.append("status", filters.status);
      if (filters.talhao) params.append("talhao", filters.talhao);
      
      const endpoint = type === "pdf" ? "/api/reports/pdf" : "/api/reports/excel";
      const response = await fetch(`${endpoint}?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Erro ao gerar relatório");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-${format(new Date(), "yyyy-MM-dd-HHmm")}.${type === "pdf" ? "pdf" : "xlsx"}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Relatório gerado",
        description: `Relatório ${type.toUpperCase()} baixado com sucesso`,
      });
      
      setOpen(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível gerar o relatório",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" data-testid="button-open-reports">
          <FileDown className="w-4 h-4 mr-2" />
          Gerar Relatório
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gerar Relatório</DialogTitle>
          <DialogDescription>
            Configure os filtros e escolha o formato do relatório
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="start-date">Data Inicial</Label>
            <Input
              id="start-date"
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              data-testid="input-report-start-date"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="end-date">Data Final</Label>
            <Input
              id="end-date"
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              data-testid="input-report-end-date"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select 
              value={filters.status || "todos"} 
              onValueChange={(value) => setFilters({ ...filters, status: value === "todos" ? "" : value })}
            >
              <SelectTrigger data-testid="select-report-status">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="campo">Campo</SelectItem>
                <SelectItem value="patio">Pátio</SelectItem>
                <SelectItem value="beneficiado">Beneficiado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="talhao">Talhão</Label>
            <Input
              id="talhao"
              placeholder="Ex: T-01"
              value={filters.talhao}
              onChange={(e) => setFilters({ ...filters, talhao: e.target.value })}
              data-testid="input-report-talhao"
            />
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button
            onClick={() => downloadReport("pdf")}
            disabled={isGenerating}
            className="flex-1"
            data-testid="button-download-pdf"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4 mr-2" />
            )}
            PDF
          </Button>
          
          <Button
            onClick={() => downloadReport("excel")}
            disabled={isGenerating}
            className="flex-1"
            variant="outline"
            data-testid="button-download-excel"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 mr-2" />
            )}
            Excel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
