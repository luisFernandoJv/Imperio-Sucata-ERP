"use client";

import { memo } from "react";
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

export const RecentActivity = memo(({ transactions = [], limit = 8 }) => {
  const recent = transactions.slice(0, limit);

  const getConfig = (tipo) =>
    ({
      venda: {
        icon: TrendingUp,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        badge: "bg-emerald-100 text-emerald-700",
        label: "Venda",
        symbol: "+",
      },
      compra: {
        icon: TrendingDown,
        color: "text-blue-600",
        bg: "bg-blue-50",
        badge: "bg-blue-100 text-blue-700",
        label: "Compra",
        symbol: "−",
      },
      despesa: {
        icon: DollarSign,
        color: "text-rose-600",
        bg: "bg-rose-50",
        badge: "bg-rose-100 text-rose-700",
        label: "Despesa",
        symbol: "−",
      },
    })[tipo] || {
      icon: Clock,
      color: "text-slate-500",
      bg: "bg-slate-50",
      badge: "bg-slate-100 text-slate-500",
      label: "Outro",
      symbol: "",
    };

  return (
    <Card className="overflow-hidden border-slate-100 shadow-sm bg-white">
      {/* Cabeçalho */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
            Últimas Movimentações
          </h3>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            Transações mais recentes
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-full px-3 gap-1"
        >
          VER TUDO <ArrowRight className="h-3 w-3" />
        </Button>
      </div>

      {/* Lista */}
      <div className="divide-y divide-slate-50">
        {recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="bg-slate-50 p-3 rounded-full mb-3">
              <Clock className="h-6 w-6 text-slate-300" />
            </div>
            <p className="text-sm text-slate-500 font-semibold">
              Nenhuma movimentação ainda
            </p>
            <p className="text-xs text-slate-400 mt-1">
              As transações aparecerão aqui em tempo real
            </p>
          </div>
        ) : (
          recent.map((t, i) => {
            const cfg = getConfig(t.tipo);
            const Icon = cfg.icon;
            const valor = Number(t.valorTotal || t.total || 0);
            const pessoa = t.vendedor || t.cliente || t.fornecedor;

            return (
              <div
                key={t.id || i}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/70 transition-colors"
              >
                {/* Ícone */}
                <div
                  className={`p-2.5 rounded-xl ${cfg.bg} ${cfg.color} flex-shrink-0`}
                >
                  <Icon className="h-4 w-4" />
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-sm font-bold text-slate-800 truncate">
                      {t.material || t.descricao || cfg.label}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-tight flex-shrink-0 ${cfg.badge}`}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[11px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {formatRelativeTime(t.data)}
                    </span>
                    {t.quantidade > 0 && (
                      <span className="flex items-center gap-1">
                        <Package className="h-2.5 w-2.5" />
                        {Number(t.quantidade).toFixed(1)} kg
                      </span>
                    )}
                    {pessoa && (
                      <span className="flex items-center gap-1 truncate max-w-[90px]">
                        <User className="h-2.5 w-2.5 flex-shrink-0" />
                        {pessoa}
                      </span>
                    )}
                  </div>
                </div>

                {/* Valor */}
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-black ${cfg.color}`}>
                    {cfg.symbol} {formatCurrency(valor)}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">
                    {t.formaPagamento || "Dinheiro"}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {recent.length > 0 && (
        <div className="px-5 py-2.5 bg-slate-50/50 border-t border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
            Atualizado em tempo real
          </p>
        </div>
      )}
    </Card>
  );
});
RecentActivity.displayName = "RecentActivity";
