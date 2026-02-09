const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onCall } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const JsPDF = require("jspdf");
require("jspdf-autotable");
const XLSX = require("xlsx");

admin.initializeApp();
const db = admin.firestore();

const memoryCache = new Map();
const CACHE_TTL = 60000; // 1 minuto

/**
 * Busca dados com cache em memória para reduzir leituras do Firestore
 * @param {string} key Chave do cache
 * @param {Function} fetchFn Função que busca os dados
 * @return {Promise<any>} Dados do cache ou do Firestore
 */
async function getCachedData(key, fetchFn) {
  const cached = memoryCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  const data = await fetchFn();
  memoryCache.set(key, { data, timestamp: Date.now() });
  return data;
}

/**
 * Invalida cache por prefixo
 * @param {string} prefix Prefixo das chaves a invalidar
 */
function invalidateCache(prefix) {
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
}

// FUNÇÕES AUXILIARES PARA GERAÇÃO DE PDF PROFISSIONAL
// =================================================================================================

const PDF_CONFIG = {
  margins: { top: 25, right: 20, bottom: 25, left: 20 },
  colors: {
    primary: [34, 197, 94],
    secondary: [31, 41, 55],
    text: [55, 65, 81],
    success: [22, 163, 74],
    danger: [220, 38, 38],
  },
  fonts: {
    title: { size: 20, style: "bold" },
    subtitle: { size: 12, style: "normal" },
    heading: { size: 14, style: "bold" },
    body: { size: 10, style: "normal" },
  },
};

/**
 * Desenha o cabeçalho em todas as páginas do documento.
 * @param {JsPDF} doc O documento PDF.
 * @param {string} title O título do relatório.
 */
function drawHeader(doc, title) {
  const pageWidth = doc.internal.pageSize.width;
  doc.setFontSize(PDF_CONFIG.fonts.title.size);
  doc.setFont("helvetica", PDF_CONFIG.fonts.title.style);
  doc.setTextColor(...PDF_CONFIG.colors.primary);
  doc.text("Império Sucata", PDF_CONFIG.margins.left, 20);

  doc.setFontSize(PDF_CONFIG.fonts.subtitle.size);
  doc.setFont("helvetica", PDF_CONFIG.fonts.subtitle.style);
  doc.setTextColor(...PDF_CONFIG.colors.secondary);
  doc.text(title, pageWidth - PDF_CONFIG.margins.right, 20, { align: "right" });

  doc.setDrawColor(...PDF_CONFIG.colors.primary);
  doc.setLineWidth(0.5);
  doc.line(
    PDF_CONFIG.margins.left,
    28,
    pageWidth - PDF_CONFIG.margins.right,
    28,
  );
}

/**
 * Desenha o rodapé com número da página em todas as páginas.
 * @param {JsPDF} doc O documento PDF.
 */
function drawFooter(doc) {
  const pageCount = doc.internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...PDF_CONFIG.colors.text);
    const text = `Página ${i} de ${pageCount} | Relatório Império Sucata`;
    doc.text(text, pageWidth / 2, pageHeight - 15, { align: "center" });
  }
}

/**
 * Desenha um resumo executivo com os principais KPIs.
 * @param {JsPDF} doc O documento PDF.
 * @param {object} stats Os dados agregados do relatório.
 * @param {number} yPos A posição Y inicial para desenhar.
 * @return {number} A nova posição Y após desenhar a seção.
 */
function drawExecutiveSummary(doc, stats, yPos) {
  doc.setFontSize(PDF_CONFIG.fonts.heading.size);
  doc.setFont("helvetica", PDF_CONFIG.fonts.heading.style);
  doc.setTextColor(...PDF_CONFIG.colors.secondary);
  doc.text("Resumo Executivo", PDF_CONFIG.margins.left, yPos);
  yPos += 10;

  const kpis = [
    {
      label: "Receita (Vendas)",
      value: `R$ ${stats.totalSales.toFixed(2)}`,
      color: PDF_CONFIG.colors.success,
    },
    {
      label: "Custos (Compras)",
      value: `R$ ${stats.totalPurchases.toFixed(2)}`,
      color: PDF_CONFIG.colors.danger,
    },
    {
      label: "Lucro Bruto",
      value: `R$ ${(stats.totalSales - stats.totalPurchases).toFixed(2)}`,
      color:
        stats.totalSales - stats.totalPurchases >= 0
          ? PDF_CONFIG.colors.success
          : PDF_CONFIG.colors.danger,
    },
    {
      label: "Nº de Transações",
      value: stats.totalTransactions,
      color: PDF_CONFIG.colors.secondary,
    },
  ];

  const boxWidth =
    (doc.internal.pageSize.width -
      PDF_CONFIG.margins.left * 2 -
      10 * (kpis.length - 1)) /
    kpis.length;

  kpis.forEach((kpi, index) => {
    const x = PDF_CONFIG.margins.left + index * (boxWidth + 10);
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(248, 249, 250);
    doc.rect(x, yPos, boxWidth, 25, "FD");

    doc.setFontSize(8);
    doc.setTextColor(...PDF_CONFIG.colors.text);
    doc.text(kpi.label, x + boxWidth / 2, yPos + 7, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...kpi.color);
    doc.text(String(kpi.value), x + boxWidth / 2, yPos + 18, {
      align: "center",
    });
  });

  return yPos + 25 + 15;
}

