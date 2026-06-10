"use client";

import { useState, memo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calculator,
  Plus,
  X,
  MoreVertical,
  Users,
} from "lucide-react";
import { Button } from "../ui/button";

export const QuickActions = memo(({ onAction }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Fecha o menu se clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const actions = [
    {
      id: "nova-venda",
      label: "Nova Venda",
      icon: TrendingUp,
      color: "bg-gradient-to-r from-green-500 to-emerald-600",
      action: () => {
        onAction("transaction", "venda");
        setIsOpen(false);
      },
    },
    {
      id: "nova-compra",
      label: "Nova Compra",
      icon: TrendingDown,
      color: "bg-gradient-to-r from-blue-500 to-cyan-600",
      action: () => {
        onAction("transaction", "compra");
        setIsOpen(false);
      },
    },
    {
      id: "novo-cliente",
      label: "Novo Cliente",
      icon: Users,
      color: "bg-gradient-to-r from-indigo-500 to-purple-600",
      action: () => {
        onAction("clients");
        setIsOpen(false);
      },
    },
    {
      id: "nova-despesa",
      label: "Nova Despesa",
      icon: DollarSign,
      color: "bg-gradient-to-r from-red-500 to-pink-600",
      action: () => {
        onAction("expenses");
        setIsOpen(false);
      },
    },
    {
      id: "calculadora",
      label: "Calculadora",
      icon: Calculator,
      color: "bg-gradient-to-r from-purple-500 to-indigo-600",
      action: () => {
        onAction("calculator");
        setIsOpen(false);
      },
    },
  ];

  return (
    <div
      ref={menuRef}
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none"
    >
      <AnimatePresence>
        {isOpen && (
          <div className="flex flex-col gap-3 mb-2 pointer-events-auto">
            {actions.map((action, index) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, scale: 0.8, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 20 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="flex items-center justify-end gap-3"
              >
                <span className="bg-white text-gray-700 px-3 py-1 rounded-md text-sm font-medium shadow-md border border-gray-100 hidden sm:block">
                  {action.label}
                </span>
                <Button
                  onClick={action.action}
                  className={`h-12 w-12 rounded-full ${action.color} text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all p-0 flex items-center justify-center`}
                  title={action.label}
                  aria-label={action.label}
                >
                  <action.icon className="h-5 w-5" />
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`h-14 w-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 pointer-events-auto focus:outline-none focus:ring-4 focus:ring-blue-300 ${
          isOpen
            ? "bg-red-500 text-white rotate-90 hover:bg-red-600"
            : "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105"
        }`}
        aria-label="Menu de Ações Rápidas"
        aria-expanded={isOpen}
        whileTap={{ scale: 0.9 }}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-8 w-8" />}
      </motion.button>
    </div>
  );
});

QuickActions.displayName = "QuickActions";
