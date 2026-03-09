import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  setDoc,
  getDoc,
  where,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// Coleções do Firestore
const TRANSACTIONS_COLLECTION = "transactions";
const INVENTORY_COLLECTION = "inventory";
const DAILY_REPORTS_COLLECTION = "daily_reports";
const LIVE_SUMMARY_COLLECTION = "reports";
const CUSTOMERS_COLLECTION = "clients";

// Funções para Transações
export const addTransaction = async (transaction) => {
  try {
    const transactionData = {
      ...transaction,
      createdAt: new Date(),
      data:
        transaction.data instanceof Date
          ? transaction.data
          : new Date(transaction.data),
    };

    console.log("[v0] Salvando transação com data:", transactionData.data);

    const docRef = await addDoc(
      collection(db, TRANSACTIONS_COLLECTION),
      transactionData,
    );
    console.log("[v0] Transação salva com ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("[v0] Erro ao adicionar transação:", error);
    throw error;
  }
};

export const getTransactions = async () => {
  try {
    const q = query(
      collection(db, TRANSACTIONS_COLLECTION),
      orderBy("data", "desc"),
      limit(100),
    );
    const querySnapshot = await getDocs(q);
    console.log(
      `[v0] getTransactions: Retornando ${querySnapshot.docs.length} transações (LIMITADO a 100)`,
    );
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      data: doc.data().data?.toDate
        ? doc.data().data.toDate()
        : new Date(doc.data().data),
    }));
  } catch (error) {
    console.error("Erro ao buscar transações:", error);
    throw error;
  }
};

export const updateTransaction = async (id, transaction) => {
  try {
    const docRef = doc(db, TRANSACTIONS_COLLECTION, id);
    const updateData = {
      ...transaction,
      data:
        transaction.data instanceof Date
          ? transaction.data
          : new Date(transaction.data),
      updatedAt: new Date(),
    };

    console.log("[v0] Atualizando transação com data:", updateData.data);

    await updateDoc(docRef, updateData);
    console.log("[v0] Transação atualizada com sucesso");
  } catch (error) {
    console.error("[v0] Erro ao atualizar transação:", error);
    throw error;
  }
};

export const deleteTransaction = async (id) => {
  try {
    console.log("[v0] Deletando transação:", id);
    const docRef = doc(db, TRANSACTIONS_COLLECTION, id);

    // CORREÇÃO: Ler os dados da transação ANTES de deletar
    // para poder atualizar o daily_reports correspondente
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.warn("[v0] Transação não encontrada para deletar:", id);
      return;
    }

    const transactionData = docSnap.data();
    const valor =
      Number(transactionData.valorTotal || transactionData.total) || 0;
    const tipo = transactionData.tipo || transactionData.type;
    const quantidade =
      Number(transactionData.quantidade || transactionData.weight) || 0;
    const material = transactionData.material || "";
    const formaPagamento = transactionData.formaPagamento || "dinheiro";

    // Determinar a data da transação para encontrar o daily_report correto
    let transactionDate;
    if (
      transactionData.data &&
      typeof transactionData.data.toDate === "function"
    ) {
      transactionDate = transactionData.data.toDate();
    } else if (transactionData.data instanceof Date) {
      transactionDate = transactionData.data;
    } else if (transactionData.data) {
      transactionDate = new Date(transactionData.data);
    } else {
      transactionDate = new Date();
    }

    // Deletar o documento da transação
    await deleteDoc(docRef);
    console.log("[v0] Transação deletada com sucesso");

    // CORREÇÃO PRINCIPAL: Atualizar o daily_report correspondente
    // para subtrair os valores da transação excluída
    await updateDailyReportAfterDeletion(
      transactionDate,
      tipo,
      valor,
      quantidade,
      material,
      formaPagamento,
    );

    // CORREÇÃO: Também atualizar o live_summary para que o dashboard
    // reflita imediatamente a exclusão da despesa/transação
    await updateLiveSummaryAfterDeletion(tipo, valor);

    console.log("[v0] Daily report e live_summary atualizados após exclusão");
  } catch (error) {
    console.error("[v0] Erro ao deletar transação:", error);
    throw error;
  }
};

/**
 * Atualiza o documento daily_reports correspondente após a exclusão de uma transação.
 * Subtrai os valores da transação excluída dos totais agregados.
 */
