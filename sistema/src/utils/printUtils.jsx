/**
 * printUtils.js — Relatórios PDF Profissionais
 * Império Sucata · Design A4 moderno e organizado
 */

import { format } from "date-fns";

/* ── Design Tokens ───────────────────────────────────────── */
const C = {
  navy: [15, 23, 42], // fundo do header
  blue: [37, 99, 235], // acento / destaques
  slate: [51, 65, 85], // texto principal
  muted: [100, 116, 139], // texto secundário
  light: [148, 163, 184], // texto sutil / rodapé
  hairline: [226, 232, 240], // borda fina
  bg: [248, 250, 252], // fundo de seção

  green: [16, 185, 129],
  greenDark: [6, 95, 70],
  greenBg: [236, 253, 245],

  red: [239, 68, 68],
  redDark: [127, 29, 29],
  redBg: [254, 242, 242],

  blueDark: [30, 64, 175],
  blueBg: [239, 246, 255],

  amber: [245, 158, 11],
  amberDark: [120, 53, 15],

  white: [255, 255, 255],
};

const F = { xl: 22, lg: 14, md: 11, sm: 9, xs: 8, xxs: 7 };
const ML = 14; // margin left
const MR = 14; // margin right

const pw = (doc) => doc.internal.pageSize.getWidth();
const ph = (doc) => doc.internal.pageSize.getHeight();
const W = (doc) => pw(doc) - ML - MR;

const fmtR = (v) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(v) || 0);

const fmtDate = (d) => {
  try {
    return format(new Date(d), "dd/MM/yyyy");
  } catch {
    return "—";
  }
};

/* ── Cabeçalho navy com acento azul ──────────────────────── */
function header(doc, title, subtitle = "") {
  const w = pw(doc);

  // Faixa escura
  doc.setFillColor(...C.navy);
  doc.rect(0, 0, w, 36, "F");

  // Linha de acento
  doc.setFillColor(...C.blue);
  doc.rect(0, 36, w, 2.5, "F");

  // Logo / empresa
  doc.setTextColor(...C.white);
  doc.setFontSize(F.xl);
  doc.setFont("helvetica", "bold");
  doc.text("IMPÉRIO SUCATA", ML, 16);

  doc.setFontSize(F.xs);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.light);
  doc.text("Gestão de Reciclagem e Resíduos", ML, 23);

  // Título do relatório (direita)
  doc.setFontSize(F.md);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.white);
  doc.text(title.toUpperCase(), w - MR, 15, { align: "right" });

  if (subtitle) {
    doc.setFontSize(F.xs);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.light);
    doc.text(subtitle, w - MR, 22, { align: "right" });
  }

  doc.setFontSize(F.xxs);
  doc.setTextColor(...C.light);
  doc.text(
    `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`,
    w - MR,
    30,
    { align: "right" },
  );

  return 46; // Y disponível após cabeçalho
}

/* ── Rodapé numerado em todas as páginas ─────────────────── */
function footer(doc) {
  const n = doc.internal.getNumberOfPages();
  const w = pw(doc);
  const h = ph(doc);

  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setDrawColor(...C.hairline);
    doc.setLineWidth(0.3);
    doc.line(ML, h - 12, w - MR, h - 12);

    doc.setFontSize(F.xxs);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.light);
    doc.text("Império Sucata — Documento Gerencial de Uso Interno", ML, h - 7);
    doc.text(`Página ${i} de ${n}`, w - MR, h - 7, { align: "right" });
  }
}

/* ── Bloco de cliente ────────────────────────────────────── */
function clientBlock(doc, y, client) {
  if (!client?.nome) return y;

  const bw = W(doc);
  const bh = 20;

  doc.setFillColor(...C.bg);
  doc.rect(ML, y, bw, bh, "F");
  doc.setFillColor(...C.blue);
  doc.rect(ML, y, 3, bh, "F");

  doc.setFontSize(F.xxs);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.muted);
  doc.text("CLIENTE / PARCEIRO", ML + 6, y + 5);

  doc.setFontSize(F.sm);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.slate);
  doc.text(client.nome, ML + 6, y + 11);

  const extras = [];
  if (client.cpfCnpj || client.cpf)
    extras.push(`CPF/CNPJ: ${client.cpfCnpj || client.cpf}`);
  if (client.telefone) extras.push(`Tel: ${client.telefone}`);
  if (extras.length) {
    doc.setFontSize(F.xxs);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.muted);
    doc.text(extras.join("  ·  "), ML + 6, y + 17);
  }

  return y + bh + 6;
}

