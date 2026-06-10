"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

const MONTHS = [
  { value: 0, label: "Janeiro" },
  { value: 1, label: "Fevereiro" },
  { value: 2, label: "Março" },
  { value: 3, label: "Abril" },
  { value: 4, label: "Maio" },
  { value: 5, label: "Junho" },
  { value: 6, label: "Julho" },
  { value: 7, label: "Agosto" },
  { value: 8, label: "Setembro" },
  { value: 9, label: "Outubro" },
  { value: 10, label: "Novembro" },
  { value: 11, label: "Dezembro" },
];

const MonthYearPicker = ({ dateRange, onApply, navigateMonth }) => {
  const currentDate = dateRange?.from || new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  useEffect(() => {
    if (dateRange?.from) {
      setSelectedMonth(dateRange.from.getMonth());
      setSelectedYear(dateRange.from.getFullYear());
    }
  }, [dateRange]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 8 }, (_, i) => currentYear - 5 + i);

  const handleApply = () => onApply?.(selectedMonth, selectedYear);

  // Data de início e fim do mês para exibição
  const periodStart = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1,
  ).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const periodEnd = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0,
  ).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 print:hidden">
      {/* ── Cabeçalho ── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">
              Período de análise
            </p>
            <p className="text-xs text-slate-400">
              Selecione mês e ano para filtrar
            </p>
          </div>
        </div>

        {/* Navegação rápida de mês */}
        <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1 border border-slate-200">
          <button
            onClick={() => navigateMonth?.("prev")}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm transition-all text-slate-500 hover:text-slate-800"
            title="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-slate-700 min-w-[130px] text-center px-2">
            {MONTHS[currentDate.getMonth()].label} {currentDate.getFullYear()}
          </span>
          <button
            onClick={() => navigateMonth?.("next")}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm transition-all text-slate-500 hover:text-slate-800"
            title="Próximo mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Seletores ── */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
            Mês
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
            Ano
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Botão aplicar ── */}
      <button
        onClick={handleApply}
        className="w-full py-2.5 bg-slate-900 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl transition-colors"
      >
        Aplicar período
      </button>

      {/* ── Período selecionado ── */}
      <div className="mt-4 px-3 py-2.5 bg-blue-50 rounded-xl border border-blue-100">
        <p className="text-xs text-blue-600 font-semibold mb-0.5">
          Período selecionado
        </p>
        <p className="text-xs text-blue-800">
          {periodStart} até {periodEnd}
        </p>
      </div>
    </div>
  );
};

export default MonthYearPicker;
