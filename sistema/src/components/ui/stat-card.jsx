"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from "../../utils/formatters";
import { Card } from "./card";
import { cn } from "@/lib/utils";

/**
 * StatCard — card de KPI profissional para o dashboard.
 *
 * Props:
 *   title        string   — label do indicador
 *   value        number   — valor principal
 *   change       number   — variação percentual vs período anterior (positivo = subiu)
 *   trend        "inverse"— inverte semântica de cor (ex: despesas: subir é ruim)
 *   icon         LucideIcon
 *   color        "blue"|"green"|"red"|"orange"|"purple"|"emerald"|"gray"
 *   format       "currency"|"number"|"percent"|"custom"
 *   formatFn     (val) => string   — usado quando format="custom"
 *   subtitle     string   — texto secundário abaixo do valor
 *   loading      boolean  — mostra skeleton
 *   pulse        boolean  — mostra indicador pulsante (dado ao vivo)
 *   className    string
 */

const COLOR_MAP = {
  blue: {
    icon: "bg-blue-100 text-blue-600",
    badge: "bg-blue-50 text-blue-700",
  },
  green: {
    icon: "bg-green-100 text-green-600",
    badge: "bg-green-50 text-green-700",
  },
  emerald: {
    icon: "bg-emerald-100 text-emerald-600",
    badge: "bg-emerald-50 text-emerald-700",
  },
  red: { icon: "bg-red-100 text-red-600", badge: "bg-red-50 text-red-700" },
  orange: {
    icon: "bg-orange-100 text-orange-600",
    badge: "bg-orange-50 text-orange-700",
  },
  purple: {
    icon: "bg-purple-100 text-purple-600",
    badge: "bg-purple-50 text-purple-700",
  },
  amber: {
    icon: "bg-amber-100 text-amber-600",
    badge: "bg-amber-50 text-amber-700",
  },
  gray: {
    icon: "bg-gray-100 text-gray-600",
    badge: "bg-gray-50 text-gray-700",
  },
};

const Skeleton = ({ className }) => (
  <div className={cn("animate-pulse rounded bg-gray-200", className)} />
);

export const StatCard = ({
  title,
  value,
  change,
  trend,
  icon: Icon,
  color = "blue",
  format = "currency",
  formatFn,
  subtitle,
  loading = false,
  pulse = false,
  className = "",
}) => {
  const colors = COLOR_MAP[color] ?? COLOR_MAP.blue;

  const formatValue = (val) => {
    if (formatFn) return formatFn(val);
    switch (format) {
      case "currency":
        return formatCurrency(val);
      case "number":
        return formatNumber(val);
      case "percent":
        return formatPercent(val);
      default:
        return String(val ?? "—");
    }
  };

  const getTrendInfo = () => {
    if (change === undefined || change === null) return null;

    const isInverse = trend === "inverse";
    const isPositive = change > 0;
    const isNeutral = change === 0;

    let colorClass = "text-gray-500 bg-gray-100";
    let Icon_ = Minus;

    if (!isNeutral) {
      const isGood = isInverse ? !isPositive : isPositive;
      colorClass = isGood
        ? "text-green-700 bg-green-100"
        : "text-red-700 bg-red-100";
      Icon_ = isPositive ? TrendingUp : TrendingDown;
    }

    return { colorClass, Icon_ };
  };

  const trendInfo = getTrendInfo();

  if (loading) {
    return (
      <Card className={cn("p-5 space-y-4", className)}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-20" />
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "p-5 hover:shadow-md transition-shadow duration-200 group relative overflow-hidden",
        className,
      )}
    >
      {/* Indicador ao vivo */}
      {pulse && (
        <span className="absolute top-3 right-3 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      )}

      {/* Topo: título e ícone */}
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider leading-tight pr-2">
          {title}
        </span>
        {Icon && (
          <div
            className={cn(
              "flex-shrink-0 p-2.5 rounded-xl transition-transform duration-200 group-hover:scale-110",
              colors.icon,
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      {/* Valor principal */}
      <p className="text-2xl font-black text-gray-900 tabular-nums leading-none mb-2">
        {formatValue(value)}
      </p>

      {/* Rodapé: variação e subtítulo */}
      <div className="flex items-center gap-2 flex-wrap">
        {trendInfo && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full",
              trendInfo.colorClass,
            )}
          >
            <trendInfo.Icon_ className="h-3 w-3" />
            {Math.abs(change).toFixed(1)}%
          </span>
        )}
        {subtitle && (
          <span className="text-xs text-gray-400 truncate">{subtitle}</span>
        )}
      </div>
    </Card>
  );
};
