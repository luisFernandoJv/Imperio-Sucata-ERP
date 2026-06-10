/**
 * reportGenerators.js — Geradores de PDF Profissionais
 * Império Sucata · Design A4 moderno, limpo e organizado
 */

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

/* ── Design Tokens ───────────────────────────────────────── */
const C = {
  navy: [15, 23, 42],
  blue: [37, 99, 235],
  slate: [51, 65, 85],
  muted: [100, 116, 139],
  light: [148, 163, 184],
  hairline: [226, 232, 240],
  bg: [248, 250, 252],
  white: [255, 255, 255],

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
  amberBg: [255, 251, 235],

  purple: [124, 58, 237],
  purpleBg: [245, 243, 255],
};

const F = { xl: 20, lg: 13, md: 10, sm: 8.5, xs: 7.5, xxs: 6.5 };
const ML = 14;
const MR = 14;

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
const fmtDateTime = (d) => {
  try {
    return format(new Date(d), "dd/MM/yyyy HH:mm");
  } catch {
    return "—";
  }
};

/* ── Layout helpers ──────────────────────────────────────── */

function drawHeader(doc, title, subtitle = "") {
  const w = pw(doc);

  // Faixa navy
  doc.setFillColor(...C.navy);
  doc.rect(0, 0, w, 36, "F");

  // Acento azul
  doc.setFillColor(...C.blue);
  doc.rect(0, 36, w, 2.5, "F");

  // Empresa
  doc.setTextColor(...C.white);
  doc.setFontSize(F.xl);
  doc.setFont("helvetica", "bold");
  doc.text("IMPÉRIO SUCATA", ML, 15);

  doc.setFontSize(F.xs);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.light);
  doc.text("Gestão de Reciclagem e Resíduos", ML, 22);

  // Título
  doc.setFontSize(F.lg);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.white);
  doc.text(title.toUpperCase(), w - MR, 14, { align: "right" });

  if (subtitle) {
    doc.setFontSize(F.xs);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.light);
    doc.text(subtitle, w - MR, 21, { align: "right" });
  }

  doc.setFontSize(F.xxs);
  doc.setTextColor(...C.light);
  doc.text(
    `Emitido em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`,
    w - MR,
    29,
    { align: "right" },
  );

  return 46;
}

function drawFooter(doc) {
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
    doc.text(
      "Império Sucata — Documento de uso interno gerado automaticamente",
      ML,
      h - 7,
    );
    doc.text(`Página ${i} de ${n}`, w - MR, h - 7, { align: "right" });
  }
}

function drawSectionTitle(doc, y, text) {
  doc.setFontSize(F.xs);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.navy);
  doc.text(text.toUpperCase(), ML, y);

  doc.setDrawColor(...C.blue);
  doc.setLineWidth(0.9);
  doc.line(ML, y + 2, ML + 26, y + 2);
  doc.setDrawColor(...C.hairline);
  doc.setLineWidth(0.3);
  doc.line(ML + 26, y + 2, pw(doc) - MR, y + 2);

  return y + 9;
}

/* ── KPI strip ───────────────────────────────────────────── */
function drawKPIStrip(doc, y, cards) {
  const gap = 3;
  const n = cards.length;
  const cw = (W(doc) - gap * (n - 1)) / n;
  const ch = 21;

  cards.forEach((c, i) => {
    const x = ML + i * (cw + gap);

    doc.setFillColor(...C.bg);
    doc.rect(x, y, cw, ch, "F");

    doc.setFillColor(...(c.bar || C.blue));
    doc.rect(x, y, cw, 2.5, "F");

    doc.setFontSize(F.xxs);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.light);
    doc.text(c.label, x + cw / 2, y + 8, { align: "center" });

    doc.setFontSize(F.sm);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...(c.color || C.slate));
    doc.text(c.value, x + cw / 2, y + 17, { align: "center" });
  });

  return y + ch + 7;
}

/* ── Tabela padrão ───────────────────────────────────────── */
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
const TF = {
  fillColor: C.navy,
  textColor: C.white,
  fontStyle: "bold",
  fontSize: F.xxs,
};

