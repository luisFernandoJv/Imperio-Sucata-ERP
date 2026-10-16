"use client";

import { memo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Receipt,
  Clock,
  ArrowUpRight,
  User,
  Package,
  Plus,
} from "lucide-react";
import { formatCurrency, formatRelativeTime } from "../../utils/formatters";
import { Card } from "../ui/card";
import { Button } from "../ui/button";

const transactionConfig = {
  venda: { icon: TrendingUp, label: "Venda", symbol: "+", accent: "green" },
  compra: { icon: TrendingDown, label: "Compra", symbol: "−", accent: "blue" },
  despesa: { icon: Receipt, label: "Despesa", symbol: "−", accent: "red" },
};
const defaultConfig = {
  icon: Clock,
  label: "Outro",
  symbol: "",
  accent: "neutral",
};

export const RecentActivity = memo(
  ({ transactions = [], limit = 8, onViewReports, onNewTransaction }) => {
    const recent = transactions.slice(0, limit);
    return (
      <Card className="dashboard-activity">
        <div className="dashboard-activity-header">
          <div>
            <h2>Últimas movimentações</h2>
            <p className="dashboard-panel-description">
              Da mais recente para a mais antiga
            </p>
          </div>
          {onViewReports && (
            <Button
              type="button"
              variant="ghost"
              onClick={onViewReports}
              className="dashboard-button no-print"
            >
              Consultar relatórios
              <ArrowUpRight size={16} aria-hidden="true" />
            </Button>
          )}
        </div>
        {recent.length === 0 ? (
          <div className="dashboard-state dashboard-activity-empty">
            <Clock size={30} aria-hidden="true" />
            <h3>Nenhuma movimentação registrada</h3>
            <p>
              Registre uma compra ou venda para acompanhar as movimentações por
              aqui.
            </p>
            {onNewTransaction && (
              <Button
                type="button"
                variant="outline"
                onClick={onNewTransaction}
                className="dashboard-button no-print"
              >
                <Plus size={17} aria-hidden="true" />
                Registrar transação
              </Button>
            )}
          </div>
        ) : (
          <ul className="dashboard-activity-list">
            {recent.map((transaction, index) => {
              const config =
                transactionConfig[transaction.tipo || transaction.type] ||
                defaultConfig;
              const Icon = config.icon;
              const valor = Number(
                transaction.valorTotal || transaction.total || 0,
              );
              const pessoa =
                transaction.vendedor ||
                transaction.cliente ||
                transaction.fornecedor;
              return (
                <li
                  key={transaction.id || index}
                  className="dashboard-activity-item"
                  data-accent={config.accent}
                >
                  <span className="dashboard-metric-icon">
                    <Icon size={19} aria-hidden="true" />
                  </span>
                  <div className="dashboard-activity-copy">
                    <div className="dashboard-activity-title">
                      <h3>
                        {transaction.material ||
                          transaction.descricao ||
                          config.label}
                      </h3>
                      <span className="dashboard-type-badge">
                        {config.label}
                      </span>
                    </div>
                    <div className="dashboard-activity-meta">
                      <span>
                        <Clock size={13} aria-hidden="true" />
                        {formatRelativeTime(transaction.data)}
                      </span>
                      {transaction.quantidade > 0 && (
                        <span>
                          <Package size={13} aria-hidden="true" />
                          {Number(transaction.quantidade).toFixed(1)} kg
                        </span>
                      )}
                      {pessoa && (
                        <span>
                          <User size={13} aria-hidden="true" />
                          {pessoa}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="dashboard-activity-amount">
                    <strong>
                      {config.symbol} {formatCurrency(valor)}
                    </strong>
                    <span>{transaction.formaPagamento || "Dinheiro"}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {recent.length > 0 && (
          <p className="dashboard-activity-footer">
            Exibindo {recent.length}{" "}
            {recent.length === 1 ? "movimentação" : "movimentações"} mais
            recentes.
          </p>
        )}
      </Card>
    );
  },
);
RecentActivity.displayName = "RecentActivity";