async function updateDailyReportAfterDeletion(
  transactionDate,
  tipo,
  valor,
  quantidade,
  material,
  formaPagamento,
) {
  try {
    const dateStr = transactionDate.toISOString().split("T")[0];
    console.log(
      `[v0] Atualizando daily_report do dia ${dateStr} após exclusão`,
    );

    // Buscar o daily_report pelo ID (formato: YYYY-MM-DD)
    const reportRef = doc(db, DAILY_REPORTS_COLLECTION, dateStr);
    const reportSnap = await getDoc(reportRef);

    if (!reportSnap.exists()) {
      // Tentar buscar por query de data se o ID não corresponder
      const dayStart = new Date(transactionDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(transactionDate);
      dayEnd.setHours(23, 59, 59, 999);

      const q = query(
        collection(db, DAILY_REPORTS_COLLECTION),
        where("date", ">=", Timestamp.fromDate(dayStart)),
        where("date", "<=", Timestamp.fromDate(dayEnd)),
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.warn(
          `[v0] Nenhum daily_report encontrado para ${dateStr}. Os totais podem estar desatualizados.`,
        );
        return;
      }

      // Atualizar o primeiro report encontrado para esse dia
      const reportDoc = querySnapshot.docs[0];
      await subtractFromReport(
        reportDoc.ref,
        reportDoc.data(),
        tipo,
        valor,
        quantidade,
        material,
        formaPagamento,
      );
    } else {
      await subtractFromReport(
        reportRef,
        reportSnap.data(),
        tipo,
        valor,
        quantidade,
        material,
        formaPagamento,
      );
    }
  } catch (error) {
    console.error("[v0] Erro ao atualizar daily_report após exclusão:", error);
    // Não lançar erro aqui para não impedir a exclusão da transação
    // O relatório será corrigido na próxima agregação
  }
}

/**
 * Subtrai os valores de uma transação excluída do documento de relatório diário.
 */
async function subtractFromReport(
  reportRef,
  reportData,
  tipo,
  valor,
  quantidade,
  material,
  formaPagamento,
) {
  const updates = {
    totalTransactions: Math.max(0, (reportData.totalTransactions || 0) - 1),
  };

  if (tipo === "venda") {
    updates.totalSales = Math.max(0, (reportData.totalSales || 0) - valor);
    updates.salesCount = Math.max(0, (reportData.salesCount || 0) - 1);
  } else if (tipo === "compra") {
    updates.totalPurchases = Math.max(
      0,
      (reportData.totalPurchases || 0) - valor,
    );
    updates.purchasesCount = Math.max(0, (reportData.purchasesCount || 0) - 1);
  } else if (tipo === "despesa") {
    updates.totalExpenses = Math.max(
      0,
      (reportData.totalExpenses || 0) - valor,
    );
    updates.expensesCount = Math.max(0, (reportData.expensesCount || 0) - 1);
  }

  // Recalcular lucro
  const newSales =
    updates.totalSales !== undefined
      ? updates.totalSales
      : reportData.totalSales || 0;
  const newPurchases =
    updates.totalPurchases !== undefined
      ? updates.totalPurchases
      : reportData.totalPurchases || 0;
  const newExpenses =
    updates.totalExpenses !== undefined
      ? updates.totalExpenses
      : reportData.totalExpenses || 0;
  updates.totalProfit = newSales - newPurchases - newExpenses;

  // Atualizar materialStats se houver material
  if (
    material &&
    reportData.materialStats &&
    reportData.materialStats[material]
  ) {
    const matStats = { ...reportData.materialStats[material] };
    if (tipo === "venda") {
      matStats.vendas = Math.max(0, (matStats.vendas || 0) - valor);
      matStats.quantidade = Math.max(
        0,
        (matStats.quantidade || 0) - quantidade,
      );
    } else if (tipo === "compra") {
      matStats.compras = Math.max(0, (matStats.compras || 0) - valor);
    }
    matStats.transacoes = Math.max(0, (matStats.transacoes || 0) - 1);
    updates.materialStats = {
      ...reportData.materialStats,
      [material]: matStats,
    };
  }

  // Atualizar paymentStats
  if (
    formaPagamento &&
    reportData.paymentStats &&
    reportData.paymentStats[formaPagamento]
  ) {
    const payStats = { ...reportData.paymentStats[formaPagamento] };
    payStats.total = Math.max(0, (payStats.total || 0) - valor);
    payStats.count = Math.max(0, (payStats.count || 0) - 1);
    updates.paymentStats = {
      ...reportData.paymentStats,
      [formaPagamento]: payStats,
    };
  }

  updates.updatedAt = new Date();

  console.log(`[v0] Subtraindo do daily_report: tipo=${tipo}, valor=${valor}`);
  await updateDoc(reportRef, updates);
}

// Normaliza o inventário recebido do Firestore, corrigindo chaves legadas e garantindo
// que todos os campos numéricos sejam números válidos.
function normalizeInventory(rawData) {
  if (!rawData) return {};
  const normalized = {};

  for (const [key, value] of Object.entries(rawData)) {
    // Ignorar campos de metadados
    if (key === "updatedAt") continue;

    // CORREÇÃO: Ignorar chaves corrompidas com ponto (ex: "perfil natural.quantidade")
    // Estas são criadas acidentalmente quando updateDoc usa dot-notation em chaves com espaço
    if (key.includes(".")) {
      console.warn(`[normalizeInventory] Ignorando chave corrompida: "${key}"`);
      continue;
    }

    // Migrar chave legada "perfil" → "perfil natural"
    const normalizedKey = key === "perfil" ? "perfil natural" : key;
    if (typeof value === "object" && value !== null) {
      // Se já existe a chave destino e estamos migrando, somar quantidades
      if (normalizedKey !== key && normalized[normalizedKey]) {
        normalized[normalizedKey].quantidade =
          (normalized[normalizedKey].quantidade || 0) +
          (Number(value.quantidade) || 0);
      } else {
        normalized[normalizedKey] = {
          quantidade: Number(value.quantidade) || 0,
          precoCompra: Number(value.precoCompra) || 0,
          precoVenda: Number(value.precoVenda) || 0,
        };
      }
    }
  }

  return normalized;
}

// Funções para Inventário
export const getInventory = async () => {
  try {
    const docRef = doc(db, INVENTORY_COLLECTION, "current");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return normalizeInventory(docSnap.data());
    } else {
      const initialInventory = {
        ferro: { quantidade: 0, precoCompra: 2.5, precoVenda: 3.2 },
        aluminio: { quantidade: 0, precoCompra: 8.5, precoVenda: 10.8 },
        cobre: { quantidade: 0, precoCompra: 25.0, precoVenda: 32.0 },
        latinha: { quantidade: 0, precoCompra: 4.2, precoVenda: 5.5 },
        panela: { quantidade: 0, precoCompra: 3.0, precoVenda: 4.0 },
        bloco2: { quantidade: 0, precoCompra: 1.8, precoVenda: 2.5 },
        chapa: { quantidade: 0, precoCompra: 2.2, precoVenda: 3.0 },
        "perfil natural": { quantidade: 0, precoCompra: 2.8, precoVenda: 3.8 },
        "perfil pintado": { quantidade: 0, precoCompra: 2.8, precoVenda: 3.8 },
        bloco: { quantidade: 0, precoCompra: 1.5, precoVenda: 2.2 },
        metal: { quantidade: 0, precoCompra: 2.0, precoVenda: 2.8 },
        inox: { quantidade: 0, precoCompra: 12.0, precoVenda: 15.0 },
        bateria: { quantidade: 0, precoCompra: 8.0, precoVenda: 12.0 },
        motor_gel: { quantidade: 0, precoCompra: 15.0, precoVenda: 20.0 },
        roda: { quantidade: 0, precoCompra: 5.0, precoVenda: 7.0 },
        papelao: { quantidade: 0, precoCompra: 0.8, precoVenda: 1.2 },
        papel_branco: { quantidade: 0, precoCompra: 1.0, precoVenda: 1.5 },
        rad_metal: { quantidade: 0, precoCompra: 3.5, precoVenda: 4.5 },
        rad_cobre: { quantidade: 0, precoCompra: 28.0, precoVenda: 35.0 },
        rad_chapa: { quantidade: 0, precoCompra: 2.8, precoVenda: 3.6 },
        tela: { quantidade: 0, precoCompra: 1.5, precoVenda: 2.0 },
        antimonio: { quantidade: 0, precoCompra: 45.0, precoVenda: 55.0 },
        cabo_ai: { quantidade: 0, precoCompra: 12.0, precoVenda: 16.0 },
        tubo_limpo: { quantidade: 0, precoCompra: 4.0, precoVenda: 5.5 },
        cobre_mel: { quantidade: 0, precoCompra: 20.0, precoVenda: 26.0 },
        bronze: { quantidade: 0, precoCompra: 15.0, precoVenda: 20.0 },
        magnesio: { quantidade: 0, precoCompra: 18.0, precoVenda: 24.0 },
      };
      await setDoc(docRef, initialInventory);
      return initialInventory;
    }
  } catch (error) {
    console.error("Erro ao buscar inventário:", error);
    throw error;
  }
};