/* ── Bloco de cliente ────────────────────────────────────── */
function drawClientBlock(doc, y, customer) {
  const w = pw(doc);
  const bw = W(doc);

  // Fundo e borda esquerda azul
  doc.setFillColor(...C.bg);
  doc.rect(ML, y, bw, 26, "F");
  doc.setFillColor(...C.blue);
  doc.rect(ML, y, 3, 26, "F");

  // Inicial do nome (avatar)
  doc.setFillColor(...C.blue);
  doc.circle(ML + 14, y + 13, 8, "F");
  doc.setTextColor(...C.white);
  doc.setFontSize(F.lg);
  doc.setFont("helvetica", "bold");
  doc.text(customer.nome.charAt(0).toUpperCase(), ML + 14, y + 17, {
    align: "center",
  });

  // Nome principal
  doc.setFontSize(F.lg);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.navy);
  doc.text(customer.nome, ML + 28, y + 10);

  // Informações em linha
  const infos = [];
  if (customer.telefone) infos.push(`📞 ${customer.telefone}`);
  if (customer.cpfCnpj || customer.cpf)
    infos.push(`ID: ${customer.cpfCnpj || customer.cpf}`);
  if (customer.email) infos.push(`✉ ${customer.email}`);
  if (customer.endereco) infos.push(`📍 ${customer.endereco}`);

  doc.setFontSize(F.xs);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.muted);
  const infoText = infos.length
    ? infos.join("   ·   ")
    : "Sem informações adicionais";
  doc.text(infoText, ML + 28, y + 18);

  // Tipo / categoria do cliente
  const tipo = customer.tipo || customer.categoria || "Pessoa Física";
  doc.setFontSize(F.xxs);
  doc.setTextColor(...C.light);
  doc.text(tipo.toUpperCase(), ML + 28, y + 23);

  return y + 26 + 7;
}

/* ── Barra de saldo devedor (destaque visual) ────────────── */
function drawSaldoBlock(doc, y, saldo, stats) {
  const w = pw(doc);
  const bw = W(doc);
  const positivo = saldo > 0;
  const bh = 18;

  // Fundo colorido
  doc.setFillColor(...(positivo ? C.redBg : C.greenBg));
  doc.rect(ML, y, bw, bh, "F");

  // Borda esquerda espessa
  doc.setFillColor(...(positivo ? C.red : C.green));
  doc.rect(ML, y, 4, bh, "F");

  // Label
  doc.setFontSize(F.xxs);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.muted);
  doc.text("SALDO DEVEDOR ATUAL", ML + 10, y + 6);

  // Valor grande
  doc.setFontSize(F.lg + 2);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...(positivo ? C.redDark : C.greenDark));
  doc.text(fmtR(saldo), ML + 10, y + 14);

  // Status à direita
  const statusText = positivo
    ? "CLIENTE DEVE"
    : saldo === 0
      ? "SALDO ZERADO"
      : "CRÉDITO DO CLIENTE";
  doc.setFontSize(F.xxs);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...(positivo ? C.redDark : C.greenDark));
  doc.text(statusText, w - MR - 4, y + 6, { align: "right" });

  // Mini resumo
  if (stats) {
    doc.setFontSize(F.xxs);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.muted);
    const resumo = `Entradas: ${fmtR(stats.totalAumento || 0)}   ·   Saídas: ${fmtR(stats.totalDiminuicao || 0)}   ·   ${stats.count || 0} transações`;
    doc.text(resumo, w - MR - 4, y + 13, { align: "right" });
  }

  return y + bh + 7;
}

/* ============================================================
   EXTRATO DE CONTA CORRENTE DO CLIENTE
   Recebe: (customer, transactions, stats?)
   ============================================================ */
