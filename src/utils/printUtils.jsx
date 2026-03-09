import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency, formatDate, getMaterialName } from "./reportUtils";

const PDF_CONFIG = {
  MARGIN: { TOP: 20, LEFT: 15, RIGHT: 15, BOTTOM: 20 },
  FONT: { SIZE: { LARGE: 18, MEDIUM: 12, SMALL: 9, XSMALL: 8, TINY: 7 } },
  COLORS: {
    PRIMARY: [44, 62, 80], // Azul Slate (Robusto)
    SECONDARY: [127, 140, 141],
    SUCCESS: [39, 174, 96],
    DANGER: [192, 57, 43],
    INFO: [41, 128, 185],
    LIGHT_BG: [248, 249, 250],
    BORDER: [220, 220, 220],
  },
};

const addHeader = (
  doc,
  title,
  period,
  totalTransactions,
  clientData = null,
) => {
  const pageWidth = doc.internal.pageSize.width;

  // Título e Empresa
  doc.setFontSize(PDF_CONFIG.FONT.SIZE.LARGE);
  doc.setTextColor(...PDF_CONFIG.COLORS.PRIMARY);
  doc.setFont("helvetica", "bold");
  doc.text("IMPÉRIO SUCATA", PDF_CONFIG.MARGIN.LEFT, PDF_CONFIG.MARGIN.TOP);

  doc.setFontSize(PDF_CONFIG.FONT.SIZE.MEDIUM);
  doc.setFont("helvetica", "normal");
  doc.text(
    title.toUpperCase(),
    PDF_CONFIG.MARGIN.LEFT,
    PDF_CONFIG.MARGIN.TOP + 10,
  );

  // Info à direita
  doc.setFontSize(PDF_CONFIG.FONT.SIZE.XSMALL);
  doc.setTextColor(...PDF_CONFIG.COLORS.SECONDARY);
  doc.text(
    `Período: ${period}`,
    pageWidth - PDF_CONFIG.MARGIN.RIGHT,
    PDF_CONFIG.MARGIN.TOP,
    { align: "right" },
  );
  doc.text(
    `Gerado: ${new Date().toLocaleString("pt-BR")}`,
    pageWidth - PDF_CONFIG.MARGIN.RIGHT,
    PDF_CONFIG.MARGIN.TOP + 5,
    { align: "right" },
  );
  doc.text(
    `Transações: ${totalTransactions}`,
    pageWidth - PDF_CONFIG.MARGIN.RIGHT,
    PDF_CONFIG.MARGIN.TOP + 10,
    { align: "right" },
  );

  let yPos = PDF_CONFIG.MARGIN.TOP + 18;

  // Seção do Cliente (se disponível)
  if (clientData && clientData.nome) {
    doc.setFillColor(...PDF_CONFIG.COLORS.LIGHT_BG);
    doc.rect(
      PDF_CONFIG.MARGIN.LEFT,
      yPos,
      pageWidth - (PDF_CONFIG.MARGIN.LEFT + PDF_CONFIG.MARGIN.RIGHT),
      20,
      "F",
    );

    doc.setFontSize(PDF_CONFIG.FONT.SIZE.XSMALL);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PDF_CONFIG.COLORS.PRIMARY);
    doc.text("CLIENTE / PARCEIRO", PDF_CONFIG.MARGIN.LEFT + 5, yPos + 6);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text(`Nome: ${clientData.nome}`, PDF_CONFIG.MARGIN.LEFT + 5, yPos + 12);
    if (clientData.cpfCnpj)
      doc.text(
        `CPF/CNPJ: ${clientData.cpfCnpj}`,
        PDF_CONFIG.MARGIN.LEFT + 5,
        yPos + 17,
      );
    if (clientData.telefone)
      doc.text(`Telefone: ${clientData.telefone}`, pageWidth / 2, yPos + 12);

    yPos += 28;
  } else {
    doc.setDrawColor(...PDF_CONFIG.COLORS.BORDER);
    doc.line(
      PDF_CONFIG.MARGIN.LEFT,
      yPos,
      pageWidth - PDF_CONFIG.MARGIN.RIGHT,
      yPos,
    );
    yPos += 10;
  }

  return yPos;
};

