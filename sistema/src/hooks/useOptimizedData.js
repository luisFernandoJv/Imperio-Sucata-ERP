"use client";

import { useMemo, useCallback } from "react";
import { useTransactions, useInventory } from "./useFirebaseQuery";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Hook de Dados Otimizados
 * CORREÇÃO: Calcula TUDO a partir das transações reais do listener do Firebase.
 * Antes usava daily_reports (aggregated) que ficava desatualizado após exclusões.
 * Agora as transações reais são a única fonte da verdade.
 */
export function useOptimizedData() {
  const queryClient = useQueryClient();

  const {
    data: transactions = [],
    isLoading: transactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useTransactions();

  const {
    data: inventory = {},
    isLoading: inventoryLoading,
    error: inventoryError,
    refetch: refetchInventory,
  } = useInventory();

  const refetch = useCallback(async () => {
    await Promise.all([refetchTransactions(), refetchInventory()]);
  }, [refetchTransactions, refetchInventory]);

  // Processar transacoes de um array em totais
  const processTransactions = (txs) => {
    let vendas = 0;
    let compras = 0;
    let despesas = 0;

    txs.forEach((t) => {
      const valor = Number(t.valorTotal || t.total) || 0;
      const tipo = t.tipo || t.type;

      if (tipo === "venda") vendas += valor;
      else if (tipo === "compra") compras += valor;
      else if (tipo === "despesa") despesas += valor;
    });

    const lucro = vendas - compras - despesas;
    const margem = vendas > 0 ? (lucro / vendas) * 100 : 0;

    return { vendas, compras, despesas, lucro, margem, count: txs.length };
  };

  const stats = useMemo(() => {
    const now = new Date();
    const today = now.toDateString();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const currentMonthStart = new Date(currentYear, currentMonth, 1);
    const currentMonthEnd = new Date(
      currentYear,
      currentMonth + 1,
      0,
      23,
      59,
      59,
      999,
    );
    const previousMonthStart = new Date(currentYear, currentMonth - 1, 1);
    const previousMonthEnd = new Date(
      currentYear,
      currentMonth,
      0,
      23,
      59,
      59,
      999,
    );

    // CORREÇÃO: Filtrar transacoes reais por periodo em vez de ler daily_reports
    const currentMonthTxns = transactions.filter((t) => {
      const d = new Date(t.data);
      return d >= currentMonthStart && d <= currentMonthEnd;
    });

    const previousMonthTxns = transactions.filter((t) => {
      const d = new Date(t.data);
      return d >= previousMonthStart && d <= previousMonthEnd;
    });

    const mesAtual = processTransactions(currentMonthTxns);
    const mesAnterior = processTransactions(previousMonthTxns);

    // Transacoes de hoje
    const transacoesHoje = transactions.filter((t) => {
      const txDate = new Date(t.data);
      return txDate.toDateString() === today;
    }).length;

    // Estoque total
    const estoqueTotal = Object.values(inventory).reduce(
      (total, item) => total + (Number(item.quantidade) || 0),
      0,
    );

    // Calculo de crescimento
    const crescimentoVendas =
      mesAnterior.vendas > 0
        ? ((mesAtual.vendas - mesAnterior.vendas) / mesAnterior.vendas) * 100
        : mesAtual.vendas > 0
          ? 100
          : 0;

    const crescimentoLucro =
      mesAnterior.lucro !== 0
        ? ((mesAtual.lucro - mesAnterior.lucro) / Math.abs(mesAnterior.lucro)) *
          100
        : mesAtual.lucro > 0
          ? 100
          : 0;

    return {
      totalVendas: mesAtual.vendas,
      totalCompras: mesAtual.compras,
      totalDespesas: mesAtual.despesas,
      lucroTotal: mesAtual.lucro,
      transacoesHoje,
      estoqueTotal,

      vendasMesAtual: mesAtual.vendas,
      comprasMesAtual: mesAtual.compras,
      despesasMesAtual: mesAtual.despesas,
      lucroMesAtual: mesAtual.lucro,
      margemLucro: mesAtual.margem,
      transacoesMesAtual: mesAtual.count,

      vendasMesAnterior: mesAnterior.vendas,
      comprasMesAnterior: mesAnterior.compras,
      despesasMesAnterior: mesAnterior.despesas,
      lucroMesAnterior: mesAnterior.lucro,
      margemMesAnterior: mesAnterior.margem,
      transacoesMesAnterior: mesAnterior.count,

      crescimentoVendas,
      crescimentoLucro,
    };
  }, [transactions, inventory]);

  // Transacoes recentes memoizadas (do listener - sempre atualizadas)
  const recentTransactions = useMemo(() => {
    return [...transactions].sort(
      (a, b) => new Date(b.data) - new Date(a.data),
    );
  }, [transactions]);

  // Alertas de estoque baixo
  const lowStockAlerts = useMemo(() => {
    const alerts = [];
    Object.entries(inventory).forEach(([material, data]) => {
      if (data.quantidade < 10) {
        alerts.push({
          material,
          quantidade: data.quantidade,
          nivel: data.quantidade < 5 ? "critico" : "baixo",
        });
      }
    });
    return alerts;
  }, [inventory]);

  return {
    transactions,
    inventory,
    stats,
    recentTransactions,
    lowStockAlerts,
    isLoading: transactionsLoading || inventoryLoading,
    error: transactionsError || inventoryError,
    refetch,
  };
}
