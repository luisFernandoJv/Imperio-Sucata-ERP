"use client";
import { memo } from "react";
import {
  Search,
  LayoutGrid,
  List,
  AlertTriangle,
  Download,
  Printer,
  Plus,
  X,
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
    onNewMaterial,
    onClear,
    resultCount,
    totalCount,
    searching,
  }) => (
    <section
      aria-label="Consultar estoque"
      className="inventory-filters rounded-xl border border-slate-200 bg-white p-4 space-y-4"
    >
      <div
        role="group"
        aria-label="Categorias de materiais"
        className="inventory-categories flex flex-wrap gap-2"
      >
        {categories.map((cat) => (
          <button
            key={cat.key}
            type="button"
            aria-pressed={selectedCategory === cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold ${selectedCategory === cat.key ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
          >
            <span aria-hidden="true" className="mr-1.5">
              {cat.icon}
            </span>
            {cat.name}
          </button>
        ))}
      </div>
      <div className="inventory-filter-controls flex flex-wrap gap-3 items-end border-t border-slate-100 pt-4">
        <div className="inventory-search flex-1 min-w-0">
          <label
            htmlFor="inventory-search"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Buscar material
          </label>
          <div className="relative">
            <Search
              aria-hidden="true"
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              id="inventory-search"
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nome do material…"
              className="h-11 w-full rounded-lg border border-slate-300 pl-10 pr-10 text-sm"
            />
            {searchTerm && (
              <button
                type="button"
                aria-label="Limpar busca"
                onClick={() => {
                  setSearchTerm("");
                  document.getElementById("inventory-search")?.focus();
                }}
                className="absolute right-1 top-1 rounded-md p-2 text-slate-500"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
        <button
          type="button"
          aria-pressed={showLowStock}
          onClick={() => setShowLowStock(!showLowStock)}
          className={`inline-flex h-11 items-center gap-2 rounded-lg border px-3 text-sm font-semibold ${showLowStock ? "border-amber-300 bg-amber-50 text-amber-800" : "border-slate-200 text-slate-600"}`}
        >
          <AlertTriangle size={16} />
          Estoque baixo
        </button>
        <div
          role="group"
          aria-label="Visualização do estoque"
          className="flex gap-1 rounded-lg border border-slate-200 p-1"
        >
          {[
            ["grid", "Cartões", LayoutGrid],
            ["list", "Tabela", List],
          ].map(([value, label, Icon]) => {
            const ViewIcon = Icon;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={viewMode === value}
                onClick={() => setViewMode(value)}
                className={`inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-semibold ${viewMode === value ? "bg-blue-50 text-blue-700" : "text-slate-600"}`}
              >
                <ViewIcon size={16} />
                {label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p role="status" className="text-sm text-slate-600">
          {searching
            ? "Buscando materiais…"
            : `${resultCount} de ${totalCount} materiais`}
        </p>
        <div className="flex flex-wrap gap-2">
          {(searchTerm || selectedCategory !== "todos" || showLowStock) && (
            <button
              type="button"
              onClick={onClear}
              className="h-10 rounded-lg px-3 text-sm font-semibold text-blue-700 hover:bg-blue-50"
            >
              Limpar filtros
            </button>
          )}
          <button
            type="button"
            onClick={onPrint}
            title="Imprimir todos os materiais"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm text-slate-700"
          >
            <Printer size={16} />
            Imprimir estoque
          </button>
          <button
            type="button"
            onClick={onExport}
            title="Exportar todos os materiais para CSV"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm text-slate-700"
          >
            <Download size={16} />
            Exportar estoque
          </button>
          {onNewMaterial && (
            <button
              type="button"
              onClick={onNewMaterial}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-700 px-3 text-sm font-semibold text-white"
            >
              <Plus size={16} />
              Novo Material
            </button>
          )}
        </div>
      </div>
      <p className="text-xs text-slate-500">
        Impressão e exportação incluem o estoque completo.
      </p>
    </section>
  ),
);
InventoryFilters.displayName = "InventoryFilters";
