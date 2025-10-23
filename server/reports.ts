import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import type { Bale } from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ReportFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  talhao?: string;
}

interface BaleStats {
  total: number;
  campo: number;
  patio: number;
  beneficiado: number;
}

function filterBales(bales: Bale[], filters: ReportFilters): Bale[] {
  return bales.filter(bale => {
    if (filters.status && bale.status !== filters.status) return false;
    if (filters.talhao && bale.talhao !== filters.talhao) return false;
    
    if (filters.startDate) {
      const start = new Date(filters.startDate);
      if (bale.createdAt < start) return false;
    }
    
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      if (bale.createdAt > end) return false;
    }
    
    return true;
  });
}

function calculateStats(bales: Bale[]): BaleStats {
  return {
    total: bales.length,
    campo: bales.filter(b => b.status === "campo").length,
    patio: bales.filter(b => b.status === "patio").length,
    beneficiado: bales.filter(b => b.status === "beneficiado").length,
  };
}

export function generatePDF(bales: Bale[], filters: ReportFilters): Buffer {
  const filteredBales = filterBales(bales, filters);
  const stats = calculateStats(filteredBales);
  
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.text("Relatório de Rastreabilidade", 14, 20);
  
  // Report info
  doc.setFontSize(10);
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, 14, 30);
  
  if (filters.startDate || filters.endDate) {
    const periodText = `Período: ${filters.startDate ? format(new Date(filters.startDate), "dd/MM/yyyy", { locale: ptBR }) : "Início"} - ${filters.endDate ? format(new Date(filters.endDate), "dd/MM/yyyy", { locale: ptBR }) : "Hoje"}`;
    doc.text(periodText, 14, 36);
  }
  
  // Statistics section
  doc.setFontSize(14);
  doc.text("Estatísticas", 14, 46);
  
  doc.setFontSize(10);
  doc.text(`Total de fardos: ${stats.total}`, 14, 54);
  doc.text(`Campo: ${stats.campo}`, 14, 60);
  doc.text(`Pátio: ${stats.patio}`, 14, 66);
  doc.text(`Beneficiado: ${stats.beneficiado}`, 14, 72);
  
  // Bales table
  const tableData = filteredBales.map(bale => [
    bale.numero,
    bale.talhao,
    bale.qrCode,
    bale.status,
    format(bale.createdAt, "dd/MM/yyyy", { locale: ptBR }),
    bale.campoTimestamp ? format(bale.campoTimestamp, "dd/MM/yyyy", { locale: ptBR }) : "-",
    bale.patioTimestamp ? format(bale.patioTimestamp, "dd/MM/yyyy", { locale: ptBR }) : "-",
    bale.beneficiadoTimestamp ? format(bale.beneficiadoTimestamp, "dd/MM/yyyy", { locale: ptBR }) : "-",
  ]);
  
  autoTable(doc, {
    startY: 80,
    head: [["Número", "Talhão", "QR Code", "Status", "Cadastro", "Campo", "Pátio", "Beneficiado"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [30, 90, 74] },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 20 },
      2: { cellWidth: 30 },
      3: { cellWidth: 25 },
    },
  });
  
  return Buffer.from(doc.output("arraybuffer"));
}

export function generateExcel(bales: Bale[], filters: ReportFilters): Buffer {
  const filteredBales = filterBales(bales, filters);
  const stats = calculateStats(filteredBales);
  
  // Summary sheet
  const summaryData = [
    ["Relatório de Rastreabilidade de Fardos"],
    [""],
    ["Gerado em:", format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })],
    [""],
    ["Estatísticas"],
    ["Total de fardos:", stats.total],
    ["Campo:", stats.campo],
    ["Pátio:", stats.patio],
    ["Beneficiado:", stats.beneficiado],
  ];
  
  if (filters.startDate || filters.endDate) {
    summaryData.splice(3, 0, [
      "Período:",
      `${filters.startDate ? format(new Date(filters.startDate), "dd/MM/yyyy", { locale: ptBR }) : "Início"} - ${filters.endDate ? format(new Date(filters.endDate), "dd/MM/yyyy", { locale: ptBR }) : "Hoje"}`
    ]);
  }
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Bales sheet
  const balesData = filteredBales.map(bale => ({
    "Número": bale.numero,
    "Talhão": bale.talhao,
    "QR Code": bale.qrCode,
    "Status": bale.status,
    "Data Cadastro": format(bale.createdAt, "dd/MM/yyyy HH:mm", { locale: ptBR }),
    "Campo - Data": bale.campoTimestamp ? format(bale.campoTimestamp, "dd/MM/yyyy HH:mm", { locale: ptBR }) : "-",
    "Campo - Lat": bale.campoLatitude || "-",
    "Campo - Long": bale.campoLongitude || "-",
    "Pátio - Data": bale.patioTimestamp ? format(bale.patioTimestamp, "dd/MM/yyyy HH:mm", { locale: ptBR }) : "-",
    "Pátio - Lat": bale.patioLatitude || "-",
    "Pátio - Long": bale.patioLongitude || "-",
    "Beneficiado - Data": bale.beneficiadoTimestamp ? format(bale.beneficiadoTimestamp, "dd/MM/yyyy HH:mm", { locale: ptBR }) : "-",
    "Beneficiado - Lat": bale.beneficiadoLatitude || "-",
    "Beneficiado - Long": bale.beneficiadoLongitude || "-",
  }));
  
  const balesSheet = XLSX.utils.json_to_sheet(balesData);
  
  // Status breakdown sheet
  const statusBreakdown = [
    ["Status", "Quantidade"],
    ["Campo", stats.campo],
    ["Pátio", stats.patio],
    ["Beneficiado", stats.beneficiado],
  ];
  
  const statusSheet = XLSX.utils.aoa_to_sheet(statusBreakdown);
  
  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumo");
  XLSX.utils.book_append_sheet(workbook, balesSheet, "Fardos");
  XLSX.utils.book_append_sheet(workbook, statusSheet, "Por Status");
  
  return Buffer.from(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }));
}
