"use client";

import { useMemo } from "react";
import { useData } from "@/contexts/DataContext";
import { useAggregatedReport } from "./useFirebaseQuery";
import { differenceInDays, parseISO } from "date-fns";

/**
 * Hook Híbrido Sênior para Otimização de Custos (Firestore)
 *
 * ESTRATÉGIA:
 * 1. Se o período for curto (<= 7 dias), usa 'transactions' (Dados Quentes/Detalhado).
 * 2. Se o período for longo (> 7 dias), usa 'daily_reports' (Dados Frios/Agregados).
 *
 * Isso evita carregar milhares de documentos apenas para mostrar totais na tela.
 */
export function useFinancialAnalytics(startDate, endDate) {
  const { transactions = [], liveSummary } = useData();

  // Calcula a diferença em dias entre as datas
  const diffDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    try {
      const start =
        typeof startDate === "string" ? parseISO(startDate) : startDate;
      const end = typeof endDate === "string" ? parseISO(endDate) : endDate;
      return Math.abs(differenceInDays(end, start));
    } catch (e) {
      return 0;
    }
  }, [startDate, endDate]);

  // Define se deve usar dados agregados (mais barato) ou detalhados
  const useAggregated = diffDays > 7;

  // Busca dados agregados se necessário
  const { data: aggregatedData, isLoading: loadingAggregated } =
    useAggregatedReport(startDate, endDate, {
      enabled: useAggregated,
    });

  // Processa os dados com base na estratégia escolhida
  const stats = useMemo(() => {
    // Caso 1: Período longo - Usar Totais do daily_reports (1 leitura por dia)
    if (useAggregated && aggregatedData?.totals) {
      const { totals } = aggregatedData;
      return {
        totalSales: totals.totalSales,
        totalPurchases: totals.totalPurchases,
        totalExpenses: totals.totalExpenses,
        lucroTotal: totals.totalProfit,
        countTransactions: totals.totalTransactions,
        isAggregated: true,
        source: "daily_reports (Otimizado)",
      };
    }

    // Caso 2: Período curto ou Fallback - Usar transações da memória (já carregadas pelo DataContext)
    // Filtramos as transações que já estão no estado global (limitadas a 50/100)
    const filtered = transactions.filter((t) => {
      const txDate = new Date(t.data);
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59);
      return txDate >= start && txDate <= end;
    });

    const totals = filtered.reduce(
      (acc, t) => {
        const valor = Number(t.valorTotal || t.total) || 0;
        if (t.tipo === "venda") acc.totalSales += valor;
        else if (t.tipo === "compra") acc.totalPurchases += valor;
        else if (t.tipo === "despesa") acc.totalExpenses += valor;
        return acc;
      },
      { totalSales: 0, totalPurchases: 0, totalExpenses: 0 },
    );

    return {
      ...totals,
      lucroTotal:
        totals.totalSales - totals.totalPurchases - totals.totalExpenses,
      countTransactions: filtered.length,
      isAggregated: false,
      source: "transactions (Memória)",
    };
  }, [useAggregated, aggregatedData, transactions, startDate, endDate]);

  return {
    stats,
    isLoading: useAggregated ? loadingAggregated : false,
    useAggregated,
  };
}
