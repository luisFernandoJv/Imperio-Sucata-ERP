"use client"

import React from "react"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useData } from "../contexts/DataContext"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Package,
  Activity,
  Eye,
  AlertTriangle,
  Wifi,
  WifiOff,
  RefreshCw,
  XCircle,
  CalculatorIcon,
  Zap,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  BarChart3,
  PieChart,
  CreditCard,
} from "lucide-react"
import Calculator from "./Calculator" // Importando componente da calculadora
import {
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-lg shadow-md border border-gray-200 ${className}`}>{children}</div>
)

const Button = ({ children, onClick, disabled = false, variant = "default", size = "default", className = "" }) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"

  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500",
    ghost: "text-gray-700 hover:bg-gray-100 focus:ring-gray-500",
  }

  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-8 px-3 text-sm",
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  )
}

const Badge = ({ children, variant = "default", className = "" }) => {
  const variants = {
    default: "bg-blue-100 text-blue-800",
    secondary: "bg-gray-100 text-gray-800",
    outline: "border border-gray-300 text-gray-700",
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0)
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("pt-BR")
}

const getMonthData = (transactions, monthOffset = 0) => {
  const now = new Date()
  const targetMonth = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1)
  const nextMonth = new Date(now.getFullYear(), now.getMonth() - monthOffset + 1, 1)

  const monthTransactions = transactions.filter((t) => {
    const transactionDate = new Date(t.data)
    return transactionDate >= targetMonth && transactionDate < nextMonth
  })

  let vendas = 0
  let compras = 0
  let despesas = 0
  let transactionCount = 0

  monthTransactions.forEach((transaction) => {
    if (transaction.tipo === "venda") {
      vendas += transaction.valorTotal || 0
    } else if (transaction.tipo === "compra") {
      compras += transaction.valorTotal || 0
    } else if (transaction.tipo === "despesa") {
      despesas += transaction.valorTotal || 0
    }
    transactionCount++
  })

  const lucro = vendas - compras - despesas
  const margem = vendas > 0 ? (lucro / vendas) * 100 : 0

  return {
    vendas,
    compras,
    despesas,
    lucro,
    margem,
    transactionCount,
    transactions: monthTransactions,
  }
}

const calculateChange = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

const Dashboard = ({ onQuickAction }) => {
  const [stats, setStats] = useState({
    totalVendas: 0,
    totalCompras: 0,
    lucroTotal: 0,
    transacoesHoje: 0,
    estoqueTotal: 0,
    margemLucro: 0,
    crescimentoSemanal: 0,
  })

  const [recentTransactions, setRecentTransactions] = useState([])
  const [lowStockAlerts, setLowStockAlerts] = useState([])
  const [calculatorOpen, setCalculatorOpen] = useState(false) // Estado para controlar abertura da calculadora
  const dataContext = useData()

  const {
    transactions = [],
    inventory = {},
    firebaseConnected = false,
    syncing = false,
    lastSyncTime = null,
    realTimeSync = true,
    pendingChanges = 0,
    refreshData,
    toggleRealTimeSync,
  } = dataContext || {}

  const currentMonthData = useMemo(() => getMonthData(transactions, 0), [transactions])
  const previousMonthData = useMemo(() => getMonthData(transactions, 1), [transactions])

  const vendasChange = calculateChange(currentMonthData.vendas, previousMonthData.vendas)
  const comprasChange = calculateChange(currentMonthData.compras, previousMonthData.compras)
  const lucroChange = calculateChange(currentMonthData.lucro, previousMonthData.lucro)
  const margemChange = currentMonthData.margem - previousMonthData.margem

  const topMaterials = useMemo(() => {
    const materialStats = {}
    currentMonthData.transactions.forEach((t) => {
      if (t.tipo === "venda") {
        if (!materialStats[t.material]) {
          materialStats[t.material] = { revenue: 0, quantity: 0 }
        }
        materialStats[t.material].revenue += t.valorTotal || 0
        materialStats[t.material].quantity += t.quantidade || 0
      }
    })
    return Object.entries(materialStats)
      .map(([material, data]) => ({ material, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
  }, [currentMonthData.transactions])

  const paymentDistribution = useMemo(() => {
    const distribution = {}
    currentMonthData.transactions.forEach((t) => {
      const method = t.formaPagamento || "dinheiro"
      if (!distribution[method]) {
        distribution[method] = 0
      }
      distribution[method] += t.valorTotal || 0
    })
    return Object.entries(distribution).map(([name, value]) => ({ name, value }))
  }, [currentMonthData.transactions])

  const dailyTrend = useMemo(() => {
    const dailyData = {}
    currentMonthData.transactions.forEach((t) => {
      const day = new Date(t.data).getDate()
      if (!dailyData[day]) {
        dailyData[day] = { day, vendas: 0, compras: 0, despesas: 0 }
      }
      if (t.tipo === "venda") dailyData[day].vendas += t.valorTotal || 0
      else if (t.tipo === "compra") dailyData[day].compras += t.valorTotal || 0
      else if (t.tipo === "despesa") dailyData[day].despesas += t.valorTotal || 0
    })
    return Object.values(dailyData).sort((a, b) => a.day - b.day)
  }, [currentMonthData.transactions])

  useEffect(() => {
    // calculateStats() // Removed as stats are now derived from month data
    checkLowStock()
    const recent = transactions.sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 6)
    setRecentTransactions(recent)
  }, [transactions, inventory])

  const calculateStats = () => {
    const today = new Date().toDateString()
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    let totalVendas = 0
    let totalCompras = 0
    let transacoesHoje = 0
    let vendasSemanaPassada = 0

    transactions.forEach((transaction) => {
      const transactionDate = new Date(transaction.data)
      const transactionDateString = transactionDate.toDateString()

      if (transaction.tipo === "venda") {
        totalVendas += transaction.valorTotal || 0
        if (transactionDate >= lastWeek) {
          vendasSemanaPassada += transaction.valorTotal || 0
        }
      } else if (transaction.tipo === "compra") {
        totalCompras += transaction.valorTotal || 0
      }

      if (transactionDateString === today) {
        transacoesHoje++
      }
    })

    const estoqueTotal = Object.values(inventory).reduce((total, item) => total + (item.quantidade || 0), 0)
    const margemLucro = totalCompras > 0 ? ((totalVendas - totalCompras) / totalCompras) * 100 : 0
    const crescimentoSemanal =
      vendasSemanaPassada > 0 ? ((totalVendas - vendasSemanaPassada) / vendasSemanaPassada) * 100 : 0

    setStats({
      totalVendas,
      totalCompras,
      lucroTotal: totalVendas - totalCompras,
      transacoesHoje,
      estoqueTotal,
      margemLucro,
      crescimentoSemanal,
    })

    // const recent = transactions.sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 6)
    // setRecentTransactions(recent)
  }

  const checkLowStock = () => {
    const alerts = []
    Object.entries(inventory).forEach(([material, data]) => {
      if (data.quantidade < 10) {
        // Alerta quando estoque < 10kg
        alerts.push({
          material,
          quantidade: data.quantidade,
          nivel: data.quantidade < 5 ? "critico" : "baixo",
        })
      }
    })
    setLowStockAlerts(alerts)
  }

  const handleSync = async () => {
    if (refreshData) {
      await refreshData()
    }
  }

  const getMaterialColor = (material) => {
    const colors = {
      ferro: "bg-gray-600",
      aluminio: "bg-blue-600",
      cobre: "bg-orange-600",
      latinha: "bg-green-600",
    }
    return colors[material] || "bg-gray-600"
  }

  const getMaterialIcon = (material) => {
    const icons = {
      ferro: "🔩",
      aluminio: "⚡",
      cobre: "🔶",
      latinha: "🥤",
    }
    return icons[material] || "📦"
  }

  const metricsCards = [
    {
      title: "Receita do Mês",
      current: currentMonthData.vendas,
      previous: previousMonthData.vendas,
      change: vendasChange,
      icon: DollarSign,
      color: "text-emerald-400",
      bgGradient: "from-emerald-500/10 to-emerald-600/5",
      borderColor: "border-emerald-500/20",
    },
    {
      title: "Compras do Mês",
      current: currentMonthData.compras,
      previous: previousMonthData.compras,
      change: comprasChange,
      icon: TrendingDown,
      color: "text-blue-400",
      bgGradient: "from-blue-500/10 to-blue-600/5",
      borderColor: "border-blue-500/20",
    },
    {
      title: "Despesas do Mês",
      current: currentMonthData.despesas,
      previous: previousMonthData.despesas,
      change: calculateChange(currentMonthData.despesas, previousMonthData.despesas),
      icon: XCircle,
      color: "text-red-400",
      bgGradient: "from-red-500/10 to-red-600/5",
      borderColor: "border-red-500/20",
    },
    {
      title: "Lucro Líquido",
      current: currentMonthData.lucro,
      previous: previousMonthData.lucro,
      change: lucroChange,
      icon: TrendingUp,
      color: currentMonthData.lucro >= 0 ? "text-emerald-400" : "text-red-400",
      bgGradient: currentMonthData.lucro >= 0 ? "from-emerald-500/10 to-emerald-600/5" : "from-red-500/10 to-red-600/5",
      borderColor: currentMonthData.lucro >= 0 ? "border-emerald-500/20" : "border-red-500/20",
    },
    {
      title: "Margem de Lucro",
      current: currentMonthData.margem,
      previous: previousMonthData.margem,
      change: margemChange,
      icon: PieChart,
      color: "text-purple-400",
      bgGradient: "from-purple-500/10 to-purple-600/5",
      borderColor: "border-purple-500/20",
      isPercentage: true,
    },
    {
      title: "Transações",
      current: currentMonthData.transactionCount,
      previous: previousMonthData.transactionCount,
      change: calculateChange(currentMonthData.transactionCount, previousMonthData.transactionCount),
      icon: Activity,
      color: "text-cyan-400",
      bgGradient: "from-cyan-500/10 to-cyan-600/5",
      borderColor: "border-cyan-500/20",
      isCount: true,
    },
  ]

  const statsCards = [
    // Kept for compatibility, but not used in the new structure
    {
      title: "Total de Vendas",
      value: formatCurrency(stats.totalVendas),
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-gradient-to-br from-green-50 via-emerald-50 to-green-100",
      borderColor: "border-green-300",
      change: `+${stats.crescimentoSemanal.toFixed(1)}%`,
      changeColor: stats.crescimentoSemanal >= 0 ? "text-green-600" : "text-red-600",
      glowColor: "shadow-green-200",
    },
    {
      title: "Total de Compras",
      value: formatCurrency(stats.totalCompras),
      icon: TrendingDown,
      color: "text-blue-600",
      bgColor: "bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100",
      borderColor: "border-blue-300",
      change: "Este mês",
      changeColor: "text-blue-600",
      glowColor: "shadow-blue-200",
    },
    {
      title: "Lucro Total",
      value: formatCurrency(stats.lucroTotal),
      icon: DollarSign,
      color: stats.lucroTotal >= 0 ? "text-emerald-600" : "text-red-600",
      bgColor:
        stats.lucroTotal >= 0
          ? "bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100"
          : "bg-gradient-to-br from-red-50 via-rose-50 to-red-100",
      borderColor: stats.lucroTotal >= 0 ? "border-emerald-300" : "border-red-300",
      change: `${stats.margemLucro.toFixed(1)}% margem`,
      changeColor: stats.margemLucro >= 0 ? "text-emerald-600" : "text-red-600",
      glowColor: stats.lucroTotal >= 0 ? "shadow-emerald-200" : "shadow-red-200",
    },
    {
      title: "Transações Hoje",
      value: stats.transacoesHoje,
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-gradient-to-br from-purple-50 via-violet-50 to-purple-100",
      borderColor: "border-purple-300",
      change: "Hoje",
      changeColor: "text-purple-600",
      glowColor: "shadow-purple-200",
    },
    {
      title: "Estoque Total",
      value: `${stats.estoqueTotal.toFixed(1)}kg`,
      icon: Package,
      color: "text-orange-600",
      bgColor: "bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100",
      borderColor: "border-orange-300",
      change: `${Object.keys(inventory).length} materiais`,
      changeColor: "text-orange-600",
      glowColor: "shadow-orange-200",
    },
  ]

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"]

  return (
    <div className="space-y-6 lg:space-y-8 p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-gray-100 min-h-screen">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-100/30 via-purple-100/30 to-cyan-100/30 blur-3xl -z-10"></div>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-2xl shadow-lg">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
              Visão Geral do Negócio
            </h1>
          </div>
          <p className="text-gray-600 text-lg mb-4">Comparação mensal e insights comerciais em tempo real</p>

          <div className="flex justify-center items-center gap-4 mb-4 flex-wrap">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium shadow-lg ${
                firebaseConnected
                  ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white"
                  : "bg-gradient-to-r from-yellow-500 to-orange-600 text-white"
              }`}
            >
              {firebaseConnected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              <span>{firebaseConnected ? "Sistema Online" : "Modo Offline"}</span>
            </motion.div>

            {syncing && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-full text-sm font-medium shadow-lg"
              >
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Sincronizando...</span>
              </motion.div>
            )}

            {lastSyncTime && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 px-4 py-2 bg-white/80 border border-gray-200 rounded-full text-sm text-gray-600 shadow-sm"
              >
                <Clock className="h-4 w-4" />
                <span>Última sync: {new Date(lastSyncTime).toLocaleTimeString("pt-BR")}</span>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {lowStockAlerts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="p-4 border-2 border-orange-300 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <h3 className="font-medium text-orange-800 text-sm">
                    {lowStockAlerts.length} {lowStockAlerts.length === 1 ? "item com" : "itens com"} estoque baixo
                  </h3>
                </div>
                <button
                  onClick={() => onQuickAction("inventory")}
                  className="text-orange-700 hover:text-orange-900 text-xs font-medium"
                >
                  Ver Estoque
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {lowStockAlerts.slice(0, 5).map((alert) => (
                  <span
                    key={alert.material}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      alert.nivel === "critico"
                        ? "bg-red-100 text-red-700 border-2 border-red-300"
                        : "bg-yellow-100 text-yellow-700 border-2 border-yellow-300"
                    }`}
                  >
                    {getMaterialIcon(alert.material)} {alert.material} ({alert.quantidade.toFixed(1)}kg)
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {metricsCards.map((metric, index) => {
          const Icon = metric.icon
          const changeIcon = metric.change > 0 ? ArrowUpRight : metric.change < 0 ? ArrowDownRight : Minus
          const changeColor =
            metric.change > 0 ? "text-emerald-600" : metric.change < 0 ? "text-red-600" : "text-gray-500"

          return (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="group"
            >
              <div className="p-6 bg-white border-2 border-gray-200 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
                      <Icon className={`h-6 w-6 ${metric.color.replace("400", "600")}`} />
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-bold ${changeColor}`}>
                      {React.createElement(changeIcon, { className: "h-4 w-4" })}
                      {Math.abs(metric.change).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{metric.title}</p>
                    <p className={`text-2xl font-bold ${metric.color.replace("400", "600")}`}>
                      {metric.isPercentage
                        ? `${metric.current.toFixed(1)}%`
                        : metric.isCount
                          ? metric.current
                          : formatCurrency(metric.current)}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Mês anterior:{" "}
                      {metric.isPercentage
                        ? `${metric.previous.toFixed(1)}%`
                        : metric.isCount
                          ? metric.previous
                          : formatCurrency(metric.previous)}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-6 bg-white border-2 border-gray-200 rounded-xl shadow-lg"
        >
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Tendência Diária do Mês
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  color: "#1f2937",
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="vendas" stroke="#10b981" strokeWidth={2} name="Vendas" />
              <Line type="monotone" dataKey="compras" stroke="#3b82f6" strokeWidth={2} name="Compras" />
              <Line type="monotone" dataKey="despesas" stroke="#ef4444" strokeWidth={2} name="Despesas" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-6 bg-white border-2 border-gray-200 rounded-xl shadow-lg"
        >
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-purple-600" />
            Distribuição de Pagamentos
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={paymentDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {paymentDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  color: "#1f2937",
                }}
                formatter={(value) => formatCurrency(value)}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-white border-2 border-gray-200 rounded-xl shadow-lg"
        >
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-orange-600" />
            Top Materiais do Mês
          </h2>
          <div className="space-y-3">
            {topMaterials.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">Nenhuma venda registrada este mês</p>
            ) : (
              topMaterials.map((item, index) => (
                <div
                  key={item.material}
                  className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{getMaterialIcon(item.material)}</div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 capitalize">{item.material}</p>
                      <p className="text-xs text-gray-600">{item.quantity.toFixed(1)}kg vendidos</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-emerald-600">{formatCurrency(item.revenue)}</p>
                </div>
              ))
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-white border-2 border-gray-200 rounded-xl shadow-lg xl:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Activity className="h-5 w-5 text-cyan-600" />
              Atividade Recente
            </h2>
            <button
              onClick={() => onQuickAction("reports")}
              className="text-sm text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-1"
            >
              <Eye className="h-4 w-4" />
              Ver Todas
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="text-center py-8">
              <XCircle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-600 mb-1">Nenhuma transação encontrada</p>
              <p className="text-sm text-gray-500">Comece registrando sua primeira transação</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTransactions.slice(0, 5).map((transaction, index) => (
                <motion.div
                  key={transaction.id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        transaction.tipo === "venda"
                          ? "bg-emerald-500"
                          : transaction.tipo === "compra"
                            ? "bg-blue-500"
                            : "bg-red-500"
                      }`}
                    ></div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-800 capitalize">
                          {transaction.tipo === "compra"
                            ? "Compra"
                            : transaction.tipo === "venda"
                              ? "Venda"
                              : "Despesa"}
                        </span>
                        {transaction.material && (
                          <span className="text-xs text-gray-600 capitalize">{transaction.material}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {transaction.quantidade && `${transaction.quantidade}kg • `}
                        {formatDate(transaction.data)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold text-sm ${
                        transaction.tipo === "venda"
                          ? "text-emerald-600"
                          : transaction.tipo === "compra"
                            ? "text-blue-600"
                            : "text-red-600"
                      }`}
                    >
                      {formatCurrency(transaction.valorTotal)}
                    </p>
                    {transaction.formaPagamento && (
                      <p className="text-xs text-gray-500 capitalize">{transaction.formaPagamento}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 bg-white border-2 border-gray-200 rounded-xl shadow-lg"
      >
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-600" />
          Ações Rápidas
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onQuickAction("transaction", "venda")}
            className="h-20 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-emerald-50 to-green-100 hover:from-emerald-100 hover:to-green-200 border-2 border-emerald-300 rounded-xl text-emerald-700 font-semibold text-sm transition-all shadow-md hover:shadow-lg"
          >
            <TrendingUp className="h-5 w-5" />
            Nova Venda
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onQuickAction("transaction", "compra")}
            className="h-20 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-blue-50 to-cyan-100 hover:from-blue-100 hover:to-cyan-200 border-2 border-blue-300 rounded-xl text-blue-700 font-semibold text-sm transition-all shadow-md hover:shadow-lg"
          >
            <TrendingDown className="h-5 w-5" />
            Nova Compra
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onQuickAction("inventory")}
            className="h-20 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-purple-50 to-violet-100 hover:from-purple-100 hover:to-violet-200 border-2 border-purple-300 rounded-xl text-purple-700 font-semibold text-sm transition-all shadow-md hover:shadow-lg"
          >
            <Package className="h-5 w-5" />
            Ver Estoque
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onQuickAction("reports")}
            className="h-20 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-orange-50 to-amber-100 hover:from-orange-100 hover:to-amber-200 border-2 border-orange-300 rounded-xl text-orange-700 font-semibold text-sm transition-all shadow-md hover:shadow-lg"
          >
            <Eye className="h-5 w-5" />
            Relatórios
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCalculatorOpen(true)}
            className="h-20 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-indigo-50 to-blue-100 hover:from-indigo-100 hover:to-blue-200 border-2 border-indigo-300 rounded-xl text-indigo-700 font-semibold text-sm transition-all shadow-md hover:shadow-lg"
          >
            <CalculatorIcon className="h-5 w-5" />
            Calculadora
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSync}
            disabled={syncing}
            className="h-20 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-cyan-50 to-teal-100 hover:from-cyan-100 hover:to-teal-200 border-2 border-cyan-300 rounded-xl text-cyan-700 font-semibold text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Sincronizando" : "Sincronizar"}
          </motion.button>
        </div>
      </motion.div>

      <Calculator isOpen={calculatorOpen} onClose={() => setCalculatorOpen(false)} />
    </div>
  )
}

export default Dashboard