exports.updateInventoryAndStatsOnChange = onDocumentWritten(
  {
    document: "transactions/{transactionId}",
    memory: "256MiB",
    timeoutSeconds: 30,
    maxInstances: 10, // Aumentado para lidar com picos, mas ainda controlado
  },
  async (event) => {
    const inventoryRef = db.doc("inventory/current");
    const statsRef = db.doc("reports/live_summary");

    const beforeData = event.data.before.exists
      ? event.data.before.data()
      : null;
    const afterData = event.data.after.exists ? event.data.after.data() : null;

    if (!beforeData && !afterData) return null;

    // Otimização Sênior: Usar transação em vez de batch para garantir consistência atômica total
    // e evitar condições de corrida em incrementos simultâneos.
    await db.runTransaction(async (transaction) => {
      const now = new Date();
      const today = now.toISOString().split("T")[0];

      let invUpdate = {};
      let statsUpdate = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastTransactionDate: today,
      };

      // 1. Lógica de Reversão (se for deleção ou atualização)
      if (beforeData) {
        const { material, quantidade, tipo, valorTotal } = beforeData;
        const invIncrement = tipo === "compra" ? -quantidade : quantidade;

        invUpdate[`${material}.quantidade`] =
          admin.firestore.FieldValue.increment(invIncrement);

        statsUpdate.transacoesHoje = admin.firestore.FieldValue.increment(-1);
        statsUpdate.totalTransacoesMes =
          admin.firestore.FieldValue.increment(-1);

        if (tipo === "venda") {
          statsUpdate.totalVendasMes =
            admin.firestore.FieldValue.increment(-valorTotal);
          statsUpdate.vendasHoje =
            admin.firestore.FieldValue.increment(-valorTotal);
          statsUpdate.vendasCountMes = admin.firestore.FieldValue.increment(-1);
        } else if (tipo === "compra") {
          statsUpdate.totalComprasMes =
            admin.firestore.FieldValue.increment(-valorTotal);
          statsUpdate.comprasHoje =
            admin.firestore.FieldValue.increment(-valorTotal);
          statsUpdate.comprasCountMes =
            admin.firestore.FieldValue.increment(-1);
        } else if (tipo === "despesa") {
          statsUpdate.totalDespesasMes =
            admin.firestore.FieldValue.increment(-valorTotal);
          statsUpdate.despesasCountMes =
            admin.firestore.FieldValue.increment(-1);
        }
      }

      // 2. Lógica de Aplicação (se for criação ou atualização)
      if (afterData) {
        const { material, quantidade, tipo, valorTotal } = afterData;
        const invIncrement = tipo === "compra" ? quantidade : -quantidade;

        invUpdate[`${material}.quantidade`] =
          admin.firestore.FieldValue.increment(invIncrement);

        statsUpdate.transacoesHoje = admin.firestore.FieldValue.increment(1);
        statsUpdate.totalTransacoesMes =
          admin.firestore.FieldValue.increment(1);

        if (tipo === "venda") {
          statsUpdate.totalVendasMes =
            admin.firestore.FieldValue.increment(valorTotal);
          statsUpdate.vendasHoje =
            admin.firestore.FieldValue.increment(valorTotal);
          statsUpdate.vendasCountMes = admin.firestore.FieldValue.increment(1);
        } else if (tipo === "compra") {
          statsUpdate.totalComprasMes =
            admin.firestore.FieldValue.increment(valorTotal);
          statsUpdate.comprasHoje =
            admin.firestore.FieldValue.increment(valorTotal);
          statsUpdate.comprasCountMes = admin.firestore.FieldValue.increment(1);
        } else if (tipo === "despesa") {
          statsUpdate.totalDespesasMes =
            admin.firestore.FieldValue.increment(valorTotal);
          statsUpdate.despesasCountMes =
            admin.firestore.FieldValue.increment(1);
        }
      }

      transaction.set(inventoryRef, invUpdate, { merge: true });
      transaction.set(statsRef, statsUpdate, { merge: true });
    });

    invalidateCache("reports_");
    invalidateCache("stats");
    invalidateCache("inventory");

    // Nível Sênior: Atualizar o daily_report do dia atual em tempo real
    // Isso evita que o sistema precise ler todas as transações do dia para mostrar o relatório de hoje.
    try {
      const dailyReportRef = db.collection("daily_reports").doc(today);

      let dailyUpdate = {
        date: admin.firestore.Timestamp.fromDate(
          new Date(today + "T12:00:00Z"),
        ),
        dateString: today,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (beforeData) {
        const { tipo, valorTotal, material, quantidade, formaPagamento } =
          beforeData;
        const fp = (formaPagamento || "dinheiro").toLowerCase();

        dailyUpdate.totalTransactions =
          admin.firestore.FieldValue.increment(-1);
        if (tipo === "venda") {
          dailyUpdate.totalSales =
            admin.firestore.FieldValue.increment(-valorTotal);
          dailyUpdate.salesCount = admin.firestore.FieldValue.increment(-1);
          if (material) {
            dailyUpdate[`materialStats.${material}.vendas`] =
              admin.firestore.FieldValue.increment(-valorTotal);
            dailyUpdate[`materialStats.${material}.quantidade`] =
              admin.firestore.FieldValue.increment(quantidade);
          }
        } else if (tipo === "compra") {
          dailyUpdate.totalPurchases =
            admin.firestore.FieldValue.increment(-valorTotal);
          dailyUpdate.purchasesCount = admin.firestore.FieldValue.increment(-1);
          if (material) {
            dailyUpdate[`materialStats.${material}.compras`] =
              admin.firestore.FieldValue.increment(-valorTotal);
            dailyUpdate[`materialStats.${material}.quantidade`] =
              admin.firestore.FieldValue.increment(-quantidade);
          }
        } else if (tipo === "despesa") {
          dailyUpdate.totalExpenses =
            admin.firestore.FieldValue.increment(-valorTotal);
          dailyUpdate.expensesCount = admin.firestore.FieldValue.increment(-1);
        }

        dailyUpdate[`paymentStats.${fp}.total`] =
          admin.firestore.FieldValue.increment(-valorTotal);
        dailyUpdate[`paymentStats.${fp}.count`] =
          admin.firestore.FieldValue.increment(-1);
      }

      if (afterData) {
        const { tipo, valorTotal, material, quantidade, formaPagamento } =
          afterData;
        const fp = (formaPagamento || "dinheiro").toLowerCase();

        dailyUpdate.totalTransactions = admin.firestore.FieldValue.increment(1);
        if (tipo === "venda") {
          dailyUpdate.totalSales =
            admin.firestore.FieldValue.increment(valorTotal);
          dailyUpdate.salesCount = admin.firestore.FieldValue.increment(1);
          if (material) {
            dailyUpdate[`materialStats.${material}.vendas`] =
              admin.firestore.FieldValue.increment(valorTotal);
            dailyUpdate[`materialStats.${material}.quantidade`] =
              admin.firestore.FieldValue.increment(-quantidade);
            dailyUpdate[`materialStats.${material}.transacoes`] =
              admin.firestore.FieldValue.increment(1);
          }
        } else if (tipo === "compra") {
          dailyUpdate.totalPurchases =
            admin.firestore.FieldValue.increment(valorTotal);
          dailyUpdate.purchasesCount = admin.firestore.FieldValue.increment(1);
          if (material) {
            dailyUpdate[`materialStats.${material}.compras`] =
              admin.firestore.FieldValue.increment(valorTotal);
            dailyUpdate[`materialStats.${material}.quantidade`] =
              admin.firestore.FieldValue.increment(quantidade);
            dailyUpdate[`materialStats.${material}.transacoes`] =
              admin.firestore.FieldValue.increment(1);
          }
        } else if (tipo === "despesa") {
          dailyUpdate.totalExpenses =
            admin.firestore.FieldValue.increment(valorTotal);
          dailyUpdate.expensesCount = admin.firestore.FieldValue.increment(1);
        }

        dailyUpdate[`paymentStats.${fp}.total`] =
          admin.firestore.FieldValue.increment(valorTotal);
        dailyUpdate[`paymentStats.${fp}.count`] =
          admin.firestore.FieldValue.increment(1);
      }

      transaction.set(dailyReportRef, dailyUpdate, { merge: true });
    } catch (e) {
      logger.error("Erro ao atualizar daily_report em tempo real:", e);
    }

    return { success: true };
  },
);