export const updateInventory = async (inventory) => {
  try {
    const docRef = doc(db, INVENTORY_COLLECTION, "current");
    await setDoc(docRef, {
      ...inventory,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error("Erro ao atualizar inventário:", error);
    throw error;
  }
};

// Localize no firebaseService.js
export const updateInventoryQuantity = async (material, quantidade, tipo) => {
  try {
    const docRef = doc(db, INVENTORY_COLLECTION, "current");
    const docSnap = await getDoc(docRef);

    let currentInventory = docSnap.exists() ? docSnap.data() : {};

    // CORREÇÃO: Normalizar chaves legadas (ex: "perfil" → "perfil natural")
    if (
      "perfil" in currentInventory &&
      !("perfil natural" in currentInventory)
    ) {
      currentInventory["perfil natural"] = currentInventory["perfil"];
      delete currentInventory["perfil"];
    }

    // Força a inicialização como objeto caso não exista
    if (
      !currentInventory[material] ||
      typeof currentInventory[material] !== "object"
    ) {
      currentInventory[material] = {
        quantidade: 0,
        precoCompra: 0,
        precoVenda: 0,
      };
    }

    // Lógica de cálculo
    const valorAtual = Number(currentInventory[material].quantidade) || 0;
    let novaQuantidade;
    if (tipo === "compra") {
      novaQuantidade = valorAtual + Number(quantidade);
    } else if (tipo === "venda") {
      novaQuantidade = Math.max(0, valorAtual - Number(quantidade));
    } else {
      novaQuantidade = valorAtual;
    }

    currentInventory[material] = {
      ...currentInventory[material],
      quantidade: novaQuantidade,
      updatedAt: new Date(),
    };

    // CORREÇÃO CRÍTICA: Usar setDoc com merge:false para garantir que campos com
    // espaços no nome (ex: "perfil natural", "perfil pintado") sejam gravados corretamente.
    // Construímos um objeto limpo sem referências que possam causar problemas.
    const inventoryToSave = {};
    for (const [key, value] of Object.entries(currentInventory)) {
      if (key === "updatedAt" || key.includes(".")) continue;
      {
        inventoryToSave[key] = {
          quantidade: Number(value.quantidade) || 0,
          precoCompra: Number(value.precoCompra) || 0,
          precoVenda: Number(value.precoVenda) || 0,
        };
      }
    }
    inventoryToSave.updatedAt = new Date();

    await setDoc(docRef, inventoryToSave);

    console.log(
      `[v0] updateInventoryQuantity: ${material} → ${novaQuantidade}kg (tipo=${tipo})`,
    );
    return novaQuantidade;
  } catch (error) {
    console.error("Erro ao atualizar inventário:", error);
    throw error;
  }
};

export const subscribeToTransactions = (callback) => {
  const q = query(
    collection(db, TRANSACTIONS_COLLECTION),
    orderBy("data", "desc"),
    limit(50),
  );
  console.log(
    "[v0] subscribeToTransactions: Listener configurado com LIMIT(50)",
  );
  return onSnapshot(q, (querySnapshot) => {
    const transactions = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      data: doc.data().data?.toDate
        ? doc.data().data.toDate()
        : new Date(doc.data().data),
    }));
    console.log(
      `[v0] subscribeToTransactions: ${transactions.length} transações recebidas`,
    );
    callback(transactions);
  });
};

