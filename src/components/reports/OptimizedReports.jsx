"use client";

import { useState, useMemo, useCallback, memo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Briefcase,
  Wallet,
  PieChart as PieChartIcon,
} from "lucide-react";
import { useData } from "@/contexts/DataContext";
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  isValid,
  differenceInDays,
} from "date-fns";
import { ptBR } from "date-fns/locale";
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
} from "recharts";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import TransactionEditModal from "@/components/TransactionEditModal";

// Cores para gráficos
const COLORS = [
  "#22c55e",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

// Formatador de moeda
const formatCurrency = (value) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
};

// Toast simples
const showToast = (title, description, type = "success") => {
  const toastEl = document.createElement("div");
  const bgColor =
    type === "error"
      ? "bg-red-100 border-red-500 text-red-800"
      : "bg-green-100 border-green-500 text-green-800";

  toastEl.innerHTML = `
    <div class="fixed top-4 right-4 z-[9999] p-4 rounded-lg border-l-4 ${bgColor} shadow-lg max-w-sm animate-in slide-in-from-right">
      <div class="font-semibold">${title}</div>
      <div class="text-sm mt-1">${description}</div>
    </div>
  `;
  document.body.appendChild(toastEl);
  setTimeout(() => toastEl.remove(), 4000);
};

const ExportMenu = memo(({ onExport, isExporting, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);

  const exportOptions = [
    {
      id: "pdf-completo",
      label: "Relatório Completo",
      icon: FileText,
      description: "Resumo + Transações + Gráficos",
    },
    {
      id: "pdf-financeiro",
      label: "Relatório Financeiro",
      icon: DollarSign,
      description: "Análise de receitas e despesas",
    },
    {
      id: "pdf-despesas",
      label: "Relatório de Despesas",
      icon: Wallet,
      description: "Apenas transações de despesas",
    },
    {
      id: "pdf-clientes-geral",
      label: "Relatório Geral de Clientes",
      icon: Users,
      description: "Resumo de todos os clientes",
    },
    {
      id: "pdf-materiais",
      label: "Relatório por Material",
      icon: Package,
      description: "Análise detalhada por material",
    },
    {
      id: "pdf-diario",
      label: "Relatório Diário",
      icon: CalendarDays,
      description: "Movimentação dia a dia",
    },
    {
      id: "pdf-transacoes",
      label: "Lista de Transações",
      icon: Receipt,
      description: "Tabela completa de transações",
    },
    {
      id: "pdf-pagamentos",
      label: "Relatório Pagamentos",
      icon: CreditCard,
      description: "Análise por forma de pagamento",
    },
  ];

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
        <ChevronDown
          className={`h-4 w-4 ml-1 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-3 bg-slate-50 border-b border-slate-200">
              <h4 className="font-bold text-slate-800 text-sm">
                Opções de Impressão PDF
              </h4>
              <p className="text-xs text-slate-500">
                Escolha o tipo de relatório
              </p>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {exportOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    onExport(option.id);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-start gap-3 p-3 hover:bg-emerald-50 transition-colors text-left border-b border-slate-100 last:border-0"
                >
                  <div className="bg-red-100 p-2 rounded-lg">
                    <option.icon className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 text-sm">
                      {option.label}
                    </p>
                    <p className="text-xs text-slate-500">
                      {option.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            <div className="p-2 bg-slate-50 border-t border-slate-200">
              <button
                onClick={() => {
                  onExport("excel");
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 p-2 hover:bg-emerald-100 rounded-lg transition-colors"
              >
                <div className="bg-emerald-100 p-2 rounded-lg">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-slate-800 text-sm">
                    Exportar Excel
                  </p>
                  <p className="text-xs text-slate-500">
                    Planilha completa com 5 abas
                  </p>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
});
ExportMenu.displayName = "ExportMenu";

const StatCard = memo(
  ({
    title,
    value,
    subtitle,
    icon: Icon,
    color,
    trend,
    trendValue,
    className = "",
  }) => {
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
    };

    const styles = colorStyles[color] || colorStyles.green;

    return (
      <Card
        className={`p-5 ${styles.bg} ${styles.border} border-2 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${className}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p
              className={`text-xs font-bold uppercase tracking-wider mb-1 ${styles.text} opacity-80`}
            >
              {title}
            </p>
            <p className="text-2xl lg:text-3xl font-extrabold text-slate-900 truncate">
              {value}
            </p>
            {subtitle && (
              <div className="flex items-center gap-2 mt-2">
                {trend !== undefined && (
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold ${trend >= 0 ? "text-emerald-600" : "text-red-600"}`}
                  >
                    {trend >= 0 ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {trendValue || `${Math.abs(trend).toFixed(1)}%`}
                  </span>
                )}
                <span className={`text-xs font-medium ${styles.text}`}>
                  {subtitle}
                </span>
              </div>
            )}
          </div>
          <div
            className={`${styles.icon} p-3 rounded-2xl shadow-lg flex-shrink-0`}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </Card>
    );
  },
);
StatCard.displayName = "StatCard";

const MiniStatCard = memo(({ label, value, icon: Icon, color = "slate" }) => {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl bg-${color}-50 border border-${color}-100`}
    >
      <div className={`p-2 rounded-lg bg-${color}-100`}>
        <Icon className={`h-4 w-4 text-${color}-600`} />
      </div>
      <div>
        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
          {label}
        </p>
        <p className="text-sm font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
});
MiniStatCard.displayName = "MiniStatCard";

const QuickFilters = memo(({ activePeriod, onPeriodChange }) => {
  const filters = [
    { id: "today", label: "Hoje" },
    { id: "week", label: "Semana" },
    { id: "month", label: "Mês" },
    { id: "quarter", label: "Trimestre" },
    { id: "year", label: "Ano" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((f) => (
        <Button
          key={f.id}
          variant={activePeriod === f.id ? "default" : "outline"}
          size="sm"
          onClick={() => onPeriodChange(f.id)}
          className={`h-8 px-4 rounded-full text-xs font-bold transition-all ${
            activePeriod === f.id
              ? "bg-emerald-600 hover:bg-emerald-700 shadow-md"
              : "hover:bg-emerald-50 hover:text-emerald-600 border-slate-200"
          }`}
        >
          {f.label}
        </Button>
      ))}
    </div>
  );
});
QuickFilters.displayName = "QuickFilters";

const TransactionDetailModal = memo(
  ({ transaction, onClose, onEdit, onDelete }) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    if (!transaction) return null;

    const handleDelete = async () => {
      setDeleting(true);
      try {
        await onDelete(transaction.id);
        onClose();
      } catch (error) {
        console.error("Erro ao excluir:", error);
      } finally {
        setDeleting(false);
      }
    };

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="absolute inset-0" onClick={onClose} />
        <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div
            className={`p-6 ${
              transaction.tipo === "venda"
                ? "bg-emerald-600"
                : transaction.tipo === "compra"
                  ? "bg-blue-600"
                  : "bg-red-600"
            } text-white`}
          >
            <div className="flex justify-between items-start">
              <div>
                <Badge className="bg-white/20 text-white border-none mb-2 px-3 py-1">
                  {transaction.tipo.toUpperCase()}
                </Badge>
                <h2 className="text-2xl font-bold">Detalhes da Transação</h2>
                <p className="text-white/80 text-sm mt-1">
                  ID: {transaction.id}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                <p className="text-xs text-slate-500 uppercase font-medium mb-1">
                  Data e Hora
                </p>
                <p className="font-bold text-slate-800">
                  {format(new Date(transaction.data), "dd/MM/yyyy HH:mm")}
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                <p className="text-xs text-slate-500 uppercase font-medium mb-1">
                  Valor Total
                </p>
                <p className="text-xl font-black text-slate-900">
                  {formatCurrency(transaction.valorTotal)}
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                <p className="text-xs text-slate-500 uppercase font-medium mb-1">
                  Material
                </p>
                <p className="font-bold text-slate-800 capitalize">
                  {transaction.material || "-"}
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                <p className="text-xs text-slate-500 uppercase font-medium mb-1">
                  Quantidade
                </p>
                <p className="font-bold text-slate-800">
                  {transaction.quantidade
                    ? `${transaction.quantidade.toFixed(2)} kg`
                    : "-"}
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                <p className="text-xs text-slate-500 uppercase font-medium mb-1">
                  Preco/kg
                </p>
                <p className="font-bold text-slate-800">
                  {formatCurrency(transaction.precoUnitario)}
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                <p className="text-xs text-slate-500 uppercase font-medium mb-1">
                  Pagamento
                </p>
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

            {(transaction.vendedor ||
              transaction.cliente ||
              transaction.fornecedor) && (
              <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                <p className="text-xs text-slate-500 uppercase font-medium mb-1">
                  Pessoa/Cliente
                </p>
                <p className="font-bold text-slate-800 flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-400" />
                  {transaction.vendedor ||
                    transaction.cliente ||
                    transaction.fornecedor}
                </p>
              </div>
            )}

            {transaction.observacoes && (
              <div className="bg-amber-50 rounded-xl p-2 border border-amber-200">
                <p className="text-xs text-amber-600 uppercase font-medium mb-1">
                  Observacoes
                </p>
                <p className="text-slate-700 text-sm">
                  {transaction.observacoes}
                </p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-slate-200 p-2 bg-slate-50 flex gap-3">
            {showDeleteConfirm ? (
              <>
                <Button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {deleting ? "Excluindo..." : "Confirmar Exclusao"}
                </Button>
                <Button
                  onClick={() => setShowDeleteConfirm(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => onEdit(transaction)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
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
    );
  },
);
TransactionDetailModal.displayName = "TransactionDetailModal";

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
    inventory = {},
    customers = [],
  } = useData();

  // Estados
  const [period, setPeriod] = useState("month");
  const [startDate, setStartDate] = useState(() =>
    format(startOfMonth(new Date()), "yyyy-MM-dd"),
  );
  const [endDate, setEndDate] = useState(() =>
    format(endOfMonth(new Date()), "yyyy-MM-dd"),
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [materialFilter, setMaterialFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");
  const [currentPage, setCurrentPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const itemsPerPage = 15;

  const [periodTransactions, setPeriodTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // Contador de reloads para forçar re-fetch quando transactions muda no contexto
  // (ex: quando o listener do Firebase dispara após add/delete)
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Quando as transactions do contexto mudam (listener do Firebase),
  // forçar re-fetch das transações do período para manter dados sincronizados
  useEffect(() => {
    setReloadTrigger((prev) => prev + 1);
  }, [transactions]);

  // CORREÇÃO: SEMPRE carregar transações individuais - são a fonte da verdade
  // para os totais/KPIs. Sem isso, os cards mostram dados desatualizados do daily_reports.
  useEffect(() => {
    let isMounted = true;
    const loadPeriodData = async () => {
      try {
        setLoadingTransactions(true);
        setLoadError(null);

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (fetchTransactionsByPeriod) {
          const txns = await fetchTransactionsByPeriod(start, end);
          if (isMounted) {
            setPeriodTransactions(txns);
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error("[v0] Erro ao carregar transações detalhadas:", error);
          setLoadError(error.message);
        }
      } finally {
        if (isMounted) setLoadingTransactions(false);
      }
    };

    loadPeriodData();
    return () => {
      isMounted = false;
    };
  }, [startDate, endDate, fetchTransactionsByPeriod, reloadTrigger]);

  // Handler para mudança de período
  const handlePeriodChange = useCallback((newPeriod) => {
    setPeriod(newPeriod);
    const now = new Date();
    let start, end;

    switch (newPeriod) {
      case "today":
        start = end = now;
        break;
      case "week":
        start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        end = now;
        break;
      case "month":
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case "quarter":
        start = new Date(
          now.getFullYear(),
          Math.floor(now.getMonth() / 3) * 3,
          1,
        );
        end = now;
        break;
      case "year":
        start = new Date(now.getFullYear(), 0, 1);
        end = now;
        break;
      default:
        return;
    }

    setStartDate(format(start, "yyyy-MM-dd"));
    setEndDate(format(end, "yyyy-MM-dd"));
    setCurrentPage(1);
  }, []);

  // Navegação entre meses
  const navigateMonth = useCallback(
    (direction) => {
      const current = new Date(startDate);
      const newDate =
        direction === "prev"
          ? subMonths(current, 1)
          : new Date(current.getFullYear(), current.getMonth() + 1, 1);
      setStartDate(format(startOfMonth(newDate), "yyyy-MM-dd"));
      setEndDate(format(endOfMonth(newDate), "yyyy-MM-dd"));
      setPeriod("custom");
      setCurrentPage(1);
    },
    [startDate],
  );

  const filteredTransactions = useMemo(() => {
    const sourceTransactions =
      periodTransactions.length > 0 ? periodTransactions : transactions;

    if (!sourceTransactions.length) return [];

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return sourceTransactions
      .filter((t) => {
        if (!t?.data) return false;
        const date = new Date(t.data);
        if (!isValid(date)) return false;

        if (date < start || date > end) return false;

        if (typeFilter !== "all" && t.tipo !== typeFilter) return false;
        if (materialFilter !== "all" && t.material !== materialFilter)
          return false;
        if (
          paymentFilter !== "all" &&
          (t.formaPagamento || "dinheiro") !== paymentFilter
        )
          return false;
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const matches =
            t.material?.toLowerCase().includes(term) ||
            t.vendedor?.toLowerCase().includes(term) ||
            t.cliente?.toLowerCase().includes(term) ||
            t.fornecedor?.toLowerCase().includes(term) ||
            t.observacoes?.toLowerCase().includes(term) ||
            t.categoria?.toLowerCase().includes(term);
          if (!matches) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.data) - new Date(a.data));
  }, [
    periodTransactions,
    transactions,
    startDate,
    endDate,
    typeFilter,
    materialFilter,
    paymentFilter,
    searchTerm,
  ]);

  const stats = useMemo(() => {
    const result = {
      totalVendas: 0,
      totalCompras: 0,
      totalDespesas: 0,
      lucroTotal: 0,
      totalQuantidade: 0,
      countVendas: 0,
      countCompras: 0,
      countDespesas: 0,
      materialStats: {},
      paymentStats: {},
      dailyStats: {},
      investimentoTotal: 0,
      lucroInvestimento: 0,
    };

    // CORREÇÃO PRINCIPAL: SEMPRE calcular stats a partir das transações reais
    // O daily_reports pode estar desatualizado/corrompido com dados de transações
    // já excluídas. As transações individuais são a fonte da verdade.
    const sourceData =
      periodTransactions.length > 0 ? periodTransactions : filteredTransactions;

    sourceData.forEach((t) => {
      const valor = Number(t.valorTotal) || 0;
      const qtd = Number(t.quantidade) || 0;
      const tipo = t.tipo;
      const dateKey = format(new Date(t.data), "yyyy-MM-dd");

      if (!result.dailyStats[dateKey]) {
        result.dailyStats[dateKey] = {
          vendas: 0,
          compras: 0,
          despesas: 0,
          lucro: 0,
          transacoes: 0,
        };
      }
      result.dailyStats[dateKey].transacoes++;

      if (tipo === "venda") {
        result.totalVendas += valor;
        result.countVendas++;
        result.totalQuantidade += qtd;
        result.dailyStats[dateKey].vendas += valor;
      } else if (tipo === "compra") {
        result.totalCompras += valor;
        result.countCompras++;
        result.dailyStats[dateKey].compras += valor;
        result.investimentoTotal += valor;
      } else if (tipo === "despesa") {
        result.totalDespesas += valor;
        result.countDespesas++;
        result.dailyStats[dateKey].despesas += valor;
      }

      // Stats por material
      if (t.material && tipo !== "despesa") {
        if (!result.materialStats[t.material]) {
          result.materialStats[t.material] = {
            vendas: 0,
            compras: 0,
            quantidade: 0,
            lucro: 0,
            transacoes: 0,
          };
        }
        result.materialStats[t.material].transacoes++;
        if (tipo === "venda") {
          result.materialStats[t.material].vendas += valor;
          result.materialStats[t.material].quantidade += qtd;
          result.materialStats[t.material].lucro += valor;
        } else {
          result.materialStats[t.material].compras += valor;
          result.materialStats[t.material].quantidade += qtd;
          result.materialStats[t.material].lucro -= valor;
        }
      }

      // Stats por pagamento
      const method = t.formaPagamento || "dinheiro";
      if (!result.paymentStats[method]) {
        result.paymentStats[method] = { total: 0, count: 0 };
      }
      result.paymentStats[method].total += valor;
      result.paymentStats[method].count++;
    });

    result.lucroTotal =
      result.totalVendas - result.totalCompras - result.totalDespesas;
    result.lucroInvestimento = result.totalVendas - result.totalCompras;
    result.margemLucro =
      result.totalVendas > 0
        ? (result.lucroTotal / result.totalVendas) * 100
        : 0;
    result.roi =
      result.totalCompras > 0
        ? (result.lucroInvestimento / result.totalCompras) * 100
        : 0;

    // Médias
    const diffDays = Math.max(
      1,
      differenceInDays(new Date(endDate), new Date(startDate)) + 1,
    );
    result.diasNoPeriodo = diffDays;
    result.mediaVendasDia = result.totalVendas / diffDays;
    result.mediaTransacoesDia =
      (result.countVendas + result.countCompras + result.countDespesas) /
      diffDays;
    result.ticketMedioVenda =
      result.countVendas > 0 ? result.totalVendas / result.countVendas : 0;
    result.ticketMedioCompra =
      result.countCompras > 0 ? result.totalCompras / result.countCompras : 0;

    return result;
  }, [filteredTransactions, periodTransactions, startDate, endDate]);

  const uniqueMaterials = useMemo(() => {
    const materials = new Set();
    transactions.forEach((t) => {
      if (t.material) materials.add(t.material);
    });
    return Array.from(materials).sort();
  }, [transactions]);

  const chartData = useMemo(() => {
    const dailyArray = Object.entries(stats.dailyStats)
      .map(([date, data]) => ({
        date: format(new Date(date), "dd/MM"),
        vendas: data.vendas,
        compras: data.compras,
        despesas: data.despesas,
        lucro: data.vendas - data.compras - data.despesas,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const materialArray = Object.entries(stats.materialStats)
      .map(([name, data]) => ({
        name,
        vendas: data.vendas,
        compras: data.compras,
        lucro: data.lucro,
      }))
      .sort((a, b) => b.vendas - a.vendas)
      .slice(0, 8);

    return { dailyArray, materialArray };
  }, [stats]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const createPDFHeader = (doc, title, subtitle) => {
    const pageWidth = doc.internal.pageSize.getWidth();

    // Logo / Nome da Empresa
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pageWidth, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("IMPÉRIO SUCATA", 15, 25);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("SISTEMA DE GESTÃO PROFISSIONAL", 15, 32);

    // Título do Relatório
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(title.toUpperCase(), 15, 55);

    // Meta info à direita
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const periodText = `Período: ${format(new Date(startDate), "dd/MM/yyyy")} - ${format(new Date(endDate), "dd/MM/yyyy")}`;
    doc.text(periodText, pageWidth - 15, 50, { align: "right" });
    doc.text(
      `Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
      pageWidth - 15,
      55,
      { align: "right" },
    );

    if (subtitle) {
      doc.text(subtitle, pageWidth - 15, 60, { align: "right" });
    }

    return 70;
  };

  const createPDFFooter = (doc) => {
    const pageCount = doc.internal.getNumberOfPages();
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(15, pageHeight - 18, pageWidth - 15, pageHeight - 18);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Pagina ${i} de ${pageCount}`, 15, pageHeight - 10);
      doc.text(
        "Sistema Imperio Sucata - Relatorio Confidencial",
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" },
      );
      doc.text(
        format(new Date(), "dd/MM/yyyy HH:mm"),
        pageWidth - 15,
        pageHeight - 10,
        { align: "right" },
      );
    }
  };

  const handleExport = useCallback(
    async (exportType) => {
      if (!filteredTransactions.length && exportType !== "excel") {
        showToast("Sem dados", "Nao ha transacoes para exportar", "error");
        return;
      }

      setIsExporting(true);

      try {
        if (exportType === "excel") {
          const workbook = XLSX.utils.book_new();

          // Aba 1: Resumo
          const summaryData = [
            ["IMPERIO SUCATA - Relatorio Consolidado"],
            [
              `Periodo: ${format(new Date(startDate), "dd/MM/yyyy")} ate ${format(new Date(endDate), "dd/MM/yyyy")}`,
            ],
            [`Gerado em: ${format(new Date(), "dd/MM/yyyy 'as' HH:mm")}`],
            [],
            ["RESUMO FINANCEIRO"],
            ["Metrica", "Valor (R$)", "Quantidade"],
            ["Total Vendas", stats.totalVendas, stats.countVendas],
            ["Total Compras", stats.totalCompras, stats.countCompras],
            ["Total Despesas", stats.totalDespesas, stats.countDespesas],
            ["Lucro Liquido", stats.lucroTotal, "-"],
            [],
            ["INVESTIMENTOS"],
            ["Total Investido (Compras)", stats.totalCompras],
            ["Lucro s/ Investimento", stats.lucroInvestimento],
            ["ROI (%)", `${stats.roi.toFixed(2)}%`],
            [],
            ["INDICADORES"],
            ["Margem de Lucro", `${stats.margemLucro.toFixed(2)}%`],
            ["Ticket Medio Venda", stats.ticketMedioVenda],
            ["Ticket Medio Compra", stats.ticketMedioCompra],
            ["Total de Transacoes", filteredTransactions.length],
          ];
          const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
          XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumo");

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
              t.tipo.toUpperCase(),
              t.material || "-",
              t.quantidade || 0,
              t.precoUnitario || 0,
              t.valorTotal || 0,
              t.formaPagamento || "dinheiro",
              t.vendedor || t.cliente || t.fornecedor || "-",
              t.observacoes || "-",
            ]),
          ];
          const transactionsSheet = XLSX.utils.aoa_to_sheet(transactionsData);
          XLSX.utils.book_append_sheet(
            workbook,
            transactionsSheet,
            "Transacoes",
          );

          XLSX.writeFile(
            workbook,
            `imperio_sucata_relatorio_${format(new Date(), "dd-MM-yyyy")}.xlsx`,
          );
          showToast("Excel Exportado", "Planilha gerada com sucesso!");
        } else {
          const doc = new jsPDF();

          if (exportType === "pdf-completo") {
            let yPos = createPDFHeader(
              doc,
              "RELATÓRIO COMPLETO",
              `${filteredTransactions.length} transações`,
            );

            // Resumo
            autoTable(doc, {
              startY: yPos,
              head: [["Métrica", "Valor", "Observação"]],
              body: [
                [
                  "Total de Vendas",
                  formatCurrency(stats.totalVendas),
                  `${stats.countVendas} registros`,
                ],
                [
                  "Total de Compras",
                  formatCurrency(stats.totalCompras),
                  `${stats.countCompras} registros`,
                ],
                [
                  "Total de Despesas",
                  formatCurrency(stats.totalDespesas),
                  `${stats.countDespesas} registros`,
                ],
                [
                  "Lucro Líquido",
                  formatCurrency(stats.lucroTotal),
                  `Margem: ${stats.margemLucro.toFixed(1)}%`,
                ],
                [
                  "ROI s/ Compras",
                  `${stats.roi.toFixed(1)}%`,
                  "Retorno sobre investimento",
                ],
              ],
              theme: "grid",
              headStyles: { fillColor: [30, 41, 59] },
            });

            yPos = doc.lastAutoTable.finalY + 10;
            doc.text("TRANSAÇÕES DO PERÍODO", 15, yPos);
            yPos += 5;

            autoTable(doc, {
              startY: yPos,
              head: [["Data", "Tipo", "Material", "Qtd", "Valor", "Pessoa"]],
              body: filteredTransactions.map((t) => [
                format(new Date(t.data), "dd/MM/yyyy"),
                t.tipo.toUpperCase(),
                t.material || "-",
                `${t.quantidade?.toFixed(2) || 0} kg`,
                formatCurrency(t.valorTotal),
                t.cliente || t.vendedor || t.fornecedor || "-",
              ]),
              theme: "striped",
              headStyles: { fillColor: [71, 85, 105] },
              styles: { fontSize: 8 },
            });

            createPDFFooter(doc);
            doc.save(
              `relatorio_completo_${format(new Date(), "ddMMyyyy")}.pdf`,
            );
          } else if (exportType === "pdf-despesas") {
            const yPos = createPDFHeader(
              doc,
              "RELATÓRIO DE DESPESAS",
              "Detalhamento de saídas operacionais",
            );
            const despesas = filteredTransactions.filter(
              (t) => t.tipo === "despesa",
            );

            autoTable(doc, {
              startY: yPos,
              head: [
                [
                  "Data",
                  "Descrição/Favorecido",
                  "Categoria",
                  "Pagamento",
                  "Valor",
                ],
              ],
              body: despesas.map((t) => [
                format(new Date(t.data), "dd/MM/yyyy"),
                t.vendedor || t.cliente || "-",
                t.categoria || "Geral",
                t.formaPagamento || "dinheiro",
                formatCurrency(t.valorTotal),
              ]),
              theme: "striped",
              headStyles: { fillColor: [220, 38, 38] },
              foot: [
                [
                  "",
                  "",
                  "",
                  "TOTAL DESPESAS",
                  formatCurrency(stats.totalDespesas),
                ],
              ],
              footStyles: {
                fillColor: [220, 38, 38],
                textColor: [255, 255, 255],
              },
            });

            createPDFFooter(doc);
            doc.save(
              `relatorio_despesas_${format(new Date(), "ddMMyyyy")}.pdf`,
            );
          } else if (exportType === "pdf-clientes-geral") {
            const yPos = createPDFHeader(
              doc,
              "RELATÓRIO GERAL DE CLIENTES",
              "Resumo de movimentação por parceiro",
            );

            // Agrupar por cliente
            const clientMap = {};
            transactions.forEach((t) => {
              const name = t.cliente || t.vendedor || t.fornecedor;
              if (!name) return;
              if (!clientMap[name])
                clientMap[name] = {
                  vendas: 0,
                  compras: 0,
                  despesas: 0,
                  total: 0,
                };
              if (t.tipo === "venda")
                clientMap[name].vendas += Number(t.valorTotal) || 0;
              else if (t.tipo === "compra")
                clientMap[name].compras += Number(t.valorTotal) || 0;
              else if (t.tipo === "despesa")
                clientMap[name].despesas += Number(t.valorTotal) || 0;
              clientMap[name].total += Number(t.valorTotal) || 0;
            });

            autoTable(doc, {
              startY: yPos,
              head: [
                [
                  "Cliente/Parceiro",
                  "Vendas (Empresa)",
                  "Compras (Empresa)",
                  "Saldo Movimentado",
                ],
              ],
              body: Object.entries(clientMap).map(([name, data]) => [
                name,
                formatCurrency(data.vendas),
                formatCurrency(data.compras),
                formatCurrency(data.vendas - data.compras),
              ]),
              theme: "striped",
              headStyles: { fillColor: [37, 99, 235] },
            });

            createPDFFooter(doc);
            doc.save(
              `relatorio_geral_clientes_${format(new Date(), "ddMMyyyy")}.pdf`,
            );
          } else if (exportType === "pdf-financeiro") {
            const yPos = createPDFHeader(
              doc,
              "RELATÓRIO FINANCEIRO",
              "Análise de fluxo e rentabilidade",
            );

            autoTable(doc, {
              startY: yPos,
              head: [["Descrição", "Valor", "% Receita"]],
              body: [
                [
                  "Receita Bruta (Vendas)",
                  formatCurrency(stats.totalVendas),
                  "100%",
                ],
                [
                  "Custos de Aquisição (Compras)",
                  formatCurrency(stats.totalCompras),
                  `${((stats.totalCompras / (stats.totalVendas || 1)) * 100).toFixed(1)}%`,
                ],
                [
                  "Despesas Operacionais",
                  formatCurrency(stats.totalDespesas),
                  `${((stats.totalDespesas / (stats.totalVendas || 1)) * 100).toFixed(1)}%`,
                ],
                [
                  "Lucro Líquido",
                  formatCurrency(stats.lucroTotal),
                  `${stats.margemLucro.toFixed(1)}%`,
                ],
              ],
              theme: "grid",
              headStyles: { fillColor: [5, 150, 105] },
            });

            createPDFFooter(doc);
            doc.save(
              `relatorio_financeiro_${format(new Date(), "ddMMyyyy")}.pdf`,
            );
          } else if (exportType === "pdf-materiais") {
            const yPos = createPDFHeader(
              doc,
              "RELATÓRIO POR MATERIAL",
              "Análise de volume e lucro por item",
            );

            autoTable(doc, {
              startY: yPos,
              head: [
                [
                  "Material",
                  "Qtd (kg)",
                  "Vendas",
                  "Compras",
                  "Lucro",
                  "Margem",
                ],
              ],
              body: Object.entries(stats.materialStats).map(([name, data]) => [
                name.toUpperCase(),
                `${data.quantidade.toFixed(2)} kg`,
                formatCurrency(data.vendas),
                formatCurrency(data.compras),
                formatCurrency(data.lucro),
                `${data.vendas > 0 ? ((data.lucro / data.vendas) * 100).toFixed(1) : 0}%`,
              ]),
              theme: "striped",
              headStyles: { fillColor: [124, 58, 237] },
            });

            createPDFFooter(doc);
            doc.save(
              `relatorio_materiais_${format(new Date(), "ddMMyyyy")}.pdf`,
            );
          } else if (exportType === "pdf-diario") {
            const yPos = createPDFHeader(
              doc,
              "RELATÓRIO DIÁRIO",
              "Movimentação cronológica",
            );

            autoTable(doc, {
              startY: yPos,
              head: [
                ["Data", "Trans.", "Vendas", "Compras", "Despesas", "Lucro"],
              ],
              body: Object.entries(stats.dailyStats)
                .sort()
                .map(([date, data]) => [
                  format(new Date(date), "dd/MM/yyyy"),
                  data.transacoes,
                  formatCurrency(data.vendas),
                  formatCurrency(data.compras),
                  formatCurrency(data.despesas),
                  formatCurrency(data.vendas - data.compras - data.despesas),
                ]),
              theme: "striped",
              headStyles: { fillColor: [219, 39, 119] },
            });

            createPDFFooter(doc);
            doc.save(`relatorio_diario_${format(new Date(), "ddMMyyyy")}.pdf`);
          } else if (exportType === "pdf-transacoes") {
            const yPos = createPDFHeader(
              doc,
              "LISTA DE TRANSAÇÕES",
              "Histórico detalhado",
            );

            autoTable(doc, {
              startY: yPos,
              head: [["Data", "Tipo", "Material", "Qtd", "Valor", "Pessoa"]],
              body: filteredTransactions.map((t) => [
                format(new Date(t.data), "dd/MM/yyyy HH:mm"),
                t.tipo.toUpperCase(),
                t.material || "-",
                `${t.quantidade?.toFixed(2) || 0} kg`,
                formatCurrency(t.valorTotal),
                t.cliente || t.vendedor || t.fornecedor || "-",
              ]),
              theme: "striped",
              headStyles: { fillColor: [71, 85, 105] },
              styles: { fontSize: 7 },
            });

            createPDFFooter(doc);
            doc.save(`lista_transacoes_${format(new Date(), "ddMMyyyy")}.pdf`);
          } else if (exportType === "pdf-pagamentos") {
            const yPos = createPDFHeader(
              doc,
              "RELATÓRIO DE PAGAMENTOS",
              "Fluxo por modalidade",
            );

            autoTable(doc, {
              startY: yPos,
              head: [["Forma", "Qtd", "Total", "%"]],
              body: Object.entries(stats.paymentStats).map(([method, data]) => [
                method.toUpperCase(),
                data.count,
                formatCurrency(data.total),
                `${((data.total / (Object.values(stats.paymentStats).reduce((a, b) => a + b.total, 0) || 1)) * 100).toFixed(1)}%`,
              ]),
              theme: "striped",
              headStyles: { fillColor: [14, 165, 233] },
            });

            createPDFFooter(doc);
            doc.save(
              `relatorio_pagamentos_${format(new Date(), "ddMMyyyy")}.pdf`,
            );
          }

          showToast("PDF Gerado", "Relatorio exportado com sucesso!");
        }
      } catch (error) {
        console.error("Erro ao exportar:", error);
        showToast("Erro", "Falha ao gerar exportacao", "error");
      } finally {
        setIsExporting(false);
      }
    },
    [filteredTransactions, stats, startDate, endDate, transactions],
  );

  const handleEdit = useCallback((transaction) => {
    setSelectedTransaction(null);
    setEditingTransaction(transaction);
  }, []);

  const handleSaveEdit = useCallback(
    async (updatedData) => {
      try {
        await editTransaction(editingTransaction.id, updatedData);
        setEditingTransaction(null);
        showToast("Sucesso", "Transacao atualizada com sucesso!");
        if (fetchTransactionsByPeriod) {
          const txns = await fetchTransactionsByPeriod(
            new Date(startDate),
            new Date(endDate),
          );
          setPeriodTransactions(txns);
        }
      } catch (error) {
        showToast("Erro", "Falha ao atualizar transacao", "error");
      }
    },
    [
      editTransaction,
      editingTransaction,
      fetchTransactionsByPeriod,
      startDate,
      endDate,
    ],
  );

  const handleDelete = useCallback(
    async (id) => {
      await deleteTransaction(id);

      // CORREÇÃO: Remover a transação do estado local imediatamente.
      // Como os stats agora calculam a partir de periodTransactions (fonte da verdade),
      // os cards de totais atualizam instantaneamente ao remover do array.
      setPeriodTransactions((prev) => prev.filter((t) => t.id !== id));
    },
    [deleteTransaction],
  );

  const currentMonthDisplay = useMemo(() => {
    const date = new Date(startDate);
    return format(date, "MMMM yyyy", { locale: ptBR });
  }, [startDate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-100 p-3 rounded-2xl shadow-inner">
            <img
              src="/relatorio2.png"
              alt="Ícone de Relatório"
              className="w-8 h-8 object-contain"
            />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
              Relatórios
            </h1>
            <p className="text-slate-500 font-medium">
              Análise estratégica e financeira do seu negócio
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={syncing}
            className="shadow-sm bg-white border-slate-200 hover:bg-slate-50"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`}
            />
            Sincronizar
          </Button>
          <ExportMenu
            onExport={handleExport}
            isExporting={isExporting}
            disabled={!filteredTransactions.length}
          />
        </div>
      </div>

      {/* Filtros Profissionais */}
      <Card className="p-5 bg-white shadow-xl border-slate-200 rounded-2xl">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-emerald-600" />
              <h3 className="font-bold text-slate-800">Filtros de Período</h3>
            </div>
            <QuickFilters
              activePeriod={period}
              onPeriodChange={handlePeriodChange}
            />
            <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-full border border-slate-200">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateMonth("prev")}
                className="h-8 w-8 rounded-full hover:bg-white hover:shadow-sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-bold min-w-[120px] text-center capitalize text-slate-700">
                {currentMonthDisplay}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateMonth("next")}
                className="h-8 w-8 rounded-full hover:bg-white hover:shadow-sm"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                Início
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPeriod("custom");
                }}
                className="h-10 border-slate-200 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                Fim
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPeriod("custom");
                }}
                className="h-10 border-slate-200 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                Tipo
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full h-10 px-3 text-sm border border-slate-200 rounded-md bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
              >
                <option value="all">Todos os Tipos</option>
                <option value="venda">Vendas</option>
                <option value="compra">Compras</option>
                <option value="despesa">Despesas</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                Material
              </label>
              <select
                value={materialFilter}
                onChange={(e) => setMaterialFilter(e.target.value)}
                className="w-full h-10 px-3 text-sm border border-slate-200 rounded-md bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
              >
                <option value="all">Todos Materiais</option>
                {uniqueMaterials.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                Pagamento
              </label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full h-10 px-3 text-sm border border-slate-200 rounded-md bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
              >
                <option value="all">Todos Pagamentos</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="pix">PIX</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                Busca Livre
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Cliente, obs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-10 pl-9 border-slate-200 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Receita Bruta"
          value={formatCurrency(stats.totalVendas)}
          subtitle={`${stats.countVendas} vendas realizadas`}
          icon={(props) => (
            <img
              src="/image/lucro.png" // Caminho da sua imagem na pasta public
              alt="Ícone"
              // 2. Usamos 'props.className' para herdar o tamanho/cor se o StatCard mandar,
              // mas forçamos w-6 h-6 para garantir.
              className={`w-6 h-6 object-contain ${props.className || ""}`}
            />
          )}
          color="green"
        />
        <StatCard
          title="Investimento"
          value={formatCurrency(stats.totalCompras)}
          subtitle={`${stats.countCompras} compras de material`}
          icon={(props) => (
            <img
              src="/image/investimento.png" // Caminho da sua imagem na pasta public
              alt="Ícone"
              // 2. Usamos 'props.className' para herdar o tamanho/cor se o StatCard mandar,
              // mas forçamos w-6 h-6 para garantir.
              className={`w-6 h-6 object-contain ${props.className || ""}`}
            />
          )}
          color="blue"
        />
        <StatCard
          title="Despesas"
          value={formatCurrency(stats.totalDespesas)}
          subtitle={`${stats.countDespesas} saídas operacionais`}
          icon={(props) => (
            <img
              src="/image/despesa.png" // Caminho da sua imagem na pasta public
              alt="Ícone"
              // 2. Usamos 'props.className' para herdar o tamanho/cor se o StatCard mandar,
              // mas forçamos w-6 h-6 para garantir.
              className={`w-6 h-6 object-contain ${props.className || ""}`}
            />
          )}
          color="red"
        />
        <StatCard
          title="Lucro Líquido"
          value={formatCurrency(stats.lucroTotal)}
          subtitle={`Margem de ${stats.margemLucro.toFixed(1)}%`}
          icon={(props) => (
            <img
              src="/image/fluxo-de-caixa.png" // Caminho da sua imagem na pasta public
              alt="Ícone"
              // 2. Usamos 'props.className' para herdar o tamanho/cor se o StatCard mandar,
              // mas forçamos w-6 h-6 para garantir.
              className={`w-6 h-6 object-contain ${props.className || ""}`}
            />
          )}
          color="orange"
          trend={stats.margemLucro}
        />
      </div>

      {/* Métricas de Investimento (Nova Seção) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border-none shadow-2xl lg:col-span-2 relative overflow-hidden group">
          {/* Efeito de brilho moderno */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-500"></div>

          <div className="flex items-center justify-between mb-8 relative z-10">
            <div>
              <h3 className="text-xl font-black flex items-center gap-3 tracking-tight">
                <img
                  src="/image/pe.png"
                  alt="Ícone de Relatório"
                  className="w-7 h-7 object-contain"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "block";
                  }}
                />
                <Activity className="h-6 w-6 text-emerald-400 hidden" />
                Performance de Investimento
              </h3>
              <p className="text-slate-400 text-sm mt-1 font-medium">
                Análise estratégica de compra, revenda e eficiência
              </p>
            </div>
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1 font-bold">
              Mês Atual
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative z-10">
            <div className="space-y-2 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
              <p className="text-slate-400 text-[10px] uppercase font-black tracking-[0.2em]">
                Total Investido
              </p>
              <p className="text-3xl font-black tracking-tighter">
                {formatCurrency(stats.totalCompras)}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                Capital aplicado em estoque
              </p>
            </div>
            <div className="space-y-2 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 transition-colors">
              <p className="text-emerald-400/70 text-[10px] uppercase font-black tracking-[0.2em]">
                Retorno Bruto
              </p>
              <p className="text-3xl font-black text-emerald-400 tracking-tighter">
                {formatCurrency(stats.totalVendas)}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                Valor total das revendas
              </p>
            </div>
            <div className="space-y-2 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 hover:bg-blue-500/10 transition-colors">
              <p className="text-blue-400/70 text-[10px] uppercase font-black tracking-[0.2em]">
                ROI Estratégico
              </p>
              <p className="text-3xl font-black text-blue-400 tracking-tighter">
                {stats.roi.toFixed(1)}%
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                Eficiência do capital
              </p>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-8">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
                  Lucro Real (Venda - Despesa)
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-black text-emerald-400 tracking-tighter">
                    {formatCurrency(stats.totalVendas - stats.totalDespesas)}
                  </p>
                  <span className="text-[10px] text-slate-500 font-bold">
                    LÍQUIDO
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 italic">
                  Resultado direto após subtrair custos operacionais
                </p>
              </div>
              <div className="h-12 w-[1px] bg-slate-700/50 hidden sm:block"></div>
              <div className="space-y-1">
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
                  Lucro s/ Investimento
                </p>
                <p className="text-2xl font-black text-white tracking-tighter">
                  {formatCurrency(stats.lucroInvestimento)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-slate-950/50 border border-slate-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Processamento em Tempo Real
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-white border-slate-200 shadow-lg">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-blue-500" />
            Distribuição de Custos
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "Compras", value: stats.totalCompras },
                    { name: "Despesas", value: stats.totalDespesas },
                    { name: "Lucro", value: Math.max(0, stats.lucroTotal) },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#3b82f6" />
                  <Cell fill="#ef4444" />
                  <Cell fill="#22c55e" />
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div> Compras
              </span>
              <span className="font-bold">
                {(
                  (stats.totalCompras / (stats.totalVendas || 1)) *
                  100
                ).toFixed(1)}
                %
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div> Despesas
              </span>
              <span className="font-bold">
                {(
                  (stats.totalDespesas / (stats.totalVendas || 1)) *
                  100
                ).toFixed(1)}
                %
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>{" "}
                Lucro
              </span>
              <span className="font-bold">{stats.margemLucro.toFixed(1)}%</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs de conteúdo */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="bg-slate-100 p-1 rounded-xl border border-slate-200">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm py-2 px-6 font-bold transition-all rounded-lg"
          >
            Visão Geral
          </TabsTrigger>
          <TabsTrigger
            value="transactions"
            className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm py-2 px-6 font-bold transition-all rounded-lg"
          >
            Transações
          </TabsTrigger>
          <TabsTrigger
            value="materials"
            className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm py-2 px-6 font-bold transition-all rounded-lg"
          >
            Materiais
          </TabsTrigger>
          <TabsTrigger
            value="payments"
            className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm py-2 px-6 font-bold transition-all rounded-lg"
          >
            Pagamentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-5 shadow-md border-slate-200 rounded-2xl">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-500" />
                Evolução Financeira Diária
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData.dailyArray}>
                    <defs>
                      <linearGradient
                        id="colorVendas"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#22c55e"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#22c55e"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f1f5f9"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `R$${v}`}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      }}
                      formatter={(value) => formatCurrency(value)}
                    />
                    <Area
                      type="monotone"
                      dataKey="vendas"
                      stroke="#22c55e"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorVendas)"
                      name="Vendas"
                    />
                    <Area
                      type="monotone"
                      dataKey="compras"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fill="transparent"
                      name="Compras"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-5 shadow-md border-slate-200 rounded-2xl">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-500" />
                Top Materiais por Receita
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData.materialArray}
                    layout="vertical"
                    margin={{ left: 20 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f1f5f9"
                      horizontal={false}
                    />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fontSize: 11, fontWeight: 700 }}
                      width={100}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "#f8fafc" }}
                      formatter={(value) => formatCurrency(value)}
                    />
                    <Bar
                      dataKey="vendas"
                      fill="#10b981"
                      radius={[0, 10, 10, 0]}
                      barSize={20}
                      name="Vendas"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card className="overflow-hidden border-slate-200 shadow-xl rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="text-left p-4 text-xs font-bold uppercase tracking-wider">
                      Data/Hora
                    </th>
                    <th className="text-left p-4 text-xs font-bold uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="text-left p-4 text-xs font-bold uppercase tracking-wider">
                      Pessoa/Cliente
                    </th>
                    <th className="text-left p-4 text-xs font-bold uppercase tracking-wider">
                      Material/Categoria
                    </th>
                    <th className="text-right p-4 text-xs font-bold uppercase tracking-wider">
                      Qtd (kg)
                    </th>
                    <th className="text-right p-4 text-xs font-bold uppercase tracking-wider">
                      Valor Total
                    </th>
                    <th className="text-center p-4 text-xs font-bold uppercase tracking-wider">
                      Pagamento
                    </th>
                    <th className="text-center p-4 text-xs font-bold uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedTransactions.map((t) => (
                    <tr
                      key={t.id}
                      className="hover:bg-emerald-50/30 transition-colors group"
                    >
                      <td className="p-4 text-sm font-medium text-slate-600">
                        {t.data
                          ? format(new Date(t.data), "dd/MM/yyyy HH:mm")
                          : "-"}
                      </td>
                      <td className="p-4">
                        <Badge
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            t.tipo === "venda"
                              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                              : t.tipo === "compra"
                                ? "bg-blue-100 text-blue-700 border-blue-200"
                                : "bg-red-100 text-red-700 border-red-200"
                          }`}
                        >
                          {t.tipo.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm font-bold text-slate-800">
                        {t.vendedor || t.cliente || t.fornecedor || "-"}
                      </td>
                      <td className="p-4 text-sm font-medium text-slate-600 capitalize">
                        {t.material || t.categoria || "-"}
                      </td>
                      <td className="p-4 text-sm font-bold text-slate-900 text-right">
                        {t.quantidade ? `${t.quantidade.toFixed(2)} kg` : "-"}
                      </td>
                      <td className="p-4 text-sm font-black text-slate-900 text-right">
                        {formatCurrency(t.valorTotal)}
                      </td>
                      <td className="p-4 text-center">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-bold uppercase"
                        >
                          {t.formaPagamento || "dinheiro"}
                        </Badge>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingTransaction(t)}
                            className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-100 rounded-full"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedTransaction(t)}
                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-100 rounded-full"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedTransactions.length === 0 && (
                    <tr>
                      <td
                        colSpan="8"
                        className="p-12 text-center text-slate-400 font-medium"
                      >
                        Nenhuma transação encontrada para os filtros aplicados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 bg-slate-50 border-t border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Página {currentPage} de {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-8 rounded-lg font-bold"
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="h-8 rounded-lg font-bold"
                  >
                    Próximo
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="materials" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(stats.materialStats)
              .sort(([, a], [, b]) => b.vendas - a.vendas)
              .map(([name, data]) => (
                <Card
                  key={name}
                  className="p-4 hover:shadow-lg transition-shadow border-slate-200"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-black text-slate-800 uppercase tracking-tight">
                      {name}
                    </h4>
                    <Badge className="bg-emerald-100 text-emerald-700 border-none">
                      {data.transacoes} trans.
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 font-medium">
                        Volume Movimentado:
                      </span>
                      <span className="font-bold text-slate-900">
                        {data.quantidade.toFixed(2)} kg
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 font-medium">
                        Total em Vendas:
                      </span>
                      <span className="font-bold text-emerald-600">
                        {formatCurrency(data.vendas)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 font-medium">
                        Total em Compras:
                      </span>
                      <span className="font-bold text-blue-600">
                        {formatCurrency(data.compras)}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400 uppercase">
                        Lucro Bruto:
                      </span>
                      <span
                        className={`font-black ${data.lucro >= 0 ? "text-emerald-600" : "text-red-600"}`}
                      >
                        {formatCurrency(data.lucro)}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(stats.paymentStats).map(([method, data]) => (
              <Card key={method} className="p-6 border-slate-200 shadow-md">
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className={`p-4 rounded-2xl ${method === "pix" ? "bg-purple-100 text-purple-600" : "bg-green-100 text-green-600"}`}
                  >
                    {method === "pix" ? (
                      <Banknote className="h-8 w-8" />
                    ) : (
                      <DollarSign className="h-8 w-8" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xl font-black uppercase tracking-tight text-slate-800">
                      {method}
                    </h4>
                    <p className="text-slate-500 text-sm font-medium">
                      {data.count} transações realizadas
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-slate-400 uppercase">
                      Volume Financeiro
                    </span>
                    <span className="text-2xl font-black text-slate-900">
                      {formatCurrency(data.total)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${method === "pix" ? "bg-purple-500" : "bg-green-500"}`}
                      style={{
                        width: `${(data.total / (Object.values(stats.paymentStats).reduce((a, b) => a + b.total, 0) || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

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
          isOpen={!!editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}
