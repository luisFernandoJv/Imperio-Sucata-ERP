"use client";

import { memo } from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Package,
  CreditCard,
} from "lucide-react";
import {
  formatCurrency,
  formatPercent,
  formatNumber,
  formatWeight,
} from "../../utils/formatters";
import { Card } from "../ui/card";

const formatValue = (value, format) => {
  if (format === "percent") return formatPercent(value);
  if (format === "currency") return formatCurrency(value);
  if (format === "number") return formatNumber(value, 0);
  if (format === "weight") return formatWeight(value).replace("kg", " kg");
  return value;
};

export const TrendBadge = memo(
  ({
    value,
    inverse = false,
    neutralTone = false,
    previous,
    current,
    label = "vs. mês anterior",
  }) => {
    if (value === undefined || value === null || isNaN(value)) return null;
    if (previous === 0 && current !== undefined && current !== 0) {
      return (
        <span className="dashboard-trend" data-tone="neutral">
          Sem base no mês anterior
        </span>
      );
    }
    const neutral = Math.abs(value) < 0.01;
    const positive = value > 0;
    const favorable = inverse ? !positive : positive;
    const tone =
      neutral || neutralTone ? "neutral" : favorable ? "positive" : "negative";
    // A seta indica a direção do valor, inclusive nas despesas; a cor indica o contexto.
    const Icon = neutral ? Minus : positive ? ArrowUpRight : ArrowDownRight;
    return (
      <span className="dashboard-trend" data-tone={tone}>
        <Icon size={14} aria-hidden="true" />
        {neutral
          ? "Sem variação"
          : `${positive ? "+" : "−"}${formatPercent(Math.abs(value))}`}
        {label && <span className="dashboard-trend-label">{label}</span>}
      </span>
    );
  },
);
TrendBadge.displayName = "TrendBadge";

export const MetricCard = memo((props) => {
  const {
    title,
    current,
    previous,
    change,
    icon: Icon,
    color = "blue",
    format = "currency",
    subtitle,
    inverse = false,
    neutralTrend = false,
  } = props;
  return (
    <Card className="dashboard-metric" data-accent={color}>
      <div className="dashboard-metric-heading">
        <h3>{title}</h3>
        {Icon && (
          <span className="dashboard-metric-icon">
            <Icon size={20} aria-hidden="true" />
          </span>
        )}
      </div>
      <p className="dashboard-metric-value">{formatValue(current, format)}</p>
      {change !== undefined && (
        <TrendBadge
          value={change}
          previous={previous}
          current={current}
          inverse={inverse}
          neutralTone={neutralTrend}
        />
      )}
      {subtitle && <p className="dashboard-muted">{subtitle}</p>}
      {previous !== undefined && (
        <div className="dashboard-metric-previous">
          <span>Mês anterior</span>
          <strong>{formatValue(previous, format)}</strong>
        </div>
      )}
    </Card>
  );
});
MetricCard.displayName = "MetricCard";

export const MiniMetricCard = memo((props) => {
  const {
    label,
    value,
    format = "currency",
    icon: Icon,
    color = "blue",
  } = props;
  return (
    <Card className="dashboard-mini" data-accent={color}>
      {Icon && (
        <span className="dashboard-metric-icon">
          <Icon size={19} aria-hidden="true" />
        </span>
      )}
      <dl>
        <dt>{label}</dt>
        <dd>{formatValue(value, format)}</dd>
      </dl>
    </Card>
  );
});
MiniMetricCard.displayName = "MiniMetricCard";

