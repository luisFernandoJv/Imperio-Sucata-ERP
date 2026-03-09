"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  addTransaction as addTransactionToFirebase,
  getTransactions,
  getInventory,
  updateInventoryItem,
  updateTransaction as updateTransactionFirebase,
  deleteTransaction as deleteTransactionFirebase,
  subscribeToTransactions,
  subscribeToInventory,
  getDailyReports,
  getMonthlyReport,
  getYearlyReport,
  getLiveSummary,
  subscribeToLiveSummary,
  getTransactionsByPeriod,
  subscribeToCustomers,
} from "../lib/firebaseService";

const DataContext = createContext();

export const useData = () => useContext(DataContext);

const initialTransactions = [
  {
    id: 1,
    type: "compra",
    material: "plástico",
    weight: 10,
    pricePerKg: 2,
    total: 20,
    date: new Date().toISOString(),
  },
  {
    id: 2,
    type: "venda",
    material: "vidro",
    weight: 5,
    pricePerKg: 3,
    total: 15,
    date: new Date().toISOString(),
  },
];

export const DataProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [inventory, setInventory] = useState({});
  const [customers, setCustomers] = useState([]);
  const [liveSummary, setLiveSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [firebaseConnected, setFirebaseConnected] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [realTimeSync, setRealTimeSync] = useState(true);

  useEffect(() => {
    setLoading(true);
    console.log("[v0] Configurando listeners em tempo real...");

    let unsubscribeTransactions = null;
    let unsubscribeInventory = null;
    let unsubscribeLiveSummary = null;
    let unsubscribeCustomers = null;

    // 1. Listener de Transações isolado
    try {
      unsubscribeTransactions = subscribeToTransactions(
        (firebaseTransactions) => {
          setTransactions(firebaseTransactions);
          localStorage.setItem(
            "recyclingTransactions",
            JSON.stringify(firebaseTransactions),
          );
          setFirebaseConnected(true);
          setLastSyncTime(new Date());
        },
      );
    } catch (error) {
      console.error("[v0] Erro no listener de Transações:", error);
    }

    // 2. Listener de Inventário isolado (O que estava travando o Estoque)
    try {
      unsubscribeInventory = subscribeToInventory((firebaseInventory) => {
        setInventory(firebaseInventory);
        localStorage.setItem(
          "recycling_inventory",
          JSON.stringify(firebaseInventory),
        );
      });
    } catch (error) {
      console.error("[v0] Erro no listener de Inventário:", error);
    }

    // 3. Listener de Resumo isolado
    try {
      unsubscribeLiveSummary = subscribeToLiveSummary((summary) => {
        setLiveSummary(summary);
      });
    } catch (error) {
      console.error("[v0] Erro no listener de Resumo:", error);
    }

    // 4. Listener de Clientes isolado
    try {
      unsubscribeCustomers = subscribeToCustomers((firebaseCustomers) => {
        setCustomers(firebaseCustomers);
        localStorage.setItem(
          "recycling_customers",
          JSON.stringify(firebaseCustomers),
        );
      });
    } catch (error) {
      console.error("[v0] Erro no listener de Clientes:", error);
    }

    setLoading(false);
    setSyncing(false);

    return () => {
      console.log("[v0] Desligando listeners...");
      if (unsubscribeTransactions) unsubscribeTransactions();
      if (unsubscribeInventory) unsubscribeInventory();
      if (unsubscribeLiveSummary) unsubscribeLiveSummary();
      if (unsubscribeCustomers) unsubscribeCustomers();
    };
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      console.log("[v0] Conexão restaurada");
      setFirebaseConnected(true);
    };

    const handleOffline = () => {
      console.log("[v0] Conexão perdida, modo offline ativado");
      setFirebaseConnected(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const fetchLiveSummary = async () => {
    try {
      console.log("[v0] Fetching live_summary manually (1 read)");
      const summary = await getLiveSummary();
      setLiveSummary(summary);
      return summary;
    } catch (error) {
      console.error("[v0] Erro ao buscar live_summary:", error);
      throw error;
    }
  };

  const refreshData = async () => {
    if (syncing) return;
    try {
      setSyncing(true);
      console.log("[v0] Sincronizando dados do Firebase manualmente...");
      const [firebaseTransactions, firebaseInventory, summary] =
        await Promise.all([
          getTransactions(),
          getInventory(),
          getLiveSummary(),
        ]);

      setTransactions(firebaseTransactions);
      localStorage.setItem(
        "recyclingTransactions",
        JSON.stringify(firebaseTransactions),
      );

      setInventory(firebaseInventory);
      localStorage.setItem(
        "recycling_inventory",
        JSON.stringify(firebaseInventory),
      );

      setLiveSummary(summary);

      setLastSyncTime(new Date());
      console.log("[v0] Sincronização manual concluída.");
    } catch (error) {
      console.error("[v0] Erro ao sincronizar dados manualmente:", error);
      setFirebaseConnected(false);
    } finally {
      setSyncing(false);
    }
  };

  const addTransaction = async (transaction) => {
    try {
      console.log("[v0] DataContext: Adicionando transação:", transaction);

      const transactionDate =
        transaction.data instanceof Date
          ? transaction.data
          : new Date(transaction.data);

      const normalizedTransaction = {
        tipo: transaction.type || transaction.tipo,
        material: transaction.material,
        quantidade: transaction.weight || transaction.quantidade,
        precoUnitario: transaction.pricePerKg || transaction.precoUnitario,
        valorTotal: transaction.total || transaction.valorTotal,
        vendedor: transaction.vendedor || "",
        observacoes: transaction.observacoes || "",
        data: transactionDate,
        formaPagamento: transaction.formaPagamento || "dinheiro",
        numeroTransacao: transaction.numeroTransacao || "",
        clienteId: transaction.clienteId || "",
      };

      console.log(
        "[v0] DataContext: Transação normalizada com data:",
        normalizedTransaction.data,
      );

      await addTransactionToFirebase(normalizedTransaction);

      // CORREÇÃO CRÍTICA: Atualizar o inventário após salvar a transação
      const { updateInventoryQuantity } =
        await import("../lib/firebaseService");
      const quantidade = normalizedTransaction.quantidade;
      const tipo = normalizedTransaction.tipo;
      const material = normalizedTransaction.material;

      console.log(
        `[v0] DataContext: Atualizando estoque - material=${material}, quantidade=${quantidade}, tipo=${tipo}`,
      );

      await updateInventoryQuantity(material, quantidade, tipo);

      console.log(
        `[v0] DataContext: Estoque atualizado com sucesso para ${material}`,
      );
    } catch (error) {
      console.error(
        "[v0] DataContext: Erro ao adicionar transação ao Firebase:",
        error,
      );
      setFirebaseConnected(false);

      const localTransaction = {
        ...transaction,
        id: Date.now(),
        date: new Date().toISOString(),
        synced: false,
      };
      const updatedTransactions = [localTransaction, ...transactions];
      setTransactions(updatedTransactions);
      localStorage.setItem(
        "recyclingTransactions",
        JSON.stringify(updatedTransactions),
      );
      console.log("[v0] DataContext: Transação salva localmente como fallback");
      throw error; // Relançar o erro para que o frontend saiba que falhou
    }
  };

  const editTransaction = async (id, updatedTransaction) => {
    try {
      console.log("[v0] DataContext: Editando transação:", id);

      const transactionDate =
        updatedTransaction.data instanceof Date
          ? updatedTransaction.data
          : new Date(updatedTransaction.data);

      const normalizedTransaction = {
        tipo: updatedTransaction.type || updatedTransaction.tipo,
        material: updatedTransaction.material,
        quantidade: updatedTransaction.weight || updatedTransaction.quantidade,
        precoUnitario:
          updatedTransaction.pricePerKg || updatedTransaction.precoUnitario,
        valorTotal: updatedTransaction.total || updatedTransaction.valorTotal,
        vendedor: updatedTransaction.vendedor || "",
        observacoes: updatedTransaction.observacoes || "",
        data: transactionDate,
        formaPagamento: updatedTransaction.formaPagamento || "dinheiro",
        numeroTransacao: updatedTransaction.numeroTransacao || "",
        clienteId: updatedTransaction.clienteId || "",
      };

      console.log(
        "[v0] DataContext: Transação normalizada com data:",
        normalizedTransaction.data,
      );

      await updateTransactionFirebase(id, normalizedTransaction);

      // CORRECAO CRITICA: Recalcular o estoque apos editar a transacao
      const oldTransaction = transactions.find((t) => t.id === id);
      if (oldTransaction) {
        const { updateInventoryQuantity } =
          await import("../lib/firebaseService");

        const oldQuantidade = oldTransaction.quantidade || 0;
        const newQuantidade = normalizedTransaction.quantidade;
        const material = normalizedTransaction.material;
        const tipo = normalizedTransaction.tipo;
        const oldTipo = oldTransaction.tipo || "compra";

        console.log(
          `[v0] DataContext: Editando estoque - material=${material}, quantidade antiga=${oldQuantidade}, quantidade nova=${newQuantidade}`,
        );

        // Desfazer a transacao antiga
        if (oldTipo === "compra") {
          await updateInventoryQuantity(material, -oldQuantidade, "compra");
        } else if (oldTipo === "venda") {
          await updateInventoryQuantity(material, oldQuantidade, "venda");
        }

        // Aplicar a nova transacao
        if (tipo === "compra") {
          await updateInventoryQuantity(material, newQuantidade, "compra");
        } else if (tipo === "venda") {
          await updateInventoryQuantity(material, newQuantidade, "venda");
        }

        console.log(
          `[v0] DataContext: Estoque recalculado com sucesso para ${material}`,
        );
      }
    } catch (error) {
      console.error("[v0] DataContext: Erro ao editar transacao:", error);
      setFirebaseConnected(false);

      const updatedTransactions = transactions.map((t) =>
        t.id === id ? { ...t, ...updatedTransaction, synced: false } : t,
      );
      setTransactions(updatedTransactions);
      localStorage.setItem(
        "recyclingTransactions",
        JSON.stringify(updatedTransactions),
      );
      throw error;
    }
  };

  const deleteTransaction = async (id) => {
    try {
      console.log("[v0] DataContext: Excluindo transação:", id);

      // CORRECAO CRITICA: Reverter o estoque ANTES de deletar a transacao
      const transactionToDelete = transactions.find((t) => t.id === id);
      if (transactionToDelete) {
        const { updateInventoryQuantity } =
          await import("../lib/firebaseService");

        const quantidade = transactionToDelete.quantidade || 0;
        const tipo = transactionToDelete.tipo || "compra";
        const material = transactionToDelete.material;

        console.log(
          `[v0] DataContext: Revertendo estoque - material=${material}, quantidade=${quantidade}, tipo=${tipo}`,
        );

        // Reverter a operacao: se foi compra, subtrair; se foi venda, adicionar
        if (tipo === "compra") {
          await updateInventoryQuantity(material, -quantidade, "compra");
        } else if (tipo === "venda") {
          await updateInventoryQuantity(material, quantidade, "venda");
        }

        console.log(
          `[v0] DataContext: Estoque revertido com sucesso para ${material}`,
        );
      }

      await deleteTransactionFirebase(id);

      console.log(
        "[v0] DataContext: Transação excluída. daily_reports atualizado pelo firebaseService.",
      );

      // CORRECAO: Remover imediatamente do estado local E do localStorage
      setTransactions((prev) => {
        const updated = prev.filter((t) => t.id !== id);
        localStorage.setItem("recyclingTransactions", JSON.stringify(updated));
        return updated;
      });

      // Recarregar o inventario para refletir as mudancas
      const updatedInventory = await getInventory();
      setInventory(updatedInventory);
      localStorage.setItem(
        "recycling_inventory",
        JSON.stringify(updatedInventory),
      );

      // CORRECAO: Aguardar um momento para o Firebase processar a atualizacao do daily_reports
      // e entao re-buscar o live_summary para refletir os totais corretos
      setTimeout(async () => {
        try {
          const summary = await getLiveSummary();
          setLiveSummary(summary);
          console.log(
            "[v0] DataContext: live_summary atualizado após exclusão",
          );
        } catch (err) {
          console.warn(
            "[v0] DataContext: Falha ao atualizar live_summary após exclusão:",
            err,
          );
        }
      }, 500);
    } catch (error) {
      console.error("[v0] DataContext: Erro ao excluir transação:", error);
      setFirebaseConnected(false);

      // Mesmo em caso de erro na exclusão do Firebase, remover localmente
      const updatedTransactions = transactions.filter((t) => t.id !== id);
      setTransactions(updatedTransactions);
      localStorage.setItem(
        "recyclingTransactions",
        JSON.stringify(updatedTransactions),
      );

      throw error;
    }
  };

  const updateInventory = async (material, data) => {
    try {
      await updateInventoryItem(material, data);
    } catch (error) {
      console.error("Erro ao atualizar inventário:", error);
      const updatedInventory = { ...inventory, [material]: data };
      setInventory(updatedInventory);
      localStorage.setItem(
        "recycling_inventory",
        JSON.stringify(updatedInventory),
      );
    }
  };

  const fetchDailyReports = useCallback(async (startDate, endDate) => {
    try {
      console.log("[v0] Fetching daily reports:", { startDate, endDate });
      return await getDailyReports(startDate, endDate);
    } catch (error) {
      console.error("[v0] Erro ao buscar relatórios diários:", error);
      throw error;
    }
  }, []);

  const fetchTransactionsByPeriod = useCallback(async (startDate, endDate) => {
    try {
      console.log("[v0] Fetching transactions by period:", {
        startDate,
        endDate,
      });
      return await getTransactionsByPeriod(startDate, endDate);
    } catch (error) {
      console.error("[v0] Erro ao buscar transações por período:", error);
      throw error;
    }
  }, []);

  const fetchMonthlyReport = useCallback(async (year, month) => {
    try {
      console.log("[v0] Fetching monthly report:", { year, month });
      return await getMonthlyReport(year, month);
    } catch (error) {
      console.error("[v0] Erro ao buscar relatório mensal:", error);
      throw error;
    }
  }, []);

  const fetchYearlyReport = useCallback(async (year) => {
    try {
      console.log("[v0] Fetching yearly report:", { year });
      return await getYearlyReport(year);
    } catch (error) {
      console.error("[v0] Erro ao buscar relatório anual:", error);
      throw error;
    }
  }, []);

  const value = {
    transactions,
    inventory,
    customers,
    liveSummary,
    loading,
    syncing,
    firebaseConnected,
    lastSyncTime,
    realTimeSync,
    addTransaction,
    editTransaction,
    deleteTransaction,
    updateInventory,
    refreshData,
    fetchLiveSummary,
    toggleRealTimeSync: () => setRealTimeSync((prev) => !prev),
    fetchDailyReports,
    fetchMonthlyReport,
    fetchYearlyReport,
    fetchTransactionsByPeriod,
    // Legacy aliases
    getDailyReports: fetchDailyReports,
    getMonthlyReport: fetchMonthlyReport,
    getYearlyReport: fetchYearlyReport,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
