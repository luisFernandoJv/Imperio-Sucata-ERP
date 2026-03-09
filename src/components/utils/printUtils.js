// Utilitários para exportação e impressão de relatórios profissionais - Versão Sênior
// Focado em: Acessibilidade, Design Moderno e Robustez de Dados

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const COLORS = {
  primary: [46, 125, 50], // Verde Material Design
  secondary: [52, 73, 94], // Azul Slate
  success: [34, 197, 94], // Verde Sucesso
  danger: [239, 68, 68], // Vermelho Erro
  info: [59, 130, 246], // Azul Info
  light: [248, 249, 250], // Fundo Cinza Claro
  dark: [31, 41, 55], // Texto Escuro
  accent: [99, 102, 241], // Indigo Accent
};

const FONTS = {
  title: 22,
  subtitle: 14,
  heading: 12,
  body: 10,
  small: 9,
  tiny: 8,
};

/**
 * Formata moeda para Real Brasileiro
 */
const formatCurrency = (value) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
};

/**
 * Função para exportar dados para CSV com suporte a encoding e cabeçalhos robustos
 */
export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) {
    console.warn("Nenhum dado para exportar");
    return;
  }

  const headers = [
    "Data",
    "Tipo",
    "Material",
    "Quantidade (kg)",
    "Preço/kg (R$)",
    "Valor Total (R$)",
    "Cliente/Fornecedor",
    "Observações",
  ];

  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      [
        format(new Date(row.data), "dd/MM/yyyy"),
        row.tipo === "compra" ? "Compra" : "Venda",
        row.material,
        row.quantidade.toFixed(2),
        row.precoUnitario || row.preco || 0,
        row.valorTotal.toFixed(2),
        `"${row.vendedor || row.cliente || row.clienteNome || "N/A"}"`,
        `"${row.observacoes || ""}"`,
      ].join(","),
    ),
  ].join("\n");

  const blob = new Blob(["\ufeff" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Gera PDF profissional com layout moderno e suporte a dados de clientes
 */
export const generateProfessionalPDF = async (transactions, options = {}) => {
  const { filters = {}, clientData = null, observations = "" } = options;

  try {
    const { jsPDF } = await import("jspdf");
    await import("jspdf-autotable");

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // --- CABEÇALHO PROFISSIONAL ---
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, pageWidth, 45, "F");

    // Linha de acento inferior
    doc.setFillColor(...COLORS.accent);
    doc.rect(0, 45, pageWidth, 2, "F");

    // Título da Empresa
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FONTS.title);
    doc.text("IMPÉRIO SUCATA", pageWidth / 2, 18, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(FONTS.body);
    doc.text("Excelência em Gestão de Reciclagem", pageWidth / 2, 26, {
      align: "center",
    });

    // Título do Relatório
    doc.setFontSize(FONTS.subtitle);
    doc.text("RELATÓRIO DE MOVIMENTAÇÃO", pageWidth / 2, 36, {
      align: "center",
    });

    let yPos = 55;

    // --- INFORMAÇÕES DO CLIENTE (Se disponível) ---
    if (clientData) {
      doc.setTextColor(...COLORS.primary);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(FONTS.heading);
      doc.text("DADOS DO CLIENTE", 20, yPos);
      yPos += 8;

      doc.setDrawColor(...COLORS.primary);
      doc.setLineWidth(0.5);
      doc.setFillColor(252, 252, 252);
      doc.rect(20, yPos, pageWidth - 40, 25, "FD");

      doc.setTextColor(...COLORS.dark);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(FONTS.body);

      doc.setFont("helvetica", "bold");
      doc.text("Nome:", 25, yPos + 8);
      doc.setFont("helvetica", "normal");
      doc.text(clientData.nome || "N/A", 40, yPos + 8);

      if (clientData.telefone) {
        doc.setFont("helvetica", "bold");
        doc.text("Tel:", 25, yPos + 16);
        doc.setFont("helvetica", "normal");
        doc.text(clientData.telefone, 40, yPos + 16);
      }

      if (clientData.cpfCnpj) {
        doc.setFont("helvetica", "bold");
        doc.text("CPF/CNPJ:", pageWidth / 2, yPos + 8);
        doc.setFont("helvetica", "normal");
        doc.text(clientData.cpfCnpj, pageWidth / 2 + 25, yPos + 8);
      }

      yPos += 35;
    }

    // --- FILTROS E METADADOS ---
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(FONTS.small);

    const periodText = `Período: ${filters.startDate ? format(new Date(filters.startDate), "dd/MM/yyyy") : "Início"} até ${filters.endDate ? format(new Date(filters.endDate), "dd/MM/yyyy") : "Hoje"}`;
    doc.text(periodText, 20, yPos);

    doc.text(
      `Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
      pageWidth - 20,
      yPos,
      { align: "right" },
    );
    yPos += 10;

    // --- RESUMO FINANCEIRO (BOXES MODERNOS) ---
    const totalVendas = transactions
      .filter((t) => t.tipo === "venda")
      .reduce((sum, t) => sum + (t.valorTotal || 0), 0);
    const totalCompras = transactions
      .filter((t) => t.tipo === "compra")
      .reduce((sum, t) => sum + (t.valorTotal || 0), 0);
    const totalDespesas = transactions
      .filter((t) => t.tipo === "despesa")
      .reduce((sum, t) => sum + (t.valorTotal || 0), 0);
    const lucro = totalVendas - totalCompras - totalDespesas;

    const boxWidth = (pageWidth - 50) / 4;
    const boxes = [
      { label: "VENDAS", value: totalVendas, color: COLORS.success },
      { label: "COMPRAS", value: totalCompras, color: COLORS.info },
      { label: "DESPESAS", value: totalDespesas, color: COLORS.danger },
      {
        label: "LUCRO",
        value: lucro,
        color: lucro >= 0 ? COLORS.success : COLORS.danger,
      },
    ];

    boxes.forEach((box, i) => {
      const x = 20 + i * (boxWidth + 3.3);
      doc.setFillColor(...box.color);
      doc.rect(x, yPos, boxWidth, 20, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(FONTS.tiny);
      doc.setFont("helvetica", "bold");
      doc.text(box.label, x + boxWidth / 2, yPos + 6, { align: "center" });

      doc.setFontSize(FONTS.small);
      doc.text(formatCurrency(box.value), x + boxWidth / 2, yPos + 14, {
        align: "center",
      });
    });

    yPos += 30;

    // --- TABELA DE TRANSAÇÕES ROBUSTA ---
    const tableData = transactions.map((t) => [
      format(new Date(t.data), "dd/MM/yy"),
      t.tipo.toUpperCase(),
      t.material || "DESPESA",
      `${(t.quantidade || 0).toFixed(1)} kg`,
      formatCurrency(t.precoUnitario || t.preco || 0),
      formatCurrency(t.valorTotal || 0),
      t.vendedor || t.clienteNome || "N/A",
    ]);

    doc.autoTable({
      startY: yPos,
      head: [
        [
          "Data",
          "Tipo",
          "Material",
          "Qtd",
          "Preço/kg",
          "Total",
          "Cliente/Fornecedor",
        ],
      ],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: COLORS.primary,
        textColor: 255,
        fontSize: FONTS.small,
        fontStyle: "bold",
        halign: "center",
      },
      styles: {
        fontSize: FONTS.tiny,
        cellPadding: 3,
        textColor: COLORS.dark,
        lineColor: [230, 230, 230],
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 20 },
        1: { halign: "center", cellWidth: 18 },
        2: { cellWidth: 30 },
        3: { halign: "right", cellWidth: 18 },
        4: { halign: "right", cellWidth: 25 },
        5: { halign: "right", cellWidth: 25, fontStyle: "bold" },
        6: { cellWidth: 35 },
      },
      alternateRowStyles: {
        fillColor: COLORS.light,
      },
      didParseCell: (data) => {
        if (data.column.index === 1 && data.section === "body") {
          const type = data.cell.text[0];
          if (type === "VENDA") data.cell.styles.textColor = COLORS.success;
          if (type === "COMPRA") data.cell.styles.textColor = COLORS.info;
          if (type === "DESPESA") data.cell.styles.textColor = COLORS.danger;
        }
      },
    });

    yPos = doc.lastAutoTable.finalY + 15;

    // --- OBSERVAÇÕES ---
    if (observations) {
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = 20;
      }
      doc.setTextColor(...COLORS.primary);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(FONTS.heading);
      doc.text("OBSERVAÇÕES", 20, yPos);
      yPos += 8;

      doc.setTextColor(...COLORS.dark);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(FONTS.body);
      const splitObs = doc.splitTextToSize(observations, pageWidth - 40);
      doc.text(splitObs, 20, yPos);
    }

    // --- RODAPÉ ---
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(FONTS.tiny);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Página ${i} de ${pageCount} | Império Sucata - Sistema de Gestão Profissional`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" },
      );
    }

    const fileName = `relatorio_imperio_${format(new Date(), "dd-MM-yyyy_HHmm")}.pdf`;
    doc.save(fileName);
    return true;
  } catch (error) {
    console.error("Erro sênior ao gerar PDF:", error);
    throw error;
  }
};

