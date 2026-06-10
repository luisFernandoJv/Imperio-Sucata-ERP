"use client";

import { useMemo, useState } from "react";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  ChevronDown,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format, isValid } from "date-fns";

// ── Mini stat dentro de cada card de dia ──────────────────────────────────────
const DayStat = ({ icon: Icon, label, value, sub, colorClass, bgClass }) => (
  <div className={`rounded-xl p-3 ${bgClass}`}>
    <div className="flex items-center gap-1.5 mb-2">
      <Icon className={`w-3.5 h-3.5 ${colorClass}`} />
      <span className={`text-xs font-semibold ${colorClass}`}>{label}</span>
    </div>
    <p className={`text-base font-bold leading-none ${colorClass}`}>{value}</p>
    {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
  </div>
);

const DailyReport = ({ transactions }) => {
  const [sortBy, setSortBy] = useState("date");
  const [showAll, setShowAll] = useState(false);

  const dailyData = useMemo(() => {
    const byDay = {};

    transactions.forEach((t) => {
      let dateObj;
      if (t.data instanceof Date) dateObj = t.data;
      else if (t.data?.toDate) dateObj = t.data.toDate();
      else dateObj = new Date(t.data);
      if (!isValid(dateObj)) return;

      const date = format(dateObj, "dd/MM/yyyy");
      if (!byDay[date]) {
        byDay[date] = {
          vendas: 0,
          compras: 0,
          despesas: 0,
          transacoes: 0,
          nVenda: 0,
          nCompra: 0,
          nDespesa: 0,
        };
      }
      const d = byDay[date];
      d.transacoes++;
      if (t.tipo === "venda") {
        d.vendas += t.valorTotal;
        d.nVenda++;
      } else if (t.tipo === "compra") {
        d.compras += t.valorTotal;
        d.nCompra++;
      } else if (t.tipo === "despesa") {
        d.despesas += t.valorTotal;
        d.nDespesa++;
      }
    });

    Object.values(byDay).forEach((d) => {
      d.lucro = d.vendas - d.despesas;
      d.margem = d.vendas > 0 ? (d.lucro / d.vendas) * 100 : 0;
    });

    const entries = Object.entries(byDay);
    if (sortBy === "date") {
      return entries.sort((a, b) => {
        const [dA, mA, yA] = a[0].split("/").map(Number);
        const [dB, mB, yB] = b[0].split("/").map(Number);
        return new Date(yB, mB - 1, dB) - new Date(yA, mA - 1, dA);
      });
    }
    return entries.sort((a, b) => b[1][sortBy] - a[1][sortBy]);
  }, [transactions, sortBy]);

  const summary = useMemo(() => {
    const all = dailyData.map(([, d]) => d);
    const n = all.length;
    return {
      total: n,
      lucros: all.filter((d) => d.lucro > 0).length,
      pct: n > 0 ? (all.filter((d) => d.lucro > 0).length / n) * 100 : 0,
      avgVendas: n > 0 ? all.reduce((s, d) => s + d.vendas, 0) / n : 0,
      avgLucro: n > 0 ? all.reduce((s, d) => s + d.lucro, 0) / n : 0,
    };
  }, [dailyData]);

  const visibleData = showAll ? dailyData : dailyData.slice(0, 7);

  return (
    <div className="space-y-5">
      {/* ── Header com filtro ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Performance por dia
          </h3>
          <p className="text-sm text-slate-400 mt-0.5">
            {summary.total} dias com movimentação
          </p>
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="self-start sm:self-auto px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
        >
          <option value="date">Mais recente primeiro</option>
          <option value="lucro">Maior lucro</option>
          <option value="vendas">Maior venda</option>
          <option value="transacoes">Mais transações</option>
        </select>
      </div>

      {/* ── 4 métricas do período ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Dias analisados",
            value: summary.total,
            unit: "dias",
            color: "text-blue-700",
            bg: "bg-blue-50",
          },
          {
            label: "Dias lucrativos",
            value: `${summary.pct.toFixed(0)}%`,
            unit: `${summary.lucros} de ${summary.total} dias`,
            color: "text-emerald-700",
            bg: "bg-emerald-50",
          },
          {
            label: "Média diária vendas",
            value: formatCurrency(summary.avgVendas),
            unit: "por dia",
            color: "text-purple-700",
            bg: "bg-purple-50",
          },
          {
            label: "Média diária lucro",
            value: formatCurrency(summary.avgLucro),
            unit: "por dia",
            color: summary.avgLucro >= 0 ? "text-emerald-700" : "text-red-700",
            bg: summary.avgLucro >= 0 ? "bg-emerald-50" : "bg-red-50",
          },
        ].map(({ label, value, unit, color, bg }) => (
          <div
            key={label}
            className={`rounded-2xl ${bg} border border-slate-200 p-4`}
          >
            <p className="text-xs text-slate-400 mb-1">{label}</p>
            <p className={`text-xl font-bold leading-none ${color}`}>{value}</p>
            <p className="text-xs text-slate-400 mt-1">{unit}</p>
          </div>
        ))}
      </div>

      {/* ── Cards de dias ── */}
      {dailyData.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhum dado encontrado no período.</p>
          <p className="text-sm mt-1">
            Ajuste o filtro de datas para ver resultados.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleData.map(([date, data]) => {
            const lucroPos = data.lucro >= 0;
            return (
              <div
                key={date}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Cabeçalho do dia */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-800">
                        {date}
                      </span>
                      <p className="text-xs text-slate-400">
                        {data.transacoes} transações
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-black ${lucroPos ? "text-emerald-700" : "text-red-700"}`}
                    >
                      {formatCurrency(data.lucro)}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${lucroPos ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
                    >
                      {lucroPos ? "Lucrativo" : "Prejuízo"}
                    </span>
                  </div>
                </div>

                {/* Grid de stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4">
                  <DayStat
                    icon={TrendingUp}
                    label="Vendas"
                    value={formatCurrency(data.vendas)}
                    sub={`${data.nVenda} transações`}
                    colorClass="text-emerald-700"
                    bgClass="bg-emerald-50"
                  />
                  <DayStat
                    icon={TrendingDown}
                    label="Compras"
                    value={formatCurrency(data.compras)}
                    sub={`${data.nCompra} transações`}
                    colorClass="text-blue-700"
                    bgClass="bg-blue-50"
                  />
                  <DayStat
                    icon={Activity}
                    label="Despesas"
                    value={formatCurrency(data.despesas)}
                    sub={`${data.nDespesa} lançamentos`}
                    colorClass="text-rose-700"
                    bgClass="bg-rose-50"
                  />
                  <DayStat
                    icon={Target}
                    label="Margem"
                    value={`${data.margem.toFixed(1)}%`}
                    sub="sobre vendas"
                    colorClass={lucroPos ? "text-emerald-700" : "text-red-700"}
                    bgClass={lucroPos ? "bg-emerald-50" : "bg-red-50"}
                  />
                </div>
              </div>
            );
          })}

          {/* Botão ver mais */}
          {dailyData.length > 7 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full py-3 rounded-2xl border border-dashed border-slate-300 text-sm text-slate-500 font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform ${showAll ? "rotate-180" : ""}`}
              />
              {showAll
                ? "Mostrar menos"
                : `Ver mais ${dailyData.length - 7} dias`}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default DailyReport;