exports.generateHistoricalDailyReport = onSchedule(
  {
    schedule: "0 0 * * *",
    timeZone: "America/Sao_Paulo",
    memory: "512MiB",
    timeoutSeconds: 120,
  },
  async (_event) => {
    logger.info("Iniciando geração de relatório histórico diário...");
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateString = yesterday.toISOString().split("T")[0];

    const existingReport = await db
      .collection("daily_reports")
      .doc(dateString)
      .get();
    if (existingReport.exists) {
      logger.info(`Relatório para ${dateString} já existe. Pulando...`);
      return;
    }

    const start = new Date(yesterday);
    start.setHours(0, 0, 0, 0);
    const end = new Date(yesterday);
    end.setHours(23, 59, 59, 999);

    const BATCH_SIZE = 500;
    let lastDoc = null;
    const stats = {
      date: admin.firestore.Timestamp.fromDate(start),
      dateString: dateString,
      totalSales: 0,
      totalPurchases: 0,
      totalExpenses: 0,
      totalProfit: 0,
      totalTransactions: 0,
      salesCount: 0,
      purchasesCount: 0,
      expensesCount: 0,
      materialStats: {},
      paymentStats: {},
      generatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    let hasMore = true;
    while (hasMore) {
      let query = db
        .collection("transactions")
        .where("data", ">=", start)
        .where("data", "<=", end)
        .orderBy("data")
        .limit(BATCH_SIZE);

      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }

      const snapshot = await query.get();

      if (snapshot.empty || snapshot.docs.length < BATCH_SIZE) {
        hasMore = false;
      }

      if (!snapshot.empty) {
        lastDoc = snapshot.docs[snapshot.docs.length - 1];

        snapshot.docs.forEach((doc) => {
          const t = doc.data();
          const valorTotal = t.valorTotal || 0;
          const material = t.material || "outros";
          const formaPagamento = (t.formaPagamento || "dinheiro").toLowerCase();
          const quantidade = t.quantidade || 0;

          stats.totalTransactions++;

          if (t.tipo === "venda") {
            stats.totalSales += valorTotal;
            stats.salesCount++;
          } else if (t.tipo === "compra") {
            stats.totalPurchases += valorTotal;
            stats.purchasesCount++;
          } else if (t.tipo === "despesa") {
            stats.totalExpenses += valorTotal;
            stats.expensesCount++;
          }

          if (!stats.materialStats[material]) {
            stats.materialStats[material] = {
              vendas: 0,
              compras: 0,
              quantidade: 0,
              lucro: 0,
              transacoes: 0,
            };
          }

          if (t.tipo === "venda") {
            stats.materialStats[material].vendas += valorTotal;
            stats.materialStats[material].quantidade -= quantidade;
          } else if (t.tipo === "compra") {
            stats.materialStats[material].compras += valorTotal;
            stats.materialStats[material].quantidade += quantidade;
          }
          stats.materialStats[material].transacoes++;
          stats.materialStats[material].lucro =
            stats.materialStats[material].vendas -
            stats.materialStats[material].compras;

          if (!stats.paymentStats[formaPagamento]) {
            stats.paymentStats[formaPagamento] = { count: 0, total: 0 };
          }
          stats.paymentStats[formaPagamento].count++;
          stats.paymentStats[formaPagamento].total += valorTotal;
        });
      }
    }

    stats.totalProfit =
      stats.totalSales - stats.totalPurchases - stats.totalExpenses;

    await db.collection("daily_reports").doc(dateString).set(stats);
    logger.info(
      `Relatório gerado para ${dateString}: ${stats.totalTransactions} transações`,
    );
  },
);

exports.getAggregatedReports = onCall(
  {
    memory: "256MiB",
    timeoutSeconds: 30,
  },
  async (request) => {
    const { startDate, endDate } = request.data;
    if (!startDate || !endDate) {
      throw new Error("As datas são obrigatórias.");
    }

    const cacheKey = `reports_${startDate}_${endDate}`;
    return getCachedData(cacheKey, async () => {
      const reportsSnapshot = await db
        .collection("daily_reports")
        .where(admin.firestore.FieldPath.documentId(), ">=", startDate)
        .where(admin.firestore.FieldPath.documentId(), "<=", endDate)
        .get();
      return { reports: reportsSnapshot.docs.map((doc) => doc.data()) };
    });
  },
);

