"use client";

import { useState, useRef, useEffect } from "react";
import { CalendarIcon, X } from "lucide-react";
import { Calendar } from "./calendar";

const DatePicker = ({
  selected,
  onSelect,
  placeholder = "Selecionar data",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleSelect = (date) => {
    onSelect(date);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(null);
  };

  const formatDate = (date) => {
    if (!date) return placeholder;
    return date.toLocaleDateString("pt-BR");
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative">
        <button
          type="button"
          onClick={handleToggle}
          className="w-full h-12 px-4 pr-12 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-700 hover:border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all duration-200 flex items-center gap-2 text-left"
        >
          <CalendarIcon className="h-5 w-5 text-slate-400 flex-shrink-0" />
          <span className="truncate">{formatDate(selected)}</span>
        </button>

        {selected && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-12 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-lg transition-colors duration-200"
          >
            <X className="h-4 w-4 text-slate-500" />
          </button>
        )}

        <button
          type="button"
          onClick={handleToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors duration-200"
        >
          <CalendarIcon className="h-5 w-5" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
          <Calendar selected={selected} onSelect={handleSelect} />
        </div>
      )}
    </div>
  );
};

export { DatePicker };
