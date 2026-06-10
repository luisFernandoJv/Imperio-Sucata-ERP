"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Calendar — seletor de data embutido, usado pelo DatePicker.
 * Suporta: seleção simples, navegação por mês/ano, dias da semana em pt-BR.
 */

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];
const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const Calendar = ({ selected, onSelect, minDate, maxDate, className = "" }) => {
  const [viewDate, setViewDate] = useState(() => {
    const base =
      selected instanceof Date
        ? selected
        : selected
          ? new Date(selected)
          : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const today = new Date();
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const navigate = (deltaMonth, e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setViewDate(new Date(year, month + deltaMonth, 1));
  };

  const navigateYear = (deltaYear, e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setViewDate(new Date(year + deltaYear, month, 1));
  };

  const selectDay = (day, e) => {
    e?.preventDefault();
    e?.stopPropagation();
    const date = new Date(year, month, day);
    if (minDate && date < minDate) return;
    if (maxDate && date > maxDate) return;
    onSelect?.(date);
  };

  const isSelected = (day) => {
    if (!selected) return false;
    const sel = selected instanceof Date ? selected : new Date(selected);
    return (
      sel.getDate() === day &&
      sel.getMonth() === month &&
      sel.getFullYear() === year
    );
  };

  const isToday = (day) =>
    today.getDate() === day &&
    today.getMonth() === month &&
    today.getFullYear() === year;

  const isDisabled = (day) => {
    const date = new Date(year, month, day);
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  // Células do calendário: dias do mês anterior (opacidade reduzida) + mês atual
  const cells = [];

  // Dias do mês anterior (preenchimento)
  for (let i = 0; i < firstWeekday; i++) {
    const day = daysInPrevMonth - firstWeekday + 1 + i;
    cells.push(
      <div key={`prev-${i}`} className="h-9 flex items-center justify-center">
        <span className="text-sm text-gray-300 select-none">{day}</span>
      </div>,
    );
  }

  // Dias do mês atual
  for (let day = 1; day <= daysInMonth; day++) {
    const selected_ = isSelected(day);
    const today_ = isToday(day);
    const disabled_ = isDisabled(day);

    cells.push(
      <button
        key={day}
        type="button"
        onClick={(e) => selectDay(day, e)}
        disabled={disabled_}
        className={cn(
          "h-9 w-full rounded-lg text-sm font-medium transition-all duration-150 select-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
          selected_
            ? "bg-emerald-600 text-white font-bold shadow-md hover:bg-emerald-700"
            : today_
              ? "bg-emerald-50 text-emerald-700 font-bold ring-1 ring-emerald-300 hover:bg-emerald-100"
              : disabled_
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
        )}
      >
        {day}
      </button>,
    );
  }

  return (
    <div
      className={cn(
        "w-full bg-white rounded-xl shadow-xl border border-gray-200 p-4 select-none",
        className,
      )}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Navegação */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={(e) => navigateYear(-1, e)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-700"
            title="Ano anterior"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(e) => navigate(-1, e)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-700"
            title="Mês anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
          }}
          className="text-sm font-bold text-gray-900 hover:text-emerald-700 transition-colors px-2 py-1 rounded-lg hover:bg-emerald-50"
          title="Ir para hoje"
        >
          {MONTH_NAMES[month]} {year}
        </button>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={(e) => navigate(1, e)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-700"
            title="Próximo mês"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(e) => navigateYear(1, e)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-700"
            title="Próximo ano"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Cabeçalho dos dias */}
      <div className="grid grid-cols-7 gap-1 mb-1.5">
        {WEEK_DAYS.map((d) => (
          <div
            key={d}
            className="h-7 flex items-center justify-center text-[10px] font-bold text-gray-400 uppercase tracking-widest"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grade de dias */}
      <div className="grid grid-cols-7 gap-1">{cells}</div>

      {/* Atalho: hoje */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSelect?.(new Date());
          }}
          className="w-full text-xs text-center text-emerald-600 hover:text-emerald-800 font-semibold py-1 rounded-lg hover:bg-emerald-50 transition-colors"
        >
          Selecionar hoje
        </button>
      </div>
    </div>
  );
};

export { Calendar };