exports.generateReportFile = onCall(
  {
    memory: "512MiB",
    timeoutSeconds: 120,
  },
  async (request) => {
    const { format, filters } = request.data;
    const bucket = admin.storage().bucket();
    const { HttpsError } = require("firebase-functions/v2/https");

    if (!format || !["pdf", "excel"].includes(format)) {
      throw new HttpsError(
        "invalid-argument",
        "Formato inválido. Use 'pdf' ou 'excel'.",
      );
    }

    try {
      logger.info(`Gerando relatório ${format} com filtros:`, filters);

      let aggregatedQuery = db.collection("daily_reports");
      if (filters?.startDate) {
        aggregatedQuery = aggregatedQuery.where(
          admin.firestore.FieldPath.documentId(),
          ">=",
          filters.startDate.split("T")[0],
        );
      }
      if (filters?.endDate) {
        aggregatedQuery = aggregatedQuery.where(
          admin.firestore.FieldPath.documentId(),
          "<=",
          filters.endDate.split("T")[0],
        );
      }
      const aggregatedSnapshot = await aggregatedQuery.get();
      const dailyReports = aggregatedSnapshot.docs.map((doc) => doc.data());

      const summaryStats = dailyReports.reduce(
        (acc, report) => {
          acc.totalSales += report.totalSales || 0;
          acc.totalPurchases += report.totalPurchases || 0;
          acc.totalExpenses += report.totalExpenses || 0;
          acc.totalTransactions += report.totalTransactions || 0;
          return acc;
        },
        {
          totalSales: 0,
          totalPurchases: 0,
          totalExpenses: 0,
          totalTransactions: 0,
        },
      );

      const MAX_TRANSACTIONS = 1000;
      let detailedQuery = db.collection("transactions");
      if (filters?.startDate) {
        detailedQuery = detailedQuery.where(
          "data",
          ">=",
          new Date(filters.startDate),
        );
      }
      if (filters?.endDate) {
        detailedQuery = detailedQuery.where(
          "data",
          "<=",
          new Date(filters.endDate),
        );
      }
      if (filters?.material) {
        detailedQuery = detailedQuery.where("material", "==", filters.material);
      }
      if (filters?.tipo) {
        detailedQuery = detailedQuery.where("tipo", "==", filters.tipo);
      }

      const detailedSnapshot = await detailedQuery
        .orderBy("data", "desc")
        .limit(MAX_TRANSACTIONS) // Limite de segurança
        .get();
      const transactions = detailedSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (transactions.length === 0) {
        throw new HttpsError(
          "not-found",
          "Nenhuma transação encontrada para os filtros selecionados.",
        );
      }

      // PDF
      if (format === "pdf") {
        const doc = new JsPDF();
        let yPos = 40;
        const reportTitle = "Relatório Financeiro Detalhado";

        drawHeader(doc, reportTitle);
        yPos = drawExecutiveSummary(doc, summaryStats, yPos);

        doc.setFontSize(PDF_CONFIG.fonts.heading.size);
        doc.text("Detalhamento de Transações", PDF_CONFIG.margins.left, yPos);

        if (transactions.length === MAX_TRANSACTIONS) {
          doc.setFontSize(8);
          doc.setTextColor(220, 38, 38);
          doc.text(
            `(Mostrando as últimas ${MAX_TRANSACTIONS} transações)`,
            PDF_CONFIG.margins.left + 80,
            yPos,
          );
          doc.setTextColor(...PDF_CONFIG.colors.text);
        }
        yPos += 10;

        const tableData = transactions.map((t) => [
          t.data?.toDate
            ? new Date(t.data.toDate()).toLocaleDateString("pt-BR")
            : "-",
          t.tipo || "-",
          t.material || "N/A",
          `${(t.quantidade || 0).toFixed(2)} kg`,
          `R$ ${(t.valorTotal || 0).toFixed(2)}`,
          t.vendedor || "-",
        ]);

        doc.autoTable({
          startY: yPos,
          head: [["Data", "Tipo", "Material", "Qtd.", "Valor Total", "Pessoa"]],
          body: tableData,
          theme: "grid",
          headStyles: { fillColor: PDF_CONFIG.colors.primary },
          margin: {
            left: PDF_CONFIG.margins.left,
            right: PDF_CONFIG.margins.right,
          },
        });

        drawFooter(doc);

        const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
        const fileName = `relatorios/relatorio_${Date.now()}.pdf`;
        const file = bucket.file(fileName);
        await file.save(pdfBuffer, {
          metadata: { contentType: "application/pdf" },
        });

        const [url] = await file.getSignedUrl({
          action: "read",
          expires: Date.now() + 3600000,
        });
        return { success: true, downloadUrl: url };
      } else if (format === "excel") {
        const workbook = XLSX.utils.book_new();
        const sheetData = transactions.map((t) => ({
          Data: t.data?.toDate
            ? new Date(t.data.toDate()).toLocaleDateString("pt-BR")
            : "-",
          Tipo: t.tipo,
          Material: t.material,
          "Quantidade (kg)": t.quantidade,
          "Preço/kg": t.precoUnitario,
          "Valor Total": t.valorTotal,
          Cliente: t.vendedor || "",
          Pagamento: t.formaPagamento || "dinheiro",
        }));
        const ws = XLSX.utils.json_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(workbook, ws, "Transações");

        const excelBuffer = XLSX.write(workbook, {
          type: "buffer",
          bookType: "xlsx",
        });
        const fileName = `relatorios/relatorio_${Date.now()}.xlsx`;
        const file = bucket.file(fileName);
        await file.save(excelBuffer, {
          metadata: {
            contentType:
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          },
        });

        const [url] = await file.getSignedUrl({
          action: "read",
          expires: Date.now() + 3600000,
        });
        return { success: true, downloadUrl: url };
      }
    } catch (error) {
      logger.error("Erro ao gerar relatório:", error);
      if (error instanceof HttpsError) throw error;
      throw new HttpsError(
        "internal",
        "Ocorreu um erro inesperado ao gerar o relatório.",
      );
    }
  },
);

