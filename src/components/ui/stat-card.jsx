import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { formatCurrency, formatNumber, formatPercent } from "../../utils/formatters"
import { Card } from "./card"

export const StatCard = ({
  title,
  value,
  change,
  icon: Icon,
  color = "blue",
  format = "currency",
  trend,
  subtitle,
  className = "",
}) => {
  const colorClasses = {
    blue: "text-blue-600 bg-blue-50 border-blue-200",
    green: "text-green-600 bg-green-50 border-green-200",
    red: "text-red-600 bg-red-50 border-red-200",
    orange: "text-orange-600 bg-orange-50 border-orange-200",
    purple: "text-purple-600 bg-purple-50 border-purple-200",
    gray: "text-gray-600 bg-gray-50 border-gray-200",
  }

  const formatValue = (val) => {
    switch (format) {
      case "currency":
        return formatCurrency(val)
      case "number":
        return formatNumber(val)
      case "percent":
        return formatPercent(val)
      default:
        return val
    }
  }

  const getTrendIcon = () => {
    if (!change && change !== 0) return null
    if (change > 0) return <TrendingUp className="h-4 w-4" />
    if (change < 0) return <TrendingDown className="h-4 w-4" />
    return <Minus className="h-4 w-4" />
  }

  const getTrendColor = () => {
    if (!change && change !== 0) return "text-gray-500"
    if (trend === "inverse") {
      return change > 0 ? "text-red-600" : "text-green-600"
    }
    return change > 0 ? "text-green-600" : change < 0 ? "text-red-600" : "text-gray-500"
  }

  return (
    <Card className={`p-6 hover:shadow-lg transition-shadow duration-200 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-600">{title}</span>
        {Icon && (
          <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
      <div className="space-y-2">
        <p className="text-3xl font-bold text-gray-900">{formatValue(value)}</p>
        {(change !== undefined || subtitle) && (
          <div className="flex items-center gap-2 text-sm">
            {change !== undefined && (
              <span className={`flex items-center gap-1 font-medium ${getTrendColor()}`}>
                {getTrendIcon()}
                {Math.abs(change).toFixed(1)}%
              </span>
            )}
            {subtitle && <span className="text-gray-500">{subtitle}</span>}
          </div>
        )}
      </div>
    </Card>
  )
}