export const subscribeToInventory = (callback) => {
  const docRef = doc(db, INVENTORY_COLLECTION, "current");
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const normalized = normalizeInventory(docSnap.data());
      console.log(
        "[v0] subscribeToInventory: inventário normalizado recebido, chaves:",
        Object.keys(normalized),
      );
      callback(normalized);
    }
  });
};

export const getLiveSummary = async () => {
  try {
    console.log(
      "[v0] getLiveSummary: Buscando resumo em tempo real (1 leitura)",
    );
    const docRef = doc(db, LIVE_SUMMARY_COLLECTION, "live_summary");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log("[v0] getLiveSummary: Resumo encontrado");
      return docSnap.data();
    } else {
      console.log(
        "[v0] getLiveSummary: Documento não existe, retornando valores padrão",
      );
      return {
        totalVendas: 0,
        totalCompras: 0,
        totalDespesas: 0,
        totalLucro: 0,
        totalTransacoes: 0,
        vendasHoje: 0,
        comprasHoje: 0,
        transacoesHoje: 0,
        totalVendasMes: 0,
        totalComprasMes: 0,
        totalDespesasMes: 0,
      };
    }
  } catch (error) {
    console.error("[v0] Erro ao buscar live_summary:", error);
    throw error;
  }
};

export const subscribeToLiveSummary = (callback) => {
  console.log(
    "[v0] subscribeToLiveSummary: Configurando listener para live_summary",
  );
  const docRef = doc(db, LIVE_SUMMARY_COLLECTION, "live_summary");
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      console.log("[v0] live_summary atualizado");
      callback(docSnap.data());
    } else {
      console.log("[v0] live_summary não existe");
      callback(null);
    }
  });
};