export function generateCustomerStatementPDF(customer, transactions, stats) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  /* ── Cabeçalho ── */
  let y = drawHeader(
    doc,
    "Extrato de Conta Corrente",
    customer.nome.length > 30
      ? customer.nome.substring(0, 30) + "…"
      : customer.nome,
  );

  /* ── Bloco do cliente ── */
  y = drawClientBlock(doc, y, customer);

  /* ── Classificador de transações (replicado do componente) ── */
  const classificar = (t) => {
    const valor = Math.abs(Number(t.valorTotal) || 0);
    const obs = (t.observacoes || "").toLowerCase();
    const material = (t.material || "").toLowerCase();
    const forma = (t.formaPagamento || "").toLowerCase();

    const isEmprestimo =
      t.tipo === "despesa" &&
      (t.categoria === "emprestimo" ||
        obs.includes("empréstimo") ||
        material.includes("emprestimo"));
    const isPagamento =
      forma === "pagamento_divida" ||
      material.includes("pagamento") ||
      obs.includes("pagou") ||
      obs.includes("acerto");
    const isVendaPrazo =
      t.tipo === "venda" &&
      (forma === "prazo" ||
        forma === "divida" ||
        obs.includes("marcar") ||
        obs.includes("pendente"));
    const isAbateCompra =
      t.tipo === "compra" &&
      (obs.includes("abater") ||
        obs.includes("descontar") ||
        forma === "abate");

    if (isEmprestimo || isVendaPrazo)
      return {
        impacto: valor,
        rotulo: isEmprestimo ? "Empréstimo" : "Venda a Prazo",
        cor: "amber",
      };
    if (isPagamento || isAbateCompra)
      return {
        impacto: -valor,
        rotulo: isPagamento ? "Pagamento de Dívida" : "Abate em Compra",
        cor: "green",
      };

    return {
      impacto: 0,
      rotulo:
        t.tipo === "venda"
          ? "Venda (Vista)"
          : t.tipo === "compra"
            ? "Compra (Vista)"
            : "Despesa",
      cor: "slate",
    };
  };

  /* ── Calcular stats se não foram passados ── */
  const calcStats =
    stats ||
    (() => {
      let totalAumento = 0,
        totalDiminuicao = 0;
      let totalVendas = 0,
        quantVendas = 0;
      let totalCompras = 0,
        quantCompras = 0;
      let totalEmprestimos = 0,
        quantEmprestimos = 0;

      transactions.forEach((t) => {
        const { impacto } = classificar(t);
        const v = Math.abs(Number(t.valorTotal) || 0);
        if (impacto > 0) totalAumento += impacto;
        if (impacto < 0) totalDiminuicao += Math.abs(impacto);

        const isEmp =
          t.tipo === "despesa" &&
          (t.categoria === "emprestimo" ||
            t.observacoes?.toLowerCase().includes("empréstimo"));
        if (isEmp) {
          totalEmprestimos += v;
          quantEmprestimos++;
        } else if (t.tipo === "venda") {
          totalVendas += v;
          quantVendas++;
        } else if (t.tipo === "compra") {
          totalCompras += v;
          quantCompras++;
        }
      });

      return {
        totalAumento,
        totalDiminuicao,
        saldoDivida: totalAumento - totalDiminuicao,
        totalEmprestimos,
        quantEmprestimos,
        totalVendas,
        quantVendas,
        totalCompras,
        quantCompras,
        count: transactions.length,
      };
    })();

  const saldo =
    calcStats.saldoDivida ?? calcStats.totalAumento - calcStats.totalDiminuicao;

  /* ── Bloco de saldo em destaque ── */
  y = drawSaldoBlock(doc, y, saldo, calcStats);

  /* ── KPIs ── */
  y = drawKPIStrip(doc, y, [
    {
      label: "EMPRÉSTIMOS",
      value: fmtR(calcStats.totalEmprestimos || 0),
      bar: C.amber,
      color: C.amberDark,
    },
    {
      label: "VENDAS",
      value: fmtR(calcStats.totalVendas || 0),
      bar: C.green,
      color: C.greenDark,
    },
    {
      label: "COMPRAS",
      value: fmtR(calcStats.totalCompras || 0),
      bar: C.blue,
      color: C.blueDark,
    },
    {
      label: "PAGAMENTOS",
      value: fmtR(calcStats.totalDiminuicao || 0),
      bar: C.green,
      color: C.greenDark,
    },
    {
      label: "TOTAL TX.",
      value: String(calcStats.count || 0),
      bar: C.navy,
      color: C.slate,
    },
  ]);

  /* ── Tabela: histórico completo com saldo acumulado ── */
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.data) - new Date(b.data),
  );
  let saldoCorrido = 0;

  const LABEL_COLOR = {
    amber: C.amberDark,
    green: C.greenDark,
    slate: C.muted,
    red: C.redDark,
  };

  if (sorted.length > 0) {
    y = drawSectionTitle(
      doc,
      y,
      `Histórico Completo de Movimentações (${sorted.length} registros)`,
    );

    autoTable(doc, {
      startY: y,
      margin: { left: ML, right: MR, bottom: 18 },
      head: [
        [
          "Data/Hora",
          "Tipo",
          "Classificação",
          "Material",
          "Valor (R$)",
          "Saldo Após",
        ],
      ],
      body: sorted.map((t) => {
        const { impacto, rotulo, cor } = classificar(t);
        saldoCorrido += impacto;
        const valorNum = Number(t.valorTotal) || 0;
        const labelColor = LABEL_COLOR[cor] || C.slate;
        const saldoPos = saldoCorrido > 0;

        return [
          /* Data */
          { content: fmtDateTime(t.data), styles: { halign: "center" } },

          /* Tipo da transação */
          {
            content: (t.tipo || "outro").toUpperCase(),
            styles: {
              fontStyle: "bold",
              textColor:
                t.tipo === "venda"
                  ? C.greenDark
                  : t.tipo === "compra"
                    ? C.blueDark
                    : t.tipo === "despesa"
                      ? C.redDark
                      : C.muted,
            },
          },

          /* Classificação de dívida */
          {
            content: rotulo,
            styles: {
              fontStyle: "bold",
              textColor: labelColor,
            },
          },

          /* Material / descrição */
          {
            content: t.material
              ? t.material
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase())
              : t.observacoes
                ? t.observacoes.substring(0, 28)
                : "—",
          },

          /* Valor com sinal de impacto */
          {
            content:
              impacto !== 0
                ? `${impacto > 0 ? "+" : "−"} ${fmtR(Math.abs(valorNum))}`
                : fmtR(valorNum),
            styles: {
              halign: "right",
              fontStyle: "bold",
              textColor:
                impacto > 0 ? C.redDark : impacto < 0 ? C.greenDark : C.muted,
            },
          },

          /* Saldo acumulado */
          {
            content: fmtR(saldoCorrido),
            styles: {
              halign: "right",
              fontStyle: "bold",
              textColor: saldoPos ? C.redDark : C.greenDark,
              fillColor: saldoPos ? C.redBg : C.greenBg,
            },
          },
        ];
      }),

      /* Rodapé totalizador */
      foot: [
        [
          {
            content: `${sorted.length} movimentações`,
            colSpan: 3,
            styles: { ...TF },
          },
          { content: "", styles: { ...TF } },
          {
            content: `Variação: ${saldo >= 0 ? "+" : "−"}${fmtR(Math.abs(saldo))}`,
            styles: {
              ...TF,
              halign: "right",
              textColor: saldo > 0 ? C.red : C.green,
            },
          },
          {
            content: fmtR(saldoCorrido),
            styles: {
              ...TF,
              halign: "right",
              textColor: saldoCorrido > 0 ? C.red : C.green,
            },
          },
        ],
      ],

      theme: "grid",
      headStyles: TH,
      styles: TS,
      alternateRowStyles: TALT,
      footStyles: TF,

      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 18 },
        2: { cellWidth: 32 },
        4: { halign: "right", cellWidth: 26 },
        5: { halign: "right", cellWidth: 26 },
      },

      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          drawHeader(doc, "Extrato de Conta Corrente", customer.nome);
        }
      },
    });
  }

  /* ── Separar transações por tipo em seções adicionais ── */
  const transAumentam = sorted.filter((t) => classificar(t).impacto > 0);
  const transDiminuem = sorted.filter((t) => classificar(t).impacto < 0);

  /* Resumo por tipo */
  if (transAumentam.length > 0 || transDiminuem.length > 0) {
    let ySec = doc.lastAutoTable?.finalY + 10 || y;
    if (ySec > ph(doc) - 60) {
      doc.addPage();
      ySec = 20;
    }

    ySec = drawSectionTitle(doc, ySec, "Resumo — Entradas e Saídas da Dívida");

    const resumoRows = [];

    if (transAumentam.length) {
      transAumentam.forEach((t) => {
        const { rotulo } = classificar(t);
        resumoRows.push([
          fmtDate(t.data),
          {
            content: rotulo,
            styles: { fontStyle: "bold", textColor: C.amberDark },
          },
          t.material || t.observacoes?.substring(0, 25) || "—",
          {
            content: `+ ${fmtR(t.valorTotal)}`,
            styles: {
              halign: "right",
              fontStyle: "bold",
              textColor: C.redDark,
            },
          },
        ]);
      });
    }

    if (transDiminuem.length) {
      transDiminuem.forEach((t) => {
        const { rotulo } = classificar(t);
        resumoRows.push([
          fmtDate(t.data),
          {
            content: rotulo,
            styles: { fontStyle: "bold", textColor: C.greenDark },
          },
          t.material || t.observacoes?.substring(0, 25) || "—",
          {
            content: `− ${fmtR(t.valorTotal)}`,
            styles: {
              halign: "right",
              fontStyle: "bold",
              textColor: C.greenDark,
            },
          },
        ]);
      });
    }

    autoTable(doc, {
      startY: ySec,
      margin: { left: ML, right: MR, bottom: 18 },
      head: [["Data", "Classificação", "Descrição", "Valor"]],
      body: resumoRows,
      foot: [
        [
          {
            content: "Saldo Final",
            colSpan: 3,
            styles: { ...TF, fillColor: saldo > 0 ? C.redDark : C.greenDark },
          },
          {
            content: fmtR(saldo),
            styles: {
              ...TF,
              halign: "right",
              fillColor: saldo > 0 ? C.redDark : C.greenDark,
              textColor: C.white,
            },
          },
        ],
      ],
      theme: "grid",
      headStyles: TH,
      styles: TS,
      alternateRowStyles: TALT,
      footStyles: TF,
      columnStyles: {
        0: { cellWidth: 22, halign: "center" },
        3: { halign: "right" },
      },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          drawHeader(doc, "Extrato de Conta Corrente", customer.nome);
        }
      },
    });
  }

  drawFooter(doc);
  doc.save(
    `extrato_${customer.nome.toLowerCase().replace(/\s+/g, "_")}_${format(new Date(), "ddMMyy_HHmm")}.pdf`,
  );
}

