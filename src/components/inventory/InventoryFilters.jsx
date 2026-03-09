"use client";

import { memo } from "react";
import {
  Search,
  LayoutGrid,
  List,
  AlertTriangle,
  Download,
  Printer,
} from "lucide-react";
import { categories } from "../../config/designTokens";

export const InventoryFilters = memo(
  ({
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    viewMode,
    setViewMode,
    showLowStock,
    setShowLowStock,
    onPrint,
    onExport,
  }) => {
    return (
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-8 space-y-6">
        {/* Categorias - Estilo "Pílulas" Horizontal com Scroll */}
        <div className="overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex gap-3 min-w-max px-1">
            <button
              onClick={() => setSelectedCategory("todos")}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
                selectedCategory === "todos"
                  ? "bg-orange-500 text-white shadow-md shadow-orange-200 scale-105"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-orange-200 hover:text-orange-600"
              }`}
            >
              📋 Todos os Materiais
            </button>

            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
                  selectedCategory === cat.key
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200 scale-105"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-blue-200 hover:text-blue-600"
                }`}
              >
                <span className="text-lg">{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Barra de Controle Inferior */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center pt-2 border-t border-slate-50">
          {/* Barra de Busca */}
          <div className="relative w-full lg:max-w-md group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              placeholder="Buscar material..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 h-12 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-500 rounded-xl text-sm transition-all outline-none placeholder:text-slate-400 font-medium"
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
            <button
              onClick={() => setShowLowStock(!showLowStock)}
              className={`h-10 px-4 rounded-lg text-sm font-bold flex items-center gap-2 transition-all border ${
                showLowStock
                  ? "bg-red-50 text-red-600 border-red-200 shadow-sm"
                  : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Estoque Baixo</span>
            </button>

            <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block" />

            <button
              onClick={onPrint}
              className="h-10 px-4 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 text-sm font-bold flex items-center gap-2 transition-colors"
            >
              <Printer className="h-4 w-4" /> Imprimir
            </button>

            <button
              onClick={onExport}
              className="h-10 px-4 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 text-sm font-bold flex items-center gap-2 transition-colors"
            >
              <Download className="h-4 w-4" /> Exportar
            </button>

            <div className="bg-slate-100 p-1 rounded-lg flex ml-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-all ${viewMode === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
              >
                <LayoutGrid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-all ${viewMode === "list" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

InventoryFilters.displayName = "InventoryFilters";