export const getTransactionsByPeriod = async (startDate, endDate) => {
  try {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const startTimestamp = Timestamp.fromDate(start);
    const endTimestamp = Timestamp.fromDate(end);

    console.log(
      `[v0] getTransactionsByPeriod: Buscando de ${start.toISOString()} até ${end.toISOString()}`,
    );

    const q = query(
      collection(db, TRANSACTIONS_COLLECTION),
      where("data", ">=", startTimestamp),
      where("data", "<=", endTimestamp),
      orderBy("data", "desc"),
    );

    const querySnapshot = await getDocs(q);
    console.log(`[v0] Query retornou ${querySnapshot.docs.length} documentos`);

    return querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      let transactionDate;

      if (data.data && typeof data.data.toDate === "function") {
        transactionDate = data.data.toDate();
      } else if (data.data instanceof Date) {
        transactionDate = data.data;
      } else if (data.data) {
        transactionDate = new Date(data.data);
      } else {
        transactionDate = new Date();
      }

      return {
        id: docSnap.id,
        ...data,
        data: transactionDate,
      };
    });
  } catch (error) {
    console.error("Erro ao buscar transações por período:", error);
    throw error;
  }
};

/**
 * Busca relatórios diários agregados diretamente da coleção 'daily_reports'.
 * Nível Sênior: Reduz drasticamente o consumo de leituras ao evitar ler transação por transação.
 */
export const getAggregatedReport = async (startDate, endDate) => {
  try {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const q = query(
      collection(db, DAILY_REPORTS_COLLECTION),
      where("date", ">=", Timestamp.fromDate(start)),
      where("date", "<=", Timestamp.fromDate(end)),
      orderBy("date", "asc"),
    );

    const querySnapshot = await getDocs(q);
    const reports = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.date?.toDate() || new Date(data.date),
      };
    });

    // Calcular totais agregados para facilitar o uso no dashboard
    const totals = reports.reduce(
      (acc, curr) => ({
        totalSales: acc.totalSales + (curr.totalSales || 0),
        totalPurchases: acc.totalPurchases + (curr.totalPurchases || 0),
        totalExpenses: acc.totalExpenses + (curr.totalExpenses || 0),
        totalProfit: acc.totalProfit + (curr.totalProfit || 0),
        totalTransactions:
          acc.totalTransactions + (curr.totalTransactions || 0),
      }),
      {
        totalSales: 0,
        totalPurchases: 0,
        totalExpenses: 0,
        totalProfit: 0,
        totalTransactions: 0,
      },
    );

    return { reports, totals };
  } catch (error) {
    console.error("[v0] Erro ao buscar relatórios agregados:", error);
    // Fallback para processamento manual se a coleção estiver vazia ou falhar
    // Nível Sênior: Retornar array vazio em vez de ler todas as transações
    console.warn(
      "[v0] Coleção daily_reports vazia ou erro. Retornando vazio para evitar excesso de leituras.",
    );
    return {
      reports: [],
      totals: {
        totalSales: 0,
        totalPurchases: 0,
        totalExpenses: 0,
        totalProfit: 0,
        totalTransactions: 0,
      },
    };
  }
};

export const getDailyReports = async (startDate, endDate) => {
  try {
    // Tentar primeiro a coleção agregada
    const { reports } = await getAggregatedReport(startDate, endDate);
    if (reports && reports.length > 0) return reports;

    // Se não houver dados agregados, buscar transações apenas como último recurso
    console.log(
      "[v0] getDailyReports: Buscando transações individuais (fallback caro)",
    );
    const transactions = await getTransactionsByPeriod(startDate, endDate);
    return processTransactionsToDailyReports(transactions);
  } catch (error) {
    console.error("Erro ao gerar relatórios diários:", error);
    throw error;
  }
};

function processTransactionsToDailyReports(transactions) {
  const dailyMap = {};

  transactions.forEach((t) => {
    const dateStr = t.data.toISOString().split("T")[0];
    if (!dailyMap[dateStr]) {
      dailyMap[dateStr] = {
        date: new Date(dateStr),
        totalSales: 0,
        totalPurchases: 0,
        totalExpenses: 0,
        totalTransactions: 0,
        materialStats: {},
        paymentStats: {},
      };
    }

    const report = dailyMap[dateStr];
    const valor = Number.parseFloat(t.valorTotal) || 0;
    const quantidade = Number.parseFloat(t.quantidade) || 0;

    report.totalTransactions++;

    if (t.tipo === "venda") {
      report.totalSales += valor;
    } else if (t.tipo === "compra") {
      report.totalPurchases += valor;
    } else if (t.tipo === "despesa") {
      report.totalExpenses += valor;
    }

    if (t.material) {
      if (!report.materialStats[t.material]) {
        report.materialStats[t.material] = {
          vendas: 0,
          compras: 0,
          quantidade: 0,
          transacoes: 0,
        };
      }
      if (t.tipo === "venda") {
        report.materialStats[t.material].vendas += valor;
        report.materialStats[t.material].quantidade += quantidade;
      } else if (t.tipo === "compra") {
        report.materialStats[t.material].compras += valor;
      }
      report.materialStats[t.material].transacoes++;
    }

    const pagamento = t.formaPagamento || "dinheiro";
    if (!report.paymentStats[pagamento]) {
      report.paymentStats[pagamento] = { total: 0, count: 0 };
    }
    report.paymentStats[pagamento].total += valor;
    report.paymentStats[pagamento].count++;
  });

  Object.values(dailyMap).forEach((report) => {
    report.totalProfit =
      report.totalSales - report.totalPurchases - report.totalExpenses;
  });

  return Object.values(dailyMap).sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );
}