/* ============================================================
   RELATÓRIO FINANCEIRO
   ============================================================ */
export function generateFinancialPDF(reportData, options = {}) {
  const { startDate, endDate, clientData, observations } = options;
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const startStr = startDate ? fmtDate(startDate) : "Início";
  const endStr = endDate ? fmtDate(endDate) : "Hoje";

  let y = drawHeader(doc, "Relatório Financeiro", `${startStr} a ${endStr}`);

  if (clientData) y = drawClientBlock(doc, y, clientData);
  else {
    // Período
    doc.setFontSize(F.xs);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.muted);
    doc.text(`Período de referência: ${startStr} a ${endStr}`, ML, y);
    doc.setDrawColor(...C.hairline);
    doc.setLineWidth(0.3);
    doc.line(ML, y + 4, pw(doc) - MR, y + 4);
    y += 10;
  }

  const totalVendas = reportData.totalSales || reportData.totalVendas || 0;
  const totalCompras =
    reportData.totalPurchases || reportData.totalCompras || 0;
  const totalDespesas =
    reportData.totalExpenses || reportData.totalDespesas || 0;
  const lucro = reportData.profit || reportData.totalLucro || 0;
  const margem = totalVendas > 0 ? (lucro / totalVendas) * 100 : 0;

  y = drawKPIStrip(doc, y, [
    {
      label: "RECEITA TOTAL",
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
    {
      label: "MARGEM",
      value: `${margem.toFixed(1)}%`,
      bar: C.navy,
      color: C.slate,
    },
  ]);

  if (reportData.dailyData?.length > 0) {
    y = drawSectionTitle(doc, y, "Evolução Diária");

    autoTable(doc, {
      startY: y,
      margin: { left: ML, right: MR, bottom: 18 },
      head: [
        [
          "Data",
          "Tx.",
          "Vendas (R$)",
          "Compras (R$)",
          "Despesas (R$)",
          "Lucro (R$)",
        ],
      ],
      body: reportData.dailyData.map((d) => {
        const lucroD =
          (d.sales || d.vendas || 0) -
          (d.purchases || d.compras || 0) -
          (d.expenses || d.despesas || 0);
        return [
          { content: fmtDate(d.date), styles: { halign: "center" } },
          {
            content: d.transactionCount || d.transacoes || 0,
            styles: { halign: "center" },
          },
          {
            content: fmtR(d.sales || d.vendas || 0),
            styles: { halign: "right" },
          },
          {
            content: fmtR(d.purchases || d.compras || 0),
            styles: { halign: "right" },
          },
          {
            content: fmtR(d.expenses || d.despesas || 0),
            styles: { halign: "right" },
          },
          {
            content: fmtR(lucroD),
            styles: {
              halign: "right",
              fontStyle: "bold",
              textColor: lucroD >= 0 ? C.greenDark : C.redDark,
            },
          },
        ];
      }),
      foot: [
        [
          {
            content: `${reportData.dailyData.length} dias`,
            colSpan: 2,
            styles: { ...TF },
          },
          { content: fmtR(totalVendas), styles: { ...TF, halign: "right" } },
          { content: fmtR(totalCompras), styles: { ...TF, halign: "right" } },
          { content: fmtR(totalDespesas), styles: { ...TF, halign: "right" } },
          { content: fmtR(lucro), styles: { ...TF, halign: "right" } },
        ],
      ],
      theme: "grid",
      headStyles: TH,
      styles: TS,
      alternateRowStyles: TALT,
      footStyles: TF,
      columnStyles: {
        0: { cellWidth: 22, halign: "center" },
        1: { cellWidth: 10, halign: "center" },
      },
      didDrawPage: (d) => {
        if (d.pageNumber > 1)
          drawHeader(doc, "Relatório Financeiro", `${startStr} a ${endStr}`);
      },
    });
  }

  if (observations) {
    let yObs = doc.lastAutoTable?.finalY + 10 || y;
    if (yObs > ph(doc) - 40) {
      doc.addPage();
      yObs = 20;
    }
    yObs = drawSectionTitle(doc, yObs, "Observações");
    doc.setFontSize(F.sm);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.slate);
    doc.text(doc.splitTextToSize(observations, W(doc)), ML, yObs);
  }

  drawFooter(doc);
  doc.save(`relatorio_financeiro_${format(new Date(), "ddMMyyyy_HHmm")}.pdf`);
}

