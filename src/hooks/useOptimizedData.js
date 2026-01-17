"use client"

import { useMemo } from "react"
import { useTransactions, useInventory, useTransactionsByPeriod } from "./useFirebaseQuery"

export function useOptimizedData() {
  const { data: transactions = [], isLoading: transactionsLoading, error: transactionsError } = useTransactions()
  const { data: inventory = {}, isLoading: inventoryLoading, error: inventoryError } = useInventory()

  const { currentMonthStart, currentMonthEnd, previousMonthStart, previousMonthEnd } = useMemo(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    return {
      currentMonthStart: new Date(currentYear, currentMonth, 1),
      currentMonthEnd: new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999),
      previousMonthStart: new Date(currentYear, currentMonth - 1, 1),
      previousMonthEnd: new Date(currentYear, currentMonth, 0, 23, 59, 59, 999),
    }
  }, [])

  const { data: currentMonthTransactions = [], isLoading: currentMonthLoading } = useTransactionsByPeriod(
    currentMonthStart,
    currentMonthEnd,
  )

  const { data: previousMonthTransactions = [], isLoading: previousMonthLoading } = useTransactionsByPeriod(
    previousMonthStart,
    previousMonthEnd,
  )

  const processTransactions = (txs) => {
    let vendas = 0
    let compras = 0
    let despesas = 0

    txs.forEach((t) => {
      const valor = Number(t.valorTotal || t.total) || 0
      const tipo = t.tipo || t.type

      if (tipo === "venda") vendas += valor
      else if (tipo === "compra") compras += valor
      else if (tipo === "despesa") despesas += valor
    })

    const lucro = vendas - compras - despesas
    const margem = vendas > 0 ? (lucro / vendas) * 100 : 0

    return { vendas, compras, despesas, lucro, margem, count: txs.length }
  }

  const stats = useMemo(() => {
    const today = new Date().toDateString()

    // Processar mês atual e anterior
    const mesAtual = processTransactions(currentMonthTransactions)
    const mesAnterior = processTransactions(previousMonthTransactions)

    // Transações de hoje (das transações recentes do listener)
    const transacoesHoje = transactions.filter((t) => {
      const txDate = new Date(t.data)
      return txDate.toDateString() === today
    }).length

    // Estoque total
    const estoqueTotal = Object.values(inventory).reduce((total, item) => total + (Number(item.quantidade) || 0), 0)

    // Cálculo de crescimento
    const crescimentoVendas =
      mesAnterior.vendas > 0
        ? ((mesAtual.vendas - mesAnterior.vendas) / mesAnterior.vendas) * 100
        : mesAtual.vendas > 0
          ? 100
          : 0

    const crescimentoLucro =
      mesAnterior.lucro !== 0
        ? ((mesAtual.lucro - mesAnterior.lucro) / Math.abs(mesAnterior.lucro)) * 100
        : mesAtual.lucro > 0
          ? 100
          : 0

    return {
      // Totais gerais (para compatibilidade)
      totalVendas: mesAtual.vendas,
      totalCompras: mesAtual.compras,
      totalDespesas: mesAtual.despesas,
      lucroTotal: mesAtual.lucro,
      transacoesHoje,
      estoqueTotal,

      // Mês atual
      vendasMesAtual: mesAtual.vendas,
      comprasMesAtual: mesAtual.compras,
      despesasMesAtual: mesAtual.despesas,
      lucroMesAtual: mesAtual.lucro,
      margemLucro: mesAtual.margem,
      transacoesMesAtual: mesAtual.count,

      // Mês anterior
      vendasMesAnterior: mesAnterior.vendas,
      comprasMesAnterior: mesAnterior.compras,
      despesasMesAnterior: mesAnterior.despesas,
      lucroMesAnterior: mesAnterior.lucro,
      margemMesAnterior: mesAnterior.margem,
      transacoesMesAnterior: mesAnterior.count,

      // Crescimento
      crescimentoVendas,
      crescimentoLucro,
    }
  }, [currentMonthTransactions, previousMonthTransactions, transactions, inventory])

  // Transações recentes memoizadas (do listener limitado - ok para exibição)
  const recentTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 10)
  }, [transactions])

  // Alertas de estoque baixo
  const lowStockAlerts = useMemo(() => {
    const alerts = []
    Object.entries(inventory).forEach(([material, data]) => {
      if (data.quantidade < 10) {
        alerts.push({
          material,
          quantidade: data.quantidade,
          nivel: data.quantidade < 5 ? "critico" : "baixo",
        })
      }
    })
    return alerts
  }, [inventory])

  return {
    transactions,
    currentMonthTransactions,
    previousMonthTransactions,
    inventory,
    stats,
    recentTransactions,
    lowStockAlerts,
    isLoading: transactionsLoading || inventoryLoading || currentMonthLoading || previousMonthLoading,
    error: transactionsError || inventoryError,
  }
}
