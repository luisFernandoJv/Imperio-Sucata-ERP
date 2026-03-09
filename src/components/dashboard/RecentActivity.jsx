"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  ArrowRight,
  User,
  Package,
} from "lucide-react";
import { formatCurrency, formatRelativeTime } from "../../utils/formatters";
import { Card } from "../ui/card";
import { Button } from "../ui/button";

/**
 * Componente de Atividade Recente
 * Nível Sênior: Foca em legibilidade, feedback visual e micro-interações.
 */
export const RecentActivity = memo(({ transactions = [], limit = 8 }) => {
  const recentTransactions = transactions.slice(0, limit);

  const getTransactionConfig = (tipo) => {
    const configs = {
      venda: {
        icon: TrendingUp,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        label: "Venda",
        symbol: "+",
      },
      compra: {
        icon: TrendingDown,
        color: "text-blue-600",
        bg: "bg-blue-50",
        label: "Compra",
        symbol: "-",
      },
      despesa: {
        icon: DollarSign,
        color: "text-rose-600",
        bg: "bg-rose-50",
        label: "Despesa",
        symbol: "-",
      },
    };
    return (
      configs[tipo] || {
        icon: Clock,
        color: "text-slate-600",
        bg: "bg-slate-50",
        label: "Outro",
        symbol: "",
      }
    );
  };

  return (
    <Card className="p-0 overflow-hidden border-slate-100 shadow-sm bg-white">
      <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Atividade Recente
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            Últimas movimentações do caixa
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-full px-4"
        >
          VER TUDO <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </div>

      <div className="divide-y divide-slate-50">
        {recentTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="bg-slate-50 p-4 rounded-full mb-4">
              <Clock className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">
              Nenhuma atividade registrada
            </p>
            <p className="text-xs text-slate-400 mt-1">
              As transações aparecerão aqui em tempo real
            </p>
          </div>
        ) : (
          recentTransactions.map((transaction, index) => {
            const config = getTransactionConfig(transaction.tipo);
            const Icon = config.icon;
            const valor = Number(
              transaction.valorTotal || transaction.total || 0,
            );

            return (
              <motion.div
                key={transaction.id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-4 p-4 hover:bg-slate-50/80 transition-all cursor-default group"
              >
                <div
                  className={`p-3 rounded-2xl ${config.bg} ${config.color} shadow-sm group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-slate-800 truncate text-sm">
                      {transaction.material ||
                        transaction.descricao ||
                        config.label}
                    </p>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${config.bg} ${config.color}`}
                    >
                      {config.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] font-medium text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />{" "}
                      {formatRelativeTime(transaction.data)}
                    </span>
                    {transaction.quantidade && (
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" />{" "}
                        {Number(transaction.quantidade).toFixed(1)}kg
                      </span>
                    )}
                    {(transaction.vendedor || transaction.cliente) && (
                      <span className="flex items-center gap-1 truncate max-w-[100px]">
                        <User className="h-3 w-3" />{" "}
                        {transaction.vendedor || transaction.cliente}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <p
                    className={`font-black text-sm ${config.color} tracking-tight`}
                  >
                    {config.symbol} {formatCurrency(valor)}
                  </p>
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">
                    {transaction.formaPagamento || "Dinheiro"}
                  </p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {recentTransactions.length > 0 && (
        <div className="p-4 bg-slate-50/30 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Sincronizado com o banco de dados em tempo real
          </p>
        </div>
      )}
    </Card>
  );
});

RecentActivity.displayName = "RecentActivity";
