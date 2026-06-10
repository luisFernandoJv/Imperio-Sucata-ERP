"use client";

import { useState, useMemo } from "react";
import { ArrowUpDown, Package, Warehouse, TrendingUp } from "lucide-react";
import { formatCurrency, getMaterialName } from "../../utils/reportUtils";

// ── Barra de progresso inline ─────────────────────────────────────────────────
const Bar = ({ value, max, colorClass }) => {
  const pct = max > 0 ? Math.max(0, (value / max) * 100) : 0;
  return (
    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1.5">
      <div
        className={`h-full rounded-full ${colorClass}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

// ── Cabeçalho de coluna ordenável ─────────────────────────────────────────────
const SortTh = ({ label, field, sortConfig, onSort, align = "right" }) => {
  const active = sortConfig.key === field;
  return (
    <th
      className={`px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-widest cursor-pointer select-none hover:text-slate-800 transition-colors ${align === "right" ? "text-right" : "text-left"}`}
      onClick={() => onSort(field)}
    >
      <span
        className={`inline-flex items-center gap-1 ${align === "right" ? "justify-end" : ""}`}
      >
        {label}
        <ArrowUpDown
          className={`w-3 h-3 ${active ? "text-blue-500" : "text-slate-300"}`}
        />
      </span>
    </th>
  );
};

// ── Badge de margem ───────────────────────────────────────────────────────────
const MargemBadge = ({ margem }) => {
  const val = typeof margem === "number" ? margem : 0;
  const style =
    val >= 25
      ? "bg-emerald-100 text-emerald-700"
      : val >= 10
        ? "bg-amber-100 text-amber-700"
        : "bg-red-100 text-red-700";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${style}`}
    >
      {val.toFixed(1)}%
    </span>
  );
};

export default function MaterialAnalysis({ summaryData }) {
  const { materialStats } = summaryData;
  const [sortConfig, setSortConfig] = useState({
    key: "lucro",
    direction: "desc",
  });

  const materials = useMemo(() => {
    const arr = Object.entries(materialStats).map(([material, stats]) => {
      const qComprada = Number(stats.quantidadeComprada) || 0;
      const qVendida = Number(stats.quantidadeVendida) || 0;
      return {
        material,
        nome: getMaterialName(material),
        ...stats,
        quantidadeComprada: qComprada,
        quantidadeVendida: qVendida,
        estoqueAtual: qComprada - qVendida,
      };
    });
    return [...arr].sort((a, b) =>
      sortConfig.direction === "asc"
        ? a[sortConfig.key] - b[sortConfig.key]
        : b[sortConfig.key] - a[sortConfig.key],
    );
  }, [materialStats, sortConfig]);

  const handleSort = (key) =>
    setSortConfig({
      key,
      direction:
        sortConfig.key === key && sortConfig.direction === "desc"
          ? "asc"
          : "desc",
    });

  const totals = useMemo(
    () => ({
      vendas: materials.reduce((s, i) => s + i.vendas, 0),
      compras: materials.reduce((s, i) => s + i.compras, 0),
      lucro: materials.reduce((s, i) => s + i.lucro, 0),
      kgVendido: materials.reduce((s, i) => s + i.quantidadeVendida, 0),
      kgComprado: materials.reduce((s, i) => s + i.quantidadeComprada, 0),
      estoque: materials.reduce((s, i) => s + i.estoqueAtual, 0),
    }),
    [materials],
  );

  const maxVendas = Math.max(...materials.map((m) => m.vendas), 1);
  const maxLucro = Math.max(...materials.map((m) => m.lucro), 1);
  const top3 = [...materials].sort((a, b) => b.lucro - a.lucro).slice(0, 3);

  return (
    <div className="space-y-5">
      {/* ── Top 3 materiais ── */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {top3.map((m, i) => (
            <div
              key={m.material}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-start gap-3"
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-slate-100 text-slate-500" : "bg-orange-100 text-orange-700"}`}
              >
                {i + 1}°
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">
                  {m.nome}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                  <p className="text-xs text-slate-500">
                    {formatCurrency(m.vendas)}
                  </p>
                </div>
                <p
                  className={`text-sm font-bold mt-1 ${m.lucro >= 0 ? "text-emerald-700" : "text-red-700"}`}
                >
                  {formatCurrency(m.lucro)} lucro
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Nota estoque ── */}
      <div className="flex items-start gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
        <Warehouse className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
        <span>
          <strong>Estoque (kg)</strong> = Kg Comprados − Kg Vendidos. Valores
          negativos indicam consumo de estoque de períodos anteriores.
        </span>
      </div>

      {/* ── Tabela principal ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-900 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Package className="w-4 h-4" />
            Análise por material
          </h3>
          <span className="text-slate-400 text-xs">
            {materials.length} materiais
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-widest text-left">
                  Material
                </th>
                <SortTh
                  label="Receita"
                  field="vendas"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
                <SortTh
                  label="Custo"
                  field="compras"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
                <SortTh
                  label="Lucro"
                  field="lucro"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
                <SortTh
                  label="Margem"
                  field="margem"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
                <SortTh
                  label="Kg Vendidos"
                  field="quantidadeVendida"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
                <SortTh
                  label="Kg Comprados"
                  field="quantidadeComprada"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
                <SortTh
                  label="Estoque"
                  field="estoqueAtual"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {materials.map((item) => (
                <tr
                  key={item.material}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="px-5 py-3 font-semibold text-slate-800">
                    {item.nome}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-semibold text-emerald-700">
                      {formatCurrency(item.vendas)}
                    </span>
                    <Bar
                      value={item.vendas}
                      max={maxVendas}
                      colorClass="bg-emerald-400"
                    />
                  </td>
                  <td className="px-4 py-3 text-right text-orange-600">
                    {formatCurrency(item.compras)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`font-bold ${item.lucro >= 0 ? "text-emerald-700" : "text-red-600"}`}
                    >
                      {formatCurrency(item.lucro)}
                    </span>
                    {item.lucro > 0 && (
                      <Bar
                        value={item.lucro}
                        max={maxLucro}
                        colorClass="bg-blue-400"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <MargemBadge margem={item.margem} />
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600">
                    {item.quantidadeVendida.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600">
                    {item.quantidadeComprada.toFixed(2)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-bold ${item.estoqueAtual > 0 ? "text-amber-600" : item.estoqueAtual < 0 ? "text-red-600" : "text-slate-400"}`}
                  >
                    {item.estoqueAtual.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-300 font-bold">
                <td className="px-5 py-3 text-slate-700 text-xs uppercase tracking-widest">
                  Total
                </td>
                <td className="px-4 py-3 text-right text-emerald-700">
                  {formatCurrency(totals.vendas)}
                </td>
                <td className="px-4 py-3 text-right text-orange-700">
                  {formatCurrency(totals.compras)}
                </td>
                <td
                  className={`px-4 py-3 text-right ${totals.lucro >= 0 ? "text-emerald-700" : "text-red-700"}`}
                >
                  {formatCurrency(totals.lucro)}
                </td>
                <td className="px-4 py-3 text-right text-slate-400">—</td>
                <td className="px-4 py-3 text-right text-slate-600">
                  {totals.kgVendido.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right text-slate-600">
                  {totals.kgComprado.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right text-amber-700">
                  {totals.estoque.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
