"use client"

import { useState, useMemo, useCallback, memo, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart3,
  FileText,
  Package,
  RefreshCw,
  Search,
  TrendingUp,
  TrendingDown,
  DollarSign,
  X,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  CreditCard,
  Banknote,
  Eye,
  Edit3,
  Trash2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  ShoppingCart,
  Activity,
  Target,
  Clock,
  CheckCircle2,
  Printer,
  ChevronDown,
  Receipt,
  CalendarDays,
} from "lucide-react"
import { useData } from "@/contexts/DataContext"
import { format, startOfMonth, endOfMonth, subMonths, isValid, differenceInDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"
import TransactionEditModal from "@/components/TransactionEditModal"

// Cores para gráficos
const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"]

// Formatador de moeda
const formatCurrency = (value) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0)
}

// Toast simples
const showToast = (title, description, type = "success") => {
  const toastEl = document.createElement("div")
  const bgColor =
    type === "error" ? "bg-red-100 border-red-500 text-red-800" : "bg-green-100 border-green-500 text-green-800"

  toastEl.innerHTML = `
    <div class="fixed top-4 right-4 z-[9999] p-4 rounded-lg border-l-4 ${bgColor} shadow-lg max-w-sm animate-in slide-in-from-right">
      <div class="font-semibold">${title}</div>
      <div class="text-sm mt-1">${description}</div>
    </div>
  `
  document.body.appendChild(toastEl)
  setTimeout(() => toastEl.remove(), 4000)
}

const ExportMenu = memo(({ onExport, isExporting, disabled }) => {
  const [isOpen, setIsOpen] = useState(false)

  const exportOptions = [
    { id: "pdf-completo", label: "Relatório Completo", icon: FileText, description: "Resumo + Transações + Gráficos" },
    {
      id: "pdf-financeiro",
      label: "Relatório Financeiro",
      icon: DollarSign,
      description: "Análise de receitas e despesas",
    },
    {
      id: "pdf-materiais",
      label: "Relatório por Material",
      icon: Package,
      description: "Análise detalhada por material",
    },
    { id: "pdf-diario", label: "Relatório Diário", icon: CalendarDays, description: "Movimentação dia a dia" },
    { id: "pdf-transacoes", label: "Lista de Transações", icon: Receipt, description: "Tabela completa de transações" },
    {
      id: "pdf-pagamentos",
      label: "Relatório Pagamentos",
      icon: CreditCard,
      description: "Análise por forma de pagamento",
    },
  ]

  return (
    <div className="relative">
      <Button
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting || disabled}
        className="bg-red-600 hover:bg-red-700 shadow-md"
      >
        <Printer className="h-4 w-4 mr-2" />
        Imprimir
        <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-3 bg-slate-50 border-b border-slate-200">
              <h4 className="font-bold text-slate-800 text-sm">Opções de Impressão PDF</h4>
              <p className="text-xs text-slate-500">Escolha o tipo de relatório</p>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {exportOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    onExport(option.id)
                    setIsOpen(false)
                  }}
                  className="w-full flex items-start gap-3 p-3 hover:bg-emerald-50 transition-colors text-left border-b border-slate-100 last:border-0"
                >
                  <div className="bg-red-100 p-2 rounded-lg">
                    <option.icon className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 text-sm">{option.label}</p>
                    <p className="text-xs text-slate-500">{option.description}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="p-2 bg-slate-50 border-t border-slate-200">
              <button
                onClick={() => {
                  onExport("excel")
                  setIsOpen(false)
                }}
                className="w-full flex items-center gap-3 p-2 hover:bg-emerald-100 rounded-lg transition-colors"
              >
                <div className="bg-emerald-100 p-2 rounded-lg">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-slate-800 text-sm">Exportar Excel</p>
                  <p className="text-xs text-slate-500">Planilha completa com 5 abas</p>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
})
ExportMenu.displayName = "ExportMenu"

