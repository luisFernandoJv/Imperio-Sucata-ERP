"use client";

import { useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Receipt,
  Activity,
  Package,
  AlertTriangle,
  RefreshCw,
  ArrowUpRight,
  Target,
  ShoppingCart,
  BarChart3,
  Plus,
  XCircle,
} from "lucide-react";
import { useOptimizedData } from "../../hooks/useOptimizedData";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  TrendBadge,
  MetricCard,
  MiniMetricCard,
  MonthComparison,
  TopMaterialsCard,
  PaymentMethodsCard,
} from "./DashboardWidgets";
import { RecentActivity } from "./RecentActivity";
import { Button } from "../ui/button";
import { formatCurrency } from "../../utils/formatters";
import "../../styles/dashboard.css";

function MonthlyResult({ stats, previous, change, empty }) {
  // Mesma fórmula do painel original; só a apresentação foi alterada.
  const lucro =
    (stats.vendasMesAtual || 0) -
    (stats.comprasMesAtual || 0) -
    (stats.despesasMesAtual || 0);
  const status = empty
    ? "Sem transações no mês"
    : lucro > 0
      ? "Resultado positivo"
      : lucro < 0
        ? "Resultado negativo"
        : "Resultado zerado";
  return (
    <section
      className="dashboard-result"
      aria-labelledby="monthly-result-title"
      data-state={lucro < 0 ? "negative" : lucro > 0 ? "positive" : "neutral"}
    >
      <div>
        <div className="dashboard-result-heading">
          <h2 id="monthly-result-title">Resultado do mês</h2>
          <span className="dashboard-result-status">{status}</span>
        </div>
        <p className="dashboard-result-value">{formatCurrency(lucro)}</p>
        <p className="dashboard-muted">
          Vendas menos compras e despesas do mês.
        </p>
      </div>
      <div className="dashboard-result-comparison">
        <span className="dashboard-muted">Resultado do mês anterior</span>
        <strong>{formatCurrency(previous)}</strong>
        <TrendBadge value={change} previous={previous} current={lucro} />
      </div>
    </section>
  );
}

function DashboardLoading() {
  return (
    <div
      className="dashboard-loading"
      role="status"
      aria-label="Carregando painel"
    >
      <p className="dashboard-muted">Carregando os indicadores do mês...</p>
      <div
        aria-hidden="true"
        className="dashboard-skeleton dashboard-skeleton-result"
      />
      <div aria-hidden="true" className="dashboard-financial-grid">
        {[0, 1, 2].map((id) => (
          <div
            key={id}
            className="dashboard-skeleton dashboard-skeleton-card"
          />
        ))}
      </div>
    </div>
  );
}

// ─── Dashboard principal ───────────────────────────────────────────────────────

