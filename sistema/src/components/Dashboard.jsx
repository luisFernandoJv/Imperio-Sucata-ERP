"use client";

import React from "react";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useData } from "../contexts/DataContext";
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
  ShoppingCart,
  Target,
  TrendingUpIcon,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import Calculator from "./Calculator";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart,
} from "recharts";

// ============ COMPONENTES BASE ============

const Card = ({ children, className = "" }) => (
  <div
    className={`bg-white rounded-xl shadow-md border border-gray-200 ${className}`}
  >
    {children}
  </div>
);

const Button = ({
  children,
  onClick,
  disabled = false,
  variant = "default",
  size = "default",
  className = "",
}) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

  const variants = {
    default:
      "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-lg hover:scale-105 focus:ring-blue-500",
    outline:
      "border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500",
    ghost: "text-gray-700 hover:bg-gray-100 focus:ring-gray-500",
  };

  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-8 px-3 text-sm",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("pt-BR");
};

// ============ FUNÇÕES UTILITÁRIAS ============

const getMonthData = (transactions, monthOffset = 0) => {
  const now = new Date();
  const targetMonth = new Date(
    now.getFullYear(),
    now.getMonth() - monthOffset,
    1,
  );
  const nextMonth = new Date(
    now.getFullYear(),
    now.getMonth() - monthOffset + 1,
    1,
  );

  const monthTransactions = transactions.filter((t) => {
    const transactionDate = new Date(t.data);
    return transactionDate >= targetMonth && transactionDate < nextMonth;
  });

  let vendas = 0;
  let compras = 0;
  let despesas = 0;
  let lucroSobreVenda = 0;
  let transactionCount = 0;

  monthTransactions.forEach((transaction) => {
    const valor = Number(transaction.valorTotal) || 0;
    if (transaction.tipo === "venda") {
      vendas += valor;
    } else if (transaction.tipo === "compra") {
      compras += valor;
    } else if (transaction.tipo === "despesa") {
      despesas += valor;
    }
    transactionCount++;
  });

  // NOVO: Lucro sobre Venda = Vendas - Despesas
  lucroSobreVenda = vendas - despesas;
  const lucroLiquido = vendas - compras - despesas;
  const margem = vendas > 0 ? (lucroLiquido / vendas) * 100 : 0;
  const margemSobreVenda = vendas > 0 ? (lucroSobreVenda / vendas) * 100 : 0;

  return {
    vendas,
    compras,
    despesas,
    lucro: lucroLiquido,
    lucroSobreVenda,
    margem,
    margemSobreVenda,
    transactionCount,
    transactions: monthTransactions,
  };
};

const calculateChange = (current, previous) => {
  if (!previous || previous === 0) return 0;
  const change = ((current - previous) / Math.abs(previous)) * 100;
  return isFinite(change) ? change : 0;
};

// ============ COMPONENTE PRINCIPAL ============

