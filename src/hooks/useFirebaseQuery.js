"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTransactions,
  getInventory,
  addTransaction as addTransactionToFirebase,
  updateInventoryItem,
  updateTransaction as updateTransactionFirebase,
  deleteTransaction as deleteTransactionFirebase,
  getTransactionsByPeriod,
  getAggregatedReport,
} from "../lib/firebaseService";

// Query Keys
export const QUERY_KEYS = {
  transactions: ["transactions"],
  inventory: ["inventory"],
  dailyReports: (startDate, endDate) => ["dailyReports", startDate, endDate],
  monthlyReport: (year, month) => ["monthlyReport", year, month],
  yearlyReport: (year) => ["yearlyReport", year],
  transactionsByPeriod: (startDate, endDate) => [
    "transactionsByPeriod",
    startDate?.toISOString(),
    endDate?.toISOString(),
  ],
  aggregatedReport: (startDate, endDate) => [
    "aggregatedReport",
    startDate?.toISOString(),
    endDate?.toISOString(),
  ],
};

// Transactions Query
export function useTransactions() {
  return useQuery({
    queryKey: QUERY_KEYS.transactions,
    queryFn: getTransactions,
    staleTime: 1000 * 30, // 30 segundos
    onError: (error) => {
      console.error("[v0] Error fetching transactions:", error);
    },
  });
}

export function useTransactionsByPeriod(startDate, endDate, options = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.transactionsByPeriod(startDate, endDate),
    queryFn: () => getTransactionsByPeriod(startDate, endDate),
    enabled: !!startDate && !!endDate,
    staleTime: 1000 * 60 * 5, // 5 minutos - dados históricos mudam menos
    ...options,
  });
}

/**
 * Hook para buscar relatórios agregados (Barato em leituras).
 * Nível Sênior: Usado para gráficos e resumos financeiros.
 */
export function useAggregatedReport(startDate, endDate, options = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.aggregatedReport(startDate, endDate),
    queryFn: () => getAggregatedReport(startDate, endDate),
    enabled: !!startDate && !!endDate,
    staleTime: 1000 * 30, // 30 segundos - dados agregados devem refletir exclusões rapidamente
    ...options,
  });
}

// Inventory Query
export function useInventory() {
  return useQuery({
    queryKey: QUERY_KEYS.inventory,
    queryFn: getInventory,
    staleTime: 1000 * 60, // 1 minuto
    onError: (error) => {
      console.error("[v0] Error fetching inventory:", error);
    },
  });
}

// Add Transaction Mutation
export function useAddTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addTransactionToFirebase,
    onMutate: async (newTransaction) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.transactions });
      const previousTransactions = queryClient.getQueryData(
        QUERY_KEYS.transactions,
      );

      queryClient.setQueryData(QUERY_KEYS.transactions, (old) => [
        { ...newTransaction, id: `temp-${Date.now()}`, synced: false },
        ...(old || []),
      ]);

      return { previousTransactions };
    },
    onError: (err, newTransaction, context) => {
      console.error("[v0] Error adding transaction:", err);
      queryClient.setQueryData(
        QUERY_KEYS.transactions,
        context.previousTransactions,
      );
    },
    onSuccess: () => {
      console.log("[v0] Transaction added successfully");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.transactions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory });
      queryClient.invalidateQueries({ queryKey: ["aggregatedReport"] });
      queryClient.invalidateQueries({ queryKey: ["transactionsByPeriod"] });
      queryClient.invalidateQueries({ queryKey: ["dailyReports"] });
      queryClient.invalidateQueries({ queryKey: ["monthlyReport"] });
      queryClient.invalidateQueries({ queryKey: ["yearlyReport"] });
    },
  });
}

// Update Transaction Mutation
export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateTransactionFirebase(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.transactions });
      const previousTransactions = queryClient.getQueryData(
        QUERY_KEYS.transactions,
      );

      queryClient.setQueryData(QUERY_KEYS.transactions, (old) =>
        old?.map((t) => (t.id === id ? { ...t, ...data } : t)),
      );

      return { previousTransactions };
    },
    onError: (err, variables, context) => {
      console.error("[v0] Error updating transaction:", err);
      queryClient.setQueryData(
        QUERY_KEYS.transactions,
        context.previousTransactions,
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.transactions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory });
      queryClient.invalidateQueries({ queryKey: ["aggregatedReport"] });
      queryClient.invalidateQueries({ queryKey: ["transactionsByPeriod"] });
      queryClient.invalidateQueries({ queryKey: ["dailyReports"] });
      queryClient.invalidateQueries({ queryKey: ["monthlyReport"] });
      queryClient.invalidateQueries({ queryKey: ["yearlyReport"] });
    },
  });
}

// Delete Transaction Mutation
export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTransactionFirebase,
    onMutate: async (id) => {
      // Cancel ALL related queries to prevent stale data
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.transactions });
      const previousTransactions = queryClient.getQueryData(
        QUERY_KEYS.transactions,
      );

      queryClient.setQueryData(QUERY_KEYS.transactions, (old) =>
        old?.filter((t) => t.id !== id),
      );

      return { previousTransactions };
    },
    onError: (err, id, context) => {
      console.error("[v0] Error deleting transaction:", err);
      queryClient.setQueryData(
        QUERY_KEYS.transactions,
        context.previousTransactions,
      );
    },
    onSettled: () => {
      // CORREÇÃO: Invalidar TODAS as queries relacionadas após exclusão
      // Isso garante que daily_reports, aggregatedReports e transações por período
      // sejam re-buscados com dados atualizados do Firebase
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.transactions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory });
      // Invalidar TODOS os relatórios agregados (qualquer período)
      queryClient.invalidateQueries({ queryKey: ["aggregatedReport"] });
      // Invalidar transações por período (qualquer período)
      queryClient.invalidateQueries({ queryKey: ["transactionsByPeriod"] });
      // Invalidar relatórios diários
      queryClient.invalidateQueries({ queryKey: ["dailyReports"] });
      // Invalidar relatórios mensais e anuais
      queryClient.invalidateQueries({ queryKey: ["monthlyReport"] });
      queryClient.invalidateQueries({ queryKey: ["yearlyReport"] });
      console.log(
        "[v0] Todas as queries invalidadas após exclusão de transação",
      );
    },
  });
}

// Update Inventory Mutation
export function useUpdateInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ material, data }) => updateInventoryItem(material, data),
    onMutate: async ({ material, data }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.inventory });
      const previousInventory = queryClient.getQueryData(QUERY_KEYS.inventory);

      queryClient.setQueryData(QUERY_KEYS.inventory, (old) => ({
        ...old,
        [material]: { ...old?.[material], ...data },
      }));

      return { previousInventory };
    },
    onError: (err, variables, context) => {
      console.error("[v0] Error updating inventory:", err);
      queryClient.setQueryData(QUERY_KEYS.inventory, context.previousInventory);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory });
    },
  });
}
