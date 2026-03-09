"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  XCircle,
  PieChart,
  Activity,
  Package,
  AlertTriangle,
  BarChart3,
  Calendar,
  RefreshCw,
  Filter,
  ArrowUpRight,
  Info,
} from "lucide-react";
import { useOptimizedData } from "../../hooks/useOptimizedData";
import { startOfMonth, endOfMonth } from "date-fns";
import { MetricCard, MiniMetricCard } from "./DashboardWidgets";
import {
  DailyTrendChart,
  TopMaterialsChart,
  PaymentDistributionChart,
  MonthlyComparisonChart,
} from "./AdvancedCharts";
import { RecentActivity } from "./RecentActivity";
import { LoadingOverlay } from "../ui/loading";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

/**
 * Componente de Dashboard Executivo
 * Nível Sênior: Implementa memoização agressiva, tratamento de estados nulos,
 * animações fluidas e arquitetura limpa.
 */
export default function ExecutiveDashboard({ onQuickAction }) {
  const {
    inventory,
    stats: optimizedStats,
    recentTransactions,
    lowStockAlerts,
    isLoading: loadingOptimized,
    error,
    refetch,
  } = useOptimizedData();

  // CORREÇÃO: Usar dados do listener em tempo real (optimizedStats) como fonte da verdade.
  // O daily_reports pode ter dados desatualizados de transações já excluídas.
  // O optimizedStats vem do listener do Firebase que sempre reflete o estado real.
  const isLoading = loadingOptimized;
  const stats = optimizedStats;

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (refetch) {
      setIsRefreshing(true);
      await refetch();
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  // Cálculos de KPI com segurança contra divisão por zero e valores nulos
  const kpis = useMemo(() => {
    const safeDivide = (a, b) => (b === 0 ? 0 : (a / b) * 100);

    return {
      vendas: {
        atual: stats.vendasMesAtual || 0,
        anterior: stats.vendasMesAnterior || 0,
        crescimento: stats.crescimentoVendas || 0,
      },
      compras: {
        atual: stats.comprasMesAtual || 0,
        anterior: stats.comprasMesAnterior || 0,
        crescimento:
          stats.comprasMesAnterior > 0
            ? ((stats.comprasMesAtual - stats.comprasMesAnterior) /
                stats.comprasMesAnterior) *
              100
            : 0,
      },
      lucro: {
        atual: stats.lucroMesAtual || 0,
        anterior: stats.lucroMesAnterior || 0,
        crescimento: stats.crescimentoLucro || 0,
        margem: stats.margemLucro || 0,
      },
      operacional: {
        transacoes: stats.transacoesMesAtual || 0,
        ticketMedio:
          stats.transacoesMesAtual > 0
            ? stats.vendasMesAtual / stats.transacoesMesAtual
            : 0,
        estoqueTotal: stats.estoqueTotal || 0,
      },
    };
  }, [stats]);

  // CORREÇÃO: Calcular dados dos graficos a partir das transacoes reais (listener)
  // em vez de daily_reports que pode ter dados desatualizados
  const chartData = useMemo(() => {
    if (!recentTransactions || recentTransactions.length === 0) {
      return { topMaterials: [], paymentDistribution: [], dailyTrend: [] };
    }

    // Filtrar apenas transacoes do mes atual
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const monthTransactions = recentTransactions.filter((t) => {
      const d = new Date(t.data);
      return d >= monthStart && d <= monthEnd;
    });

    // Top Materiais
    const materialMap = new Map();
    monthTransactions.forEach((t) => {
      if (t.material && t.tipo !== "despesa") {
        const current = materialMap.get(t.material) || {
          revenue: 0,
          quantity: 0,
        };
        const valor = Number(t.valorTotal) || 0;
        const qtd = Number(t.quantidade) || 0;
        if (t.tipo === "venda") {
          materialMap.set(t.material, {
            revenue: current.revenue + valor,
            quantity: current.quantity + qtd,
          });
        }
      }
    });
    const topMaterials = Array.from(materialMap.entries())
      .map(([material, data]) => ({ material, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Distribuicao de Pagamento
    const paymentMap = new Map();
    monthTransactions.forEach((t) => {
      const method = t.formaPagamento || "dinheiro";
      const valor = Number(t.valorTotal) || 0;
      paymentMap.set(method, (paymentMap.get(method) || 0) + valor);
    });
    const paymentDistribution = Array.from(paymentMap.entries()).map(
      ([name, value]) => ({ name, value }),
    );

    // Tendencia Diaria
    const dailyMap = new Map();
    monthTransactions.forEach((t) => {
      const day = new Date(t.data).getDate();
      const current = dailyMap.get(day) || {
        vendas: 0,
        compras: 0,
        despesas: 0,
      };
      const valor = Number(t.valorTotal) || 0;
      if (t.tipo === "venda") current.vendas += valor;
      else if (t.tipo === "compra") current.compras += valor;
      else if (t.tipo === "despesa") current.despesas += valor;
      dailyMap.set(day, current);
    });
    const dailyTrend = Array.from(dailyMap.entries())
      .map(([day, data]) => ({ day, ...data }))
      .sort((a, b) => a.day - b.day);

    return { topMaterials, paymentDistribution, dailyTrend };
  }, [recentTransactions]);

  if (isLoading)
    return <LoadingOverlay message="Sincronizando dados do dashboard..." />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="bg-red-50 p-4 rounded-full mb-4">
          <XCircle className="h-12 w-12 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Erro ao carregar dados
        </h2>
        <p className="text-gray-500 max-w-md mb-6">
          Não foi possível conectar ao banco de dados. Verifique sua conexão e
          tente novamente.
        </p>
        <Button onClick={handleRefresh} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-8 p-4 md:p-8 bg-slate-50/50 min-h-screen pb-20">
        {/* Header Estratégico */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <img
              src="/image/painel2.png"
              alt="Ícone de Relatório"
              className="w-8 h-8 object-contain"
            />

            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Visão geral
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <Activity className="h-3 w-3" /> Sistema Online
                </span>
                <span className="text-slate-400 text-xs font-medium">•</span>
                <span className="text-slate-400 text-xs font-medium flex items-center gap-1">
                  <Calendar className="h-3 w-3" />{" "}
                  {new Date().toLocaleDateString("pt-BR", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-white shadow-sm border-slate-200 gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Atualizar
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => onQuickAction("reports")}
              className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 gap-2"
            >
              <Filter className="h-4 w-4" />
              Relatórios Detalhados
            </Button>
          </motion.div>
        </header>

        {/* Alertas de Estoque Crítico */}
        <AnimatePresence>
          {lowStockAlerts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="relative overflow-hidden p-4 border border-amber-200 bg-gradient-to-r from-amber-50 to-white rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-400" />
              <div className="flex items-center gap-4">
                <div className="bg-amber-100 p-2.5 rounded-xl">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-amber-900">
                    Atenção ao Estoque
                  </h3>
                  <p className="text-sm text-amber-700">
                    Existem {lowStockAlerts.length} materiais abaixo do nível de
                    segurança.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="flex -space-x-2 overflow-hidden">
                  {lowStockAlerts.slice(0, 3).map((alert, i) => (
                    <div
                      key={i}
                      className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-amber-200 flex items-center justify-center text-[10px] font-bold text-amber-700 uppercase"
                    >
                      {alert.material.substring(0, 2)}
                    </div>
                  ))}
                  {lowStockAlerts.length > 3 && (
                    <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                      +{lowStockAlerts.length - 3}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onQuickAction("inventory")}
                  className="text-amber-700 hover:bg-amber-100 font-bold text-xs"
                >
                  GERENCIAR ESTOQUE <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid de Métricas Principais */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Receita Bruta"
            current={kpis.vendas.atual}
            previous={kpis.vendas.anterior}
            change={kpis.vendas.crescimento}
            icon={(props) => (
              <img
                src="/image/cifrao2.png" // Caminho da imagem na pasta 'public'
                alt="Receita"
                // 2. Use props.className para herdar o tamanho correto (h-5 w-5) do card
                // Adicione 'brightness-0 invert' se quiser que o ícone fique BRANCO
                className={`object-contain ${props.className} brightness-0 invert `}
              />
            )}
            color="green"
            subtitle="vs. mês anterior"
          />
          <MetricCard
            title="Volume de Compras"
            current={kpis.compras.atual}
            previous={kpis.compras.anterior}
            change={kpis.compras.crescimento}
            icon={(props) => (
              <img
                src="/image/caixa-aberta.png" // Caminho da imagem na pasta 'public'
                alt="Receita"
                // 2. Use props.className para herdar o tamanho correto (h-5 w-5) do card
                // Adicione 'brightness-0 invert' se quiser que o ícone fique BRANCO
                className={`object-contain ${props.className} brightness-0 invert `}
              />
            )}
            color="blue"
            subtitle="vs. mês anterior"
          />
          <MetricCard
            title="Despesas Operacionais"
            current={stats.despesasMesAtual}
            previous={stats.despesasMesAnterior}
            change={
              ((stats.despesasMesAtual - stats.despesasMesAnterior) /
                (stats.despesasMesAnterior || 1)) *
              100
            }
            icon={(props) => (
              <img
                src="/image/cifrao2.png" // Caminho da imagem na pasta 'public'
                alt="Receita"
                // 2. Use props.className para herdar o tamanho correto (h-5 w-5) do card
                // Adicione 'brightness-0 invert' se quiser que o ícone fique BRANCO
                className={`object-contain ${props.className} brightness-0 invert `}
              />
            )}
            color="red"
            subtitle="vs. mês anterior"
          />
          <MetricCard
            title="Lucro Líquido"
            current={kpis.lucro.atual}
            previous={kpis.lucro.anterior}
            change={kpis.lucro.crescimento}
            icon={(props) => (
              <img
                src="/image/cresce.png" // Caminho da imagem na pasta 'public'
                alt="Receita"
                // 2. Use props.className para herdar o tamanho correto (h-5 w-5) do card
                // Adicione 'brightness-0 invert' se quiser que o ícone fique BRANCO
                className={`object-contain ${props.className} brightness-0 invert `}
              />
            )}
            color={kpis.lucro.atual >= 0 ? "green" : "red"}
            subtitle="Resultado final"
          />
        </section>

        {/* Métricas Secundárias (Eficiência) */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MiniMetricCard
            label="Margem Líquida"
            value={kpis.lucro.margem}
            format="percent"
            icon={PieChart}
            color="purple"
          />
          <MiniMetricCard
            label="Ticket Médio"
            value={kpis.operacional.ticketMedio}
            format="currency"
            icon={DollarSign}
            color="blue"
          />
          <MiniMetricCard
            label="Volume de Itens"
            value={kpis.operacional.estoqueTotal}
            format="weight"
            icon={Activity}
            color="orange"
          />
          <MiniMetricCard
            label="Transações"
            value={kpis.operacional.transacoes}
            format="number"
            icon={Activity}
            color="green"
          />
        </section>

        {/* Área de Gráficos e Análise */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  Tendência de Fluxo <Info className="h-4 w-4 text-slate-300" />
                </h3>
              </div>
              <div className="p-2">
                <DailyTrendChart data={chartData.dailyTrend} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <TopMaterialsChart data={chartData.topMaterials} />
              <PaymentDistributionChart data={chartData.paymentDistribution} />
            </div>
          </div>

          <div className="space-y-8">
            <MonthlyComparisonChart
              currentMonth={{
                vendas: kpis.vendas.atual,
                compras: kpis.compras.atual,
                lucro: kpis.lucro.atual,
              }}
              previousMonth={{
                vendas: kpis.vendas.anterior,
                compras: kpis.compras.anterior,
                lucro: kpis.lucro.anterior,
              }}
            />

            <RecentActivity transactions={recentTransactions} limit={6} />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
