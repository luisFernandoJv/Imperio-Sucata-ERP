"use client";

import { useState, useMemo } from "react";
import {
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Edit3,
  Trash2,
  ArrowUpDown,
  X,
  Filter,
  Receipt,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// ── Badge de tipo de transação ────────────────────────────────────────────────
const TipoBadge = ({ tipo }) => {
  const map = {
    venda: {
      label: "Venda",
      cls: "bg-emerald-100 text-emerald-700 border-emerald-200",
    },
    compra: {
      label: "Compra",
      cls: "bg-blue-100 text-blue-700 border-blue-200",
    },
    despesa: {
      label: "Despesa",
      cls: "bg-red-100 text-red-700 border-red-200",
    },
  };
  const { label, cls } = map[tipo] || {
    label: tipo,
    cls: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}
    >
      {label}
    </span>
  );
};

// ── Badge de pagamento ────────────────────────────────────────────────────────
const PagamentoBadge = ({ forma }) => {
  const isPix = forma === "pix";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${isPix ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}
    >
      {isPix ? "PIX" : "Dinheiro"}
    </span>
  );
};

const TransactionsReport = ({
  transactions,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState("todos");
  const [sortField, setSortField] = useState("data");
  const [sortDirection, setSortDirection] = useState("desc");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleSort = (field) => {
    if (sortField === field)
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const filtered = useMemo(() => {
    let list = transactions.filter((t) => {
      const matchSearch =
        !searchTerm ||
        t.material?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.vendedor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.tipo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.formaPagamento?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchTipo = tipoFilter === "todos" || t.tipo === tipoFilter;
      return matchSearch && matchTipo;
    });

    list.sort((a, b) => {
      let aVal = a[sortField],
        bVal = b[sortField];
      if (sortField === "data") {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      return sortDirection === "asc"
        ? aVal > bVal
          ? 1
          : -1
        : aVal < bVal
          ? 1
          : -1;
    });

    return list;
  }, [transactions, searchTerm, tipoFilter, sortField, sortDirection]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  // Totais da página atual
  const pageTotals = useMemo(() => {
    const vendas = filtered
      .filter((t) => t.tipo === "venda")
      .reduce((s, t) => s + (t.valorTotal || 0), 0);
    const compras = filtered
      .filter((t) => t.tipo === "compra")
      .reduce((s, t) => s + (t.valorTotal || 0), 0);
    const despesas = filtered
      .filter((t) => t.tipo === "despesa")
      .reduce((s, t) => s + (t.valorTotal || 0), 0);
    return { vendas, compras, despesas };
  }, [filtered]);

  const handleDelete = async (id) => {
    try {
      setDeleting(true);
      await onDeleteTransaction(id);
      setShowDeleteConfirm(null);
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
    }
  };

  const SortHeader = ({ label, field, align = "right" }) => (
    <th
      className={`px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-widest cursor-pointer select-none hover:text-slate-800 transition-colors ${align === "right" ? "text-right" : "text-left"}`}
      onClick={() => handleSort(field)}
    >
      <span
        className={`inline-flex items-center gap-1 ${align === "right" ? "justify-end" : ""}`}
      >
        {label}
        <ArrowUpDown
          className={`w-3 h-3 ${sortField === field ? "text-blue-500" : "text-slate-300"}`}
        />
      </span>
    </th>
  );

  return (
    <>
      {/* ── Modal confirmação exclusão ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Confirmar exclusão
                </h3>
                <p className="text-xs text-slate-400">
                  Esta ação não pode ser desfeita
                </p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 mb-5 border border-slate-200">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tipo</span>
                  <TipoBadge tipo={showDeleteConfirm.tipo} />
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Material</span>
                  <span className="font-medium text-slate-800">
                    {showDeleteConfirm.material || "Despesa"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Valor</span>
                  <span className="font-bold text-slate-900">
                    {formatCurrency(showDeleteConfirm.valorTotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Data</span>
                  <span className="text-slate-700">
                    {new Date(showDeleteConfirm.data).toLocaleDateString(
                      "pt-BR",
                    )}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(showDeleteConfirm.id)}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {deleting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Excluir definitivamente
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                disabled={deleting}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* ── Totais filtrados ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "Vendas (filtrado)",
              value: pageTotals.vendas,
              color: "text-emerald-700",
              bg: "bg-emerald-50",
              border: "border-emerald-200",
            },
            {
              label: "Compras (filtrado)",
              value: pageTotals.compras,
              color: "text-blue-700",
              bg: "bg-blue-50",
              border: "border-blue-200",
            },
            {
              label: "Despesas (filtrado)",
              value: pageTotals.despesas,
              color: "text-red-700",
              bg: "bg-red-50",
              border: "border-red-200",
            },
          ].map(({ label, value, color, bg, border }) => (
            <div
              key={label}
              className={`${bg} border ${border} rounded-xl p-3`}
            >
              <p className="text-xs text-slate-500 mb-1">{label}</p>
              <p className={`text-lg font-bold ${color}`}>
                {formatCurrency(value)}
              </p>
            </div>
          ))}
        </div>

        {/* ── Barra de busca e filtros ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Campo de busca principal */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por material, vendedor ou forma de pagamento…"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filtro de tipo */}
            <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl shrink-0">
              {[
                { value: "todos", label: "Todos" },
                { value: "venda", label: "Vendas" },
                { value: "compra", label: "Compras" },
                { value: "despesa", label: "Despesas" },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => {
                    setTipoFilter(value);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${tipoFilter === value ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Itens por página */}
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none shrink-0"
            >
              <option value={10}>10 por página</option>
              <option value={15}>15 por página</option>
              <option value={25}>25 por página</option>
              <option value={50}>50 por página</option>
            </select>
          </div>

          {/* Resultado */}
          <p className="text-xs text-slate-400">
            {filtered.length === 0
              ? "Nenhuma transação encontrada"
              : `Exibindo ${startIndex + 1}–${Math.min(startIndex + itemsPerPage, filtered.length)} de ${filtered.length} transações`}
            {(searchTerm || tipoFilter !== "todos") &&
              filtered.length !== transactions.length && (
                <span className="text-slate-300">
                  {" "}
                  · filtrado de {transactions.length} total
                </span>
              )}
          </p>
        </div>

        {/* ── Tabela ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-900">
                  <SortHeader label="Data" field="data" align="left" />
                  <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-widest text-left">
                    Tipo
                  </th>
                  <SortHeader label="Material" field="material" align="left" />
                  <SortHeader label="Qtd (kg)" field="quantidade" />
                  <SortHeader label="Preço/kg" field="precoUnitario" />
                  <SortHeader label="Total" field="valorTotal" />
                  <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-widest text-left">
                    Vendedor
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-widest text-center">
                    Pagamento
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-widest text-center">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-sm font-medium text-slate-800">
                        {new Date(t.data).toLocaleDateString("pt-BR")}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(t.data).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <TipoBadge tipo={t.tipo} />
                    </td>
                    <td className="px-4 py-3">
                      <p
                        className="font-medium text-slate-800 truncate max-w-[140px]"
                        title={t.material}
                      >
                        {t.material || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {t.quantidade ? `${t.quantidade.toFixed(2)} kg` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {t.precoUnitario ? formatCurrency(t.precoUnitario) : "—"}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-bold ${t.tipo === "venda" ? "text-emerald-700" : t.tipo === "compra" ? "text-blue-700" : "text-red-700"}`}
                    >
                      {formatCurrency(t.valorTotal)}
                    </td>
                    <td className="px-4 py-3">
                      <p
                        className="text-slate-600 truncate max-w-[100px]"
                        title={t.vendedor}
                      >
                        {t.vendedor || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <PagamentoBadge forma={t.formaPagamento} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onEditTransaction?.(t)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-blue-600 hover:bg-blue-100 transition-colors"
                          title="Editar"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(t)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-red-600 hover:bg-red-100 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan="9" className="p-12 text-center">
                      <Receipt className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                      <p className="text-slate-400 font-medium">
                        Nenhuma transação encontrada.
                      </p>
                      {(searchTerm || tipoFilter !== "todos") && (
                        <button
                          onClick={() => {
                            setSearchTerm("");
                            setTipoFilter("todos");
                          }}
                          className="mt-2 text-xs text-blue-500 hover:underline"
                        >
                          Limpar filtros
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50">
              <span className="text-xs text-slate-500">
                Página {currentPage} de {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let p;
                  if (totalPages <= 5) p = i + 1;
                  else if (currentPage <= 3) p = i + 1;
                  else if (currentPage >= totalPages - 2)
                    p = totalPages - 4 + i;
                  else p = currentPage - 2 + i;
                  return (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${currentPage === p ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-600 hover:bg-white"}`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// badge necessário também no módulo
const PagamentoBadge = ({ forma }) => {
  const isPix = forma === "pix";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${isPix ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}
    >
      {isPix ? "PIX" : "Dinheiro"}
    </span>
  );
};

export default TransactionsReport;
