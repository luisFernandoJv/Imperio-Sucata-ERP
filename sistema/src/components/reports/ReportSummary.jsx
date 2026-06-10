"use client";

import { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Receipt,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  BarChart2,
  Percent,
  Hash,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// ── Pill badge ──────────────────────────────────────────────────────────────
const StatusPill = ({ value, thresholds, labels }) => {
  let color = "bg-red-100 text-red-700";
  let label = labels[2];
  if (value >= thresholds[0]) {
    color = "bg-emerald-100 text-emerald-700";
    label = labels[0];
  } else if (value >= thresholds[1]) {
    color = "bg-amber-100 text-amber-700";
    label = labels[1];
  }
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${color}`}
    >
      {label}
    </span>
  );
};

// ── Primary KPI card ────────────────────────────────────────────────────────
const KpiCard = ({ icon: Icon, label, value, sub, accent, large }) => (
  <div
    className={`
    relative bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-3
    shadow-sm hover:shadow-md transition-shadow duration-200
    ${large ? "md:col-span-2" : ""}
  `}
  >
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
        {label}
      </span>
      <span
        className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent.bg}`}
      >
        <Icon className={`w-4 h-4 ${accent.icon}`} />
      </span>
    </div>
    <p
      className={`text-2xl font-bold leading-none tracking-tight ${accent.value}`}
    >
      {value}
    </p>
    {sub && <p className="text-xs text-slate-400">{sub}</p>}
    {/* Accent bar at bottom */}
    <div
      className={`absolute bottom-0 left-5 right-5 h-0.5 rounded-full ${accent.bar} opacity-40`}
    />
  </div>
);

// ── Horizontal metric row ────────────────────────────────────────────────────
const MetricRow = ({ label, value, valueClass = "text-slate-800" }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
    <span className="text-sm text-slate-500">{label}</span>
    <span className={`text-sm font-bold ${valueClass}`}>{value}</span>
  </div>
);