/* ── Barra de KPIs ───────────────────────────────────────── */
function kpiStrip(doc, y, cards) {
  const gap = 3;
  const n = cards.length;
  const cw = (W(doc) - gap * (n - 1)) / n;
  const ch = 21;

  cards.forEach((c, i) => {
    const x = ML + i * (cw + gap);

    doc.setFillColor(...C.bg);
    doc.rect(x, y, cw, ch, "F");

    // Barra superior colorida
    doc.setFillColor(...(c.bar || C.blue));
    doc.rect(x, y, cw, 2.5, "F");

    // Label
    doc.setFontSize(F.xxs);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.light);
    doc.text(c.label, x + cw / 2, y + 8, { align: "center" });

    // Valor
    doc.setFontSize(F.sm);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...(c.color || C.slate));
    doc.text(c.value, x + cw / 2, y + 16, { align: "center" });
  });

  return y + ch + 8;
}

/* ── Título de seção ─────────────────────────────────────── */
function sectionTitle(doc, y, text) {
  doc.setFontSize(F.xs);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.navy);
  doc.text(text.toUpperCase(), ML, y);

  // Linha decorativa
  doc.setDrawColor(...C.blue);
  doc.setLineWidth(1);
  doc.line(ML, y + 2, ML + 26, y + 2);
  doc.setDrawColor(...C.hairline);
  doc.setLineWidth(0.3);
  doc.line(ML + 26, y + 2, pw(doc) - MR, y + 2);

  return y + 9;
}

/* ── Estilos padrão de tabela ────────────────────────────── */
const TH = {
  fillColor: C.navy,
  textColor: C.white,
  fontStyle: "bold",
  fontSize: F.xxs,
  cellPadding: 3.5,
};

const TS = {
  fontSize: F.xxs,
  cellPadding: 2.5,
  lineColor: C.hairline,
  lineWidth: 0.2,
  textColor: C.slate,
  overflow: "linebreak",
};

const TALT = { fillColor: C.bg };

