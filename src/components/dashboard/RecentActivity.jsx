"use client"

import { memo } from "react"
import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, DollarSign, Clock, ArrowRight } from "lucide-react"
import { formatCurrency, formatRelativeTime } from "../../utils/formatters"
import { Card } from "../ui/card"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"

export const RecentActivity = memo(({ transactions, limit = 8 }) => {
  const recentTransactions = transactions.slice(0, limit)

  const getTransactionConfig = (tipo) => {
    switch (tipo) {
      case "venda":
        return { icon: TrendingUp, color: "text-green-600", bg: "bg-green-50", border: "border-green-100", label: "Venda" }
      case "compra":
        return { icon: TrendingDown, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", label: "Compra" }
      case "despesa":
        return { icon: DollarSign, color: "text-red-600", bg: "bg-red-50", border: "border-red-100", label: "Despesa" }
      default:
        return { icon: Clock, color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-100", label: "Outro" }
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">Atividade Recente</h3>
        <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50">
          Ver tudo <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </div>

      <div className="space-y-0 divide-y divide-gray-50">
        {recentTransactions.length === 0 ? (
          <div className="text-center py-10">
            <div className="bg-gray-50 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <Clock className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">Nenhuma transação registrada recentemente.</p>
          </div>
        ) : (
          recentTransactions.map((transaction, index) => {
            const config = getTransactionConfig(transaction.tipo)
            const Icon = config.icon

            return (
              <motion.div
                key={transaction.id || index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="flex items-center gap-4 py-3 hover:bg-gray-50/50 transition-colors px-2 -mx-2 rounded-lg group"
              >
                <div className={`p-2.5 rounded-xl ${config.bg} ${config.color} shadow-sm`}>
                  <Icon className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-gray-900 truncate text-sm">
                      {transaction.material || config.label}
                    </p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${config.bg} ${config.color}`}>
                      {config.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {transaction.quantidade && <span>{Number(transaction.quantidade).toFixed(1)}kg</span>}
                    {transaction.quantidade && <span>•</span>}
                    <span>{formatRelativeTime(transaction.data)}</span>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`font-bold text-sm ${config.color}`}>
                    {transaction.tipo === 'despesa' ? '-' : '+'} {formatCurrency(transaction.valorTotal)}
                  </p>
                  {transaction.vendedor && (
                    <p className="text-[10px] text-gray-400">
                      {transaction.vendedor}
                    </p>
                  )}
                </div>
              </motion.div>
            )
          })
        )}
      </div>
    </Card>
  )
})

RecentActivity.displayName = "RecentActivity"