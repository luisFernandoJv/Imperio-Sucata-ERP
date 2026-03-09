"use client";

import { memo, useMemo } from "react";
import { Package, DollarSign, TrendingUp, Activity } from "lucide-react";
import { formatCurrency, formatWeight, formatPercent } from "../../lib/utils";

const StatWidget = ({ label, value, icon: Icon, color, subtext }) => {
  // Configuração de temas visuais consistentes com a imagem
  const themes = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    violet: "bg-violet-50 text-violet-700 border-violet-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
  };

  const theme = themes[color] || themes.blue;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            {label}
          </p>
          <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            {value}
          </h3>
          {subtext && (
            <p className="text-xs text-slate-400 mt-2 font-medium">{subtext}</p>
          )}
        </div>
        <div
          className={`p-3 rounded-xl ${theme} transition-transform group-hover:scale-110`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
      {/* Background Decorativo Sutil */}
      <div
        className={`absolute -bottom-6 -right-6 opacity-5 pointer-events-none transform rotate-12 group-hover:scale-125 transition-transform duration-500`}
      >
        <Icon className={`h-32 w-32 ${theme.split(" ")[1]}`} />
      </div>
    </div>
  );
};

export const InventoryStats = memo(({ inventory, materials }) => {
  const stats = useMemo(() => {
    let totalQuantity = 0;
    let totalValue = 0;
    let potentialRevenue = 0;

    materials.forEach((material) => {
      const item = inventory[material.key] || {};
      // Defensiva: Ignora negativos para soma global
      const qtd = Math.max(0, Number(item.quantidade) || 0);
      const compra = Number(item.precoCompra) || 0;
      const venda = Number(item.precoVenda) || 0;

      totalQuantity += qtd;
      totalValue += qtd * compra;
      potentialRevenue += qtd * venda;
    });

    // Cálculo de margem global ponderada
    const margin =
      totalValue > 0 ? ((potentialRevenue - totalValue) / totalValue) * 100 : 0;

    return { totalQuantity, totalValue, potentialRevenue, margin };
  }, [inventory, materials]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatWidget
        label="Peso Total"
        value={formatWeight(stats.totalQuantity)}
        icon={Package}
        color="blue"
        subtext="Estoque físico atual"
      />
      <StatWidget
        label="Investimento"
        value={formatCurrency(stats.totalValue)}
        icon={DollarSign}
        color="violet"
        subtext="Custo total acumulado"
      />
      <StatWidget
        label="Potencial Venda"
        value={formatCurrency(stats.potentialRevenue)}
        icon={TrendingUp}
        color="emerald"
        subtext="Valor de mercado"
      />
      <StatWidget
        label="Margem Média"
        value={formatPercent(stats.margin)}
        icon={Activity}
        color="amber"
        subtext="Lucratividade estimada"
      />
    </div>
  );
});

InventoryStats.displayName = "InventoryStats";
