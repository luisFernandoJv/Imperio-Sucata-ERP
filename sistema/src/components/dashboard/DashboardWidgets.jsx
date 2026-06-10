"use client";

import { memo } from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import {
  formatCurrency,
  formatPercent,
  formatNumber,
  formatWeight,
} from "../../utils/formatters";
import { Card } from "../ui/card";

// ─── Utilitários ───────────────────────────────────────────────────────────────

const formatValue = (val, fmt) => {
  if (fmt === "percent") return formatPercent(val);
  if (fmt === "currency") return formatCurrency(val);
  if (fmt === "number") return formatNumber(val);
  if (fmt === "weight") return formatWeight(val);
  return val;
};

// ─── Indicador de tendência ────────────────────────────────────────────────────

export const TrendBadge = memo(
  ({ value, inverse = false, label = "vs. mês anterior" }) => {
    if (value === undefined || value === null || isNaN(value)) return null;

    const neutral = Math.abs(value) < 0.01;
    const isPositive = value > 0;

    let cls, Icon;
    if (neutral) {
      cls = "text-slate-500 bg-slate-100";
      Icon = Minus;
    } else if ((!inverse && isPositive) || (inverse && !isPositive)) {
      cls = "text-emerald-700 bg-emerald-100";
      Icon = ArrowUpRight;
    } else {
      cls = "text-red-700 bg-red-100";
      Icon = ArrowDownRight;
    }

    return (
      <span
        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${cls}`}
      >
        <Icon className="h-3 w-3" />
        {Math.abs(value).toFixed(1)}% {label}
      </span>
    );
  },
);
TrendBadge.displayName = "TrendBadge";

// ─── Card de KPI Principal ─────────────────────────────────────────────────────
// Card grande — usado para os 4 números mais importantes

export const MetricCard = memo(
  ({
    title,
    current,
    previous,
    change,
    icon: Icon,
    color = "blue",
    format = "currency",
    subtitle,
    info,
  }) => {
    const PALETTE = {
      green: {
        bar: "bg-emerald-500",
        icon: "bg-emerald-100 text-emerald-600",
        label: "text-emerald-600",
        border: "border-emerald-100",
      },
      blue: {
        bar: "bg-blue-500",
        icon: "bg-blue-100 text-blue-600",
        label: "text-blue-600",
        border: "border-blue-100",
      },
      red: {
        bar: "bg-red-500",
        icon: "bg-red-100 text-red-600",
        label: "text-red-600",
        border: "border-red-100",
      },
      orange: {
        bar: "bg-amber-500",
        icon: "bg-amber-100 text-amber-600",
        label: "text-amber-600",
        border: "border-amber-100",
      },
      purple: {
        bar: "bg-violet-500",
        icon: "bg-violet-100 text-violet-600",
        label: "text-violet-600",
        border: "border-violet-100",
      },
    };
    const p = PALETTE[color] || PALETTE.blue;
    const isInverse = color === "red";

    return (
      <Card
        className={`relative overflow-hidden bg-white border ${p.border} shadow-sm hover:shadow-md transition-shadow duration-200`}
      >
        {/* Faixa colorida no topo */}
        <div className={`h-1 w-full ${p.bar}`} />

        <div className="p-5">
          {/* Cabeçalho */}
          <div className="flex items-start justify-between mb-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider leading-tight">
              {title}
            </p>
            <div className={`p-2.5 rounded-xl ${p.icon} flex-shrink-0`}>
              {Icon && <Icon className="h-5 w-5" />}
            </div>
          </div>

          {/* Valor principal */}
          <p className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight mb-3">
            {formatValue(current, format)}
          </p>

          {/* Tendência */}
          <div className="flex items-center gap-2 flex-wrap">
            {change !== undefined && (
              <TrendBadge value={change} inverse={isInverse} />
            )}
            {subtitle && (
              <span className="text-[11px] text-slate-400 font-medium">
                {subtitle}
              </span>
            )}
          </div>

          {/* Linha de comparativo */}
          {previous !== undefined && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">
                Mês anterior
              </span>
              <span className="text-xs font-bold text-slate-600">
                {formatValue(previous, format)}
              </span>
            </div>
          )}
        </div>
      </Card>
    );
  },
);
MetricCard.displayName = "MetricCard";

// ─── Card de KPI Secundário ────────────────────────────────────────────────────
// Card menor — usado para métricas de eficiência

export const MiniMetricCard = memo(
  ({ label, value, format = "currency", icon: Icon, color = "blue" }) => {
    const PALETTE = {
      green: {
        bg: "bg-emerald-50",
        text: "text-emerald-600",
        border: "border-emerald-100",
      },
      blue: {
        bg: "bg-blue-50",
        text: "text-blue-600",
        border: "border-blue-100",
      },
      red: { bg: "bg-red-50", text: "text-red-600", border: "border-red-100" },
      orange: {
        bg: "bg-amber-50",
        text: "text-amber-600",
        border: "border-amber-100",
      },
      purple: {
        bg: "bg-violet-50",
        text: "text-violet-600",
        border: "border-violet-100",
      },
    };
    const p = PALETTE[color] || PALETTE.blue;

    return (
      <div
        className={`flex items-center gap-3 p-4 rounded-2xl bg-white border ${p.border} shadow-sm`}
      >
        {Icon && (
          <div className={`p-2.5 rounded-xl ${p.bg} ${p.text} flex-shrink-0`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 truncate">
            {label}
          </p>
          <p className="text-lg font-extrabold text-slate-800 leading-none">
            {formatValue(value, format)}
          </p>
        </div>
      </div>
    );
  },
);
MiniMetricCard.displayName = "MiniMetricCard";

// ─── Comparativo Mês vs Mês (sem gráfico) ─────────────────────────────────────

export const MonthComparison = memo(({ currentMonth, previousMonth }) => {
  const rows = [
    {
      label: "Vendas",
      atual: currentMonth.vendas,
      anterior: previousMonth.vendas,
      color: "bg-emerald-500",
    },
    {
      label: "Compras",
      atual: currentMonth.compras,
      anterior: previousMonth.compras,
      color: "bg-blue-500",
    },
    {
      label: "Despesas",
      atual: currentMonth.despesas,
      anterior: previousMonth.despesas,
      color: "bg-red-500",
    },
    {
      label: "Lucro",
      atual: currentMonth.lucro,
      anterior: previousMonth.lucro,
      color: "bg-amber-500",
    },
  ];

  return (
    <Card className="p-5 bg-white border-slate-100 shadow-sm">
      <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">
        Este mês vs. mês anterior
      </p>
      <div className="space-y-4">
        {rows.map(({ label, atual, anterior, color }) => {
          const max = Math.max(atual, anterior, 1);
          const pct = Math.round((atual / max) * 100);
          const diff = anterior > 0 ? ((atual - anterior) / anterior) * 100 : 0;
          const up = diff >= 0;

          return (
            <div key={label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-bold text-slate-700">
                  {label}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-slate-900">
                    {formatCurrency(atual)}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${up ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
                  >
                    {up ? "+" : ""}
                    {diff.toFixed(1)}%
                  </span>
                </div>
              </div>
              {/* Barra de progresso */}
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${color}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1 text-right font-medium">
                Anterior: {formatCurrency(anterior)}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
});
MonthComparison.displayName = "MonthComparison";

// ─── Resumo de Materiais (top) ─────────────────────────────────────────────────

export const TopMaterialsCard = memo(({ data = [] }) => {
  if (!data.length) return null;

  const max = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <Card className="p-5 bg-white border-slate-100 shadow-sm">
      <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">
        Materiais mais vendidos
      </p>
      <div className="space-y-3">
        {data.slice(0, 5).map((item, i) => {
          const pct = Math.round((item.revenue / max) * 100);
          const COLORS = [
            "bg-indigo-500",
            "bg-emerald-500",
            "bg-amber-500",
            "bg-rose-500",
            "bg-cyan-500",
          ];
          return (
            <div key={item.material}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-400 w-4">
                    {i + 1}
                  </span>
                  <span className="text-sm font-bold text-slate-800 capitalize">
                    {item.material}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-slate-900">
                    {formatCurrency(item.revenue)}
                  </span>
                  {item.quantity > 0 && (
                    <span className="block text-[10px] text-slate-400 font-medium">
                      {item.quantity.toFixed(1)} kg
                    </span>
                  )}
                </div>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${COLORS[i % COLORS.length]}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
});
TopMaterialsCard.displayName = "TopMaterialsCard";

// ─── Distribuição de Pagamentos (sem gráfico) ─────────────────────────────────

export const PaymentMethodsCard = memo(({ data = [] }) => {
  if (!data.length) return null;

  const ICONS = { pix: "💸", dinheiro: "💵", pagamento_divida: "📋" };
  const LABELS = {
    pix: "PIX",
    dinheiro: "Dinheiro",
    pagamento_divida: "Dívida",
  };
  const COLORS = {
    pix: "bg-violet-500",
    dinheiro: "bg-emerald-500",
    pagamento_divida: "bg-amber-500",
  };
  const LABEL_COLORS = {
    pix: "text-violet-700 bg-violet-100",
    dinheiro: "text-emerald-700 bg-emerald-100",
    pagamento_divida: "text-amber-700 bg-amber-100",
  };

  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;

  return (
    <Card className="p-5 bg-white border-slate-100 shadow-sm">
      <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">
        Formas de pagamento
      </p>
      <div className="space-y-3">
        {data.map((item) => {
          const pct = Math.round((item.value / total) * 100);
          const key = item.name.toLowerCase().replace(/ /g, "_");
          return (
            <div key={item.name} className="flex items-center gap-3">
              <span className="text-xl w-7 flex-shrink-0">
                {ICONS[key] || "💳"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-slate-800">
                    {LABELS[key] || item.name}
                  </span>
                  <span className="text-sm font-black text-slate-900">
                    {formatCurrency(item.value)}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${COLORS[key] || "bg-slate-400"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${LABEL_COLORS[key] || "bg-slate-100 text-slate-500"}`}
              >
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
});
PaymentMethodsCard.displayName = "PaymentMethodsCard";