export default function ExecutiveDashboard({ onQuickAction }) {
  const {
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

  const [refreshError, setRefreshError] = useState(false);

  const handleRefresh = async () => {
    if (!refetch || isRefreshing) return;
    setIsRefreshing(true);
    setRefreshError(false);
    try {
      await refetch();
    } catch {
      setRefreshError(true);
    } finally {
      setIsRefreshing(false);
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

  const mesAtual = format(new Date(), "MMMM 'de' yyyy", { locale: ptBR });
  const emptyMonth = stats.transacoesMesAtual === 0;
  const accessDenied = [
    "permission-denied",
    "unauthenticated",
    "firestore/permission-denied",
  ].includes(error?.code);

  return (
    <div className="executive-dashboard">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">Visão geral do negócio</p>
          <h1>Painel</h1>
          <p className="dashboard-period">{mesAtual}</p>
        </div>
        <div className="dashboard-header-actions no-print">
          <Button
            type="button"
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            aria-busy={isRefreshing}
            className="dashboard-button dashboard-refresh"
          >
            <RefreshCw
              aria-hidden="true"
              size={17}
              className={isRefreshing ? "dashboard-spin" : ""}
            />
            {isRefreshing ? "Atualizando..." : "Atualizar"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onQuickAction?.("reports")}
            className="dashboard-button"
          >
            <BarChart3 aria-hidden="true" size={17} />
            Relatórios
          </Button>
          <Button
            type="button"
            onClick={() => onQuickAction?.("transaction", "compra")}
            className="dashboard-button dashboard-button-primary"
          >
            <Plus aria-hidden="true" size={18} />
            Nova transação
          </Button>
        </div>
      </header>

      {refreshError && (
        <p role="alert" className="dashboard-inline-error">
          Não foi possível atualizar o painel. Tente novamente.
        </p>
      )}
      {isLoading ? (
        <DashboardLoading />
      ) : error ? (
        <section
          className="dashboard-state"
          aria-labelledby="dashboard-error-title"
        >
          <XCircle
            size={32}
            aria-hidden="true"
            className="dashboard-error-icon"
          />
          <h2 id="dashboard-error-title">
            {accessDenied
              ? "Acesso aos indicadores indisponível"
              : "Não foi possível carregar os indicadores"}
          </h2>
          <p>
            {accessDenied
              ? "Entre novamente ou peça ao responsável pelo sistema para verificar suas permissões."
              : "Verifique sua conexão e tente novamente. Seus registros não foram alterados."}
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={isRefreshing}
            onClick={handleRefresh}
            className="dashboard-button"
          >
            <RefreshCw size={17} aria-hidden="true" />
            {isRefreshing ? "Tentando novamente..." : "Tentar novamente"}
          </Button>
        </section>
      ) : (
        <div className="dashboard-layout">
          {lowStockAlerts?.length > 0 && (
            <section
              className="dashboard-stock-alert"
              aria-label="Aviso de estoque baixo"
            >
              <AlertTriangle size={21} aria-hidden="true" />
              <div>
                <strong>Estoque precisa de atenção</strong>
                <p>
                  {lowStockAlerts.length}{" "}
                  {lowStockAlerts.length === 1
                    ? "material está"
                    : "materiais estão"}{" "}
                  abaixo do nível mínimo.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onQuickAction?.("inventory")}
                className="dashboard-button"
              >
                Ver estoque
                <ArrowUpRight size={16} aria-hidden="true" />
              </Button>
            </section>
          )}

          <MonthlyResult
            stats={stats}
            previous={kpis.lucro.anterior}
            change={kpis.lucro.crescimento}
            empty={emptyMonth}
          />

          {emptyMonth && (
            <section
              className="dashboard-empty-month"
              aria-labelledby="empty-month-title"
            >
              <div>
                <h2 id="empty-month-title">Nenhuma transação neste mês</h2>
                <p>
                  Os indicadores deste mês serão preenchidos conforme você
                  registrar as movimentações.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => onQuickAction?.("transaction", "compra")}
                className="dashboard-button no-print"
              >
                Registrar compra
                <ArrowUpRight size={16} aria-hidden="true" />
              </Button>
            </section>
          )}

          <section aria-labelledby="financial-heading">
            <div className="dashboard-section-heading">
              <h2 id="financial-heading">Movimentação financeira</h2>
              <span>Valores do mês atual</span>
            </div>
            <div className="dashboard-financial-grid">
              <MetricCard
                title="Vendas"
                current={kpis.vendas.atual}
                previous={kpis.vendas.anterior}
                change={kpis.vendas.crescimento}
                icon={TrendingUp}
                color="green"
              />
              <MetricCard
                title="Compras"
                current={kpis.compras.atual}
                previous={kpis.compras.anterior}
                change={kpis.compras.crescimento}
                icon={TrendingDown}
                color="blue"
                neutralTrend
              />
              <MetricCard
                title="Despesas operacionais"
                current={kpis.despesas.atual}
                previous={kpis.despesas.anterior}
                change={kpis.despesas.crescimento}
                icon={Receipt}
                color="red"
                inverse
              />
            </div>
          </section>

          <section aria-labelledby="operational-heading">
            <div className="dashboard-section-heading">
              <h2 id="operational-heading">Indicadores operacionais</h2>
            </div>
            <div className="dashboard-operational-grid">
              <MiniMetricCard
                label="Margem de lucro"
                value={kpis.lucro.margem}
                format="percent"
                icon={Target}
                color="purple"
              />
              <MiniMetricCard
                label="Ticket médio"
                value={kpis.operacional.ticketMedio}
                format="currency"
                icon={ShoppingCart}
                color="blue"
              />
              <MiniMetricCard
                label="Estoque total"
                value={kpis.operacional.estoqueTotal}
                format="weight"
                icon={Package}
                color="orange"
              />
              <MiniMetricCard
                label="Transações no mês"
                value={kpis.operacional.transacoes}
                format="number"
                icon={Activity}
                color="green"
              />
            </div>
            <p className="dashboard-operational-note">
              Ticket médio: vendas do mês divididas pelo total de transações do
              mês.
            </p>
          </section>

          <div className="dashboard-detail-grid">
            <RecentActivity
              transactions={recentTransactions}
              limit={10}
              onViewReports={() => onQuickAction?.("reports")}
              onNewTransaction={() => onQuickAction?.("transaction", "compra")}
            />
            <div className="dashboard-secondary-stack">
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
          </div>
        </div>
      )}
    </div>
  );
}