export const getMonthlyReport = async (year, month) => {
  try {
    console.log("[v0] Generating monthly report:", { year, month });

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Tentar usar relatórios agregados primeiro
    const { reports: dailyReports } = await getAggregatedReport(
      startDate,
      endDate,
    );

    const monthlyStats = {
      year,
      month,
      totalSales: 0,
      totalPurchases: 0,
      totalExpenses: 0,
      totalProfit: 0,
      totalTransactions: 0,
      materialStats: {},
      dailyBreakdown: dailyReports,
    };

    dailyReports.forEach((report) => {
      monthlyStats.totalSales += report.totalSales || 0;
      monthlyStats.totalPurchases += report.totalPurchases || 0;
      monthlyStats.totalExpenses += report.totalExpenses || 0;
      monthlyStats.totalProfit += report.totalProfit || 0;
      monthlyStats.totalTransactions += report.totalTransactions || 0;

      Object.entries(report.materialStats || {}).forEach(
        ([material, stats]) => {
          if (!monthlyStats.materialStats[material]) {
            monthlyStats.materialStats[material] = {
              vendas: 0,
              compras: 0,
              quantidade: 0,
              lucro: 0,
            };
          }
          monthlyStats.materialStats[material].vendas += stats.vendas || 0;
          monthlyStats.materialStats[material].compras += stats.compras || 0;
          monthlyStats.materialStats[material].quantidade +=
            stats.quantidade || 0;
          monthlyStats.materialStats[material].lucro += stats.lucro || 0;
        },
      );
    });

    console.log(
      `[v0] Monthly report generated from ${dailyReports.length} daily reports`,
    );
    return monthlyStats;
  } catch (error) {
    console.error("[v0] Erro ao gerar relatório mensal:", error);
    throw error;
  }
};

export const getYearlyReport = async (year) => {
  try {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    // Tentar usar relatórios agregados primeiro
    const { reports: dailyReports } = await getAggregatedReport(
      startDate,
      endDate,
    );

    const yearlyStats = {
      year,
      totalSales: 0,
      totalPurchases: 0,
      totalExpenses: 0,
      totalProfit: 0,
      totalTransactions: 0,
      materialStats: {},
      monthlyBreakdown: {},
    };

    dailyReports.forEach((report) => {
      const month = report.date.getMonth() + 1;

      if (!yearlyStats.monthlyBreakdown[month]) {
        yearlyStats.monthlyBreakdown[month] = {
          totalSales: 0,
          totalPurchases: 0,
          totalExpenses: 0,
          totalProfit: 0,
          totalTransactions: 0,
        };
      }

      yearlyStats.totalSales += report.totalSales || 0;
      yearlyStats.totalPurchases += report.totalPurchases || 0;
      yearlyStats.totalExpenses += report.totalExpenses || 0;
      yearlyStats.totalProfit += report.totalProfit || 0;
      yearlyStats.totalTransactions += report.totalTransactions || 0;

      yearlyStats.monthlyBreakdown[month].totalSales += report.totalSales || 0;
      yearlyStats.monthlyBreakdown[month].totalPurchases +=
        report.totalPurchases || 0;
      yearlyStats.monthlyBreakdown[month].totalExpenses +=
        report.totalExpenses || 0;
      yearlyStats.monthlyBreakdown[month].totalProfit +=
        report.totalProfit || 0;
      yearlyStats.monthlyBreakdown[month].totalTransactions +=
        report.totalTransactions || 0;

      Object.entries(report.materialStats || {}).forEach(
        ([material, stats]) => {
          if (!yearlyStats.materialStats[material]) {
            yearlyStats.materialStats[material] = {
              vendas: 0,
              compras: 0,
              quantidade: 0,
              lucro: 0,
            };
          }
          yearlyStats.materialStats[material].vendas += stats.vendas || 0;
          yearlyStats.materialStats[material].compras += stats.compras || 0;
          yearlyStats.materialStats[material].quantidade +=
            stats.quantidade || 0;
          yearlyStats.materialStats[material].lucro += stats.lucro || 0;
        },
      );
    });

    return yearlyStats;
  } catch (error) {
    console.error("Erro ao gerar relatório anual:", error);
    throw error;
  }
};

