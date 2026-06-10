"use client";

import { memo } from "react";
import { Edit, AlertTriangle } from "lucide-react";
import { formatCurrency, formatWeight, formatPercent } from "../../lib/utils";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

const parseValue = (val) => Number(val) || 0;

const calcMargin = (compra, venda) => {
  if (!compra || compra === 0) return 0;
  return ((venda - compra) / compra) * 100;
};

export const InventoryTableView = memo(({ materials, inventory, onEdit }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-lg shadow-slate-200/50">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50/90 text-slate-500 font-semibold border-b border-slate-200 backdrop-blur">
            <tr>
              <th className="px-6 py-4 w-1/3">Material</th>
              <th className="px-6 py-4 text-right">Qtd. Atual</th>
              <th className="px-6 py-4 text-right">Compra (kg)</th>
              <th className="px-6 py-4 text-right">Venda (kg)</th>
              <th className="px-6 py-4 text-right">Total Investido</th>
              <th className="px-6 py-4 text-center">Margem</th>
              <th className="px-6 py-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {materials.map((material) => {
              const item = inventory[material.key] || {};

              // Sanitização consistente com os outros componentes
              const qtd = parseValue(item.quantidade);
              const compra = parseValue(item.precoCompra);
              const venda = parseValue(item.precoVenda);

              const isNegative = qtd < 0;
              const isLowStock = !isNegative && qtd <= (material.minStock || 0);

              const totalValue = Math.max(0, qtd) * compra;
              const margin = calcMargin(compra, venda);

              return (
                <tr
                  key={material.key}
                  className={`group hover:bg-slate-50 transition-colors ${isNegative ? "bg-rose-50/30" : ""}`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform">
                        {material.icon}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-base">
                          {material.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 h-5 font-normal text-slate-500 border-slate-200 bg-slate-50"
                          >
                            {material.category}
                          </Badge>
                          {isLowStock && (
                            <span className="flex items-center gap-1 text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 rounded-full border border-amber-100">
                              <AlertTriangle className="h-3 w-3" /> Baixo
                            </span>
                          )}
                          {isNegative && (
                            <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-1.5 rounded-full border border-rose-100">
                              Negativo
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <span
                      className={`font-bold text-base tabular-nums ${isNegative ? "text-rose-600" : isLowStock ? "text-amber-600" : "text-slate-700"}`}
                    >
                      {formatWeight(qtd)}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right text-slate-600 tabular-nums font-medium">
                    {formatCurrency(compra)}
                  </td>

                  <td className="px-6 py-4 text-right text-emerald-600 tabular-nums font-medium">
                    {formatCurrency(venda)}
                  </td>

                  <td className="px-6 py-4 text-right font-bold text-slate-800 tabular-nums">
                    {isNegative ? "---" : formatCurrency(totalValue)}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold tabular-nums border ${
                        margin > 20
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : margin > 0
                            ? "bg-blue-50 text-blue-700 border-blue-100"
                            : "bg-rose-50 text-rose-700 border-rose-100"
                      }`}
                    >
                      {formatPercent(margin)}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(material.key)}
                      className="h-9 w-9 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});
InventoryTableView.displayName = "InventoryTableView";
