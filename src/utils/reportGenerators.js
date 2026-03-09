import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

/**
 * Configuração unificada de design para PDFs
 * Foco em robustez, clareza e fontes proporcionais.
 */
const PDF_CONFIG = {
  colors: {
    primary: [44, 62, 80], // Azul Marinho Profissional (Slate)
    secondary: [127, 140, 141], // Cinza Médio
    accent: [39, 174, 96], // Verde Esmeralda (Sucesso discreto)
    danger: [192, 57, 43], // Vermelho (Débito)
    text: [44, 62, 80], // Texto Principal
    lightText: [127, 140, 141], // Texto Secundário
    background: [248, 249, 250], // Fundo de seções
    border: [200, 200, 200], // Bordas
  },
  fonts: {
    h1: 20,
    h2: 14,
    h3: 11,
    body: 10,
    small: 8,
    tiny: 7,
  },
  margin: 15,
};

/**
 * Cria cabeçalho profissional unificado
 */
function createProfessionalHeader(doc, title, startDate, endDate) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Linha de topo (detalhe sutil)
  doc.setFillColor(...PDF_CONFIG.colors.primary);
  doc.rect(0, 0, pageWidth, 4, "F");

  // Nome da Empresa
  doc.setTextColor(...PDF_CONFIG.colors.primary);
  doc.setFontSize(PDF_CONFIG.fonts.h1);
  doc.setFont("helvetica", "bold");
  doc.text("IMPÉRIO SUCATA", PDF_CONFIG.margin, 15);

  // Título do Relatório
  doc.setFontSize(PDF_CONFIG.fonts.h2);
  doc.setFont("helvetica", "normal");
  doc.text(title.toUpperCase(), PDF_CONFIG.margin, 23);

  // Período e Geração (Alinhado à direita)
  doc.setFontSize(PDF_CONFIG.fonts.small);
  doc.setTextColor(...PDF_CONFIG.colors.lightText);
  const startStr = startDate
    ? format(new Date(startDate), "dd/MM/yyyy")
    : "Início";
  const endStr = endDate ? format(new Date(endDate), "dd/MM/yyyy") : "Hoje";
  doc.text(
    `Período: ${startStr} - ${endStr}`,
    pageWidth - PDF_CONFIG.margin,
    15,
    { align: "right" },
  );
  doc.text(
    `Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
    pageWidth - PDF_CONFIG.margin,
    20,
    { align: "right" },
  );

  // Linha divisória
  doc.setDrawColor(...PDF_CONFIG.colors.border);
  doc.setLineWidth(0.5);
  doc.line(PDF_CONFIG.margin, 28, pageWidth - PDF_CONFIG.margin, 28);

  return 35; // Próxima posição Y
}

/**
 * Adiciona seção de dados do cliente/parceiro
 */
function addClientSection(doc, yPos, clientData) {
  if (!clientData || !clientData.nome) return yPos;

  const pageWidth = doc.internal.pageSize.getWidth();
  const sectionWidth = pageWidth - PDF_CONFIG.margin * 2;

  doc.setFillColor(...PDF_CONFIG.colors.background);
  doc.rect(PDF_CONFIG.margin, yPos, sectionWidth, 25, "F");

  doc.setTextColor(...PDF_CONFIG.colors.primary);
  doc.setFontSize(PDF_CONFIG.fonts.h3);
  doc.setFont("helvetica", "bold");
  doc.text("DADOS DO CLIENTE / PARCEIRO", PDF_CONFIG.margin + 5, yPos + 7);

  doc.setFontSize(PDF_CONFIG.fonts.body);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...PDF_CONFIG.colors.text);

  // Coluna 1
  doc.text(`Nome: ${clientData.nome}`, PDF_CONFIG.margin + 5, yPos + 14);
  if (clientData.cpfCnpj || clientData.cpf) {
    doc.text(
      `CPF/CNPJ: ${clientData.cpfCnpj || clientData.cpf}`,
      PDF_CONFIG.margin + 5,
      yPos + 20,
    );
  }

  // Coluna 2
  if (clientData.telefone) {
    doc.text(`Telefone: ${clientData.telefone}`, pageWidth / 2, yPos + 14);
  }
  if (clientData.endereco) {
    const addr = doc.splitTextToSize(
      `Endereço: ${clientData.endereco}`,
      pageWidth / 2 - PDF_CONFIG.margin,
    );
    doc.text(addr, pageWidth / 2, yPos + 20);
  }

  return yPos + 32;
}

/**
 * Cria rodapé profissional em todas as páginas
 */
function createProfessionalFooter(doc) {
  const pageCount = doc.internal.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(PDF_CONFIG.fonts.tiny);
    doc.setTextColor(...PDF_CONFIG.colors.lightText);

    doc.setDrawColor(...PDF_CONFIG.colors.border);
    doc.line(
      PDF_CONFIG.margin,
      pageHeight - 15,
      pageWidth - PDF_CONFIG.margin,
      pageHeight - 15,
    );

    doc.text(
      "Império Sucata - Gestão de Reciclagem e Resíduos",
      PDF_CONFIG.margin,
      pageHeight - 10,
    );
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth - PDF_CONFIG.margin,
      pageHeight - 10,
      { align: "right" },
    );
  }
}

/**
 * Gera Extrato de Conta Corrente do Cliente (Lógica de Dívidas)
 */
export function generateCustomerStatementPDF(customer, transactions) {
  const doc = new jsPDF();

  let yPos = createProfessionalHeader(
    doc,
    "Extrato de Conta Corrente",
    null,
    null,
  );
  yPos = addClientSection(doc, yPos, customer);

  // Ordenar transações por data
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(a.data) - new Date(b.data),
  );

  // Resumo Financeiro do Cliente
  doc.setFontSize(PDF_CONFIG.fonts.h3);
  doc.setTextColor(...PDF_CONFIG.colors.primary);
  doc.setFont("helvetica", "bold");
  doc.text("RESUMO DE SALDOS (DÍVIDA)", PDF_CONFIG.margin, yPos);
  yPos += 6;

  const totalEmprestimos = transactions
    .filter(
      (t) =>
        t.tipo === "despesa" &&
        (t.categoria === "emprestimo" ||
          t.observacoes?.toLowerCase().includes("empréstimo") ||
          t.material === "emprestimo_cliente"),
    )
    .reduce((acc, t) => acc + (Number(t.valorTotal) || 0), 0);

  const totalPagamentos = transactions
    .filter(
      (t) =>
        t.formaPagamento === "pagamento_divida" ||
        t.material === "pagamento_cliente" ||
        t.observacoes?.toLowerCase().includes("pagamento de dívida"),
    )
    .reduce((acc, t) => acc + (Number(t.valorTotal) || 0), 0);

  const saldoFinal = totalEmprestimos - totalPagamentos;

  const summaryData = [
    [
      {
        content: "Total em Empréstimos (Aumenta Dívida)",
        styles: { fillColor: [255, 248, 241] },
      },
      {
        content: `R$ ${totalEmprestimos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        styles: { fillColor: [255, 248, 241], halign: "right" },
      },
    ],
    [
      {
        content: "Total em Pagamentos (Diminui Dívida)",
        styles: { fillColor: [240, 253, 244] },
      },
      {
        content: `R$ ${totalPagamentos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        styles: { fillColor: [240, 253, 244], halign: "right" },
      },
    ],
    [
      {
        content: "SALDO DEVEDOR ATUAL",
        styles: {
          fontStyle: "bold",
          fillColor: saldoFinal > 0 ? [254, 242, 242] : [240, 253, 244],
        },
      },
      {
        content: `R$ ${saldoFinal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        styles: {
          fontStyle: "bold",
          halign: "right",
          fillColor: saldoFinal > 0 ? [254, 242, 242] : [240, 253, 244],
          textColor:
            saldoFinal > 0
              ? PDF_CONFIG.colors.danger
              : PDF_CONFIG.colors.accent,
        },
      },
    ],
  ];

  autoTable(doc, {
    startY: yPos,
    body: summaryData,
    theme: "grid",
    styles: {
      fontSize: PDF_CONFIG.fonts.body,
      cellPadding: 4,
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
    },
    margin: { left: PDF_CONFIG.margin, right: PDF_CONFIG.margin },
  });

  yPos = doc.lastAutoTable.finalY + 12;

  // Tabela de Movimentações de Dívida
  doc.setFontSize(PDF_CONFIG.fonts.h3);
  doc.setFont("helvetica", "bold");
  doc.text("HISTÓRICO DE MOVIMENTAÇÕES DA DÍVIDA", PDF_CONFIG.margin, yPos);
  yPos += 6;

  let runningBalance = 0;
  const debtTransactions = sortedTransactions.filter((t) => {
    const isEmprestimo =
      t.tipo === "despesa" &&
      (t.categoria === "emprestimo" ||
        t.observacoes?.toLowerCase().includes("empréstimo") ||
        t.material === "emprestimo_cliente");

    const isPagamentoDivida =
      t.formaPagamento === "pagamento_divida" ||
      t.material === "pagamento_cliente" ||
      t.observacoes?.toLowerCase().includes("pagamento de dívida");

    return isEmprestimo || isPagamentoDivida;
  });

  const tableData = debtTransactions.map((t) => {
    const isEmprestimo =
      t.tipo === "despesa" &&
      (t.categoria === "emprestimo" ||
        t.observacoes?.toLowerCase().includes("empréstimo") ||
        t.material === "emprestimo_cliente");

    let tipoFormatado = "";
    let debito = "";
    let credito = "";
    let valorNum = Number(t.valorTotal) || 0;

    if (isEmprestimo) {
      tipoFormatado = "EMPRÉSTIMO";
      debito = valorNum.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
      runningBalance += valorNum;
    } else {
      tipoFormatado = "PAGAMENTO DE DÍVIDA";
      credito = valorNum.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
      runningBalance -= valorNum;
    }

    return [
      format(new Date(t.data), "dd/MM/yyyy HH:mm"),
      tipoFormatado,
      t.observacoes || t.material || "-",
      debito ? `R$ ${debito}` : "-",
      credito ? `R$ ${credito}` : "-",
      {
        content: `R$ ${runningBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        styles: { fontStyle: "bold" },
      },
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [
      ["Data", "Operação", "Observação", "Débito (+)", "Crédito (-)", "Saldo"],
    ],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: PDF_CONFIG.colors.primary,
      fontSize: PDF_CONFIG.fonts.tiny,
    },
    styles: { fontSize: PDF_CONFIG.fonts.tiny, cellPadding: 2 },
    columnStyles: {
      3: { halign: "right", textColor: PDF_CONFIG.colors.danger },
      4: { halign: "right", textColor: PDF_CONFIG.colors.accent },
      5: { halign: "right" },
    },
    margin: { left: PDF_CONFIG.margin, right: PDF_CONFIG.margin },
  });

  // Se houver transações comerciais, adicionar uma seção separada
  const commercialTransactions = sortedTransactions.filter((t) => {
    const isEmprestimo =
      t.tipo === "despesa" &&
      (t.categoria === "emprestimo" ||
        t.observacoes?.toLowerCase().includes("empréstimo") ||
        t.material === "emprestimo_cliente");

    const isPagamentoDivida =
      t.formaPagamento === "pagamento_divida" ||
      t.material === "pagamento_cliente" ||
      t.observacoes?.toLowerCase().includes("pagamento de dívida");

    return (
      !isEmprestimo &&
      !isPagamentoDivida &&
      (t.tipo === "compra" || t.tipo === "venda")
    );
  });

  if (commercialTransactions.length > 0) {
    yPos = doc.lastAutoTable.finalY + 12;

    // Verificar se precisa de nova página
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(PDF_CONFIG.fonts.h3);
    doc.setFont("helvetica", "bold");
    doc.text(
      "HISTÓRICO DE TRANSAÇÕES COMERCIAIS (NÃO AFETAM DÍVIDA)",
      PDF_CONFIG.margin,
      yPos,
    );
    yPos += 6;

    const commercialTableData = commercialTransactions.map((t) => [
      format(new Date(t.data), "dd/MM/yyyy HH:mm"),
      t.tipo === "compra" ? "VENDA P/ EMPRESA" : "COMPRA DA EMPRESA",
      t.material || "-",
      `${t.quantidade || 0} kg`,
      `R$ ${(Number(t.precoUnitario) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      `R$ ${(Number(t.valorTotal) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Data", "Operação", "Material", "Qtd", "Preço/kg", "Total"]],
      body: commercialTableData,
      theme: "striped",
      headStyles: {
        fillColor: PDF_CONFIG.colors.secondary,
        fontSize: PDF_CONFIG.fonts.tiny,
      },
      styles: { fontSize: PDF_CONFIG.fonts.tiny, cellPadding: 2 },
      columnStyles: {
        3: { halign: "right" },
        4: { halign: "right" },
        5: { halign: "right", fontStyle: "bold" },
      },
      margin: { left: PDF_CONFIG.margin, right: PDF_CONFIG.margin },
    });
  }

  createProfessionalFooter(doc);
  doc.save(
    `extrato_${customer.nome.toLowerCase().replace(/\s+/g, "_")}_${format(new Date(), "ddMMyy")}.pdf`,
  );
}

/**
 * Relatório Financeiro Profissional
 */
export function generateFinancialPDF(reportData, options = {}) {
  const { startDate, endDate, clientData, observations } = options;
  const doc = new jsPDF();

  let yPos = createProfessionalHeader(
    doc,
    "Relatório Financeiro",
    startDate,
    endDate,
  );

  if (clientData) {
    yPos = addClientSection(doc, yPos, clientData);
  }

  // Resumo em Cards
  const totalVendas = reportData.totalSales || reportData.totalVendas || 0;
  const totalCompras =
    reportData.totalPurchases || reportData.totalCompras || 0;
  const totalExpenses =
    reportData.totalExpenses || reportData.totalDespesas || 0;
  const profit = reportData.profit || reportData.totalLucro || 0;

  const metrics = [
    { label: "VENDAS", value: totalVendas, color: [39, 174, 96] },
    { label: "COMPRAS", value: totalCompras, color: [41, 128, 185] },
    { label: "DESPESAS", value: totalExpenses, color: [192, 57, 43] },
    {
      label: "LUCRO",
      value: profit,
      color: profit >= 0 ? [39, 174, 96] : [192, 57, 43],
    },
  ];

  const cardWidth =
    (doc.internal.pageSize.getWidth() - PDF_CONFIG.margin * 2 - 10) / 4;
  metrics.forEach((m, i) => {
    const x = PDF_CONFIG.margin + i * (cardWidth + 3.3);
    doc.setFillColor(...PDF_CONFIG.colors.background);
    doc.rect(x, yPos, cardWidth, 18, "F");

    doc.setFontSize(PDF_CONFIG.fonts.tiny);
    doc.setTextColor(...PDF_CONFIG.colors.lightText);
    doc.setFont("helvetica", "bold");
    doc.text(m.label, x + cardWidth / 2, yPos + 6, { align: "center" });

    doc.setFontSize(PDF_CONFIG.fonts.body);
    doc.setTextColor(...m.color);
    doc.text(
      `R$ ${m.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      x + cardWidth / 2,
      yPos + 13,
      { align: "center" },
    );
  });

  yPos += 25;

  // Tabela de Dados Diários
  if (reportData.dailyData && reportData.dailyData.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [["Data", "Transações", "Vendas", "Compras", "Despesas", "Lucro"]],
      body: reportData.dailyData.map((d) => [
        format(new Date(d.date), "dd/MM/yyyy"),
        d.transactionCount || d.transacoes || 0,
        `R$ ${d.sales.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        `R$ ${d.purchases.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        `R$ ${d.expenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        `R$ ${d.profit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      ]),
      theme: "grid",
      headStyles: {
        fillColor: PDF_CONFIG.colors.primary,
        fontSize: PDF_CONFIG.fonts.small,
        halign: "center",
      },
      styles: { fontSize: PDF_CONFIG.fonts.small, cellPadding: 3 },
      columnStyles: {
        0: { halign: "center" },
        1: { halign: "center" },
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "right" },
        5: { halign: "right", fontStyle: "bold" },
      },
    });
    yPos = doc.lastAutoTable.finalY + 10;
  }

  if (observations) {
    doc.setFontSize(PDF_CONFIG.fonts.h3);
    doc.setTextColor(...PDF_CONFIG.colors.primary);
    doc.text("OBSERVAÇÕES", PDF_CONFIG.margin, yPos);
    yPos += 5;
    doc.setFontSize(PDF_CONFIG.fonts.body);
    doc.setTextColor(...PDF_CONFIG.colors.text);
    const splitObs = doc.splitTextToSize(
      observations,
      doc.internal.pageSize.getWidth() - PDF_CONFIG.margin * 2,
    );
    doc.text(splitObs, PDF_CONFIG.margin, yPos);
  }

  createProfessionalFooter(doc);
  doc.save(`relatorio_financeiro_${format(new Date(), "ddMMyyyy_HHmm")}.pdf`);
}

/**
 * Relatório por Material Profissional
 */
export function generateMaterialPDF(reportData, options = {}) {
  const { startDate, endDate, clientData } = options;
  const doc = new jsPDF();

  let yPos = createProfessionalHeader(
    doc,
    "Relatório por Material",
    startDate,
    endDate,
  );

  if (clientData) {
    yPos = addClientSection(doc, yPos, clientData);
  }

  if (reportData.materialStats) {
    autoTable(doc, {
      startY: yPos,
      head: [
        ["Material", "Quantidade", "Vendas", "Compras", "Lucro", "Margem"],
      ],
      body: Object.entries(reportData.materialStats).map(([mat, stats]) => [
        mat.toUpperCase(),
        `${stats.quantity.toFixed(2)} kg`,
        `R$ ${stats.vendas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        `R$ ${stats.compras.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        `R$ ${stats.lucro.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        `${(stats.vendas > 0 ? (stats.lucro / stats.vendas) * 100 : 0).toFixed(1)}%`,
      ]),
      theme: "striped",
      headStyles: {
        fillColor: PDF_CONFIG.colors.primary,
        fontSize: PDF_CONFIG.fonts.small,
      },
      styles: { fontSize: PDF_CONFIG.fonts.small },
      columnStyles: {
        1: { halign: "right" },
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "right", fontStyle: "bold" },
        5: { halign: "center" },
      },
    });
  }

  createProfessionalFooter(doc);
  doc.save(`relatorio_materiais_${format(new Date(), "ddMMyyyy_HHmm")}.pdf`);
}
