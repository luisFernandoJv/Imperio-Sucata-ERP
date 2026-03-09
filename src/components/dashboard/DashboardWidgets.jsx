"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Minus, Info } from "lucide-react";
import {
  formatCurrency,
  formatPercent,
  formatNumber,
  formatWeight,
} from "../../utils/formatters";
import { Card } from "../ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

const THEMES = {
  blue: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    icon: "bg-blue-600",
    border: "border-blue-100",
    shadow: "shadow-blue-100",
    gradient: "from-blue-600 to-indigo-600",
  },
  green: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    icon: "bg-emerald-600",
    border: "border-emerald-100",
    shadow: "shadow-emerald-100",
    gradient: "from-emerald-600 to-teal-600",
  },
  red: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    icon: "bg-rose-600",
    border: "border-rose-100",
    shadow: "shadow-rose-100",
    gradient: "from-rose-600 to-pink-600",
  },
  orange: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    icon: "bg-amber-600",
    border: "border-amber-100",
    shadow: "shadow-amber-100",
    gradient: "from-amber-600 to-orange-600",
  },
  purple: {
    bg: "bg-violet-50",
    text: "text-violet-700",
    icon: "bg-violet-600",
    border: "border-violet-100",
    shadow: "shadow-violet-100",
    gradient: "from-violet-600 to-purple-600",
  },
};

const TrendIndicator = memo(({ value, inverse = false }) => {
  if (value === undefined || value === null || isNaN(value)) return null;

  const isPositive = value > 0;
  const isNegative = value < 0;

  let colors = isPositive
    ? "text-emerald-600 bg-emerald-50 border-emerald-100"
    : "text-rose-600 bg-rose-50 border-rose-100";
  let Icon = isPositive ? ArrowUpRight : ArrowDownRight;

  if (inverse) {
    colors = isPositive
      ? "text-rose-600 bg-rose-50 border-rose-100"
      : "text-emerald-600 bg-emerald-50 border-emerald-100";
  }

  if (Math.abs(value) < 0.01) {
    colors = "text-slate-500 bg-slate-50 border-slate-100";
    Icon = Minus;
  }

  return (
    <div
      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${colors} transition-all duration-300`}
    >
      <Icon className="h-3 w-3" />
      <span>{Math.abs(value).toFixed(1)}%</span>
    </div>
  );
});
TrendIndicator.displayName = "TrendIndicator";

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
    const theme = THEMES[color] || THEMES.blue;
    const isInverse = color === "red";

    const formatValue = (val) => {
      if (format === "percent") return formatPercent(val);
      if (format === "currency") return formatCurrency(val);
      if (format === "number") return formatNumber(val);
      if (format === "weight") return formatWeight(val);
      return val;
    };

    return (
      <motion.div
        whileHover={{ y: -5 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="relative overflow-hidden p-6 h-full border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 bg-white group">
          {/* Decorative background element */}
          <div
            className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${theme.bg} opacity-50 group-hover:scale-150 transition-transform duration-500`}
          />

          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {title}
                </p>
                {info && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-slate-300" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">{info}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <div
                className={`p-2.5 rounded-2xl bg-gradient-to-br ${theme.gradient} text-white shadow-lg ${theme.shadow}/50 group-hover:rotate-12 transition-transform duration-300`}
              >
                <Icon className="h-5 w-5" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
                {formatValue(current)}
              </h3>

              <div className="flex items-center gap-2 min-h-[24px]">
                {change !== undefined && (
                  <TrendIndicator value={change} inverse={isInverse} />
                )}
                {subtitle && (
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                    {subtitle}
                  </span>
                )}
              </div>
            </div>

            {previous !== undefined && (
              <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Período Anterior
                </p>
                <span className="text-xs font-bold text-slate-600">
                  {formatValue(previous)}
                </span>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    );
  },
);
MetricCard.displayName = "MetricCard";

export const MiniMetricCard = memo(
  ({ label, value, format = "currency", icon: Icon, color = "blue" }) => {
    const theme = THEMES[color] || THEMES.blue;

    const formatValue = (val) => {
      if (format === "percent") return formatPercent(val);
      if (format === "weight") return formatWeight(val);
      if (format === "currency") return formatCurrency(val);
      if (format === "number") return formatNumber(val);
      return val;
    };

    return (
      <motion.div
        whileHover={{ scale: 1.03, y: -2 }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div
          className={`flex items-center gap-4 p-4 rounded-2xl border bg-white shadow-sm hover:shadow-md transition-all duration-300 ${theme.border}`}
        >
          <div
            className={`p-3 rounded-xl ${theme.bg} ${theme.text} group-hover:scale-110 transition-transform`}
          >
            {Icon && <Icon className="h-5 w-5" />}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
              {label}
            </p>
            <p className="text-lg font-extrabold text-slate-800 truncate leading-none">
              {formatValue(value)}
            </p>
          </div>
        </div>
      </motion.div>
    );
  },
);
MiniMetricCard.displayName = "MiniMetricCard";