exports.getAggregatedReport = onCall(
  {
    memory: "256MiB",
    timeoutSeconds: 30,
  },
  async (request) => {
    const { startDate, endDate, material } = request.data;

    if (!startDate || !endDate) {
      throw new Error("As datas de início e fim são obrigatórias.");
    }

    try {
      const cacheKey = `aggregated_${startDate}_${endDate}_${material || "all"}`;

      return getCachedData(cacheKey, async () => {
        logger.info("Gerando relatório agregado:", {
          startDate,
          endDate,
          material,
        });

        const query = db
          .collection("daily_reports")
          .where(admin.firestore.FieldPath.documentId(), ">=", startDate)
          .where(admin.firestore.FieldPath.documentId(), "<=", endDate);

        const snapshot = await query.get();
        const dailyReports = snapshot.docs.map((doc) => doc.data());

        const aggregated = {
          totalSales: 0,
          totalPurchases: 0,
          totalExpenses: 0,
          totalProfit: 0,
          totalTransactions: 0,
          salesCount: 0,
          purchasesCount: 0,
          expensesCount: 0,
          materialStats: {},
          paymentStats: {},
          dailyBreakdown: [],
        };

        dailyReports.forEach((report) => {
          aggregated.totalSales += report.totalSales || 0;
          aggregated.totalPurchases += report.totalPurchases || 0;
          aggregated.totalExpenses += report.totalExpenses || 0;
          aggregated.totalProfit += report.totalProfit || 0;
          aggregated.totalTransactions += report.totalTransactions || 0;
          aggregated.salesCount += report.salesCount || 0;
          aggregated.purchasesCount += report.purchasesCount || 0;
          aggregated.expensesCount += report.expensesCount || 0;

          Object.entries(report.materialStats || {}).forEach(([mat, stats]) => {
            if (!aggregated.materialStats[mat]) {
              aggregated.materialStats[mat] = {
                vendas: 0,
                compras: 0,
                quantidade: 0,
                lucro: 0,
                transacoes: 0,
              };
            }
            aggregated.materialStats[mat].vendas += stats.vendas || 0;
            aggregated.materialStats[mat].compras += stats.compras || 0;
            aggregated.materialStats[mat].quantidade += stats.quantidade || 0;
            aggregated.materialStats[mat].lucro += stats.lucro || 0;
            aggregated.materialStats[mat].transacoes += stats.transacoes || 0;
          });

          Object.entries(report.paymentStats || {}).forEach(
            ([method, stats]) => {
              if (!aggregated.paymentStats[method]) {
                aggregated.paymentStats[method] = { count: 0, total: 0 };
              }
              aggregated.paymentStats[method].count += stats.count || 0;
              aggregated.paymentStats[method].total += stats.total || 0;
            },
          );

          aggregated.dailyBreakdown.push({
            date: report.dateString,
            totalSales: report.totalSales,
            totalPurchases: report.totalPurchases,
            totalProfit: report.totalProfit,
            transactions: report.totalTransactions,
          });
        });

        if (material && aggregated.materialStats[material]) {
          aggregated.materialStats = {
            [material]: aggregated.materialStats[material],
          };
        }

        logger.info(
          `Relatório agregado: ${aggregated.totalTransactions} transações`,
        );
        return aggregated;
      });
    } catch (error) {
      logger.error("Erro ao gerar relatório agregado:", error);
      throw new Error(`Erro ao gerar relatório: ${error.message}`);
    }
  },
);