export const updateInventoryItem = async (material, data) => {
  try {
    const docRef = doc(db, INVENTORY_COLLECTION, "current");
    const docSnap = await getDoc(docRef);

    // CORREÇÃO: Normalizar o inventário existente antes de atualizar
    let currentInventory = docSnap.exists()
      ? normalizeInventory(docSnap.data())
      : {};

    currentInventory[material] = {
      quantidade: Number(currentInventory[material]?.quantidade) || 0,
      precoCompra:
        Number(data.precoCompra ?? currentInventory[material]?.precoCompra) ||
        0,
      precoVenda:
        Number(data.precoVenda ?? currentInventory[material]?.precoVenda) || 0,
      ...(data.quantidade !== undefined && {
        quantidade: Number(data.quantidade),
      }),
    };

    // Salvar limpo (sem campos updatedAt por item, apenas no root)
    const inventoryToSave = {};
    for (const [key, value] of Object.entries(currentInventory)) {
      inventoryToSave[key] = {
        quantidade: Number(value.quantidade) || 0,
        precoCompra: Number(value.precoCompra) || 0,
        precoVenda: Number(value.precoVenda) || 0,
      };
    }
    inventoryToSave.updatedAt = new Date();

    await setDoc(docRef, inventoryToSave);
    return inventoryToSave;
  } catch (error) {
    console.error("Erro ao atualizar item do inventário:", error);
    throw error;
  }
};

export const getAllTransactions = async () => {
  try {
    const q = query(
      collection(db, TRANSACTIONS_COLLECTION),
      orderBy("data", "desc"),
    );
    const querySnapshot = await getDocs(q);
    console.log(
      `[v0] getAllTransactions: Retornando ${querySnapshot.docs.length} transações (SEM LIMITE)`,
    );
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      data: doc.data().data?.toDate
        ? doc.data().data.toDate()
        : new Date(doc.data().data),
    }));
  } catch (error) {
    console.error("Erro ao buscar todas as transações:", error);
    throw error;
  }
};

// =============================================
// FUNÇÕES PARA CLIENTES
// =============================================

export const addCustomer = async (customer) => {
  try {
    const customerData = {
      ...customer,
      saldo: customer.saldo || 0,
      totalCompras: 0,
      totalVendas: 0,
      totalEmprestimos: 0,
      totalPagamentos: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      ativo: true,
    };

    console.log("[v0] Salvando cliente:", customerData.nome);
    const docRef = await addDoc(
      collection(db, CUSTOMERS_COLLECTION),
      customerData,
    );
    console.log("[v0] Cliente salvo com ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("[v0] Erro ao adicionar cliente:", error);
    throw error;
  }
};

export const getCustomers = async () => {
  try {
    const q = query(
      collection(db, CUSTOMERS_COLLECTION),
      orderBy("nome", "asc"),
    );
    const querySnapshot = await getDocs(q);
    console.log(
      `[v0] getCustomers: Retornando ${querySnapshot.docs.length} clientes`,
    );
    return querySnapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt?.toDate
        ? docSnap.data().createdAt.toDate()
        : new Date(),
      updatedAt: docSnap.data().updatedAt?.toDate
        ? docSnap.data().updatedAt.toDate()
        : new Date(),
    }));
  } catch (error) {
    console.error("[v0] Erro ao buscar clientes:", error);
    throw error;
  }
};

export const getCustomerById = async (id) => {
  try {
    const docRef = doc(db, CUSTOMERS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate
          ? docSnap.data().createdAt.toDate()
          : new Date(),
        updatedAt: docSnap.data().updatedAt?.toDate
          ? docSnap.data().updatedAt.toDate()
          : new Date(),
      };
    }
    return null;
  } catch (error) {
    console.error("[v0] Erro ao buscar cliente:", error);
    throw error;
  }
};

export const updateCustomer = async (id, customerData) => {
  try {
    const docRef = doc(db, CUSTOMERS_COLLECTION, id);
    await updateDoc(docRef, {
      ...customerData,
      updatedAt: new Date(),
    });
    console.log("[v0] Cliente atualizado:", id);
  } catch (error) {
    console.error("[v0] Erro ao atualizar cliente:", error);
    throw error;
  }
};

export const deleteCustomer = async (id) => {
  try {
    const docRef = doc(db, CUSTOMERS_COLLECTION, id);
    await deleteDoc(docRef);
    console.log("[v0] Cliente deletado:", id);
  } catch (error) {
    console.error("[v0] Erro ao deletar cliente:", error);
    throw error;
  }
};