const Dashboard = ({ onQuickAction }) => {
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const dataContext = useData();

  const {
    transactions = [],
    inventory = {},
    firebaseConnected = false,
    syncing = false,
    lastSyncTime = null,
    refreshData,
  } = dataContext || {};

  const currentMonthData = useMemo(
    () => getMonthData(transactions, 0),
    [transactions],
  );
  const previousMonthData = useMemo(
    () => getMonthData(transactions, 1),
    [transactions],
  );

  const vendasChange = calculateChange(
    currentMonthData.vendas,
    previousMonthData.vendas,
  );
  const comprasChange = calculateChange(
    currentMonthData.compras,
    previousMonthData.compras,
  );
  const despesasChange = calculateChange(
    currentMonthData.despesas,
    previousMonthData.despesas,
  );
  const lucroChange = calculateChange(
    currentMonthData.lucro,
    previousMonthData.lucro,
  );
  const lucroSobreVendaChange = calculateChange(
    currentMonthData.lucroSobreVenda,
    previousMonthData.lucroSobreVenda,
  );
  const margemDiff = currentMonthData.margem - previousMonthData.margem;

  const topMaterials = useMemo(() => {
    const materialStats = {};
    currentMonthData.transactions.forEach((t) => {
      if (t.tipo === "venda") {
        if (!materialStats[t.material]) {
          materialStats[t.material] = { revenue: 0, quantity: 0 };
        }
        materialStats[t.material].revenue += Number(t.valorTotal) || 0;
        materialStats[t.material].quantity += Number(t.quantidade) || 0;
      }
    });
    return Object.entries(materialStats)
      .map(([material, data]) => ({ material, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [currentMonthData.transactions]);

  const paymentDistribution = useMemo(() => {
    const distribution = {};
    currentMonthData.transactions.forEach((t) => {
      const method = t.formaPagamento || "dinheiro";
      if (!distribution[method]) {
        distribution[method] = 0;
      }
      distribution[method] += Number(t.valorTotal) || 0;
    });
    return Object.entries(distribution).map(([name, value]) => ({
      name,
      value,
    }));
  }, [currentMonthData.transactions]);

  const dailyTrend = useMemo(() => {
    const dailyData = {};
    currentMonthData.transactions.forEach((t) => {
      const day = new Date(t.data).getDate();
      if (!dailyData[day]) {
        dailyData[day] = { day, vendas: 0, compras: 0, despesas: 0, lucro: 0 };
      }
      const valor = Number(t.valorTotal) || 0;
      if (t.tipo === "venda") dailyData[day].vendas += valor;
      else if (t.tipo === "compra") dailyData[day].compras += valor;
      else if (t.tipo === "despesa") dailyData[day].despesas += valor;
    });

    return Object.values(dailyData)
      .sort((a, b) => a.day - b.day)
      .map((d) => ({
        ...d,
        lucro: d.vendas - d.compras - d.despesas,
      }));
  }, [currentMonthData.transactions]);

  useEffect(() => {
    checkLowStock();
    const recent = [...transactions]
      .sort((a, b) => new Date(b.data) - new Date(a.data))
      .slice(0, 6);
    setRecentTransactions(recent);
  }, [transactions, inventory]);

  const checkLowStock = () => {
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
    setLowStockAlerts(alerts);
  };

  const handleSync = async () => {
    if (refreshData) {
      await refreshData();
    }
  };

  const getMaterialIcon = (material) => {
    const icons = {
      ferro: "⛓️",
      aluminio: "🥫",
      cobre: "🔌",
      plastico: "🥤",
      papel: "📄",
      vidro: "🍾",
      bateria: "🔋",
      metal: "🏗️",
    };
    return icons[material.toLowerCase()] || "📦";
  };

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];

  // ============ RENDER ============

  return (
    <div className="space-y-6 lg:space-y-8 p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-gray-100 min-h-screen">
      {/* ============ HEADER PROFISSIONAL ============ */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-100/40 via-purple-100/40 to-cyan-100/40 blur-3xl -z-10 rounded-3xl"></div>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-3 rounded-2xl shadow-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Painel de Controle
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Visão completa do seu negócio em tempo real
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
              {firebaseConnected ? (
                <>
                  <Wifi className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs font-medium text-emerald-700">
                    Conectado
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-red-500" />
                  <span className="text-xs font-medium text-red-700">
                    Desconectado
                  </span>
                </>
              )}
            </div>

            <Button
              onClick={handleSync}
              disabled={syncing}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`}
              />
              {syncing ? "Sincronizando..." : "Sincronizar"}
            </Button>

            <Button
              onClick={() => setCalculatorOpen(!calculatorOpen)}
              variant="outline"
              className="gap-2"
            >
              <CalculatorIcon className="h-4 w-4" />
              Calculadora
            </Button>
          </div>
        </div>

        {calculatorOpen && (
          <div className="mt-4 p-4 bg-white rounded-xl border border-gray-200 shadow-lg">
            <Calculator />
          </div>
        )}
      </motion.div>

      {/* ============ ALERTAS ============ */}
      <AnimatePresence>
        {lowStockAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl flex items-start gap-3"
          >
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-amber-900 mb-2">
                ⚠️ Alertas de Estoque
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {lowStockAlerts.map((alert) => (
                  <div
                    key={alert.material}
                    className={`text-sm p-2 rounded-lg ${
                      alert.nivel === "critico"
                        ? "bg-red-100 text-red-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    <span className="font-bold">{alert.material}</span>: apenas{" "}
                    <span className="font-bold">
                      {alert.quantidade.toFixed(1)}kg
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ CARDS DE MÉTRICAS PRINCIPAIS ============ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receita */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -5 }}
          className="group"
        >
          <Card className="p-6 h-full bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 hover:shadow-xl transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <span
                  className={`text-sm font-bold flex items-center gap-1 ${
                    vendasChange >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {vendasChange >= 0 ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  {Math.abs(vendasChange).toFixed(1)}%
                </span>
              </div>
            </div>
            <p className="text-sm text-emerald-700 font-bold uppercase tracking-wider mb-1">
              Receita do Mês
            </p>
            <p className="text-3xl font-black text-emerald-900 mb-2">
              {formatCurrency(currentMonthData.vendas)}
            </p>
            <p className="text-xs text-emerald-600">
              Mês anterior: {formatCurrency(previousMonthData.vendas)}
            </p>
          </Card>
        </motion.div>

        {/* Compras */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          whileHover={{ y: -5 }}
          className="group"
        >
          <Card className="p-6 h-full bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 hover:shadow-xl transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <span
                  className={`text-sm font-bold flex items-center gap-1 ${
                    comprasChange >= 0 ? "text-red-600" : "text-emerald-600"
                  }`}
                >
                  {comprasChange >= 0 ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  {Math.abs(comprasChange).toFixed(1)}%
                </span>
              </div>
            </div>
            <p className="text-sm text-blue-700 font-bold uppercase tracking-wider mb-1">
              Compras do Mês
            </p>
            <p className="text-3xl font-black text-blue-900 mb-2">
              {formatCurrency(currentMonthData.compras)}
            </p>
            <p className="text-xs text-blue-600">
              Mês anterior: {formatCurrency(previousMonthData.compras)}
            </p>
          </Card>
        </motion.div>

        {/* Despesas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -5 }}
          className="group"
        >
          <Card className="p-6 h-full bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 hover:shadow-xl transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-gradient-to-br from-red-500 to-pink-600 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <span
                  className={`text-sm font-bold flex items-center gap-1 ${
                    despesasChange >= 0 ? "text-red-600" : "text-emerald-600"
                  }`}
                >
                  {despesasChange >= 0 ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  {Math.abs(despesasChange).toFixed(1)}%
                </span>
              </div>
            </div>
            <p className="text-sm text-red-700 font-bold uppercase tracking-wider mb-1">
              Despesas do Mês
            </p>
            <p className="text-3xl font-black text-red-900 mb-2">
              {formatCurrency(currentMonthData.despesas)}
            </p>
            <p className="text-xs text-red-600">
              Mês anterior: {formatCurrency(previousMonthData.despesas)}
            </p>
          </Card>
        </motion.div>

        {/* Lucro Líquido */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          whileHover={{ y: -5 }}
          className="group"
        >
          <Card
            className={`p-6 h-full border-2 hover:shadow-xl transition-all ${
              currentMonthData.lucro >= 0
                ? "bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200"
                : "bg-gradient-to-br from-red-50 to-orange-50 border-red-200"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform ${
                  currentMonthData.lucro >= 0
                    ? "bg-gradient-to-br from-purple-500 to-indigo-600"
                    : "bg-gradient-to-br from-red-500 to-orange-600"
                }`}
              >
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <span
                  className={`text-sm font-bold flex items-center gap-1 ${
                    lucroChange >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {lucroChange >= 0 ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  {Math.abs(lucroChange).toFixed(1)}%
                </span>
              </div>
            </div>
            <p
              className={`text-sm font-bold uppercase tracking-wider mb-1 ${
                currentMonthData.lucro >= 0 ? "text-purple-700" : "text-red-700"
              }`}
            >
              Lucro Líquido
            </p>
            <p
              className={`text-3xl font-black mb-2 ${
                currentMonthData.lucro >= 0 ? "text-purple-900" : "text-red-900"
              }`}
            >
              {formatCurrency(currentMonthData.lucro)}
            </p>
            <p
              className={`text-xs ${
                currentMonthData.lucro >= 0 ? "text-purple-600" : "text-red-600"
              }`}
            >
              Mês anterior: {formatCurrency(previousMonthData.lucro)}
            </p>
          </Card>
        </motion.div>
      </div>

      {/* ============ CARDS SECUNDÁRIOS ============ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Lucro sobre Venda */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -5 }}
          className="group"
        >
          <Card className="p-6 h-full bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 hover:shadow-xl transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <span
                  className={`text-sm font-bold flex items-center gap-1 ${
                    lucroSobreVendaChange >= 0
                      ? "text-emerald-600"
                      : "text-red-600"
                  }`}
                >
                  {lucroSobreVendaChange >= 0 ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  {Math.abs(lucroSobreVendaChange).toFixed(1)}%
                </span>
              </div>
            </div>
            <p className="text-sm text-amber-700 font-bold uppercase tracking-wider mb-1">
              Lucro sobre Venda
            </p>
            <p className="text-3xl font-black text-amber-900 mb-2">
              {formatCurrency(currentMonthData.lucroSobreVenda)}
            </p>
            <p className="text-xs text-amber-600 mb-3">
              Fórmula: Venda - Despesa
            </p>
            <div className="text-xs bg-amber-100 text-amber-800 p-2 rounded-lg font-medium">
              Margem: {currentMonthData.margemSobreVenda.toFixed(1)}%
            </div>
          </Card>
        </motion.div>

        {/* Margem de Lucro */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          whileHover={{ y: -5 }}
          className="group"
        >
          <Card className="p-6 h-full bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-200 hover:shadow-xl transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                <Target className="h-6 w-6 text-white" />
              </div>
              <span
                className={`text-sm font-bold ${
                  margemDiff >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {margemDiff >= 0 ? "+" : ""}
                {margemDiff.toFixed(1)}%
              </span>
            </div>
            <p className="text-sm text-indigo-700 font-bold uppercase tracking-wider mb-1">
              Margem de Lucro
            </p>
            <p className="text-4xl font-black text-indigo-900 mb-2">
              {currentMonthData.margem.toFixed(1)}%
            </p>
            <p className="text-xs text-indigo-600">vs mês anterior</p>
          </Card>
        </motion.div>

        {/* Ticket Médio */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ y: -5 }}
          className="group"
        >
          <Card className="p-6 h-full bg-gradient-to-br from-cyan-50 to-teal-50 border-2 border-cyan-200 hover:shadow-xl transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-gradient-to-br from-cyan-500 to-teal-600 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-bold text-cyan-600">Por venda</span>
            </div>
            <p className="text-sm text-cyan-700 font-bold uppercase tracking-wider mb-1">
              Ticket Médio
            </p>
            <p className="text-3xl font-black text-cyan-900 mb-2">
              {formatCurrency(
                currentMonthData.transactionCount > 0
                  ? currentMonthData.vendas / currentMonthData.transactionCount
                  : 0,
              )}
            </p>
            <p className="text-xs text-cyan-600">
              {currentMonthData.transactionCount} vendas
            </p>
          </Card>
        </motion.div>
      </div>

      {/* ============ GRÁFICOS ============ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Tendência Diária */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="p-6 h-full border-2 border-gray-200 hover:shadow-xl transition-all">
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Tendência Diária do Mês
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={dailyTrend}>
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
                  formatter={(value) => formatCurrency(value)}
                />
                <Legend />
                <Bar
                  dataKey="vendas"
                  fill="#10b981"
                  radius={[8, 8, 0, 0]}
                  name="Vendas"
                />
                <Line
                  type="monotone"
                  dataKey="lucro"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  name="Lucro"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Distribuição de Pagamentos */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6 h-full border-2 border-gray-200 hover:shadow-xl transition-all">
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <PieChart className="h-5 w-5 text-purple-600" />
              Distribuição de Pagamentos
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={paymentDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
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
          </Card>
        </motion.div>
      </div>

      {/* ============ MATERIAIS E ATIVIDADE ============ */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Top Materiais */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Card className="p-6 h-full border-2 border-gray-200 hover:shadow-xl transition-all">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-600" />
              Top Materiais do Mês
            </h2>
            <div className="space-y-3">
              {topMaterials.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">
                  Nenhuma venda registrada este mês
                </p>
              ) : (
                topMaterials.map((item, index) => (
                  <motion.div
                    key={item.material}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45 + index * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">
                        {getMaterialIcon(item.material)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800 capitalize">
                          {item.material}
                        </p>
                        <p className="text-xs text-gray-600">
                          {item.quantity.toFixed(1)}kg
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-emerald-600">
                      {formatCurrency(item.revenue)}
                    </p>
                  </motion.div>
                ))
              )}
            </div>
          </Card>
        </motion.div>

        {/* Atividade Recente */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="xl:col-span-2"
        >
          <Card className="p-6 h-full border-2 border-gray-200 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Activity className="h-5 w-5 text-cyan-600" />
                Atividade Recente
              </h2>
              <button
                onClick={() => onQuickAction("reports")}
                className="text-sm text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-1 hover:bg-cyan-50 px-3 py-1 rounded-lg transition-all"
              >
                <Eye className="h-4 w-4" />
                Ver Todas
              </button>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="text-center py-8">
                <XCircle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-600 mb-1">
                  Nenhuma transação encontrada
                </p>
                <p className="text-sm text-gray-500">
                  Comece registrando sua primeira transação
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {recentTransactions.slice(0, 8).map((transaction, index) => (
                  <motion.div
                    key={transaction.id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-all"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          transaction.tipo === "venda"
                            ? "bg-emerald-500"
                            : transaction.tipo === "compra"
                              ? "bg-blue-500"
                              : "bg-red-500"
                        }`}
                      ></div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-800 capitalize truncate">
                          {transaction.material || "Transação"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(transaction.data)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right ml-2 flex-shrink-0">
                      <p
                        className={`text-sm font-bold ${
                          transaction.tipo === "venda"
                            ? "text-emerald-600"
                            : transaction.tipo === "compra"
                              ? "text-blue-600"
                              : "text-red-600"
                        }`}
                      >
                        {transaction.tipo === "venda" ? "+" : "-"}
                        {formatCurrency(transaction.valorTotal)}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {transaction.tipo}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* ============ FOOTER INFO ============ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center text-sm text-gray-600 pt-6 border-t border-gray-200"
      >
        <p>
          {lastSyncTime
            ? `Última sincronização: ${formatDate(lastSyncTime)}`
            : "Dados sincronizados em tempo real"}
        </p>
      </motion.div>
    </div>
  );
};

export default Dashboard;
