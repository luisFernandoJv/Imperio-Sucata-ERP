"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { CalendarIcon, X, ChevronDown } from "lucide-react";
import { Calendar } from "./calendar";
import { cn } from "@/lib/utils";

/**
 * DatePicker — campo de seleção de data com calendário flutuante.
 *
 * Props:
 *   selected     Date | null
 *   onSelect     (date: Date | null) => void
 *   placeholder  string
 *   disabled     boolean
 *   error        boolean
 *   minDate      Date
 *   maxDate      Date
 *   className    string  — aplicado ao botão trigger
 */

const formatDate = (date) => {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
};

const DatePicker = ({
  selected,
  onSelect,
  placeholder = "Selecionar data",
  className = "",
  disabled = false,
  error = false,
  minDate,
  maxDate,
  allowClear = true,
  id,
}) => {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState({});
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  const calcPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const vh = window.innerHeight;
    const calH = 360;
    const showAbove = vh - rect.bottom < calH && rect.top > calH;

    setStyle({
      position: "fixed",
      left: Math.max(
        8,
        Math.min(
          rect.left,
          window.innerWidth -
            Math.min(Math.max(rect.width, 290), window.innerWidth - 16) -
            8,
        ),
      ),
      width: Math.min(Math.max(rect.width, 290), window.innerWidth - 16),
      zIndex: 9999,
      ...(showAbove ? { bottom: vh - rect.top + 6 } : { top: rect.bottom + 6 }),
    });
  }, []);

  const open_ = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;
      if (!open) {
        calcPosition();
        setOpen(true);
      } else {
        setOpen(false);
      }
    },
    [disabled, open, calcPosition],
  );

  // Fechar ao clicar fora; reposicionar ao rolar/redimensionar
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e) => {
      if (
        !triggerRef.current?.contains(e.target) &&
        !dropdownRef.current?.contains(e.target)
      ) {
        setOpen(false);
      }
    };

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    const onScroll = () => calcPosition();
    const onResize = () => calcPosition();

    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, calcPosition]);

  const handleSelect = useCallback(
    (date) => {
      onSelect?.(date);
      setOpen(false);
      triggerRef.current?.focus();
    },
    [onSelect],
  );

  const handleClear = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      onSelect?.(null);
    },
    [onSelect],
  );

  const hasValue = Boolean(selected);

  return (
    <>
      {/* Trigger and optional clear action are sibling buttons. */}
      <div className="relative w-full">
        <button
          id={id}
          ref={triggerRef}
          type="button"
          onClick={open_}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={cn(
            "flex h-10 items-center gap-2 w-full rounded-lg border-2 px-3 bg-white text-left",
            "text-sm font-medium transition-all duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            open
              ? "border-emerald-500 ring-2 ring-emerald-100"
              : error
                ? "border-red-400"
                : "border-gray-200 hover:border-gray-300",
            hasValue && allowClear && "pr-10",
            className,
          )}
        >
          <CalendarIcon
            size={15}
            className={cn(
              "flex-shrink-0 transition-colors",
              open ? "text-emerald-600" : "text-gray-400",
            )}
          />

          <span
            className={cn(
              "flex-1 truncate",
              hasValue ? "text-gray-800" : "text-gray-400 font-normal",
            )}
          >
            {hasValue ? formatDate(selected) : placeholder}
          </span>

          <ChevronDown
            size={14}
            className={cn(
              "flex-shrink-0 text-gray-400",
              open && "rotate-180",
              hasValue && allowClear && "invisible",
            )}
          />
        </button>
        {hasValue && allowClear && (
          <button
            type="button"
            disabled={disabled}
            onClick={handleClear}
            aria-label="Limpar data"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 text-gray-500 focus-visible:outline focus-visible:outline-2"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Dropdown com position:fixed para escapar de overflow:hidden */}
      {open && (
        <div ref={dropdownRef} style={style}>
          <Calendar
            selected={
              selected instanceof Date
                ? selected
                : selected
                  ? new Date(selected)
                  : null
            }
            onSelect={handleSelect}
            minDate={minDate}
            maxDate={maxDate}
          />
        </div>
      )}
    </>
  );
};

export { DatePicker };
