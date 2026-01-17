"use client"

import { memo } from "react"
import { motion } from "framer-motion"
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"
import { formatCurrency, formatPercent, formatNumber, formatWeight } from "../../utils/formatters" // Caminho ajustado para usar o utils.js raiz se necessário, ou utils/formatters
import { Card } from "../ui/card"

// Nota: Certifique-se de que os imports apontam para o arquivo utils.js que acabamos de criar

// Configuração de Temas (Design Tokens)
const THEMES = {
  blue: { bg: "bg-blue-50", text: "text-blue-900", icon: "bg-blue-500", border: "border-blue-100" },
  green: { bg: "bg-emerald-50", text: "text-emerald-900", icon: "bg-emerald-500", border: "border-emerald-100" },
  red: { bg: "bg-rose-50", text: "text-rose-900", icon: "bg-rose-500", border: "border-rose-100" },
  orange: { bg: "bg-amber-50", text: "text-amber-900", icon: "bg-amber-500", border: "border-amber-100" },
  purple: { bg: "bg-violet-50", text: "text-violet-900", icon: "bg-violet-500", border: "border-violet-100" },
}

const TrendIndicator = memo(({ value, inverse = false }) => {
  if (value === undefined || value === null || isNaN(value)) return null

  const isPositive = value > 0
  const isNegative = value < 0
  
  let colors = isPositive ? "text-emerald-600 bg-emerald-100" : "text-rose-600 bg-rose-100"
  let Icon = isPositive ? ArrowUpRight : ArrowDownRight

  // Se for "inverso" (ex: Despesas), subir é ruim (vermelho)
  if (inverse) {
    colors = isPositive ? "text-rose-600 bg-rose-100" : "text-emerald-600 bg-emerald-100"
  }
  
  if (value === 0) {
    colors = "text-slate-500 bg-slate-100"
    Icon = Minus
  }

  return (
    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${colors}`}>
      <Icon className="h-3 w-3" />
      <span>{Math.abs(value).toFixed(1)}%</span>
    </div>
  )
})
TrendIndicator.displayName = "TrendIndicator"

export const MetricCard = memo(({ title, current, previous, change, icon: Icon, color = "blue", format = "currency", subtitle }) => {
  const theme = THEMES[color] || THEMES.blue
  const isInverse = color === "red" // Despesas vermelhas invertem a lógica da tendência

  const formatValue = (val) => {
    if (format === "percent") return formatPercent(val)
    if (format === "currency") return formatCurrency(val)
    if (format === "number") return formatNumber(val)
    return val
  }

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Card className="relative overflow-hidden p-5 h-full border-slate-100 shadow-sm hover:shadow-lg transition-all bg-white">
        <div className="flex justify-between items-start mb-2">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">{title}</p>
          <div className={`p-2.5 rounded-xl ${theme.icon} text-white shadow-md shadow-${color}-500/20`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-2 space-y-1">
          <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">{formatValue(current)}</h3>
          
          <div className="flex items-center gap-2 min-h-[24px]">
            {change !== undefined && <TrendIndicator value={change} inverse={isInverse} />}
            {subtitle && <span className="text-xs text-slate-400 font-medium">{subtitle}</span>}
          </div>
        </div>

        {previous !== undefined && (
          <div className="mt-4 pt-3 border-t border-slate-50">
            <p className="text-xs text-slate-400">
              Anterior: <span className="font-medium text-slate-600">{formatValue(previous)}</span>
            </p>
          </div>
        )}
      </Card>
    </motion.div>
  )
})
MetricCard.displayName = "MetricCard"

export const MiniMetricCard = memo(({ label, value, format = "currency", icon: Icon, color = "blue" }) => {
  const theme = THEMES[color] || THEMES.blue

  const formatValue = (val) => {
    // Correção específica para o bug de porcentagem no dashboard
    if (format === "percent") return formatPercent(val)
    if (format === "weight") return formatWeight(val)
    if (format === "currency") return formatCurrency(val)
    if (format === "number") return formatNumber(val)
    return val
  }

  return (
    <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
      <div className={`flex items-center gap-4 p-4 rounded-xl border bg-white shadow-sm ${theme.border}`}>
        <div className={`p-3 rounded-lg ${theme.bg} ${theme.text}`}>
          {Icon && <Icon className="h-6 w-6" />}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
          <p className="text-xl font-bold text-slate-800 truncate leading-none">{formatValue(value)}</p>
        </div>
      </div>
    </motion.div>
  )
})
MiniMetricCard.displayName = "MiniMetricCard"