/**
 * Calcula estatísticas avançadas para o Dashboard e Relatórios
 */
export const calculateReportStats = (transactions) => {
  const stats = {
    totalTransactions: transactions.length,
    totalSales: 0,
    totalPurchases: 0,
    totalExpenses: 0,
    totalProfit: 0,
    totalWeight: 0,
    materialBreakdown: {},
    dailyBreakdown: {},
    paymentBreakdown: {},
  };

  transactions.forEach((t) => {
    const date = format(new Date(t.data), "dd/MM/yyyy");
    const val = t.valorTotal || 0;
    const weight = t.quantidade || 0;

    if (t.tipo === "venda") stats.totalSales += val;
    else if (t.tipo === "compra") stats.totalPurchases += val;
    else if (t.tipo === "despesa") stats.totalExpenses += val;

    stats.totalWeight += weight;

    // Breakdown por material
    const matName = t.material || "DESPESA";
    if (!stats.materialBreakdown[matName]) {
      stats.materialBreakdown[matName] = {
        sales: 0,
        purchases: 0,
        weight: 0,
        count: 0,
      };
    }
    const mat = stats.materialBreakdown[matName];
    if (t.tipo === "venda") mat.sales += val;
    else if (t.tipo === "compra") mat.purchases += val;
    mat.weight += weight;
    mat.count++;

    // Breakdown diário
    if (!stats.dailyBreakdown[date]) {
      stats.dailyBreakdown[date] = {
        sales: 0,
        purchases: 0,
        expenses: 0,
        count: 0,
      };
    }
    const daily = stats.dailyBreakdown[date];
    if (t.tipo === "venda") daily.sales += val;
    else if (t.tipo === "compra") daily.purchases += val;
    else if (t.tipo === "despesa") daily.expenses += val;
    daily.count++;

    // Breakdown por pagamento
    const payMethod = t.formaPagamento || "N/I";
    if (!stats.paymentBreakdown[payMethod])
      stats.paymentBreakdown[payMethod] = 0;
    stats.paymentBreakdown[payMethod] += val;
  });

  stats.totalProfit =
    stats.totalSales - stats.totalPurchases - stats.totalExpenses;

  return stats;
};