// ── Main component ───────────────────────────────────────────────────────────
const ReportSummary = ({ transactions }) => {
  const stats = useMemo(() => {
    const vendas = transactions.filter((t) => t.tipo === "venda");
    const compras = transactions.filter((t) => t.tipo === "compra");
    const despesas = transactions.filter((t) => t.tipo === "despesa");

    const totalVendas = vendas.reduce((s, t) => s + (t.valorTotal || 0), 0);
    const totalCompras = compras.reduce((s, t) => s + (t.valorTotal || 0), 0);
    const totalDespesas = despesas.reduce((s, t) => s + (t.valorTotal || 0), 0);

    const lucroLiquido = totalVendas - totalDespesas;
    const lucroOperacional = totalVendas - totalCompras - totalDespesas;
    const margemLiquida =
      totalVendas > 0 ? (lucroLiquido / totalVendas) * 100 : 0;
    const margemOp =
      totalVendas > 0 ? (lucroOperacional / totalVendas) * 100 : 0;
    const roi = totalCompras > 0 ? (lucroOperacional / totalCompras) * 100 : 0;
    const ticketMedio = vendas.length > 0 ? totalVendas / vendas.length : 0;
    const custoMedioCompra =
      compras.length > 0 ? totalCompras / compras.length : 0;

    return {
      totalVendas,
      totalCompras,
      totalDespesas,
      lucroLiquido,
      lucroOperacional,
      margemLiquida,
      margemOp,
      roi,
      ticketMedio,
      custoMedioCompra,
      totalTransacoes: transactions.length,
      nVendas: vendas.length,
      nCompras: compras.length,
      nDespesas: despesas.length,
    };
  }, [transactions]);

  const lucroPositivo = stats.lucroLiquido >= 0;

  return (
    <div className="space-y-6">
      {/* ── Section header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Resumo do Período
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {stats.totalTransacoes} transações registradas
          </p>
        </div>
        <StatusPill
          value={stats.margemLiquida}
          thresholds={[25, 10]}
          labels={["Margem Ótima", "Margem Regular", "Margem Baixa"]}
        />
      </div>

      {/* ── 4 primary KPIs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={TrendingUp}
          label="Receita de Vendas"
          value={formatCurrency(stats.totalVendas)}
          sub={`${stats.nVendas} venda${stats.nVendas !== 1 ? "s" : ""}`}
          accent={{
            bg: "bg-emerald-50",
            icon: "text-emerald-600",
            value: "text-emerald-700",
            bar: "bg-emerald-500",
          }}
        />
        <KpiCard
          icon={ShoppingCart}
          label="Custo de Compras"
          value={formatCurrency(stats.totalCompras)}
          sub={`${stats.nCompras} compra${stats.nCompras !== 1 ? "s" : ""}`}
          accent={{
            bg: "bg-blue-50",
            icon: "text-blue-600",
            value: "text-blue-700",
            bar: "bg-blue-500",
          }}
        />
        <KpiCard
          icon={Receipt}
          label="Despesas"
          value={formatCurrency(stats.totalDespesas)}
          sub={`${stats.nDespesas} lançamento${stats.nDespesas !== 1 ? "s" : ""}`}
          accent={{
            bg: "bg-rose-50",
            icon: "text-rose-600",
            value: "text-rose-700",
            bar: "bg-rose-500",
          }}
        />
        <KpiCard
          icon={lucroPositivo ? ArrowUpRight : ArrowDownRight}
          label="Lucro Líquido"
          value={formatCurrency(stats.lucroLiquido)}
          sub={lucroPositivo ? "Resultado positivo" : "Resultado negativo"}
          accent={
            lucroPositivo
              ? {
                  bg: "bg-emerald-50",
                  icon: "text-emerald-600",
                  value: "text-emerald-700",
                  bar: "bg-emerald-500",
                }
              : {
                  bg: "bg-red-50",
                  icon: "text-red-600",
                  value: "text-red-700",
                  bar: "bg-red-500",
                }
          }
        />
      </div>

      {/* ── Two column detail cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Resultado operacional */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
              Resultado Operacional
            </h3>
          </div>
          <MetricRow
            label="Receita de Vendas"
            value={formatCurrency(stats.totalVendas)}
            valueClass="text-emerald-700 font-bold"
          />
          <MetricRow
            label="(−) Custo de Compras"
            value={`− ${formatCurrency(stats.totalCompras)}`}
            valueClass="text-blue-700"
          />
          <MetricRow
            label="(−) Despesas"
            value={`− ${formatCurrency(stats.totalDespesas)}`}
            valueClass="text-rose-700"
          />
          <div className="mt-3 pt-3 border-t-2 border-slate-200 flex justify-between items-center">
            <span className="text-sm font-bold text-slate-700">
              Lucro Operacional
            </span>
            <span
              className={`text-lg font-black ${stats.lucroOperacional >= 0 ? "text-emerald-700" : "text-red-700"}`}
            >
              {formatCurrency(stats.lucroOperacional)}
            </span>
          </div>
        </div>

        {/* Indicadores de eficiência */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
              Indicadores de Eficiência
            </h3>
          </div>
          <MetricRow
            label="Margem Líquida"
            value={`${stats.margemLiquida.toFixed(1)}%`}
            valueClass={
              stats.margemLiquida >= 25
                ? "text-emerald-700"
                : stats.margemLiquida >= 10
                  ? "text-amber-700"
                  : "text-red-700"
            }
          />
          <MetricRow
            label="Margem Operacional"
            value={`${stats.margemOp.toFixed(1)}%`}
            valueClass={
              stats.margemOp >= 20
                ? "text-emerald-700"
                : stats.margemOp >= 8
                  ? "text-amber-700"
                  : "text-red-700"
            }
          />
          <MetricRow
            label="ROI sobre Compras"
            value={`${stats.roi.toFixed(1)}%`}
            valueClass={
              stats.roi >= 30
                ? "text-emerald-700"
                : stats.roi >= 10
                  ? "text-amber-700"
                  : "text-red-700"
            }
          />
          <MetricRow
            label="Ticket Médio (Venda)"
            value={formatCurrency(stats.ticketMedio)}
          />
          <MetricRow
            label="Custo Médio (Compra)"
            value={formatCurrency(stats.custoMedioCompra)}
          />
        </div>
      </div>

      {/* ── Health strip ── */}
      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
          Diagnóstico Rápido
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              label: "Situação Financeira",
              badge: (
                <StatusPill
                  value={stats.lucroLiquido}
                  thresholds={[1, 0]}
                  labels={["Lucrativo", "Equilibrado", "Prejuízo"]}
                />
              ),
            },
            {
              label: "Eficiência da Operação",
              badge: (
                <StatusPill
                  value={stats.margemOp}
                  thresholds={[20, 8]}
                  labels={["Alta", "Média", "Baixa"]}
                />
              ),
            },
            {
              label: "Volume de Negócios",
              badge: (
                <StatusPill
                  value={stats.totalTransacoes}
                  thresholds={[50, 20]}
                  labels={["Alto", "Médio", "Baixo"]}
                />
              ),
            },
          ].map(({ label, badge }) => (
            <div
              key={label}
              className="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-4 py-3"
            >
              <span className="text-sm text-slate-600">{label}</span>
              {badge}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportSummary;