/* ── CSV ─────────────────────────────────────────────────── */
export const exportToCSV = (data, filename) => {
  if (!data?.length) return;

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

  const rows = data.map((row) =>
    [
      fmtDate(row.data),
      row.tipo === "compra" ? "Compra" : "Venda",
      row.material || "",
      Number(row.quantidade || 0).toFixed(2),
      Number(row.precoUnitario || row.preco || 0).toFixed(2),
      Number(row.valorTotal || 0).toFixed(2),
      `"${row.vendedor || row.cliente || row.clienteNome || ""}"`,
      `"${row.observacoes || ""}"`,
    ].join(","),
  );

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename || "relatorio"}.csv`;
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/* ── PDF principal de movimentação ──────────────────────── */
export const generateProfessionalPDF = async (transactions, options = {}) => {
  const { filters = {}, clientData = null, observations = "" } = options;

  try {
    const { jsPDF } = await import("jspdf");
    await import("jspdf-autotable");

    const doc = new jsPDF({ unit: "mm", format: "a4" });

    const startStr = filters.startDate ? fmtDate(filters.startDate) : "Início";
    const endStr = filters.endDate ? fmtDate(filters.endDate) : "Hoje";
    const sub = `Período: ${startStr} a ${endStr}  ·  ${transactions.length} transações`;

    let y = header(doc, "Relatório de Movimentação", sub);

    if (clientData) y = clientBlock(doc, y, clientData);

    /* KPIs */
    const totalVendas = transactions
      .filter((t) => t.tipo === "venda")
      .reduce((s, t) => s + (Number(t.valorTotal) || 0), 0);
    const totalCompras = transactions
      .filter((t) => t.tipo === "compra")
      .reduce((s, t) => s + (Number(t.valorTotal) || 0), 0);
    const totalDespesas = transactions
      .filter((t) => t.tipo === "despesa")
      .reduce((s, t) => s + (Number(t.valorTotal) || 0), 0);
    const lucro = totalVendas - totalCompras - totalDespesas;

    y = kpiStrip(doc, y, [
      {
        label: "RECEITA (VENDAS)",
        value: fmtR(totalVendas),
        bar: C.green,
        color: C.greenDark,
      },
      {
        label: "VOLUME COMPRAS",
        value: fmtR(totalCompras),
        bar: C.blue,
        color: C.blueDark,
      },
      {
        label: "DESPESAS",
        value: fmtR(totalDespesas),
        bar: C.red,
        color: C.redDark,
      },
      {
        label: "LUCRO LÍQUIDO",
        value: fmtR(lucro),
        bar: lucro >= 0 ? C.green : C.red,
        color: lucro >= 0 ? C.greenDark : C.redDark,
      },
    ]);

    /* Tabela de transações */
    if (transactions.length > 0) {
      y = sectionTitle(
        doc,
        y,
        `Detalhamento (${transactions.length} registros)`,
      );

      const TIPO_COLOR = {
        venda: C.greenDark,
        compra: C.blueDark,
        despesa: C.redDark,
      };
      const TIPO_LABEL = {
        venda: "VENDA",
        compra: "COMPRA",
        despesa: "DESPESA",
      };

      doc.autoTable({
        startY: y,
        margin: { left: ML, right: MR, bottom: 18 },
        head: [
          [
            "Data",
            "Tipo",
            "Material",
            "Qtd (kg)",
            "Preço/kg",
            "Total",
            "Pessoa",
          ],
        ],
        body: transactions.map((t) => {
          const tipo = t.tipo || "outro";
          const color = TIPO_COLOR[tipo] || C.slate;
          return [
            { content: fmtDate(t.data), styles: { halign: "center" } },
            {
              content: TIPO_LABEL[tipo] || tipo.toUpperCase(),
              styles: { fontStyle: "bold", textColor: color },
            },
            t.material || "—",
            {
              content: `${Number(t.quantidade || 0).toFixed(2)} kg`,
              styles: { halign: "right" },
            },
            {
              content: fmtR(t.precoUnitario || t.preco || 0),
              styles: { halign: "right" },
            },
            {
              content: fmtR(t.valorTotal || 0),
              styles: { halign: "right", fontStyle: "bold", textColor: color },
            },
            t.vendedor || t.clienteNome || t.cliente || "—",
          ];
        }),
        foot: [
          [
            {
              content: `${transactions.length} lançamentos`,
              colSpan: 4,
              styles: {
                fontStyle: "bold",
                fillColor: C.navy,
                textColor: C.white,
              },
            },
            { content: "", styles: { fillColor: C.navy } },
            {
              content: fmtR(lucro),
              styles: {
                halign: "right",
                fontStyle: "bold",
                fillColor: C.navy,
                textColor: C.white,
              },
            },
            { content: "", styles: { fillColor: C.navy } },
          ],
        ],
        theme: "grid",
        headStyles: TH,
        styles: TS,
        alternateRowStyles: TALT,
        footStyles: { fillColor: C.navy, textColor: C.white, fontSize: F.xxs },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 18 },
          3: { halign: "right", cellWidth: 18 },
          4: { halign: "right", cellWidth: 22 },
          5: { halign: "right", cellWidth: 22 },
        },
        didDrawPage: (d) => {
          if (d.pageNumber > 1) header(doc, "Relatório de Movimentação", sub);
        },
      });
    }

    /* Observações */
    if (observations) {
      let yObs = doc.lastAutoTable?.finalY + 10 || y;
      if (yObs > ph(doc) - 40) {
        doc.addPage();
        yObs = 20;
      }
      yObs = sectionTitle(doc, yObs, "Observações");
      doc.setFontSize(F.sm);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.slate);
      const lines = doc.splitTextToSize(observations, W(doc));
      doc.text(lines, ML, yObs);
    }

    footer(doc);
    doc.save(`relatorio_imperio_${format(new Date(), "dd-MM-yyyy_HHmm")}.pdf`);
    return true;
  } catch (err) {
    console.error("Erro ao gerar PDF:", err);
    throw err;
  }
};

/* ── Estatísticas para dashboard ─────────────────────────── */
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
    const val = t.valorTotal || 0;
    const weight = t.quantidade || 0;
    const date = fmtDate(t.data);

    if (t.tipo === "venda") stats.totalSales += val;
    else if (t.tipo === "compra") stats.totalPurchases += val;
    else if (t.tipo === "despesa") stats.totalExpenses += val;

    stats.totalWeight += weight;

    const mat = t.material || "DESPESA";
    if (!stats.materialBreakdown[mat])
      stats.materialBreakdown[mat] = {
        sales: 0,
        purchases: 0,
        weight: 0,
        count: 0,
      };
    const m = stats.materialBreakdown[mat];
    if (t.tipo === "venda") m.sales += val;
    else if (t.tipo === "compra") m.purchases += val;
    m.weight += weight;
    m.count++;

    if (!stats.dailyBreakdown[date])
      stats.dailyBreakdown[date] = {
        sales: 0,
        purchases: 0,
        expenses: 0,
        count: 0,
      };
    const d = stats.dailyBreakdown[date];
    if (t.tipo === "venda") d.sales += val;
    else if (t.tipo === "compra") d.purchases += val;
    else if (t.tipo === "despesa") d.expenses += val;
    d.count++;

    const pay = t.formaPagamento || "N/I";
    stats.paymentBreakdown[pay] = (stats.paymentBreakdown[pay] || 0) + val;
  });

  stats.totalProfit =
    stats.totalSales - stats.totalPurchases - stats.totalExpenses;
  return stats;
};