export const MonthComparison = memo(({ currentMonth, previousMonth }) => {
  const rows = [
    {
      label: "Vendas",
      atual: currentMonth.vendas,
      anterior: previousMonth.vendas,
    },
    {
      label: "Compras",
      atual: currentMonth.compras,
      anterior: previousMonth.compras,
    },
    {
      label: "Despesas",
      atual: currentMonth.despesas,
      anterior: previousMonth.despesas,
    },
    {
      label: "Resultado",
      atual: currentMonth.lucro,
      anterior: previousMonth.lucro,
    },
  ];
  return (
    <Card className="dashboard-panel">
      <h2>Comparativo mensal</h2>
      <p className="dashboard-panel-description">Este mês e o mês anterior</p>
      <ul className="dashboard-comparison-list">
        {rows.map(({ label, atual, anterior }) => {
          // Mantém a fórmula original. Sem base positiva, não exibe uma taxa fictícia.
          const diff = anterior > 0 ? ((atual - anterior) / anterior) * 100 : 0;
          return (
            <li key={label}>
              <div className="dashboard-comparison-heading">
                <h3>{label}</h3>
                {anterior > 0 ? (
                  <TrendBadge value={diff} label="" neutralTone />
                ) : (
                  <span className="dashboard-muted">
                    {atual === 0 && anterior === 0
                      ? "Sem variação"
                      : "Sem base percentual"}
                  </span>
                )}
              </div>
              <dl className="dashboard-comparison-values">
                <div>
                  <dt>Este mês</dt>
                  <dd>{formatCurrency(atual)}</dd>
                </div>
                <div>
                  <dt>Anterior</dt>
                  <dd>{formatCurrency(anterior)}</dd>
                </div>
              </dl>
            </li>
          );
        })}
      </ul>
    </Card>
  );
});
MonthComparison.displayName = "MonthComparison";

export const TopMaterialsCard = memo(({ data = [] }) => {
  const max = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <Card className="dashboard-panel">
      <h2>Materiais mais vendidos</h2>
      <p className="dashboard-panel-description">
        Receita de vendas no mês atual
      </p>
      {!data.length ? (
        <div className="dashboard-panel-empty">
          <Package size={22} aria-hidden="true" />
          <p>Sem materiais para exibir neste mês.</p>
        </div>
      ) : (
        <ol className="dashboard-breakdown-list">
          {data.slice(0, 5).map((item) => {
            const pct = Math.round((item.revenue / max) * 100);
            return (
              <li key={item.material}>
                <div className="dashboard-breakdown-heading">
                  <span className="dashboard-material-name">
                    {item.material}
                  </span>
                  <strong>{formatCurrency(item.revenue)}</strong>
                </div>
                {item.quantity > 0 && (
                  <p className="dashboard-muted">
                    {formatNumber(item.quantity, 1)} kg
                  </p>
                )}
                <div className="dashboard-bar" aria-hidden="true">
                  <span
                    style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
});
TopMaterialsCard.displayName = "TopMaterialsCard";

export const PaymentMethodsCard = memo(({ data = [] }) => {
  const labels = {
    pix: "Pix",
    dinheiro: "Dinheiro",
    pagamento_divida: "Dívida",
  };
  const total = data.reduce((acc, item) => acc + item.value, 0) || 1;
  return (
    <Card className="dashboard-panel">
      <h2>Formas de pagamento</h2>
      <p className="dashboard-panel-description">
        Valores das movimentações do mês
      </p>
      {!data.length ? (
        <div className="dashboard-panel-empty">
          <CreditCard size={22} aria-hidden="true" />
          <p>Sem pagamentos para exibir neste mês.</p>
        </div>
      ) : (
        <ul className="dashboard-breakdown-list">
          {data.map((item) => {
            const pct = Math.round((item.value / total) * 100);
            const key = item.name.toLowerCase().replace(/ /g, "_");
            return (
              <li key={item.name}>
                <div className="dashboard-breakdown-heading">
                  <span>{labels[key] || item.name}</span>
                  <strong>{formatCurrency(item.value)}</strong>
                </div>
                <p className="dashboard-muted">{pct}% do valor movimentado</p>
                <div className="dashboard-bar" aria-hidden="true">
                  <span
                    style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
});
PaymentMethodsCard.displayName = "PaymentMethodsCard";