exports.resetDailyStats = onSchedule(
  {
    schedule: "0 0 * * *",
    timeZone: "America/Sao_Paulo",
    memory: "128MiB",
  },
  async (_event) => {
    logger.info("Resetando estatísticas diárias...");

    const statsRef = db.doc("reports/live_summary");

    await statsRef.set(
      {
        transacoesHoje: 0,
        vendasHoje: 0,
        comprasHoje: 0,
        lastDailyReset: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    invalidateCache("stats");
    logger.info("Estatísticas diárias resetadas com sucesso");
  },
);

exports.resetMonthlyStats = onSchedule(
  {
    schedule: "0 0 1 * *",
    timeZone: "America/Sao_Paulo",
    memory: "128MiB",
  },
  async (_event) => {
    logger.info("Resetando estatísticas mensais...");

    const statsRef = db.doc("reports/live_summary");

    await statsRef.set(
      {
        totalVendasMes: 0,
        totalComprasMes: 0,
        totalDespesasMes: 0,
        vendasCountMes: 0,
        comprasCountMes: 0,
        despesasCountMes: 0,
        totalTransacoesMes: 0,
        lastMonthlyReset: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    invalidateCache("stats");
    logger.info("Estatísticas mensais resetadas com sucesso");
  },
);

exports.checkLowStock = onSchedule(
  {
    schedule: "0 8 * * *",
    timeZone: "America/Sao_Paulo",
    memory: "128MiB",
    maxInstances: 1,
  },
  async (_event) => {
    logger.info("Verificando estoque baixo...");

    const inventoryRef = db.doc("inventory/current");
    const inventorySnap = await inventoryRef.get();

    if (!inventorySnap.exists) {
      logger.warn("Inventário não encontrado");
      return;
    }

    const inventory = inventorySnap.data();
    const lowStockItems = [];

    const minLevels = {
      ferro: 100,
      aluminio: 80,
      cobre: 50,
      latinha: 200,
      panela: 25,
      bloco2: 15,
      chapa: 50,
      "perfil pintado": 30,
      "perfil natural": 30,
      bloco: 20,
      metal: 60,
      inox: 30,
      bateria: 40,
      motor_gel: 10,
      roda: 15,
      papelao: 100,
      rad_metal: 35,
      rad_cobre: 30,
      rad_chapa: 25,
      tela: 50,
      antimonio: 10,
      cabo_ai: 40,
      tubo_limpo: 20,
    };

    Object.entries(inventory).forEach(([material, data]) => {
      if (material === "lastUpdated") return; // Ignora metadados
      const minLevel = minLevels[material] || 10;
      const quantidade = data?.quantidade || 0;
      if (quantidade <= minLevel) {
        lowStockItems.push({
          material,
          quantidade,
          minLevel,
          nivel: quantidade < minLevel / 2 ? "critico" : "baixo",
        });
      }
    });

    if (lowStockItems.length > 0) {
      const existingNotification = await db
        .collection("notifications")
        .where("type", "==", "low_stock")
        .where("read", "==", false)
        .limit(1)
        .get();

      if (existingNotification.empty) {
        await db.collection("notifications").add({
          type: "low_stock",
          title: "Alerta de Estoque Baixo",
          message: `${lowStockItems.length} ${lowStockItems.length === 1 ? "material está" : "materiais estão"} com estoque baixo`,
          items: lowStockItems,
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        logger.info(
          `Criada notificação de estoque baixo para ${lowStockItems.length} materiais`,
        );
      } else {
        // Atualiza notificação existente
        await existingNotification.docs[0].ref.update({
          items: lowStockItems,
          message: `${lowStockItems.length} ${lowStockItems.length === 1 ? "material está" : "materiais estão"} com estoque baixo`,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        logger.info(`Atualizada notificação existente de estoque baixo`);
      }
    } else {
      logger.info("Todos os materiais estão com estoque adequado");
    }
  },
);

exports.getLastTransactionPrice = onCall(
  {
    memory: "128MiB",
    timeoutSeconds: 10,
  },
  async (request) => {
    const { material, tipo } = request.data;

    if (!material || !tipo) {
      throw new Error("Material e tipo são obrigatórios");
    }

    try {
      const cacheKey = `lastPrice_${material}_${tipo}`;

      return getCachedData(cacheKey, async () => {
        const snapshot = await db
          .collection("transactions")
          .where("material", "==", material)
          .where("tipo", "==", tipo)
          .orderBy("data", "desc")
          .limit(1)
          .get();

        if (snapshot.empty) {
          return {
            success: false,
            message: "Nenhuma transação anterior encontrada",
          };
        }

        const lastTransaction = snapshot.docs[0].data();

        return {
          success: true,
          precoUnitario: lastTransaction.precoUnitario,
          data: lastTransaction.data,
        };
      });
    } catch (error) {
      logger.error("Erro ao buscar último preço:", error);
      throw new Error(`Erro ao buscar último preço: ${error.message}`);
    }
  },
);

exports.getLiveSummary = onCall(
  {
    memory: "128MiB",
    timeoutSeconds: 10,
  },
  async (_request) => {
    const cacheKey = "live_summary";

    return getCachedData(cacheKey, async () => {
      const statsDoc = await db.doc("reports/live_summary").get();
      if (!statsDoc.exists) {
        return {
          totalVendasMes: 0,
          totalComprasMes: 0,
          totalDespesasMes: 0,
          vendasHoje: 0,
          comprasHoje: 0,
          transacoesHoje: 0,
        };
      }
      return statsDoc.data();
    });
  },
);

exports.cleanupOldReports = onSchedule(
  {
    schedule: "0 3 1 * *", // Primeiro dia do mês às 3h
    timeZone: "America/Sao_Paulo",
    memory: "256MiB",
  },
  async (_event) => {
    logger.info("Limpando relatórios antigos...");

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    const cutoffString = cutoffDate.toISOString().split("T")[0];

    const oldReports = await db
      .collection("daily_reports")
      .where(admin.firestore.FieldPath.documentId(), "<", cutoffString)
      .limit(100) // Processa em lotes
      .get();

    if (oldReports.empty) {
      logger.info("Nenhum relatório antigo para limpar");
      return;
    }

    const batch = db.batch();
    oldReports.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    logger.info(`Removidos ${oldReports.docs.length} relatórios antigos`);
  },
);

/**
 * BACKFILL HISTORY - Gera daily_reports para transações históricas
 *
 * Esta função processa todas as transações antigas que existem no banco
 * e gera os documentos daily_reports que o sistema otimizado precisa.
 *
 * IMPORTANTE: Execute esta função apenas UMA VEZ para preencher o histórico.
 * Após execução, os novos relatórios serão gerados automaticamente pelo
 * generateHistoricalDailyReport agendado.
 *
 * Uso via Firebase Console ou chamada HTTP:
 * - Vá em Functions > backfillHistory > Testar função
 * - Ou chame via código: const backfill = httpsCallable(functions, 'backfillHistory')
 */
exports.backfillHistory = onCall(
  {
    memory: "1GiB", // Mais memória para processar muitos dados
    timeoutSeconds: 540, // 9 minutos (máximo permitido)
    maxInstances: 1, // Apenas uma instância por vez
  },
  async (request) => {
    const { startDate, endDate, forceOverwrite } = request.data || {};

    logger.info("=== INICIANDO BACKFILL DE HISTÓRICO ===");
    logger.info(
      `Parâmetros: startDate=${startDate}, endDate=${endDate}, forceOverwrite=${forceOverwrite}`,
    );

    try {
      // Define período padrão: últimos 12 meses se não especificado
      const end = endDate ? new Date(endDate) : new Date();
      const start = startDate ? new Date(startDate) : new Date(end);
      if (!startDate) {
        start.setMonth(start.getMonth() - 12); // 12 meses atrás
      }

      logger.info(
        `Período de processamento: ${start.toISOString()} até ${end.toISOString()}`,
      );

      // Busca todas as transações no período (em lotes para não estourar memória)
      const BATCH_SIZE = 500;
      let lastDoc = null;
      let totalProcessed = 0;
      let daysProcessed = 0;
      const dailyData = {}; // Agrupa por data

      // Fase 1: Coleta todas as transações e agrupa por dia
      logger.info("Fase 1: Coletando transações...");
      let hasMore = true;

      while (hasMore) {
        let query = db
          .collection("transactions")
          .where("data", ">=", start)
          .where("data", "<=", end)
          .orderBy("data", "asc")
          .limit(BATCH_SIZE);

        if (lastDoc) {
          query = query.startAfter(lastDoc);
        }

        const snapshot = await query.get();

        if (snapshot.empty || snapshot.docs.length < BATCH_SIZE) {
          hasMore = false;
        }

        if (!snapshot.empty) {
          lastDoc = snapshot.docs[snapshot.docs.length - 1];

          snapshot.docs.forEach((doc) => {
            const t = doc.data();

            // Extrai a data da transação
            let transactionDate;
            if (t.data?.toDate) {
              transactionDate = t.data.toDate();
            } else if (t.data instanceof Date) {
              transactionDate = t.data;
            } else if (typeof t.data === "string") {
              transactionDate = new Date(t.data);
            } else {
              return; // Pula transações sem data válida
            }

            const dateString = transactionDate.toISOString().split("T")[0];

            // Inicializa objeto do dia se não existir
            if (!dailyData[dateString]) {
              dailyData[dateString] = {
                date: admin.firestore.Timestamp.fromDate(
                  new Date(dateString + "T00:00:00"),
                ),
                dateString: dateString,
                totalSales: 0,
                totalPurchases: 0,
                totalExpenses: 0,
                totalProfit: 0,
                totalTransactions: 0,
                salesCount: 0,
                purchasesCount: 0,
                expensesCount: 0,
                materialStats: {},
                paymentStats: {},
              };
            }

            const day = dailyData[dateString];
            const valorTotal = t.valorTotal || 0;
            const material = t.material || "outros";
            const formaPagamento = (
              t.formaPagamento || "dinheiro"
            ).toLowerCase();
            const quantidade = t.quantidade || 0;

            day.totalTransactions++;
            totalProcessed++;

            // Agrega por tipo
            if (t.tipo === "venda") {
              day.totalSales += valorTotal;
              day.salesCount++;
            } else if (t.tipo === "compra") {
              day.totalPurchases += valorTotal;
              day.purchasesCount++;
            } else if (t.tipo === "despesa") {
              day.totalExpenses += valorTotal;
              day.expensesCount++;
            }

            // Estatísticas por material
            if (!day.materialStats[material]) {
              day.materialStats[material] = {
                vendas: 0,
                compras: 0,
                quantidade: 0,
                lucro: 0,
                transacoes: 0,
              };
            }

            if (t.tipo === "venda") {
              day.materialStats[material].vendas += valorTotal;
              day.materialStats[material].quantidade -= quantidade;
            } else if (t.tipo === "compra") {
              day.materialStats[material].compras += valorTotal;
              day.materialStats[material].quantidade += quantidade;
            }
            day.materialStats[material].transacoes++;
            day.materialStats[material].lucro =
              day.materialStats[material].vendas -
              day.materialStats[material].compras;

            // Estatísticas por forma de pagamento
            if (!day.paymentStats[formaPagamento]) {
              day.paymentStats[formaPagamento] = { count: 0, total: 0 };
            }
            day.paymentStats[formaPagamento].count++;
            day.paymentStats[formaPagamento].total += valorTotal;
          });

          logger.info(
            `Processado lote: ${totalProcessed} transações até agora...`,
          );
        }
      }

      logger.info(
        `Fase 1 completa: ${totalProcessed} transações coletadas em ${Object.keys(dailyData).length} dias`,
      );

      // Fase 2: Salva os relatórios diários no Firestore
      logger.info("Fase 2: Salvando relatórios diários...");

      const WRITE_BATCH_SIZE = 400; // Firestore limite é 500 por batch
      const dateKeys = Object.keys(dailyData).sort();
      let currentBatch = db.batch();
      let batchCount = 0;
      let skipped = 0;

      for (const dateString of dateKeys) {
        const day = dailyData[dateString];

        // Calcula lucro total do dia
        day.totalProfit =
          day.totalSales - day.totalPurchases - day.totalExpenses;
        day.generatedAt = admin.firestore.FieldValue.serverTimestamp();
        day.generatedBy = "backfillHistory";

        const docRef = db.collection("daily_reports").doc(dateString);

        // Verifica se já existe (a menos que forceOverwrite seja true)
        if (!forceOverwrite) {
          const existing = await docRef.get();
          if (existing.exists) {
            skipped++;
            continue; // Pula dias que já têm relatório
          }
        }

        currentBatch.set(docRef, day);
        batchCount++;
        daysProcessed++;

        // Commit batch quando atingir o limite
        if (batchCount >= WRITE_BATCH_SIZE) {
          await currentBatch.commit();
          logger.info(`Batch salvo: ${daysProcessed} dias processados...`);
          currentBatch = db.batch();
          batchCount = 0;
        }
      }

      // Commit do último batch
      if (batchCount > 0) {
        await currentBatch.commit();
      }

      // Fase 3: Atualiza o live_summary com os totais do mês atual
      logger.info("Fase 3: Atualizando live_summary...");

      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthEnd = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
      );

      // Soma os relatórios do mês atual
      const currentMonthReports = await db
        .collection("daily_reports")
        .where(
          admin.firestore.FieldPath.documentId(),
          ">=",
          currentMonthStart.toISOString().split("T")[0],
        )
        .where(
          admin.firestore.FieldPath.documentId(),
          "<=",
          currentMonthEnd.toISOString().split("T")[0],
        )
        .get();

      const monthStats = {
        totalVendasMes: 0,
        totalComprasMes: 0,
        totalDespesasMes: 0,
        vendasCountMes: 0,
        comprasCountMes: 0,
        despesasCountMes: 0,
        totalTransacoesMes: 0,
      };

      currentMonthReports.docs.forEach((doc) => {
        const data = doc.data();
        monthStats.totalVendasMes += data.totalSales || 0;
        monthStats.totalComprasMes += data.totalPurchases || 0;
        monthStats.totalDespesasMes += data.totalExpenses || 0;
        monthStats.vendasCountMes += data.salesCount || 0;
        monthStats.comprasCountMes += data.purchasesCount || 0;
        monthStats.despesasCountMes += data.expensesCount || 0;
        monthStats.totalTransacoesMes += data.totalTransactions || 0;
      });

      await db.doc("reports/live_summary").set(
        {
          ...monthStats,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastBackfill: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      // Invalida cache
      invalidateCache("stats");
      invalidateCache("reports");

      const result = {
        success: true,
        message: "Backfill concluído com sucesso!",
        stats: {
          totalTransactionsProcessed: totalProcessed,
          daysCreated: daysProcessed,
          daysSkipped: skipped,
          periodStart: start.toISOString().split("T")[0],
          periodEnd: end.toISOString().split("T")[0],
        },
      };

      logger.info("=== BACKFILL CONCLUÍDO ===");
      logger.info(JSON.stringify(result, null, 2));

      return result;
    } catch (error) {
      logger.error("Erro no backfill:", error);
      throw new Error(`Erro no backfill: ${error.message}`);
    }
  },
);

exports.generateMonthReport = onCall(
  {
    memory: "512MiB",
    timeoutSeconds: 300,
    maxInstances: 1,
  },
  async (request) => {
    const { year, month, forceOverwrite } = request.data;

    if (!year || month === undefined) {
      throw new Error(
        "Ano e mês são obrigatórios. Ex: { year: 2025, month: 11 }",
      );
    }

    logger.info(`Gerando relatórios para ${month + 1}/${year}...`);

    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const BATCH_SIZE = 500;
    let lastDoc = null;
    const dailyData = {};
    let totalProcessed = 0;

    let hasMore = true;
    while (hasMore) {
      let query = db
        .collection("transactions")
        .where("data", ">=", start)
        .where("data", "<=", end)
        .orderBy("data", "asc")
        .limit(BATCH_SIZE);

      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }

      const snapshot = await query.get();

      if (snapshot.empty || snapshot.docs.length < BATCH_SIZE) {
        hasMore = false;
      }

      if (!snapshot.empty) {
        lastDoc = snapshot.docs[snapshot.docs.length - 1];

        snapshot.docs.forEach((doc) => {
          const t = doc.data();

          let transactionDate;
          if (t.data?.toDate) {
            transactionDate = t.data.toDate();
          } else if (t.data instanceof Date) {
            transactionDate = t.data;
          } else if (typeof t.data === "string") {
            transactionDate = new Date(t.data);
          } else {
            return;
          }

          const dateString = transactionDate.toISOString().split("T")[0];

          if (!dailyData[dateString]) {
            dailyData[dateString] = {
              date: admin.firestore.Timestamp.fromDate(
                new Date(dateString + "T00:00:00"),
              ),
              dateString: dateString,
              totalSales: 0,
              totalPurchases: 0,
              totalExpenses: 0,
              totalProfit: 0,
              totalTransactions: 0,
              salesCount: 0,
              purchasesCount: 0,
              expensesCount: 0,
              materialStats: {},
              paymentStats: {},
            };
          }

          const day = dailyData[dateString];
          const valorTotal = t.valorTotal || 0;
          const material = t.material || "outros";
          const formaPagamento = (t.formaPagamento || "dinheiro").toLowerCase();
          const quantidade = t.quantidade || 0;

          day.totalTransactions++;
          totalProcessed++;

          if (t.tipo === "venda") {
            day.totalSales += valorTotal;
            day.salesCount++;
          } else if (t.tipo === "compra") {
            day.totalPurchases += valorTotal;
            day.purchasesCount++;
          } else if (t.tipo === "despesa") {
            day.totalExpenses += valorTotal;
            day.expensesCount++;
          }

          if (!day.materialStats[material]) {
            day.materialStats[material] = {
              vendas: 0,
              compras: 0,
              quantidade: 0,
              lucro: 0,
              transacoes: 0,
            };
          }

          if (t.tipo === "venda") {
            day.materialStats[material].vendas += valorTotal;
            day.materialStats[material].quantidade -= quantidade;
          } else if (t.tipo === "compra") {
            day.materialStats[material].compras += valorTotal;
            day.materialStats[material].quantidade += quantidade;
          }
          day.materialStats[material].transacoes++;
          day.materialStats[material].lucro =
            day.materialStats[material].vendas -
            day.materialStats[material].compras;

          if (!day.paymentStats[formaPagamento]) {
            day.paymentStats[formaPagamento] = { count: 0, total: 0 };
          }
          day.paymentStats[formaPagamento].count++;
          day.paymentStats[formaPagamento].total += valorTotal;
        });
      }
    }

    // Salva os relatórios
    const batch = db.batch();
    let daysCreated = 0;
    let skipped = 0;

    for (const [dateString, day] of Object.entries(dailyData)) {
      day.totalProfit = day.totalSales - day.totalPurchases - day.totalExpenses;
      day.generatedAt = admin.firestore.FieldValue.serverTimestamp();
      day.generatedBy = "generateMonthReport";

      const docRef = db.collection("daily_reports").doc(dateString);

      if (!forceOverwrite) {
        const existing = await docRef.get();
        if (existing.exists) {
          skipped++;
          continue;
        }
      }

      batch.set(docRef, day);
      daysCreated++;
    }

    await batch.commit();
    invalidateCache("reports");

    return {
      success: true,
      month: `${month + 1}/${year}`,
      transactionsProcessed: totalProcessed,
      daysCreated,
      daysSkipped: skipped,
    };
  },
);