const addFooter = (doc) => {
  const pageCount = doc.internal.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(PDF_CONFIG.FONT.SIZE.TINY);
    doc.setTextColor(...PDF_CONFIG.COLORS.SECONDARY);
    doc.line(
      PDF_CONFIG.MARGIN.LEFT,
      pageHeight - 15,
      pageWidth - PDF_CONFIG.MARGIN.RIGHT,
      pageHeight - 15,
    );
    doc.text(
      "Império Sucata - Gestão Profissional de Reciclagem",
      PDF_CONFIG.MARGIN.LEFT,
      pageHeight - 10,
    );
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth - PDF_CONFIG.MARGIN.RIGHT,
      pageHeight - 10,
      { align: "right" },
    );
  }
};

export const generateAdvancedPDF = async (reportData, options = {}) => {
  const {
    title = "RELATÓRIO GERENCIAL",
    includeSummary = true,
    includeDetails = true,
    clientData = null,
  } = options;

  try {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const period = `${reportData.period.start} - ${reportData.period.end}`;
    const totalTransactions = reportData.transactions?.length || 0;

    let yPos = addHeader(doc, title, period, totalTransactions, clientData);

    // KPIs / Resumo
    if (includeSummary && reportData.stats) {
      const stats = reportData.stats;
      const kpis = [
        {
          label: "RECEITA",
          val: formatCurrency(stats.totalSales || 0),
          color: PDF_CONFIG.COLORS.SUCCESS,
        },
        {
          label: "COMPRAS",
          val: formatCurrency(stats.totalPurchases || 0),
          color: PDF_CONFIG.COLORS.INFO,
        },
        {
          label: "DESPESAS",
          val: formatCurrency(stats.totalExpenses || 0),
          color: PDF_CONFIG.COLORS.DANGER,
        },
        {
          label: "LUCRO",
          val: formatCurrency(stats.totalProfit || 0),
          color:
            stats.totalProfit >= 0
              ? PDF_CONFIG.COLORS.SUCCESS
              : PDF_CONFIG.COLORS.DANGER,
        },
      ];

      const kpiWidth =
        (doc.internal.pageSize.width -
          (PDF_CONFIG.MARGIN.LEFT + PDF_CONFIG.MARGIN.RIGHT) -
          10) /
        4;
      kpis.forEach((k, i) => {
        const x = PDF_CONFIG.MARGIN.LEFT + i * (kpiWidth + 3.3);
        doc.setFillColor(...PDF_CONFIG.COLORS.LIGHT_BG);
        doc.roundedRect(x, yPos, kpiWidth, 15, 2, 2, "F");
        doc.setFontSize(PDF_CONFIG.FONT.SIZE.TINY);
        doc.setTextColor(...PDF_CONFIG.COLORS.SECONDARY);
        doc.text(k.label, x + kpiWidth / 2, yPos + 5, { align: "center" });
        doc.setFontSize(PDF_CONFIG.FONT.SIZE.SMALL);
        doc.setTextColor(...k.color);
        doc.setFont(undefined, "bold");
        doc.text(k.val, x + kpiWidth / 2, yPos + 11, { align: "center" });
      });
      yPos += 25;
    }

    // Tabela de Transações
    if (includeDetails && reportData.transactions?.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [["Data", "Tipo", "Material", "Qtd", "Valor", "Pessoa"]],
        body: reportData.transactions.map((t) => [
          formatDate(t.data),
          t.tipo.toUpperCase(),
          getMaterialName(t.material),
          `${(t.quantidade || 0).toFixed(2)} kg`,
          formatCurrency(t.valorTotal),
          t.cliente || t.vendedor || t.fornecedor || "-",
        ]),
        theme: "grid",
        headStyles: {
          fillColor: PDF_CONFIG.COLORS.PRIMARY,
          fontSize: PDF_CONFIG.FONT.SIZE.XSMALL,
        },
        styles: { fontSize: PDF_CONFIG.FONT.SIZE.XSMALL },
        columnStyles: { 4: { halign: "right", fontStyle: "bold" } },
      });
    }

    addFooter(doc);
    doc.save(
      `${title.toLowerCase().replace(/\s+/g, "_")}_${new Date().getTime()}.pdf`,
    );
    return true;
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    return false;
  }
};
