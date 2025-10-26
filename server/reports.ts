import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import type { Bale } from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ReportFilters {
  startDate?: string;
  endDate?: string;
  status?: string[];
  talhao?: string[];
}

interface BaleStats {
  total: number;
  campo: number;
  patio: number;
  beneficiado: number;
}

function filterBales(bales: Bale[], filters: ReportFilters): Bale[] {
  return bales.filter(bale => {
    // Filtro de status - aceita array
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(bale.status)) return false;
    }
    
    // Filtro de talhao - aceita array
    if (filters.talhao && filters.talhao.length > 0) {
      if (!bale.talhao || !filters.talhao.includes(bale.talhao)) return false;
    }
    
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
  
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });
  
  const pageWidth = 297;
  const pageHeight = 210;
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  
  // Cores da empresa
  const verdeEscuro = [16, 106, 68];
  const verde = [34, 197, 94];
  const amarelo = [234, 179, 8];
  const amareloClaro = [253, 224, 71];
  const cinza = [107, 114, 128];
  const cinzaClaro = [249, 250, 251];
  const branco = [255, 255, 255];
  
  // ==================== CABEÇALHO ====================
  // Barra amarela superior
  doc.setFillColor(amarelo[0], amarelo[1], amarelo[2]);
  doc.rect(0, 0, pageWidth, 5, 'F');
  
  // Fundo verde do cabeçalho
  doc.setFillColor(verdeEscuro[0], verdeEscuro[1], verdeEscuro[2]);
  doc.rect(0, 5, pageWidth, 25, 'F');
  
  // Título principal
  doc.setTextColor(branco[0], branco[1], branco[2]);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text("GRUPO PROGRESSO", margin, 17);
  
  // Subtítulo
  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.text("Relatório de Rastreabilidade de Algodão", margin, 25);
  
  // Data de geração (direita)
  doc.setFontSize(9);
  const dataGeracao = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  doc.text(`Gerado em: ${dataGeracao}`, pageWidth - margin, 25, { align: 'right' });
  
  let currentY = 38;
  
  // ==================== INFORMAÇÕES DE FILTRO ====================
  if (filters.startDate || filters.endDate || (filters.status && filters.status.length > 0) || (filters.talhao && filters.talhao.length > 0)) {
    doc.setFillColor(cinzaClaro[0], cinzaClaro[1], cinzaClaro[2]);
    doc.roundedRect(margin, currentY, contentWidth, 10, 2, 2, 'F');
    
    doc.setTextColor(verdeEscuro[0], verdeEscuro[1], verdeEscuro[2]);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    
    let filterTexts = [];
    
    if (filters.startDate || filters.endDate) {
      const periodo = `Período: ${filters.startDate ? format(new Date(filters.startDate), "dd/MM/yyyy", { locale: ptBR }) : "Início"} - ${filters.endDate ? format(new Date(filters.endDate), "dd/MM/yyyy", { locale: ptBR }) : "Hoje"}`;
      filterTexts.push(periodo);
    }
    
    if (filters.status && filters.status.length > 0) {
      filterTexts.push(`Status: ${filters.status.join(", ")}`);
    }
    
    if (filters.talhao && filters.talhao.length > 0) {
      const talhoesText = filters.talhao.join(", ");
      filterTexts.push(`Talhões: ${talhoesText.length > 30 ? talhoesText.substring(0, 27) + "..." : talhoesText}`);
    }
    
    doc.text(`🔍 Filtros: ${filterTexts.join(" | ")}`, margin + 2, currentY + 6.5);
    currentY += 15;
  }
  
  // ==================== CARDS DE ESTATÍSTICAS ====================
  const cardWidth = (contentWidth - 9) / 4; // 4 cards com espaçamento
  const cardHeight = 22;
  const cardSpacing = 3;
  
  // Card 1 - Total (Verde Escuro com borda amarela)
  doc.setFillColor(verdeEscuro[0], verdeEscuro[1], verdeEscuro[2]);
  doc.roundedRect(margin, currentY, cardWidth, cardHeight, 3, 3, 'F');
  doc.setDrawColor(amarelo[0], amarelo[1], amarelo[2]);
  doc.setLineWidth(1);
  doc.roundedRect(margin, currentY, cardWidth, cardHeight, 3, 3, 'S');
  
  doc.setTextColor(amareloClaro[0], amareloClaro[1], amareloClaro[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text("📦 TOTAL DE FARDOS", margin + 2, currentY + 6);
  doc.setTextColor(branco[0], branco[1], branco[2]);
  doc.setFontSize(20);
  doc.text(stats.total.toString(), margin + 2, currentY + 16);
  
  // Card 2 - Campo (Amarelo)
  const card2X = margin + cardWidth + cardSpacing;
  doc.setFillColor(amarelo[0], amarelo[1], amarelo[2]);
  doc.roundedRect(card2X, currentY, cardWidth, cardHeight, 3, 3, 'F');
  doc.setTextColor(verdeEscuro[0], verdeEscuro[1], verdeEscuro[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text("🌾 CAMPO", card2X + 2, currentY + 6);
  doc.setFontSize(20);
  doc.text(stats.campo.toString(), card2X + 2, currentY + 16);
  
  // Card 3 - Pátio (Verde Claro)
  const card3X = card2X + cardWidth + cardSpacing;
  doc.setFillColor(verde[0], verde[1], verde[2]);
  doc.roundedRect(card3X, currentY, cardWidth, cardHeight, 3, 3, 'F');
  doc.setTextColor(branco[0], branco[1], branco[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text("🏭 PÁTIO", card3X + 2, currentY + 6);
  doc.setFontSize(20);
  doc.text(stats.patio.toString(), card3X + 2, currentY + 16);
  
  // Card 4 - Beneficiado (Verde escuro com acento amarelo)
  const card4X = card3X + cardWidth + cardSpacing;
  doc.setFillColor(verdeEscuro[0], verdeEscuro[1], verdeEscuro[2]);
  doc.roundedRect(card4X, currentY, cardWidth, cardHeight, 3, 3, 'F');
  doc.setFillColor(amarelo[0], amarelo[1], amarelo[2]);
  doc.roundedRect(card4X, currentY, cardWidth, 5, 3, 3, 'F');
  
  doc.setTextColor(branco[0], branco[1], branco[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text("✅ BENEFICIADO", card4X + 2, currentY + 11);
  doc.setFontSize(20);
  doc.text(stats.beneficiado.toString(), card4X + 2, currentY + 19);
  
  currentY += cardHeight + 8;
  
  // ==================== GRÁFICO DE DISTRIBUIÇÃO ====================
  if (stats.total > 0) {
    // Box do gráfico
    const graphBoxHeight = 40;
    doc.setFillColor(branco[0], branco[1], branco[2]);
    doc.roundedRect(margin, currentY, contentWidth, graphBoxHeight, 3, 3, 'F');
    doc.setDrawColor(cinza[0], cinza[1], cinza[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, currentY, contentWidth, graphBoxHeight, 3, 3, 'S');
    
    // Título do gráfico
    doc.setTextColor(verdeEscuro[0], verdeEscuro[1], verdeEscuro[2]);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text("📊 Distribuição por Status", margin + 3, currentY + 7);
    
    // Gráfico de pizza simplificado (retângulos coloridos com percentuais)
    const graphY = currentY + 12;
    const graphWidth = contentWidth / 2 - 10;
    const pieX = margin + 5;
    
    // Calcular percentuais
    const campoPercent = ((stats.campo / stats.total) * 100).toFixed(1);
    const patioPercent = ((stats.patio / stats.total) * 100).toFixed(1);
    const beneficiadoPercent = ((stats.beneficiado / stats.total) * 100).toFixed(1);
    
    // Desenhar barras horizontais
    const barHeight = 7;
    const barSpacing = 2;
    const maxBarWidth = graphWidth;
    
    // Barra Campo
    const campoWidth = (stats.campo / stats.total) * maxBarWidth;
    doc.setFillColor(amarelo[0], amarelo[1], amarelo[2]);
    doc.roundedRect(pieX, graphY, campoWidth > 0 ? campoWidth : 1, barHeight, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setTextColor(verdeEscuro[0], verdeEscuro[1], verdeEscuro[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(`Campo: ${stats.campo} (${campoPercent}%)`, pieX + 2, graphY + 5);
    
    // Barra Pátio
    const patioY = graphY + barHeight + barSpacing;
    const patioWidth = (stats.patio / stats.total) * maxBarWidth;
    doc.setFillColor(verde[0], verde[1], verde[2]);
    doc.roundedRect(pieX, patioY, patioWidth > 0 ? patioWidth : 1, barHeight, 2, 2, 'F');
    doc.setTextColor(branco[0], branco[1], branco[2]);
    doc.text(`Pátio: ${stats.patio} (${patioPercent}%)`, pieX + 2, patioY + 5);
    
    // Barra Beneficiado
    const beneficiadoY = patioY + barHeight + barSpacing;
    const beneficiadoWidth = (stats.beneficiado / stats.total) * maxBarWidth;
    doc.setFillColor(verdeEscuro[0], verdeEscuro[1], verdeEscuro[2]);
    doc.roundedRect(pieX, beneficiadoY, beneficiadoWidth > 0 ? beneficiadoWidth : 1, barHeight, 2, 2, 'F');
    doc.setTextColor(branco[0], branco[1], branco[2]);
    doc.text(`Beneficiado: ${stats.beneficiado} (${beneficiadoPercent}%)`, pieX + 2, beneficiadoY + 5);
    
    // Gráfico de pizza visual (lado direito)
    const pieRadius = 15;
    const pieCenterX = margin + contentWidth - 50;
    const pieCenterY = currentY + 23;
    
    // Desenhar pizza
    let startAngle = -90; // Começa no topo
    
    if (stats.campo > 0) {
      const campoAngle = (stats.campo / stats.total) * 360;
      doc.setFillColor(amarelo[0], amarelo[1], amarelo[2]);
      drawPieSlice(doc, pieCenterX, pieCenterY, pieRadius, startAngle, startAngle + campoAngle);
      startAngle += campoAngle;
    }
    
    if (stats.patio > 0) {
      const patioAngle = (stats.patio / stats.total) * 360;
      doc.setFillColor(verde[0], verde[1], verde[2]);
      drawPieSlice(doc, pieCenterX, pieCenterY, pieRadius, startAngle, startAngle + patioAngle);
      startAngle += patioAngle;
    }
    
    if (stats.beneficiado > 0) {
      const beneficiadoAngle = (stats.beneficiado / stats.total) * 360;
      doc.setFillColor(verdeEscuro[0], verdeEscuro[1], verdeEscuro[2]);
      drawPieSlice(doc, pieCenterX, pieCenterY, pieRadius, startAngle, startAngle + beneficiadoAngle);
    }
    
    // Borda do círculo
    doc.setDrawColor(branco[0], branco[1], branco[2]);
    doc.setLineWidth(1);
    doc.circle(pieCenterX, pieCenterY, pieRadius, 'S');
    
    currentY += graphBoxHeight + 8;
  }
  
  // ==================== DADOS IMPORTANTES ====================
  // Agrupar por talhão
  const talhaoStats = new Map<string, { total: number; campo: number; patio: number; beneficiado: number }>();
  
  filteredBales.forEach(bale => {
    const talhao = bale.talhao || "Sem Talhão";
    if (!talhaoStats.has(talhao)) {
      talhaoStats.set(talhao, { total: 0, campo: 0, patio: 0, beneficiado: 0 });
    }
    const stat = talhaoStats.get(talhao)!;
    stat.total++;
    if (bale.status === 'campo') stat.campo++;
    else if (bale.status === 'patio') stat.patio++;
    else if (bale.status === 'beneficiado') stat.beneficiado++;
  });
  
  // Box de resumo por talhão
  if (talhaoStats.size > 0 && talhaoStats.size <= 10) {
    const boxHeight = Math.min(6 + (talhaoStats.size * 6), 35);
    doc.setFillColor(cinzaClaro[0], cinzaClaro[1], cinzaClaro[2]);
    doc.roundedRect(margin, currentY, contentWidth, boxHeight, 3, 3, 'F');
    
    doc.setTextColor(verdeEscuro[0], verdeEscuro[1], verdeEscuro[2]);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("📍 Resumo por Talhão", margin + 3, currentY + 5);
    
    let talhaoY = currentY + 11;
    let col = 0;
    const colWidth = contentWidth / 3;
    
    Array.from(talhaoStats.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 9)
      .forEach(([talhao, stat], index) => {
        const x = margin + 3 + (col * colWidth);
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(verdeEscuro[0], verdeEscuro[1], verdeEscuro[2]);
        doc.text(`${talhao}: ${stat.total}`, x, talhaoY);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(cinza[0], cinza[1], cinza[2]);
        doc.text(`(C:${stat.campo} P:${stat.patio} B:${stat.beneficiado})`, x + 15, talhaoY);
        
        col++;
        if (col >= 3) {
          col = 0;
          talhaoY += 6;
        }
      });
    
    currentY += boxHeight + 8;
  }
  
  // ==================== TABELA DE FARDOS ====================
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(verdeEscuro[0], verdeEscuro[1], verdeEscuro[2]);
  doc.text("📋 Detalhamento dos Fardos", margin, currentY);
  currentY += 2;
  
  const tableData = filteredBales.slice(0, 50).map(bale => [
    bale.numero?.toString() || "-",
    bale.talhao || "-",
    bale.id.substring(0, 25) + "...",
    bale.status,
    bale.safra || "-",
    format(bale.createdAt, "dd/MM/yy", { locale: ptBR }),
  ]);
  
  autoTable(doc, {
    startY: currentY,
    head: [["Nº", "Talhão", "QR Code", "Status", "Safra", "Cadastro"]],
    body: tableData,
    theme: "grid",
    headStyles: { 
      fillColor: [verdeEscuro[0], verdeEscuro[1], verdeEscuro[2]],
      textColor: [amareloClaro[0], amareloClaro[1], amareloClaro[2]],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
    },
    styles: { 
      fontSize: 8,
      cellPadding: 2.5,
      lineColor: [verde[0], verde[1], verde[2]],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 22, halign: 'center' },
      2: { cellWidth: 95 },
      3: { cellWidth: 28, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 24, halign: 'center' },
    },
    alternateRowStyles: {
      fillColor: [cinzaClaro[0], cinzaClaro[1], cinzaClaro[2]],
    },
    margin: { left: margin, right: margin },
    didParseCell: function(data) {
      if (data.column.index === 3 && data.cell.section === 'body') {
        const status = data.cell.raw as string;
        if (status === 'campo') {
          data.cell.styles.fillColor = [amarelo[0], amarelo[1], amarelo[2]];
          data.cell.styles.textColor = [verdeEscuro[0], verdeEscuro[1], verdeEscuro[2]];
        } else if (status === 'patio') {
          data.cell.styles.fillColor = [verde[0], verde[1], verde[2]];
          data.cell.styles.textColor = [branco[0], branco[1], branco[2]];
        } else if (status === 'beneficiado') {
          data.cell.styles.fillColor = [verdeEscuro[0], verdeEscuro[1], verdeEscuro[2]];
          data.cell.styles.textColor = [branco[0], branco[1], branco[2]];
        }
      }
    }
  });
  
  // Aviso se houver mais fardos
  if (filteredBales.length > 50) {
    const finalY = (doc as any).lastAutoTable.finalY + 5;
    doc.setFontSize(8);
    doc.setTextColor(cinza[0], cinza[1], cinza[2]);
    doc.setFont('helvetica', 'italic');
    doc.text(`⚠️ Mostrando 50 de ${filteredBales.length} fardos. Gere um relatório Excel para ver todos.`, margin, finalY);
  }
  
  // ==================== RODAPÉ ====================
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Barra verde
    doc.setFillColor(verdeEscuro[0], verdeEscuro[1], verdeEscuro[2]);
    doc.rect(0, pageHeight - 8, pageWidth, 8, 'F');
    
    // Barra amarela
    doc.setFillColor(amarelo[0], amarelo[1], amarelo[2]);
    doc.rect(0, pageHeight - 8, pageWidth, 2, 'F');
    
    // Texto do rodapé
    doc.setTextColor(branco[0], branco[1], branco[2]);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text("🌱 Grupo Progresso", margin, pageHeight - 3);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text("Sistema de Rastreabilidade de Algodão", 60, pageHeight - 3);
    
    doc.setFont('helvetica', 'bold');
    doc.text(`Página ${i}/${pageCount}`, pageWidth - margin, pageHeight - 3, { align: 'right' });
  }
  
  return Buffer.from(doc.output("arraybuffer"));
}

// Função auxiliar para desenhar fatia de pizza
function drawPieSlice(doc: jsPDF, centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number) {
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;
  
  doc.setLineWidth(0.5);
  doc.setDrawColor(255, 255, 255);
  
  const x1 = centerX + radius * Math.cos(startRad);
  const y1 = centerY + radius * Math.sin(startRad);
  const x2 = centerX + radius * Math.cos(endRad);
  const y2 = centerY + radius * Math.sin(endRad);
  
  // Criar path para a fatia
  const path = `M ${centerX} ${centerY} L ${x1} ${y1} `;
  
  // Adicionar arco
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  const arcPath = `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  
  // Desenhar usando lines (aproximação)
  const steps = 20;
  const angleStep = (endAngle - startAngle) / steps;
  
  for (let i = 0; i <= steps; i++) {
    const angle = startAngle + (angleStep * i);
    const rad = (angle * Math.PI) / 180;
    const x = centerX + radius * Math.cos(rad);
    const y = centerY + radius * Math.sin(rad);
    
    if (i === 0) {
      doc.line(centerX, centerY, x, y);
    } else {
      const prevAngle = startAngle + (angleStep * (i - 1));
      const prevRad = (prevAngle * Math.PI) / 180;
      const prevX = centerX + radius * Math.cos(prevRad);
      const prevY = centerY + radius * Math.sin(prevRad);
      doc.line(prevX, prevY, x, y);
    }
  }
  
  // Linha de volta ao centro
  const finalRad = (endAngle * Math.PI) / 180;
  const finalX = centerX + radius * Math.cos(finalRad);
  const finalY = centerY + radius * Math.sin(finalRad);
  doc.line(finalX, finalY, centerX, centerY);
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
    "Safra": bale.safra,
    "ID/QR Code": bale.id,
    "Status": bale.status,
    "Data Cadastro": format(bale.createdAt, "dd/MM/yyyy HH:mm", { locale: ptBR }),
    "Última Atualização": format(bale.updatedAt, "dd/MM/yyyy HH:mm", { locale: ptBR }),
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
