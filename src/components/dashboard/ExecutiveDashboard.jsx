"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, DollarSign, XCircle, PieChart, Activity, Package } from "lucide-react"
import { useOptimizedData } from "../../hooks/useOptimizedData"
import { MetricCard, MiniMetricCard } from "./DashboardWidgets"
import { DailyTrendChart, TopMaterialsChart, PaymentDistributionChart, MonthlyComparisonChart } from "./AdvancedCharts"
import { RecentActivity } from "./RecentActivity"
import { AlertTriangle, BarChart3 } from "lucide-react"
import { LoadingOverlay } from "../ui/loading"

const calculateChange = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / Math.abs(previous)) * 100
}

const safeNum = (val) => {
  const num = Number(val)
  return isNaN(num) ? 0 : num
}

export default function ExecutiveDashboard({ onQuickAction }) {
  const {
    currentMonthTransactions,
    previousMonthTransactions,
    inventory,
    stats,
    recentTransactions,
    lowStockAlerts,
    isLoading,
  } = useOptimizedData()

  const currentMonthData = useMemo(
    () => ({
      vendas: stats.vendasMesAtual,
      compras: stats.comprasMesAtual,
      despesas: stats.despesasMesAtual,
      lucro: stats.lucroMesAtual,
      margem: stats.margemLucro,
      transactionCount: stats.transacoesMesAtual || currentMonthTransactions.length,
      transactions: currentMonthTransactions,
    }),
    [stats, currentMonthTransactions],
  )

  const previousMonthData = useMemo(
    () => ({
      vendas: stats.vendasMesAnterior,
      compras: stats.comprasMesAnterior,
      despesas: stats.despesasMesAnterior,
      lucro: stats.lucroMesAnterior,
      margem: stats.margemMesAnterior,
      transactionCount: stats.transacoesMesAnterior || previousMonthTransactions.length,
      transactions: previousMonthTransactions,
    }),
    [stats, previousMonthTransactions],
  )

  const topMaterials = useMemo(() => {
    const materialStats = {}
    currentMonthTransactions.forEach((t) => {
      const tipo = t.tipo || t.type
      if (tipo === "venda") {
        if (!materialStats[t.material]) {
          materialStats[t.material] = { revenue: 0, quantity: 0 }
        }
        materialStats[t.material].revenue += safeNum(t.valorTotal || t.total)
        materialStats[t.material].quantity += safeNum(t.quantidade || t.weight)
      }
    })
    return Object.entries(materialStats)
      .map(([material, data]) => ({ material, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
  }, [currentMonthTransactions])

  const paymentDistribution = useMemo(() => {
    const distribution = {}
    currentMonthTransactions.forEach((t) => {
      const method = t.formaPagamento || t.paymentMethod || "dinheiro"
      if (!distribution[method]) distribution[method] = 0
      distribution[method] += safeNum(t.valorTotal || t.total)
    })
    return Object.entries(distribution).map(([name, value]) => ({ name, value }))
  }, [currentMonthTransactions])

  const dailyTrend = useMemo(() => {
    const dailyData = {}
    currentMonthTransactions.forEach((t) => {
      if (!t.data) return
      const day = new Date(t.data).getDate()
      if (!dailyData[day]) {
        dailyData[day] = { day, vendas: 0, compras: 0, despesas: 0 }
      }

      const val = safeNum(t.valorTotal || t.total)
      const tipo = t.tipo || t.type
      if (tipo === "venda") dailyData[day].vendas += val
      else if (tipo === "compra") dailyData[day].compras += val
      else if (tipo === "despesa") dailyData[day].despesas += val
    })
    return Object.values(dailyData).sort((a, b) => a.day - b.day)
  }, [currentMonthTransactions])

  const vendasChange = calculateChange(currentMonthData.vendas, previousMonthData.vendas)
  const comprasChange = calculateChange(currentMonthData.compras, previousMonthData.compras)
  const lucroChange = calculateChange(currentMonthData.lucro, previousMonthData.lucro)
  const despesasChange = calculateChange(currentMonthData.despesas, previousMonthData.despesas)

  if (isLoading) {
    return <LoadingOverlay message="Carregando dashboard..." />
  }

  return (
    <div className="space-y-6 p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-2xl shadow-lg">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Administração geral</h1>
        </div>
        <p className="text-gray-500">Visão completa do seu negócio em tempo real</p>

        <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span>
            Mês atual: {currentMonthTransactions.length} transações | Mês anterior: {previousMonthTransactions.length}{" "}
            transações
          </span>
        </div>
      </motion.div>

      {/* Low Stock Alerts */}
      {lowStockAlerts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="p-4 border border-orange-200 bg-orange-50 rounded-xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-2 rounded-full">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <h3 className="font-medium text-orange-800">
                {lowStockAlerts.length} {lowStockAlerts.length === 1 ? "item com" : "itens com"} estoque baixo
              </h3>
            </div>
            <button
              onClick={() => onQuickAction("inventory")}
              className="text-white bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              Ver Estoque
            </button>
          </div>
        </motion.div>
      )}

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Receita do Mês"
          current={currentMonthData.vendas}
          previous={previousMonthData.vendas}
          change={vendasChange}
          icon={DollarSign}
          color="green"
          format="currency"
        />
        <MetricCard
          title="Compras do Mês"
          current={currentMonthData.compras}
          previous={previousMonthData.compras}
          change={comprasChange}
          icon={TrendingDown}
          color="blue"
          format="currency"
        />
        <MetricCard
          title="Despesas do Mês"
          current={currentMonthData.despesas}
          previous={previousMonthData.despesas}
          change={despesasChange}
          icon={XCircle}
          color="red"
          format="currency"
        />
        <MetricCard
          title="Lucro Líquido"
          current={currentMonthData.lucro}
          previous={previousMonthData.lucro}
          change={lucroChange}
          icon={TrendingUp}
          color={currentMonthData.lucro >= 0 ? "green" : "red"}
          format="currency"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniMetricCard
          label="Margem de Lucro"
          value={currentMonthData.margem}
          format="percent"
          icon={PieChart}
          color="blue"
        />
        <MiniMetricCard
          label="Transações"
          value={currentMonthData.transactionCount}
          format="number"
          icon={Activity}
          color="green"
        />
        <MiniMetricCard
          label="Estoque Total"
          value={stats.estoqueTotal}
          format="weight"
          icon={Package}
          color="orange"
        />
        <MiniMetricCard
          label="Ticket Médio"
          value={
            currentMonthData.transactionCount > 0 ? currentMonthData.vendas / currentMonthData.transactionCount : 0
          }
          format="currency"
          icon={DollarSign}
          color="blue"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DailyTrendChart data={dailyTrend} />
        <MonthlyComparisonChart currentMonth={currentMonthData} previousMonth={previousMonthData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopMaterialsChart data={topMaterials} />
        <PaymentDistributionChart data={paymentDistribution} />
      </div>

      {/* Recent Activity */}
      <RecentActivity transactions={recentTransactions} limit={10} />
    </div>
  )
}
