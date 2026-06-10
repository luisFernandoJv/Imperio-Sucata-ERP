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
  updateInventoryQuantity,
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
  getTransactionById,
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

    // CORREÇÃO: Aguardar o primeiro dado de pelo menos um listener antes de
    // desligar o loading. Sem isso, há uma janela onde loading===false mas
    // os arrays ainda estão vazios, causando flash de "sem dados".
    let firstDataReceived = false;
    const markReady = () => {
      if (!firstDataReceived) {
        firstDataReceived = true;
        setLoading(false);
        setSyncing(false);
      }
    };

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
          markReady();
        },
      );
    } catch (error) {
      console.error("[v0] Erro no listener de Transações:", error);
      markReady(); // Garantir que o loading seja removido mesmo em caso de erro
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

    // 4. Listener de Clientes isolado (único listener central — componentes
    //    devem usar useData().customers em vez de criar listeners próprios)
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

    // Fallback: se o Firebase demorar mais de 8s, liberar o loading de qualquer forma
    const fallbackTimer = setTimeout(() => {
      if (!firstDataReceived) {
        console.warn(
          "[v0] Firebase demorou demais — liberando loading por fallback",
        );
        markReady();
      }
    }, 8000);

    return () => {
      console.log("[v0] Desligando listeners...");
      clearTimeout(fallbackTimer);
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

      // Atualizar inventário após salvar a transação.
      // CORREÇÃO: import estático (topo do arquivo) evita falha silenciosa
      // de import() dinâmico que engolia o erro e pulava a baixa de estoque.
      const quantidade = normalizedTransaction.quantidade;
      const tipo = normalizedTransaction.tipo;
      const material = normalizedTransaction.material;

      if (
        material &&
        quantidade > 0 &&
        (tipo === "compra" || tipo === "venda")
      ) {
        console.log(
          `[v0] DataContext: Atualizando estoque - material=${material}, quantidade=${quantidade}, tipo=${tipo}`,
        );
        await updateInventoryQuantity(material, quantidade, tipo);
        console.log(
          `[v0] DataContext: Estoque atualizado com sucesso para ${material}`,
        );
      } else {
        console.warn(
          `[v0] DataContext: Baixa de estoque ignorada - tipo="${tipo}", material="${material}", quantidade=${quantidade}`,
        );
      }
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

      // Lê os dados ORIGINAIS diretamente do Firestore (não do estado local)
      // para garantir que o diff de estoque seja calculado corretamente mesmo
      // para transações mais antigas que não estão no array transactions[] (limit 50).
      const originalData = await getTransactionById(id);

      await updateTransactionFirebase(id, normalizedTransaction);

      // Recalcular o estoque com base no diff entre o estado anterior e o novo.
      // Só atualiza estoque para compra/venda — despesas não movimentam estoque.
      const afetaEstoque = (tipo) => tipo === "compra" || tipo === "venda";

      if (originalData) {
        const oldMaterial = originalData.material;
        const oldQtd = Number(originalData.quantidade) || 0;
        const oldTipo = originalData.tipo;

        const newMaterial = normalizedTransaction.material;
        const newQtd = Number(normalizedTransaction.quantidade) || 0;
        const newTipo = normalizedTransaction.tipo;

        console.log(
          `[v0] DataContext: diff estoque — antes: ${oldMaterial}/${oldTipo}/${oldQtd}kg → depois: ${newMaterial}/${newTipo}/${newQtd}kg`,
        );

        // Passo 1: Reverter o efeito da transação original no estoque
        if (oldMaterial && oldQtd > 0 && afetaEstoque(oldTipo)) {
          const tipoReverso = oldTipo === "compra" ? "venda" : "compra";
          await updateInventoryQuantity(oldMaterial, oldQtd, tipoReverso);
          console.log(
            `[v0] Estoque revertido: ${oldMaterial} ${tipoReverso === "compra" ? "+" : "-"}${oldQtd}kg`,
          );
        }

        // Passo 2: Aplicar o efeito da nova transação no estoque
        if (newMaterial && newQtd > 0 && afetaEstoque(newTipo)) {
          await updateInventoryQuantity(newMaterial, newQtd, newTipo);
          console.log(
            `[v0] Estoque aplicado: ${newMaterial} ${newTipo === "compra" ? "+" : "-"}${newQtd}kg`,
          );
        }

        console.log(`[v0] DataContext: Estoque recalculado com sucesso`);
      } else {
        // Fallback: transação original não encontrada, apenas aplica o novo estado
        console.warn(
          `[v0] DataContext: Transação original não encontrada para diff. Aplicando novo estado diretamente.`,
        );
        const newMaterial = normalizedTransaction.material;
        const newQtd = Number(normalizedTransaction.quantidade) || 0;
        const newTipo = normalizedTransaction.tipo;
        if (newMaterial && newQtd > 0 && afetaEstoque(newTipo)) {
          await updateInventoryQuantity(newMaterial, newQtd, newTipo);
        }
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

      // CORREÇÃO CRÍTICA: NÃO reverter o estoque aqui.
      // O firebaseService.deleteTransaction já reverte o estoque internamente
      // (usando tipoReverso). Fazer isso aqui também causaria DUPLA reversão,
      // subtraindo o dobro do inventário. Ex: compra de 50kg → subtrairia 100kg.
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