/* ============================================================
   RELATÓRIO POR MATERIAL
   ============================================================ */
export function generateMaterialPDF(reportData, options = {}) {
  const { startDate, endDate, clientData } = options;
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const startStr = startDate ? fmtDate(startDate) : "Início";
  const endStr = endDate ? fmtDate(endDate) : "Hoje";

  let y = drawHeader(doc, "Relatório por Material", `${startStr} a ${endStr}`);

  if (clientData) y = drawClientBlock(doc, y, clientData);
  else {
    doc.setFontSize(F.xs);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.muted);
    doc.text(`Período de referência: ${startStr} a ${endStr}`, ML, y);
    doc.setDrawColor(...C.hairline);
    doc.setLineWidth(0.3);
    doc.line(ML, y + 4, pw(doc) - MR, y + 4);
    y += 10;
  }

  if (!reportData.materialStats) {
    drawFooter(doc);
    doc.save(`relatorio_materiais_${format(new Date(), "ddMMyyyy_HHmm")}.pdf`);
    return;
  }

  const entries = Object.entries(reportData.materialStats);
  const totVendas = entries.reduce((s, [, v]) => s + (v.vendas || 0), 0);
  const totCompras = entries.reduce((s, [, v]) => s + (v.compras || 0), 0);
  const totLucro = entries.reduce((s, [, v]) => s + (v.lucro || 0), 0);
  const totKg = entries.reduce(
    (s, [, v]) => s + (v.quantity || v.quantidade || 0),
    0,
  );

  y = drawKPIStrip(doc, y, [
    {
      label: "TOTAL VENDAS",
      value: fmtR(totVendas),
      bar: C.green,
      color: C.greenDark,
    },
    {
      label: "TOTAL COMPRAS",
      value: fmtR(totCompras),
      bar: C.blue,
      color: C.blueDark,
    },
    {
      label: "LUCRO TOTAL",
      value: fmtR(totLucro),
      bar: totLucro >= 0 ? C.green : C.red,
      color: totLucro >= 0 ? C.greenDark : C.redDark,
    },
    {
      label: "PESO TOTAL",
      value: `${totKg.toFixed(2)} kg`,
      bar: C.navy,
      color: C.slate,
    },
  ]);

  y = drawSectionTitle(
    doc,
    y,
    `Desempenho por Material (${entries.length} itens)`,
  );

  const sorted = entries.sort(
    ([, a], [, b]) => (b.lucro || 0) - (a.lucro || 0),
  );

  autoTable(doc, {
    startY: y,
    margin: { left: ML, right: MR, bottom: 18 },
    head: [
      [
        "Material",
        "Qtd (kg)",
        "Vendas (R$)",
        "Compras (R$)",
        "Lucro (R$)",
        "Margem",
      ],
    ],
    body: sorted.map(([mat, st]) => {
      const qty = st.quantity || st.quantidade || 0;
      const lucro = st.lucro || 0;
      const m = st.vendas > 0 ? ((lucro / st.vendas) * 100).toFixed(1) : "0.0";
      const mNum = parseFloat(m);

      return [
        mat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        { content: qty.toFixed(2), styles: { halign: "right" } },
        { content: fmtR(st.vendas), styles: { halign: "right" } },
        { content: fmtR(st.compras), styles: { halign: "right" } },
        {
          content: fmtR(lucro),
          styles: {
            halign: "right",
            fontStyle: "bold",
            textColor: lucro >= 0 ? C.greenDark : C.redDark,
          },
        },
        {
          content: `${m}%`,
          styles: {
            halign: "center",
            fontStyle: "bold",
            textColor:
              mNum >= 20 ? C.greenDark : mNum >= 10 ? C.amberDark : C.redDark,
          },
        },
      ];
    }),
    foot: [
      [
        { content: "TOTAIS", styles: { ...TF } },
        {
          content: `${totKg.toFixed(2)} kg`,
          styles: { ...TF, halign: "right" },
        },
        { content: fmtR(totVendas), styles: { ...TF, halign: "right" } },
        { content: fmtR(totCompras), styles: { ...TF, halign: "right" } },
        { content: fmtR(totLucro), styles: { ...TF, halign: "right" } },
        {
          content:
            totVendas > 0
              ? `${((totLucro / totVendas) * 100).toFixed(1)}%`
              : "—",
          styles: { ...TF, halign: "center" },
        },
      ],
    ],
    theme: "grid",
    headStyles: TH,
    styles: TS,
    alternateRowStyles: TALT,
    footStyles: TF,
    didDrawPage: (d) => {
      if (d.pageNumber > 1)
        drawHeader(doc, "Relatório por Material", `${startStr} a ${endStr}`);
    },
  });

  drawFooter(doc);
  doc.save(`relatorio_materiais_${format(new Date(), "ddMMyyyy_HHmm")}.pdf`);
}
