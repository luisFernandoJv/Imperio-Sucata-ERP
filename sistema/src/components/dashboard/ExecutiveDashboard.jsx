"use client";

import { useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  XCircle,
  Activity,
  Package,
  AlertTriangle,
  RefreshCw,
  ArrowUpRight,
  Wallet,
  Target,
  ShoppingCart,
  BarChart3,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useOptimizedData } from "../../hooks/useOptimizedData";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  MetricCard,
  MiniMetricCard,
  MonthComparison,
  TopMaterialsCard,
  PaymentMethodsCard,
} from "./DashboardWidgets";
import { RecentActivity } from "./RecentActivity";
import { LoadingOverlay } from "../ui/loading";
import { Button } from "../ui/button";
import { formatCurrency } from "../../utils/formatters";
import { Card } from "../ui/card";

// ─── Componente auxiliar: bloco de resultado do dia ───────────────────────────

const DailySummaryBanner = ({ stats }) => {
  const lucro =
    (stats.vendasMesAtual || 0) -
    (stats.comprasMesAtual || 0) -
    (stats.despesasMesAtual || 0);
  const positivo = lucro >= 0;

  return (
    <div
      className={`rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border ${positivo ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`p-3 rounded-xl ${positivo ? "bg-emerald-100" : "bg-red-100"}`}
        >
          {positivo ? (
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          ) : (
            <AlertTriangle className="h-6 w-6 text-red-600" />
          )}
        </div>
        <div>
          <p
            className={`text-xs font-black uppercase tracking-widest ${positivo ? "text-emerald-600" : "text-red-600"}`}
          >
            Resultado do mês atual
          </p>
          <p
            className={`text-2xl font-black mt-0.5 ${positivo ? "text-emerald-800" : "text-red-800"}`}
          >
            {formatCurrency(Math.abs(lucro))}
            <span
              className={`text-sm font-bold ml-2 ${positivo ? "text-emerald-600" : "text-red-600"}`}
            >
              {positivo ? "de lucro" : "de prejuízo"}
            </span>
          </p>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Vendas menos compras e despesas do mês
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 text-sm min-w-[160px]">
        <div className="flex justify-between gap-4">
          <span className="text-slate-500 font-medium">Vendas</span>
          <span className="font-bold text-emerald-700">
            {formatCurrency(stats.vendasMesAtual || 0)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500 font-medium">Compras</span>
          <span className="font-bold text-blue-700">
            {formatCurrency(stats.comprasMesAtual || 0)}
          </span>
        </div>
        <div className="flex justify-between gap-4 pt-1 border-t border-slate-200">
          <span className="text-slate-500 font-medium">Despesas</span>
          <span className="font-bold text-red-700">
            {formatCurrency(stats.despesasMesAtual || 0)}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Dashboard principal ───────────────────────────────────────────────────────

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

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
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
      despesas: {
        atual: stats.despesasMesAtual || 0,
        anterior: stats.despesasMesAnterior || 0,
        crescimento:
          stats.despesasMesAnterior > 0
            ? ((stats.despesasMesAtual - stats.despesasMesAnterior) /
                stats.despesasMesAnterior) *
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
            ? (stats.vendasMesAtual || 0) / stats.transacoesMesAtual
            : 0,
        estoqueTotal: stats.estoqueTotal || 0,
      },
    };
  }, [stats]);

  // ── Dados para cards secundários (materiais, pagamentos) ──────────────────
  const derivedData = useMemo(() => {
    if (!recentTransactions?.length) {
      return { topMaterials: [], paymentDistribution: [] };
    }
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const monthly = recentTransactions.filter((t) => {
      const d = new Date(t.data);
      return d >= monthStart && d <= monthEnd;
    });

    // Top materiais
    const matMap = new Map();
    monthly.forEach((t) => {
      if (t.material && t.tipo === "venda") {
        const cur = matMap.get(t.material) || { revenue: 0, quantity: 0 };
        matMap.set(t.material, {
          revenue: cur.revenue + (Number(t.valorTotal) || 0),
          quantity: cur.quantity + (Number(t.quantidade) || 0),
        });
      }
    });
    const topMaterials = Array.from(matMap.entries())
      .map(([material, d]) => ({ material, ...d }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Pagamentos
    const payMap = new Map();
    monthly.forEach((t) => {
      const m = t.formaPagamento || "dinheiro";
      payMap.set(m, (payMap.get(m) || 0) + (Number(t.valorTotal) || 0));
    });
    const paymentDistribution = Array.from(payMap.entries()).map(
      ([name, value]) => ({ name, value }),
    );

    return { topMaterials, paymentDistribution };
  }, [recentTransactions]);

  // ── Estados de loading / erro ──────────────────────────────────────────────
  if (isLoading) return <LoadingOverlay message="Carregando painel..." />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="bg-red-50 p-4 rounded-full mb-4">
          <XCircle className="h-12 w-12 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Não foi possível carregar os dados
        </h2>
        <p className="text-slate-500 max-w-sm mb-6 text-sm">
          Verifique sua conexão com a internet e tente novamente.
        </p>
        <Button onClick={handleRefresh} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Tentar Novamente
        </Button>
      </div>
    );
  }

  const mesAtual = format(new Date(), "MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="space-y-6 p-4 md:p-6 bg-slate-50/50 min-h-screen pb-20">
      {/* ── Cabeçalho ─────────────────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src="/image/painel2.png"
            alt=""
            className="w-8 h-8 object-contain"
          />
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Painel
            </h1>
            <p className="text-xs text-slate-400 font-medium capitalize">
              {mesAtual}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-white border-slate-200 gap-2 text-xs font-bold"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Atualizar
          </Button>
          <Button
            size="sm"
            onClick={() => onQuickAction?.("reports")}
            className="bg-emerald-600 hover:bg-emerald-700 gap-2 text-xs font-bold shadow-sm shadow-emerald-200"
          >
            <BarChart3 className="h-4 w-4" />
            Ver Relatórios
          </Button>
        </div>
      </header>

      {/* ── Alerta de estoque crítico ──────────────────────────────────────── */}
      {lowStockAlerts?.length > 0 && (
        <div className="relative overflow-hidden p-4 border border-amber-200 bg-amber-50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="absolute left-0 top-0 w-1 h-full bg-amber-400 rounded-l-2xl" />
          <div className="flex items-center gap-3 pl-2">
            <div className="bg-amber-100 p-2 rounded-xl flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="font-bold text-amber-900 text-sm">
                Atenção: Estoque baixo
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                {lowStockAlerts.length}{" "}
                {lowStockAlerts.length === 1
                  ? "material está"
                  : "materiais estão"}{" "}
                abaixo do nível mínimo.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onQuickAction?.("inventory")}
            className="text-amber-700 hover:bg-amber-100 font-bold text-xs gap-1 ml-2"
          >
            Ver estoque <ArrowUpRight className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* ── Banner de resultado do mês ─────────────────────────────────────── */}
      <DailySummaryBanner stats={stats} />

      {/* ── Seção: KPIs principais ─────────────────────────────────────────── */}
      <section>
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">
          Resumo financeiro do mês
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total em Vendas"
            current={kpis.vendas.atual}
            previous={kpis.vendas.anterior}
            change={kpis.vendas.crescimento}
            icon={(props) => (
              <img
                src="/image/cifrao2.png"
                alt="Vendas"
                className={`object-contain brightness-0 invert ${props.className}`}
              />
            )}
            color="green"
            format="currency"
          />
          <MetricCard
            title="Total em Compras"
            current={kpis.compras.atual}
            previous={kpis.compras.anterior}
            change={kpis.compras.crescimento}
            icon={(props) => (
              <img
                src="/image/caixa-aberta.png"
                alt="Compras"
                className={`object-contain brightness-0 invert ${props.className}`}
              />
            )}
            color="blue"
            format="currency"
          />
          <MetricCard
            title="Despesas Operacionais"
            current={kpis.despesas.atual}
            previous={kpis.despesas.anterior}
            change={kpis.despesas.crescimento}
            icon={(props) => (
              <img
                src="/image/cifrao2.png"
                alt="Despesas"
                className={`object-contain brightness-0 invert ${props.className}`}
              />
            )}
            color="red"
            format="currency"
          />
          <MetricCard
            title="Lucro do Mês"
            current={kpis.lucro.atual}
            previous={kpis.lucro.anterior}
            change={kpis.lucro.crescimento}
            icon={(props) => (
              <img
                src="/image/cresce.png"
                alt="Lucro"
                className={`object-contain brightness-0 invert ${props.className}`}
              />
            )}
            color={kpis.lucro.atual >= 0 ? "green" : "red"}
            format="currency"
            subtitle={`Margem: ${kpis.lucro.margem.toFixed(1)}%`}
          />
        </div>
      </section>

      {/* ── Seção: KPIs de operação ────────────────────────────────────────── */}
      <section>
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">
          Indicadores operacionais
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MiniMetricCard
            label="Margem de Lucro"
            value={kpis.lucro.margem}
            format="percent"
            icon={Target}
            color="purple"
          />
          <MiniMetricCard
            label="Ticket Médio"
            value={kpis.operacional.ticketMedio}
            format="currency"
            icon={ShoppingCart}
            color="blue"
          />
          <MiniMetricCard
            label="Estoque Total"
            value={kpis.operacional.estoqueTotal}
            format="weight"
            icon={Package}
            color="orange"
          />
          <MiniMetricCard
            label="Transações"
            value={kpis.operacional.transacoes}
            format="number"
            icon={Activity}
            color="green"
          />
        </div>
      </section>

      {/* ── Corpo principal: comparativo + materiais + pagamentos + atividade ─ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Coluna esquerda: comparativo mês + materiais + pagamentos */}
        <div className="lg:col-span-1 space-y-4">
          <MonthComparison
            currentMonth={{
              vendas: kpis.vendas.atual,
              compras: kpis.compras.atual,
              despesas: kpis.despesas.atual,
              lucro: kpis.lucro.atual,
            }}
            previousMonth={{
              vendas: kpis.vendas.anterior,
              compras: kpis.compras.anterior,
              despesas: kpis.despesas.anterior,
              lucro: kpis.lucro.anterior,
            }}
          />
          <TopMaterialsCard data={derivedData.topMaterials} />
          <PaymentMethodsCard data={derivedData.paymentDistribution} />
        </div>

        {/* Coluna direita: atividade recente */}
        <div className="lg:col-span-2">
          <RecentActivity transactions={recentTransactions} limit={10} />
        </div>
      </div>
    </div>
  );
}