export const subscribeToCustomers = (callback) => {
  const q = query(collection(db, CUSTOMERS_COLLECTION), orderBy("nome", "asc"));
  console.log("[v0] subscribeToCustomers: Listener configurado");
  return onSnapshot(q, (querySnapshot) => {
    const customers = querySnapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt?.toDate
        ? docSnap.data().createdAt.toDate()
        : new Date(),
      updatedAt: docSnap.data().updatedAt?.toDate
        ? docSnap.data().updatedAt.toDate()
        : new Date(),
    }));
    console.log(
      `[v0] subscribeToCustomers: ${customers.length} clientes recebidos`,
    );
    callback(customers);
  });
};

export const getCustomerTransactions = async (customerId, customerName) => {
  try {
    const allTransactions = await getAllTransactions();

    const customerTransactions = allTransactions.filter((t) => {
      const transactionClient = t.vendedor || t.cliente || "";
      return (
        (customerName &&
          transactionClient.toLowerCase() === customerName.toLowerCase()) ||
        t.clienteId === customerId
      );
    });

    console.log(
      `[v0] getCustomerTransactions: ${customerTransactions.length} transações encontradas para ${customerName}`,
    );
    return customerTransactions;
  } catch (error) {
    console.error("[v0] Erro ao buscar transações do cliente:", error);
    throw error;
  }
};

export const updateCustomerBalance = async (customerId, amount, type) => {
  try {
    const docRef = doc(db, CUSTOMERS_COLLECTION, customerId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const currentData = docSnap.data();
      let newBalance = Number(currentData.saldo || 0);
      let totalEmprestimos = Number(currentData.totalEmprestimos || 0);
      let totalPagamentos = Number(currentData.totalPagamentos || 0);

      if (type === "emprestimo") {
        newBalance += Number(amount);
        totalEmprestimos += Number(amount);
      } else if (type === "pagamento") {
        newBalance -= Number(amount);
        totalPagamentos += Number(amount);
      }

      await updateDoc(docRef, {
        saldo: newBalance,
        totalEmprestimos,
        totalPagamentos,
        updatedAt: new Date(),
      });
      console.log(
        `[v0] Saldo do cliente ${customerId} atualizado: ${newBalance}`,
      );
      return newBalance;
    }
  } catch (error) {
    console.error("[v0] Erro ao atualizar saldo do cliente:", error);
    throw error;
  }
};

/**
 * Atualiza o documento live_summary após a exclusão de uma transação.
 * Subtrai os valores da transação excluída dos totais globais.
 */
async function updateLiveSummaryAfterDeletion(tipo, valor) {
  try {
    const summaryRef = doc(db, LIVE_SUMMARY_COLLECTION, "live_summary");
    const summarySnap = await getDoc(summaryRef);

    if (!summarySnap.exists()) {
      console.warn("[v0] live_summary não existe, pulando atualização");
      return;
    }

    const summaryData = summarySnap.data();
    const updates = { updatedAt: new Date() };

    if (tipo === "venda") {
      updates.totalVendas = Math.max(0, (summaryData.totalVendas || 0) - valor);
      updates.totalVendasMes = Math.max(
        0,
        (summaryData.totalVendasMes || 0) - valor,
      );
    } else if (tipo === "compra") {
      updates.totalCompras = Math.max(
        0,
        (summaryData.totalCompras || 0) - valor,
      );
      updates.totalComprasMes = Math.max(
        0,
        (summaryData.totalComprasMes || 0) - valor,
      );
    } else if (tipo === "despesa") {
      updates.totalDespesas = Math.max(
        0,
        (summaryData.totalDespesas || 0) - valor,
      );
      updates.totalDespesasMes = Math.max(
        0,
        (summaryData.totalDespesasMes || 0) - valor,
      );
    }

    // Recalcular totais
    const newVendas =
      updates.totalVendas !== undefined
        ? updates.totalVendas
        : summaryData.totalVendas || 0;
    const newCompras =
      updates.totalCompras !== undefined
        ? updates.totalCompras
        : summaryData.totalCompras || 0;
    const newDespesas =
      updates.totalDespesas !== undefined
        ? updates.totalDespesas
        : summaryData.totalDespesas || 0;
    updates.totalLucro = newVendas - newCompras - newDespesas;
    updates.totalTransacoes = Math.max(
      0,
      (summaryData.totalTransacoes || 0) - 1,
    );

    console.log(
      `[v0] Atualizando live_summary após exclusão: tipo=${tipo}, valor=${valor}`,
    );
    await updateDoc(summaryRef, updates);
  } catch (error) {
    console.error("[v0] Erro ao atualizar live_summary após exclusão:", error);
    // Não lançar erro para não impedir a exclusão
  }
}