const StatCard = memo(({ title, value, subtitle, icon: Icon, color, trend, trendValue, className = "" }) => {
  const colorStyles = {
    green: {
      bg: "bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50",
      border: "border-emerald-200",
      icon: "bg-gradient-to-br from-emerald-500 to-green-600",
      text: "text-emerald-700",
      trend: "text-emerald-600",
    },
    blue: {
      bg: "bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-50",
      border: "border-blue-200",
      icon: "bg-gradient-to-br from-blue-500 to-cyan-600",
      text: "text-blue-700",
      trend: "text-blue-600",
    },
    red: {
      bg: "bg-gradient-to-br from-red-50 via-rose-50 to-pink-50",
      border: "border-red-200",
      icon: "bg-gradient-to-br from-red-500 to-rose-600",
      text: "text-red-700",
      trend: "text-red-600",
    },
    orange: {
      bg: "bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50",
      border: "border-orange-200",
      icon: "bg-gradient-to-br from-orange-500 to-amber-600",
      text: "text-orange-700",
      trend: "text-orange-600",
    },
    purple: {
      bg: "bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50",
      border: "border-purple-200",
      icon: "bg-gradient-to-br from-purple-500 to-violet-600",
      text: "text-purple-700",
      trend: "text-purple-600",
    },
  }

  const styles = colorStyles[color] || colorStyles.green

  return (
    <Card
      className={`p-5 ${styles.bg} ${styles.border} border-2 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${styles.text} opacity-80`}>{title}</p>
          <p className="text-2xl lg:text-3xl font-extrabold text-slate-900 truncate">{value}</p>
          {subtitle && (
            <div className="flex items-center gap-2 mt-2">
              {trend !== undefined && (
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold ${trend >= 0 ? "text-emerald-600" : "text-red-600"}`}
                >
                  {trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {trendValue || `${Math.abs(trend).toFixed(1)}%`}
                </span>
              )}
              <span className={`text-xs font-medium ${styles.text}`}>{subtitle}</span>
            </div>
          )}
        </div>
        <div className={`${styles.icon} p-3 rounded-2xl shadow-lg flex-shrink-0`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </Card>
  )
})
StatCard.displayName = "StatCard"

const MiniStatCard = memo(({ label, value, icon: Icon, color = "slate" }) => {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl bg-${color}-50 border border-${color}-100`}>
      <div className={`p-2 rounded-lg bg-${color}-100`}>
        <Icon className={`h-4 w-4 text-${color}-600`} />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-sm font-bold text-slate-800">{value}</p>
      </div>
    </div>
  )
})
MiniStatCard.displayName = "MiniStatCard"

// Componente de Filtros Rápidos
const QuickFilters = memo(({ activePeriod, onPeriodChange }) => {
  const periods = [
    { value: "today", label: "Hoje" },
    { value: "week", label: "Semana" },
    { value: "month", label: "Mês" },
    { value: "quarter", label: "Trimestre" },
    { value: "year", label: "Ano" },
    { value: "custom", label: "Personalizado" },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {periods.map((period) => (
        <Button
          key={period.value}
          variant={activePeriod === period.value ? "default" : "outline"}
          size="sm"
          onClick={() => onPeriodChange(period.value)}
          className={`text-xs font-medium transition-all ${
            activePeriod === period.value
              ? "bg-emerald-600 hover:bg-emerald-700 shadow-md"
              : "hover:bg-emerald-50 hover:border-emerald-300"
          }`}
        >
          {period.label}
        </Button>
      ))}
    </div>
  )
})
QuickFilters.displayName = "QuickFilters"

const TransactionDetailModal = memo(({ transaction, onClose, onEdit, onDelete }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  if (!transaction) return null

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await onDelete(transaction.id)
      showToast("Sucesso", "Transacao excluida com sucesso")
      onClose()
    } catch (error) {
      showToast("Erro", "Falha ao excluir transacao", "error")
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const tipoLabel = transaction.tipo === "venda" ? "Venda" : transaction.tipo === "compra" ? "Compra" : "Despesa"
  const tipoColor =
    transaction.tipo === "venda"
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : transaction.tipo === "compra"
        ? "bg-blue-100 text-blue-700 border-blue-200"
        : "bg-red-100 text-red-700 border-red-200"

  const tipoGradient =
    transaction.tipo === "venda"
      ? "from-emerald-600 to-green-600"
      : transaction.tipo === "compra"
        ? "from-blue-600 to-cyan-600"
        : "from-red-600 to-rose-600"

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`bg-gradient-to-r ${tipoGradient} p-5 text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Detalhes da Transacao</h3>
                <p className="text-white/80 text-sm font-mono">#{transaction.id?.slice(-8) || "N/A"}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <Badge className={`${tipoColor} px-3 py-1.5 text-sm font-semibold border`}>{tipoLabel}</Badge>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Clock className="h-4 w-4" />
              {transaction.data
                ? format(new Date(transaction.data), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })
                : "Data nao disponivel"}
            </div>
          </div>

          {/* Valor Total em Destaque */}
          <div
            className={`p-4 rounded-xl ${transaction.tipo === "venda" ? "bg-emerald-50 border border-emerald-200" : transaction.tipo === "compra" ? "bg-blue-50 border border-blue-200" : "bg-red-50 border border-red-200"}`}
          >
            <p className="text-xs text-slate-500 uppercase font-medium mb-1">Valor Total</p>
            <p
              className={`text-3xl font-extrabold ${transaction.tipo === "venda" ? "text-emerald-600" : transaction.tipo === "compra" ? "text-blue-600" : "text-red-600"}`}
            >
              {formatCurrency(transaction.valorTotal)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs text-slate-500 uppercase font-medium mb-1">Material</p>
              <p className="font-bold text-slate-800 capitalize">{transaction.material || "-"}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs text-slate-500 uppercase font-medium mb-1">Quantidade</p>
              <p className="font-bold text-slate-800">
                {transaction.quantidade ? `${transaction.quantidade.toFixed(2)} kg` : "-"}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs text-slate-500 uppercase font-medium mb-1">Preco/kg</p>
              <p className="font-bold text-slate-800">{formatCurrency(transaction.precoUnitario)}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs text-slate-500 uppercase font-medium mb-1">Pagamento</p>
              <p className="font-bold text-slate-800 capitalize flex items-center gap-2">
                {transaction.formaPagamento === "pix" ? (
                  <>
                    <Banknote className="h-4 w-4 text-purple-500" /> PIX
                  </>
                ) : (
                  <>
                    <DollarSign className="h-4 w-4 text-green-500" /> Dinheiro
                  </>
                )}
              </p>
            </div>
          </div>

          {(transaction.vendedor || transaction.cliente || transaction.fornecedor) && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs text-slate-500 uppercase font-medium mb-1">Pessoa/Cliente</p>
              <p className="font-bold text-slate-800 flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-400" />
                {transaction.vendedor || transaction.cliente || transaction.fornecedor}
              </p>
            </div>
          )}

          {transaction.observacoes && (
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <p className="text-xs text-amber-600 uppercase font-medium mb-1">Observacoes</p>
              <p className="text-slate-700 text-sm">{transaction.observacoes}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-200 p-4 bg-slate-50 flex gap-3">
          {showDeleteConfirm ? (
            <>
              <Button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {deleting ? "Excluindo..." : "Confirmar Exclusao"}
              </Button>
              <Button onClick={() => setShowDeleteConfirm(false)} variant="outline" className="flex-1">
                Cancelar
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => onEdit(transaction)} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                <Edit3 className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                variant="outline"
                className="flex-1 text-red-600 hover:bg-red-50 hover:border-red-300"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
})
TransactionDetailModal.displayName = "TransactionDetailModal"

// Componente principal
export default function OptimizedReports() {
  const {
    transactions = [],
    refreshData,
    syncing,
    editTransaction,
    deleteTransaction,
    liveSummary, // KPIs do Cloud Functions
    fetchTransactionsByPeriod,
  } = useData()

  // Estados
  const [period, setPeriod] = useState("month")
  const [startDate, setStartDate] = useState(() => format(startOfMonth(new Date()), "yyyy-MM-dd"))
  const [endDate, setEndDate] = useState(() => format(endOfMonth(new Date()), "yyyy-MM-dd"))
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [materialFilter, setMaterialFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("overview")
  const [currentPage, setCurrentPage] = useState(1)
  const [isExporting, setIsExporting] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const itemsPerPage = 15

  const [periodTransactions, setPeriodTransactions] = useState([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    const loadPeriodData = async () => {
      try {
        setLoadingTransactions(true)
        setLoadError(null)

        const start = new Date(startDate)
        const end = new Date(endDate)

        console.log(`[v0] OptimizedReports: Carregando transações de ${startDate} até ${endDate}`)

        if (fetchTransactionsByPeriod) {
          const txns = await fetchTransactionsByPeriod(start, end)
          setPeriodTransactions(txns)
          console.log(`[v0] Carregadas ${txns.length} transações do período`)

          // Debug: mostra os tipos de transações carregadas
          const vendas = txns.filter((t) => t.tipo === "venda").length
          const compras = txns.filter((t) => t.tipo === "compra").length
          const despesas = txns.filter((t) => t.tipo === "despesa").length
          console.log(`[v0] Tipos carregados: ${vendas} vendas, ${compras} compras, ${despesas} despesas`)
        } else {
          console.log("[v0] fetchTransactionsByPeriod não disponível, usando transações do contexto")
          setPeriodTransactions(transactions)
        }
      } catch (error) {
        console.error("[v0] Erro ao carregar dados do período:", error)
        setLoadError(error.message)
        // Fallback para transações do contexto
        setPeriodTransactions(transactions)
      } finally {
        setLoadingTransactions(false)
      }
    }

    loadPeriodData()
  }, [startDate, endDate, fetchTransactionsByPeriod])

  // Handler para mudança de período
  const handlePeriodChange = useCallback((newPeriod) => {
    setPeriod(newPeriod)
    const now = new Date()
    let start, end

    switch (newPeriod) {
      case "today":
        start = end = now
        break
      case "week":
        start = new Date(now)
        start.setDate(now.getDate() - now.getDay())
        end = now
        break
      case "month":
        start = startOfMonth(now)
        end = endOfMonth(now)
        break
      case "quarter":
        start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
        end = now
        break
      case "year":
        start = new Date(now.getFullYear(), 0, 1)
        end = now
        break
      default:
        return
    }

    setStartDate(format(start, "yyyy-MM-dd"))
    setEndDate(format(end, "yyyy-MM-dd"))
    setCurrentPage(1)
  }, [])

  // Navegação entre meses
  const navigateMonth = useCallback(
    (direction) => {
      const current = new Date(startDate)
      const newDate =
        direction === "prev" ? subMonths(current, 1) : new Date(current.getFullYear(), current.getMonth() + 1, 1)
      setStartDate(format(startOfMonth(newDate), "yyyy-MM-dd"))
      setEndDate(format(endOfMonth(newDate), "yyyy-MM-dd"))
      setPeriod("custom")
      setCurrentPage(1)
    },
    [startDate],
  )

  const filteredTransactions = useMemo(() => {
    // Usa as transações do período carregadas diretamente do Firestore
    const sourceTransactions = periodTransactions.length > 0 ? periodTransactions : transactions

    if (!sourceTransactions.length) return []

    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    return sourceTransactions
      .filter((t) => {
        if (!t?.data) return false
        const date = new Date(t.data)
        if (!isValid(date)) return false

        // Verifica se está dentro do período
        if (date < start || date > end) return false

        // Filtros adicionais
        if (typeFilter !== "all" && t.tipo !== typeFilter) return false
        if (materialFilter !== "all" && t.material !== materialFilter) return false
        if (paymentFilter !== "all" && (t.formaPagamento || "dinheiro") !== paymentFilter) return false
        if (searchTerm) {
          const term = searchTerm.toLowerCase()
          const matches =
            t.material?.toLowerCase().includes(term) ||
            t.vendedor?.toLowerCase().includes(term) ||
            t.cliente?.toLowerCase().includes(term) ||
            t.fornecedor?.toLowerCase().includes(term) ||
            t.observacoes?.toLowerCase().includes(term)
          if (!matches) return false
        }
        return true
      })
      .sort((a, b) => new Date(b.data) - new Date(a.data))
  }, [periodTransactions, transactions, startDate, endDate, typeFilter, materialFilter, paymentFilter, searchTerm])

  const stats = useMemo(() => {
    console.log(`[v0] Calculando stats a partir de ${filteredTransactions.length} transações filtradas`)

    const result = {
      totalVendas: 0,
      totalCompras: 0,
      totalDespesas: 0,
      countVendas: 0,
      countCompras: 0,
      countDespesas: 0,
      materialStats: {},
      paymentStats: {},
      dailyStats: {},
      vendedorStats: {},
      totalQuantidade: 0,
      ticketMedioVenda: 0,
      ticketMedioCompra: 0,
    }

    filteredTransactions.forEach((t) => {
      const valor = Number(t.valorTotal) || 0
      const tipo = t.tipo

      if (tipo === "venda") {
        result.totalVendas += valor
        result.countVendas++
        result.totalQuantidade += Number(t.quantidade) || 0
      } else if (tipo === "compra") {
        result.totalCompras += valor
        result.countCompras++
      } else if (tipo === "despesa") {
        result.totalDespesas += valor
        result.countDespesas++
      }

      // Stats por material
      if (t.material) {
        if (!result.materialStats[t.material]) {
          result.materialStats[t.material] = { vendas: 0, compras: 0, quantidade: 0, lucro: 0, transacoes: 0 }
        }
        if (tipo === "venda") {
          result.materialStats[t.material].vendas += valor
          result.materialStats[t.material].quantidade += Number(t.quantidade) || 0
        } else if (tipo === "compra") {
          result.materialStats[t.material].compras += valor
        }
        result.materialStats[t.material].transacoes++
        result.materialStats[t.material].lucro =
          result.materialStats[t.material].vendas - result.materialStats[t.material].compras
      }

      // Stats por pagamento
      const payment = t.formaPagamento || "dinheiro"
      if (!result.paymentStats[payment]) {
        result.paymentStats[payment] = { total: 0, count: 0 }
      }
      result.paymentStats[payment].total += valor
      result.paymentStats[payment].count++

      // Stats diário
      if (t.data) {
        const day = format(new Date(t.data), "yyyy-MM-dd")
        if (!result.dailyStats[day]) {
          result.dailyStats[day] = { vendas: 0, compras: 0, despesas: 0, lucro: 0, transacoes: 0 }
        }
        if (tipo === "venda") result.dailyStats[day].vendas += valor
        else if (tipo === "compra") result.dailyStats[day].compras += valor
        else if (tipo === "despesa") result.dailyStats[day].despesas += valor
        result.dailyStats[day].transacoes++
        result.dailyStats[day].lucro =
          result.dailyStats[day].vendas - result.dailyStats[day].compras - result.dailyStats[day].despesas
      }

      // Stats por vendedor/cliente
      const pessoa = t.vendedor || t.cliente || t.fornecedor
      if (pessoa) {
        if (!result.vendedorStats[pessoa]) {
          result.vendedorStats[pessoa] = { total: 0, count: 0 }
        }
        result.vendedorStats[pessoa].total += valor
        result.vendedorStats[pessoa].count++
      }
    })

    result.lucroTotal = result.totalVendas - result.totalCompras - result.totalDespesas
    result.margemLucro = result.totalVendas > 0 ? (result.lucroTotal / result.totalVendas) * 100 : 0
    result.ticketMedioVenda = result.countVendas > 0 ? result.totalVendas / result.countVendas : 0
    result.ticketMedioCompra = result.countCompras > 0 ? result.totalCompras / result.countCompras : 0
    result.diasNoPeriodo = differenceInDays(new Date(endDate), new Date(startDate)) + 1
    result.mediaVendasDia = result.diasNoPeriodo > 0 ? result.totalVendas / result.diasNoPeriodo : 0
    result.mediaTransacoesDia = result.diasNoPeriodo > 0 ? filteredTransactions.length / result.diasNoPeriodo : 0

    console.log(
      `[v0] Stats calculados: ${result.countVendas} vendas (${formatCurrency(result.totalVendas)}), ${result.countCompras} compras (${formatCurrency(result.totalCompras)})`,
    )

    return result
  }, [filteredTransactions, endDate, startDate])

  // Dados para gráficos
  const chartData = useMemo(() => {
    const dailyArray = Object.entries(stats.dailyStats)
      .map(([date, data]) => ({
        date: format(new Date(date), "dd/MM", { locale: ptBR }),
        fullDate: date,
        ...data,
      }))
      .sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate))
      .slice(-15)

    const materialArray = Object.entries(stats.materialStats)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.vendas - a.vendas)
      .slice(0, 8)

    const paymentArray = Object.entries(stats.paymentStats).map(([name, data]) => ({
      name:
        name === "pix"
          ? "PIX"
          : name === "dinheiro"
            ? "Dinheiro"
            : name === "pagamento_divida"
              ? "Pagamento Divida"
              : name,
      value: data.total,
      count: data.count,
    }))

    const vendedorArray = Object.entries(stats.vendedorStats)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)

    return { dailyArray, materialArray, paymentArray, vendedorArray }
  }, [stats])

  const uniqueMaterials = useMemo(() => {
    const sourceTransactions = periodTransactions.length > 0 ? periodTransactions : transactions
    return [...new Set(sourceTransactions.map((t) => t.material).filter(Boolean))].sort()
  }, [periodTransactions, transactions])

  // Paginação
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredTransactions.slice(start, start + itemsPerPage)
  }, [filteredTransactions, currentPage])

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)

  // Limpar filtros
  const clearFilters = useCallback(() => {
    setSearchTerm("")
    setTypeFilter("all")
    setMaterialFilter("all")
    setPaymentFilter("all")
    setCurrentPage(1)
  }, [])

  const createPDFHeader = (doc, title, subtitle) => {
    const pageWidth = doc.internal.pageSize.getWidth()

    // Header verde
    doc.setFillColor(34, 197, 94)
    doc.rect(0, 0, pageWidth, 45, "F")

    // Titulo
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.setFont("helvetica", "bold")
    doc.text("IMPERIO SUCATA", pageWidth / 2, 15, { align: "center" })

    doc.setFontSize(14)
    doc.setFont("helvetica", "normal")
    doc.text(title, pageWidth / 2, 25, { align: "center" })

    doc.setFontSize(10)
    const periodText = `Periodo: ${format(new Date(startDate), "dd/MM/yyyy")} ate ${format(new Date(endDate), "dd/MM/yyyy")}`
    doc.text(periodText, pageWidth / 2, 33, { align: "center" })

    if (subtitle) {
      doc.setFontSize(9)
      doc.text(subtitle, pageWidth / 2, 40, { align: "center" })
    }

    return 55 // posição Y inicial
  }

  const createPDFFooter = (doc) => {
    const pageCount = doc.internal.getNumberOfPages()
    const pageHeight = doc.internal.pageSize.getHeight()
    const pageWidth = doc.internal.pageSize.getWidth()

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.5)
      doc.line(15, pageHeight - 18, pageWidth - 15, pageHeight - 18)
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text(`Pagina ${i} de ${pageCount}`, 15, pageHeight - 10)
      doc.text("Sistema Imperio Sucata - Relatorio Confidencial", pageWidth / 2, pageHeight - 10, { align: "center" })
      doc.text(format(new Date(), "dd/MM/yyyy HH:mm"), pageWidth - 15, pageHeight - 10, { align: "right" })
    }
  }

  const handleExport = useCallback(
    async (exportType) => {
      if (!filteredTransactions.length && exportType !== "excel") {
        showToast("Sem dados", "Nao ha transacoes para exportar", "error")
        return
      }

      setIsExporting(true)

      try {
        if (exportType === "excel") {
          // Exportar Excel
          const workbook = XLSX.utils.book_new()

          // Aba 1: Resumo
          const summaryData = [
            ["IMPERIO SUCATA - Relatorio Consolidado"],
            [`Periodo: ${format(new Date(startDate), "dd/MM/yyyy")} ate ${format(new Date(endDate), "dd/MM/yyyy")}`],
            [`Gerado em: ${format(new Date(), "dd/MM/yyyy 'as' HH:mm")}`],
            [],
            ["RESUMO FINANCEIRO"],
            ["Metrica", "Valor (R$)", "Quantidade"],
            ["Total Vendas", stats.totalVendas, stats.countVendas],
            ["Total Compras", stats.totalCompras, stats.countCompras],
            ["Total Despesas", stats.totalDespesas, stats.countDespesas],
            ["Lucro Liquido", stats.lucroTotal, "-"],
            [],
            ["INDICADORES"],
            ["Margem de Lucro", `${stats.margemLucro.toFixed(2)}%`],
            ["Ticket Medio Venda", stats.ticketMedioVenda],
            ["Ticket Medio Compra", stats.ticketMedioCompra],
            ["Media Vendas/Dia", stats.mediaVendasDia],
            ["Total de Transacoes", filteredTransactions.length],
            ["Dias no Periodo", stats.diasNoPeriodo],
          ]
          const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
          XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumo")

          // Aba 2: Transações
          const transactionsData = [
            [
              "Data",
              "Hora",
              "Tipo",
              "Material",
              "Quantidade (kg)",
              "Preco/kg",
              "Valor Total",
              "Forma Pagamento",
              "Pessoa",
              "Observacoes",
            ],
            ...filteredTransactions.map((t) => [
              format(new Date(t.data), "dd/MM/yyyy"),
              format(new Date(t.data), "HH:mm"),
              t.tipo === "venda" ? "Venda" : t.tipo === "compra" ? "Compra" : "Despesa",
              t.material || "-",
              t.quantidade || 0,
              t.precoUnitario || 0,
              t.valorTotal || 0,
              t.formaPagamento === "pix"
                ? "PIX"
                : t.formaPagamento === "pagamento_divida"
                  ? "Pagamento Divida"
                  : "Dinheiro",
              t.vendedor || t.cliente || t.fornecedor || "-",
              t.observacoes || "-",
            ]),
          ]
          const transactionsSheet = XLSX.utils.aoa_to_sheet(transactionsData)
          XLSX.utils.book_append_sheet(workbook, transactionsSheet, "Transacoes")

          // Aba 3: Por Material
          const materialData = [
            ["Material", "Quantidade (kg)", "Vendas (R$)", "Compras (R$)", "Lucro (R$)", "Margem (%)", "Transacoes"],
            ...Object.entries(stats.materialStats)
              .sort(([, a], [, b]) => b.lucro - a.lucro)
              .map(([material, data]) => [
                material,
                data.quantidade,
                data.vendas,
                data.compras,
                data.lucro,
                data.vendas > 0 ? ((data.lucro / data.vendas) * 100).toFixed(2) : 0,
                data.transacoes,
              ]),
          ]
          const materialSheet = XLSX.utils.aoa_to_sheet(materialData)
          XLSX.utils.book_append_sheet(workbook, materialSheet, "Por Material")

          // Aba 4: Formas de Pagamento
          const totalPayments = Object.values(stats.paymentStats).reduce((sum, d) => sum + d.total, 0)
          const paymentData = [
            ["Forma de Pagamento", "Quantidade", "Valor Total (R$)", "Percentual (%)"],
            ...Object.entries(stats.paymentStats).map(([method, data]) => [
              method === "pix"
                ? "PIX"
                : method === "dinheiro"
                  ? "Dinheiro"
                  : method === "pagamento_divida"
                    ? "Pagamento Divida"
                    : method,
              data.count,
              data.total,
              totalPayments > 0 ? ((data.total / totalPayments) * 100).toFixed(2) : 0,
            ]),
          ]
          const paymentSheet = XLSX.utils.aoa_to_sheet(paymentData)
          XLSX.utils.book_append_sheet(workbook, paymentSheet, "Pagamentos")

          // Aba 5: Diário
          const dailyData = [
            ["Data", "Transacoes", "Vendas (R$)", "Compras (R$)", "Despesas (R$)", "Lucro (R$)"],
            ...Object.entries(stats.dailyStats)
              .sort(([a], [b]) => new Date(a) - new Date(b))
              .map(([date, data]) => [
                format(new Date(date), "dd/MM/yyyy"),
                data.transacoes,
                data.vendas,
                data.compras,
                data.despesas,
                data.lucro,
              ]),
          ]
          const dailySheet = XLSX.utils.aoa_to_sheet(dailyData)
          XLSX.utils.book_append_sheet(workbook, dailySheet, "Diario")

          XLSX.writeFile(
            workbook,
            `imperio_sucata_relatorio_${format(new Date(startDate), "dd-MM-yyyy")}_${format(new Date(endDate), "dd-MM-yyyy")}.xlsx`,
          )
          showToast("Excel Exportado", "Planilha gerada com sucesso!")
        } else {
          // PDF exports
          const doc = new jsPDF()

          if (exportType === "pdf-completo") {
            let yPos = createPDFHeader(doc, "RELATORIO COMPLETO", `${filteredTransactions.length} transacoes`)

            // Resumo Financeiro
            doc.setFontSize(14)
            doc.setTextColor(0, 0, 0)
            doc.setFont("helvetica", "bold")
            doc.text("RESUMO FINANCEIRO", 15, yPos)
            yPos += 8

            const summaryTableData = [
              ["Total Vendas", formatCurrency(stats.totalVendas), `${stats.countVendas} transacoes`],
              ["Total Compras", formatCurrency(stats.totalCompras), `${stats.countCompras} transacoes`],
              ["Total Despesas", formatCurrency(stats.totalDespesas), `${stats.countDespesas} transacoes`],
              ["Lucro Liquido", formatCurrency(stats.lucroTotal), `Margem: ${stats.margemLucro.toFixed(1)}%`],
            ]

            autoTable(doc, {
              startY: yPos,
              head: [["Metrica", "Valor", "Detalhes"]],
              body: summaryTableData,
              theme: "striped",
              headStyles: { fillColor: [34, 197, 94] },
              margin: { left: 15, right: 15 },
            })

            yPos = doc.lastAutoTable.finalY + 15

            // Transações recentes
            doc.setFontSize(14)
            doc.setFont("helvetica", "bold")
            doc.text("ULTIMAS TRANSACOES", 15, yPos)
            yPos += 8

            const transTableData = filteredTransactions
              .slice(0, 20)
              .map((t) => [
                format(new Date(t.data), "dd/MM/yyyy"),
                t.tipo === "venda" ? "Venda" : t.tipo === "compra" ? "Compra" : "Despesa",
                t.material || "-",
                `${t.quantidade?.toFixed(2) || 0} kg`,
                formatCurrency(t.valorTotal),
              ])

            autoTable(doc, {
              startY: yPos,
              head: [["Data", "Tipo", "Material", "Qtd", "Valor"]],
              body: transTableData,
              theme: "striped",
              headStyles: { fillColor: [59, 130, 246] },
              margin: { left: 15, right: 15 },
              styles: { fontSize: 8 },
            })

            createPDFFooter(doc)
            doc.save(
              `imperio_sucata_completo_${format(new Date(startDate), "dd-MM-yyyy")}_${format(new Date(endDate), "dd-MM-yyyy")}.pdf`,
            )
          } else if (exportType === "pdf-financeiro") {
            let yPos = createPDFHeader(doc, "RELATORIO FINANCEIRO", "Analise de receitas e despesas")

            // Gráfico de barras simplificado (simulado com tabela)
            doc.setFontSize(14)
            doc.setTextColor(0, 0, 0)
            doc.setFont("helvetica", "bold")
            doc.text("VISAO GERAL FINANCEIRA", 15, yPos)
            yPos += 10

            const financeData = [
              ["Receita (Vendas)", formatCurrency(stats.totalVendas), "100%"],
              [
                "(-) Custos (Compras)",
                formatCurrency(stats.totalCompras),
                `${((stats.totalCompras / (stats.totalVendas || 1)) * 100).toFixed(1)}%`,
              ],
              [
                "(-) Despesas",
                formatCurrency(stats.totalDespesas),
                `${((stats.totalDespesas / (stats.totalVendas || 1)) * 100).toFixed(1)}%`,
              ],
              ["(=) Lucro Bruto", formatCurrency(stats.lucroTotal), `${stats.margemLucro.toFixed(1)}%`],
            ]

            autoTable(doc, {
              startY: yPos,
              head: [["Descricao", "Valor", "% da Receita"]],
              body: financeData,
              theme: "grid",
              headStyles: { fillColor: [34, 197, 94] },
              margin: { left: 15, right: 15 },
            })

            yPos = doc.lastAutoTable.finalY + 15

            // Indicadores
            doc.setFontSize(14)
            doc.setFont("helvetica", "bold")
            doc.text("INDICADORES DE DESEMPENHO", 15, yPos)
            yPos += 10

            const indicatorsData = [
              ["Ticket Medio Venda", formatCurrency(stats.ticketMedioVenda)],
              ["Ticket Medio Compra", formatCurrency(stats.ticketMedioCompra)],
              ["Media Vendas/Dia", formatCurrency(stats.mediaVendasDia)],
              ["Dias no Periodo", `${stats.diasNoPeriodo} dias`],
              ["Total Transacoes", `${filteredTransactions.length}`],
            ]

            autoTable(doc, {
              startY: yPos,
              head: [["Indicador", "Valor"]],
              body: indicatorsData,
              theme: "striped",
              headStyles: { fillColor: [59, 130, 246] },
              margin: { left: 15, right: 15 },
            })

            createPDFFooter(doc)
            doc.save(
              `imperio_sucata_financeiro_${format(new Date(startDate), "dd-MM-yyyy")}_${format(new Date(endDate), "dd-MM-yyyy")}.pdf`,
            )
          } else if (exportType === "pdf-materiais") {
            const yPos = createPDFHeader(doc, "RELATORIO POR MATERIAL", "Analise detalhada por tipo de material")

            const materialTableData = Object.entries(stats.materialStats)
              .sort(([, a], [, b]) => b.lucro - a.lucro)
              .map(([material, data]) => [
                material.toUpperCase(),
                `${data.quantidade.toFixed(2)} kg`,
                formatCurrency(data.vendas),
                formatCurrency(data.compras),
                formatCurrency(data.lucro),
                `${data.vendas > 0 ? ((data.lucro / data.vendas) * 100).toFixed(1) : 0}%`,
              ])

            autoTable(doc, {
              startY: yPos,
              head: [["Material", "Quantidade", "Vendas", "Compras", "Lucro", "Margem"]],
              body: materialTableData,
              theme: "striped",
              headStyles: { fillColor: [139, 92, 246] },
              margin: { left: 15, right: 15 },
              styles: { fontSize: 9 },
            })

            createPDFFooter(doc)
            doc.save(
              `imperio_sucata_materiais_${format(new Date(startDate), "dd-MM-yyyy")}_${format(new Date(endDate), "dd-MM-yyyy")}.pdf`,
            )
          } else if (exportType === "pdf-diario") {
            const yPos = createPDFHeader(doc, "RELATORIO DIARIO", "Movimentacao dia a dia")

            const dailyTableData = Object.entries(stats.dailyStats)
              .sort(([a], [b]) => new Date(a) - new Date(b))
              .map(([date, data]) => [
                format(new Date(date), "dd/MM/yyyy (EEE)", { locale: ptBR }),
                data.transacoes.toString(),
                formatCurrency(data.vendas),
                formatCurrency(data.compras),
                formatCurrency(data.despesas),
                formatCurrency(data.lucro),
              ])

            autoTable(doc, {
              startY: yPos,
              head: [["Data", "Trans.", "Vendas", "Compras", "Despesas", "Lucro"]],
              body: dailyTableData,
              theme: "striped",
              headStyles: { fillColor: [249, 115, 22] },
              margin: { left: 15, right: 15 },
              styles: { fontSize: 8 },
            })

            createPDFFooter(doc)
            doc.save(
              `imperio_sucata_diario_${format(new Date(startDate), "dd-MM-yyyy")}_${format(new Date(endDate), "dd-MM-yyyy")}.pdf`,
            )
          } else if (exportType === "pdf-transacoes") {
            const yPos = createPDFHeader(doc, "LISTA DE TRANSACOES", `${filteredTransactions.length} registros`)

            const transTableData = filteredTransactions.map((t) => [
              format(new Date(t.data), "dd/MM/yy HH:mm"),
              t.tipo === "venda" ? "V" : t.tipo === "compra" ? "C" : "D",
              t.material?.substring(0, 10) || "-",
              `${t.quantidade?.toFixed(1) || 0}`,
              formatCurrency(t.valorTotal),
              t.formaPagamento === "pix" ? "PIX" : "Din",
            ])

            autoTable(doc, {
              startY: yPos,
              head: [["Data/Hora", "Tipo", "Material", "Kg", "Valor", "Pag"]],
              body: transTableData,
              theme: "striped",
              headStyles: { fillColor: [59, 130, 246] },
              margin: { left: 10, right: 10 },
              styles: { fontSize: 7 },
            })

            createPDFFooter(doc)
            doc.save(
              `imperio_sucata_transacoes_${format(new Date(startDate), "dd-MM-yyyy")}_${format(new Date(endDate), "dd-MM-yyyy")}.pdf`,
            )
          } else if (exportType === "pdf-pagamentos") {
            const yPos = createPDFHeader(doc, "RELATORIO DE PAGAMENTOS", "Analise por forma de pagamento")

            const totalPayments = Object.values(stats.paymentStats).reduce((sum, d) => sum + d.total, 0)

            const paymentTableData = Object.entries(stats.paymentStats).map(([method, data]) => [
              method === "pix"
                ? "PIX"
                : method === "dinheiro"
                  ? "Dinheiro"
                  : method === "pagamento_divida"
                    ? "Pagamento de Divida"
                    : method,
              data.count.toString(),
              formatCurrency(data.total),
              `${totalPayments > 0 ? ((data.total / totalPayments) * 100).toFixed(1) : 0}%`,
            ])

            autoTable(doc, {
              startY: yPos,
              head: [["Forma de Pagamento", "Quantidade", "Valor Total", "Percentual"]],
              body: paymentTableData,
              theme: "striped",
              headStyles: { fillColor: [236, 72, 153] },
              margin: { left: 15, right: 15 },
            })

            createPDFFooter(doc)
            doc.save(
              `imperio_sucata_pagamentos_${format(new Date(startDate), "dd-MM-yyyy")}_${format(new Date(endDate), "dd-MM-yyyy")}.pdf`,
            )
          }

          showToast("PDF Gerado", "Relatorio exportado com sucesso!")
        }
      } catch (error) {
        console.error("Erro ao exportar:", error)
        showToast("Erro", "Falha ao gerar exportacao", "error")
      } finally {
        setIsExporting(false)
      }
    },
    [filteredTransactions, stats, startDate, endDate],
  )

  // Handler para edição
  const handleEdit = useCallback((transaction) => {
    setSelectedTransaction(null)
    setEditingTransaction(transaction)
  }, [])

  // Handler para salvar edição
  const handleSaveEdit = useCallback(
    async (updatedData) => {
      try {
        await editTransaction(editingTransaction.id, updatedData)
        setEditingTransaction(null)
        showToast("Sucesso", "Transacao atualizada com sucesso!")
        // Recarrega os dados do período
        if (fetchTransactionsByPeriod) {
          const txns = await fetchTransactionsByPeriod(new Date(startDate), new Date(endDate))
          setPeriodTransactions(txns)
        }
      } catch (error) {
        showToast("Erro", "Falha ao atualizar transacao", "error")
      }
    },
    [editTransaction, editingTransaction, fetchTransactionsByPeriod, startDate, endDate],
  )

  // Handler para deletar
  const handleDelete = useCallback(
    async (id) => {
      await deleteTransaction(id)
      // Recarrega os dados do período
      if (fetchTransactionsByPeriod) {
        const txns = await fetchTransactionsByPeriod(new Date(startDate), new Date(endDate))
        setPeriodTransactions(txns)
      }
    },
    [deleteTransaction, fetchTransactionsByPeriod, startDate, endDate],
  )

  // Mostra o mês atual formatado
  const currentMonthDisplay = useMemo(() => {
    const date = new Date(startDate)
    return format(date, "MMMM yyyy", { locale: ptBR })
  }, [startDate])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-100 p-3 rounded-2xl">
            <BarChart3 className="h-8 w-8 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Relatorios</h1>
            <p className="text-slate-500">Analise completa do seu negocio</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={syncing}
            className="shadow-sm bg-transparent"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <ExportMenu onExport={handleExport} isExporting={isExporting} disabled={!filteredTransactions.length} />
        </div>
      </div>

      {/* Filtros */}
      <Card className="p-4 bg-white shadow-lg border-slate-200">
        <div className="flex flex-col gap-4">
          {/* Filtros rápidos de período */}
          <div className="flex flex-wrap items-center gap-4">
            <QuickFilters activePeriod={period} onPeriodChange={handlePeriodChange} />

            {/* Navegação de mês */}
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="outline" size="icon" onClick={() => navigateMonth("prev")} className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center capitalize">{currentMonthDisplay}</span>
              <Button variant="outline" size="icon" onClick={() => navigateMonth("next")} className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Filtros detalhados */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Data Inicial</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  setPeriod("custom")
                }}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Data Final</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  setPeriod("custom")
                }}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Tipo</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full h-9 px-3 text-sm border border-slate-200 rounded-md bg-white"
              >
                <option value="all">Todos</option>
                <option value="venda">Vendas</option>
                <option value="compra">Compras</option>
                <option value="despesa">Despesas</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Material</label>
              <select
                value={materialFilter}
                onChange={(e) => setMaterialFilter(e.target.value)}
                className="w-full h-9 px-3 text-sm border border-slate-200 rounded-md bg-white"
              >
                <option value="all">Todos</option>
                {uniqueMaterials.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Pagamento</label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full h-9 px-3 text-sm border border-slate-200 rounded-md bg-white"
              >
                <option value="all">Todos</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="pix">PIX</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 pl-8 text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Loading state */}
      {loadingTransactions && (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-emerald-600 mr-2" />
          <span className="text-slate-600">Carregando dados do periodo...</span>
        </div>
      )}

      {/* Error state */}
      {loadError && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <div>
            <p className="font-medium text-amber-800">Aviso ao carregar dados</p>
            <p className="text-sm text-amber-600">{loadError}</p>
          </div>
        </div>
      )}

      {/* Cards de estatísticas */}
      {!loadingTransactions && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="RECEITA DE VENDAS"
              value={formatCurrency(stats.totalVendas)}
              subtitle={`${stats.countVendas} transacoes`}
              icon={TrendingUp}
              color="green"
              trend={stats.margemLucro}
              trendValue={`${stats.margemLucro.toFixed(1)}%`}
            />
            <StatCard
              title="CUSTO DE COMPRAS"
              value={formatCurrency(stats.totalCompras)}
              subtitle={`${stats.countCompras} transacoes`}
              icon={ShoppingCart}
              color="blue"
            />
            <StatCard
              title="DESPESAS"
              value={formatCurrency(stats.totalDespesas)}
              subtitle={`${stats.countDespesas} transacoes`}
              icon={Receipt}
              color="red"
            />
            <StatCard
              title={stats.lucroTotal >= 0 ? "LUCRO" : "PREJUIZO"}
              value={formatCurrency(Math.abs(stats.lucroTotal))}
              subtitle={`Margem: ${stats.margemLucro.toFixed(1)}%`}
              icon={stats.lucroTotal >= 0 ? TrendingUp : TrendingDown}
              color={stats.lucroTotal >= 0 ? "green" : "red"}
              trend={stats.margemLucro}
              trendValue={`${stats.margemLucro.toFixed(1)}%`}
            />
          </div>

          {/* Mini stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <MiniStatCard label="Ticket Medio" value={formatCurrency(stats.ticketMedioVenda)} icon={Target} />
            <MiniStatCard label="Media/Dia" value={formatCurrency(stats.mediaVendasDia)} icon={Activity} />
            <MiniStatCard label="Total Kg" value={`${stats.totalQuantidade.toFixed(1)} kg`} icon={Package} />
            <MiniStatCard label="Transacoes" value={filteredTransactions.length} icon={CheckCircle2} />
            <MiniStatCard label="Dias" value={`${stats.diasNoPeriodo} dias`} icon={Clock} />
            <MiniStatCard label="Materiais" value={Object.keys(stats.materialStats).length} icon={Package} />
          </div>

          <Card className="p-5 bg-gradient-to-br from-slate-50 to-white border-2 border-slate-200 shadow-lg">
            <div className="flex items-center gap-3 mb-5">
              <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-2.5 rounded-xl shadow-md">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Resumo Geral do Periodo</h3>
                <p className="text-sm text-slate-500">
                  {format(new Date(startDate), "dd/MM/yyyy", { locale: ptBR })} a{" "}
                  {format(new Date(endDate), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Desempenho Financeiro */}
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                  Desempenho Financeiro
                </h4>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Receita Bruta:</span>
                    <span className="font-bold text-emerald-600">{formatCurrency(stats.totalVendas)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">(-) Custo Compras:</span>
                    <span className="font-semibold text-blue-600">{formatCurrency(stats.totalCompras)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">(-) Despesas:</span>
                    <span className="font-semibold text-red-600">{formatCurrency(stats.totalDespesas)}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-700">
                        {stats.lucroTotal >= 0 ? "Lucro Liquido:" : "Prejuizo:"}
                      </span>
                      <span
                        className={`font-extrabold text-lg ${stats.lucroTotal >= 0 ? "text-emerald-600" : "text-red-600"}`}
                      >
                        {formatCurrency(Math.abs(stats.lucroTotal))}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-slate-500">Margem de Lucro:</span>
                      <Badge
                        className={
                          stats.margemLucro >= 20
                            ? "bg-emerald-100 text-emerald-700"
                            : stats.margemLucro >= 0
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                        }
                      >
                        {stats.margemLucro.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Indicadores de Volume */}
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  Indicadores de Volume
                </h4>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Total Transacoes:</span>
                    <span className="font-bold text-slate-800">{filteredTransactions.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Vendas Realizadas:</span>
                    <span className="font-semibold text-emerald-600">{stats.countVendas}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Compras Efetuadas:</span>
                    <span className="font-semibold text-blue-600">{stats.countCompras}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Despesas Registradas:</span>
                    <span className="font-semibold text-red-600">{stats.countDespesas}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Peso Total Movimentado:</span>
                      <span className="font-bold text-slate-800">{stats.totalQuantidade.toFixed(2)} kg</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-slate-600">Materiais Diferentes:</span>
                      <span className="font-bold text-slate-800">{Object.keys(stats.materialStats).length}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Metricas de Desempenho */}
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-500" />
                  Metricas de Desempenho
                </h4>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Ticket Medio Venda:</span>
                    <span className="font-bold text-emerald-600">{formatCurrency(stats.ticketMedioVenda)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Ticket Medio Compra:</span>
                    <span className="font-semibold text-blue-600">{formatCurrency(stats.ticketMedioCompra)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Media Vendas/Dia:</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(stats.mediaVendasDia)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Transacoes/Dia:</span>
                    <span className="font-semibold text-slate-800">{stats.mediaTransacoesDia.toFixed(1)}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Preco Medio/Kg:</span>
                      <span className="font-bold text-slate-800">
                        {formatCurrency(stats.totalQuantidade > 0 ? stats.totalVendas / stats.totalQuantidade : 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-slate-600">Dias no Periodo:</span>
                      <span className="font-bold text-slate-800">{stats.diasNoPeriodo} dias</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Materiais e Formas de Pagamento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* Top 3 Materiais Mais Lucrativos */}
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4 text-amber-500" />
                  Top 3 Materiais Mais Lucrativos
                </h4>
                <div className="space-y-2">
                  {Object.entries(stats.materialStats)
                    .sort(([, a], [, b]) => b.lucro - a.lucro)
                    .slice(0, 3)
                    .map(([material, data], index) => (
                      <div key={material} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Badge
                            className={
                              index === 0
                                ? "bg-amber-100 text-amber-700"
                                : index === 1
                                  ? "bg-slate-200 text-slate-700"
                                  : "bg-orange-100 text-orange-700"
                            }
                          >
                            {index + 1}º
                          </Badge>
                          <span className="text-sm font-medium text-slate-700 capitalize">{material}</span>
                        </div>
                        <span className={`font-bold ${data.lucro >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {formatCurrency(data.lucro)}
                        </span>
                      </div>
                    ))}
                  {Object.keys(stats.materialStats).length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-2">Nenhum material no periodo</p>
                  )}
                </div>
              </div>

              {/* Formas de Pagamento */}
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-cyan-500" />
                  Formas de Pagamento
                </h4>
                <div className="space-y-2">
                  {Object.entries(stats.paymentStats).map(([payment, data]) => {
                    const totalPagamentos = Object.values(stats.paymentStats).reduce((acc, p) => acc + p.total, 0)
                    const percentual = totalPagamentos > 0 ? (data.total / totalPagamentos) * 100 : 0
                    const paymentLabel =
                      payment === "pix"
                        ? "PIX"
                        : payment === "dinheiro"
                          ? "Dinheiro"
                          : payment === "pagamento_divida"
                            ? "Pagamento Divida"
                            : payment
                    return (
                      <div key={payment} className="p-2 bg-slate-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {payment === "pix" ? (
                              <Banknote className="h-4 w-4 text-purple-500" />
                            ) : (
                              <DollarSign className="h-4 w-4 text-green-500" />
                            )}
                            <span className="text-sm font-medium text-slate-700">{paymentLabel}</span>
                          </div>
                          <span className="font-bold text-slate-800">{formatCurrency(data.total)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${payment === "pix" ? "bg-purple-500" : "bg-green-500"}`}
                              style={{ width: `${percentual}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500 w-12 text-right">{percentual.toFixed(0)}%</span>
                        </div>
                      </div>
                    )
                  })}
                  {Object.keys(stats.paymentStats).length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-2">Nenhuma transacao no periodo</p>
                  )}
                </div>
              </div>
            </div>
          </Card>
          {/* Fim do Resumo Geral Expandido */}

          {/* Tabs de conteúdo */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="bg-slate-100 p-1">
              <TabsTrigger value="overview" className="data-[state=active]:bg-white">
                Visao Geral
              </TabsTrigger>
              <TabsTrigger value="transactions" className="data-[state=active]:bg-white">
                Transações
              </TabsTrigger>
              <TabsTrigger value="materials" className="data-[state=active]:bg-white">
                Materiais
              </TabsTrigger>
              <TabsTrigger value="payments" className="data-[state=active]:bg-white">
                Pagamentos
              </TabsTrigger>
            </TabsList>

            {/* Tab: Visão Geral */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Gráfico de evolução diária */}
                <Card className="p-4">
                  <h3 className="font-semibold text-slate-800 mb-4">Evolucao Diaria</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData.dailyArray}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip
                          formatter={(value) => formatCurrency(value)}
                          labelFormatter={(label) => `Data: ${label}`}
                        />
                        <Area
                          type="monotone"
                          dataKey="vendas"
                          stackId="1"
                          stroke="#22c55e"
                          fill="#22c55e"
                          fillOpacity={0.6}
                          name="Vendas"
                        />
                        <Area
                          type="monotone"
                          dataKey="compras"
                          stackId="2"
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          fillOpacity={0.6}
                          name="Compras"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Gráfico por material */}
                <Card className="p-4">
                  <h3 className="font-semibold text-slate-800 mb-4">Top Materiais por Vendas</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.materialArray} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 10 }}
                          tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                        />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Bar dataKey="vendas" fill="#22c55e" name="Vendas" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* Tab: Transações */}
            <TabsContent value="transactions" className="space-y-4">
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left p-3 text-xs font-semibold text-slate-600">Data</th>
                        <th className="text-left p-3 text-xs font-semibold text-slate-600">Tipo</th>
                        <th className="text-left p-3 text-xs font-semibold text-slate-600">Material</th>
                        <th className="text-right p-3 text-xs font-semibold text-slate-600">Qtd (kg)</th>
                        <th className="text-right p-3 text-xs font-semibold text-slate-600">Valor</th>
                        <th className="text-center p-3 text-xs font-semibold text-slate-600">Pagamento</th>
                        <th className="text-center p-3 text-xs font-semibold text-slate-600">Acoes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedTransactions.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 text-sm text-slate-600">
                            {t.data ? format(new Date(t.data), "dd/MM/yyyy HH:mm") : "-"}
                          </td>
                          <td className="p-3">
                            <Badge
                              className={`text-xs ${
                                t.tipo === "venda"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : t.tipo === "compra"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-red-100 text-red-700"
                              }`}
                            >
                              {t.tipo === "venda" ? "Venda" : t.tipo === "compra" ? "Compra" : "Despesa"}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm font-medium text-slate-800 capitalize">{t.material || "-"}</td>
                          <td className="p-3 text-sm text-slate-600 text-right">{t.quantidade?.toFixed(2) || "-"}</td>
                          <td className="p-3 text-sm font-semibold text-slate-800 text-right">
                            {formatCurrency(t.valorTotal)}
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant="outline" className="text-xs">
                              {t.formaPagamento === "pix" ? "PIX" : "Dinheiro"}
                            </Badge>
                          </td>
                          <td className="p-3 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedTransaction(t)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t border-slate-200">
                    <span className="text-sm text-slate-500">
                      Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
                      {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} de{" "}
                      {filteredTransactions.length}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Proximo
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Tab: Materiais */}
            <TabsContent value="materials" className="space-y-4">
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left p-3 text-xs font-semibold text-slate-600">Material</th>
                        <th className="text-right p-3 text-xs font-semibold text-slate-600">Vendas</th>
                        <th className="text-right p-3 text-xs font-semibold text-slate-600">Compras</th>
                        <th className="text-right p-3 text-xs font-semibold text-slate-600">Lucro</th>
                        <th className="text-right p-3 text-xs font-semibold text-slate-600">Quantidade</th>
                        <th className="text-right p-3 text-xs font-semibold text-slate-600">Transacoes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Object.entries(stats.materialStats)
                        .sort(([, a], [, b]) => b.lucro - a.lucro)
                        .map(([material, data]) => (
                          <tr key={material} className="hover:bg-slate-50">
                            <td className="p-3 text-sm font-medium text-slate-800 capitalize">{material}</td>
                            <td className="p-3 text-sm text-emerald-600 text-right font-semibold">
                              {formatCurrency(data.vendas)}
                            </td>
                            <td className="p-3 text-sm text-blue-600 text-right">{formatCurrency(data.compras)}</td>
                            <td
                              className={`p-3 text-sm font-semibold text-right ${data.lucro >= 0 ? "text-emerald-600" : "text-red-600"}`}
                            >
                              {formatCurrency(data.lucro)}
                            </td>
                            <td className="p-3 text-sm text-slate-600 text-right">{data.quantidade.toFixed(2)} kg</td>
                            <td className="p-3 text-sm text-slate-600 text-right">{data.transacoes}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>

            {/* Tab: Pagamentos */}
            <TabsContent value="payments" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="p-4">
                  <h3 className="font-semibold text-slate-800 mb-4">Distribuicao por Pagamento</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData.paymentArray}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {chartData.paymentArray.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left p-3 text-xs font-semibold text-slate-600">Forma de Pagamento</th>
                        <th className="text-right p-3 text-xs font-semibold text-slate-600">Quantidade</th>
                        <th className="text-right p-3 text-xs font-semibold text-slate-600">Valor Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {chartData.paymentArray.map((p) => (
                        <tr key={p.name} className="hover:bg-slate-50">
                          <td className="p-3 text-sm font-medium text-slate-800">{p.name}</td>
                          <td className="p-3 text-sm text-slate-600 text-right">{p.count}</td>
                          <td className="p-3 text-sm font-semibold text-slate-800 text-right">
                            {formatCurrency(p.value)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Modais */}
      {selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {editingTransaction && (
        <TransactionEditModal
          transaction={editingTransaction}
          onCancel={() => setEditingTransaction(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  )
}
