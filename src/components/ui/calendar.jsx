"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Calendar = ({ selected, onSelect, className = "" }) => {
  const [currentDate, setCurrentDate] = useState(selected || new Date());

  const today = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayWeekday = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const monthNames = [
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

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const previousMonth = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const selectDate = (day, e) => {
    e.preventDefault();
    e.stopPropagation();
    const selectedDate = new Date(year, month, day);
    onSelect(selectedDate);
  };

  const isSelected = (day) => {
    if (!selected) return false;
    const date = new Date(year, month, day);
    return date.toDateString() === selected.toDateString();
  };

  const isToday = (day) => {
    const date = new Date(year, month, day);
    return date.toDateString() === today.toDateString();
  };

  const renderCalendarDays = () => {
    const days = [];

    // Dias vazios do mês anterior
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(
        <div
          key={`empty-${i}`}
          className="h-10 flex items-center justify-center"
        ></div>,
      );
    }

    // Dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(
        <button
          key={day}
          type="button"
          onClick={(e) => selectDate(day, e)}
          className={`
            h-10 rounded-lg font-semibold text-sm transition-all duration-200
            ${
              isSelected(day)
                ? "bg-red-600 text-white shadow-md hover:bg-red-700"
                : isToday(day)
                  ? "bg-red-100 text-red-700 font-bold hover:bg-red-200"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
            }
          `}
        >
          {day}
        </button>,
      );
    }

    return days;
  };

  return (
    <div
      className={`w-full bg-white rounded-xl shadow-lg border border-slate-200 p-4 ${className}`}
    >
      {/* Header com navegação */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={previousMonth}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200"
        >
          <ChevronLeft className="h-5 w-5 text-slate-600" />
        </button>

        <h3 className="text-lg font-black text-slate-900 min-w-max">
          {monthNames[month]} {year}
        </h3>

        <button
          type="button"
          onClick={nextMonth}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200"
        >
          <ChevronRight className="h-5 w-5 text-slate-600" />
        </button>
      </div>

      {/* Dias da semana */}
      <div className="grid grid-cols-7 gap-2 mb-3">
        {weekDays.map((day) => (
          <div
            key={day}
            className="h-10 flex items-center justify-center text-xs font-black text-slate-500 uppercase tracking-widest"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Dias do mês */}
      <div className="grid grid-cols-7 gap-2">{renderCalendarDays()}</div>
    </div>
  );
};

export { Calendar };
