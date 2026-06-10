import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Info,
} from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/reportUtils";

// ── KPI tile limpo ────────────────────────────────────────────────────────────
const Tile = ({
  icon: Icon,
  label,
  value,
  sub,
  helpText,
  colorClass,
  bgClass,
  borderColor,
}) => (
  <div className="relative bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
    <div className={`absolute top-0 left-0 right-0 h-1 ${borderColor}`} />
    <div className="p-5 pt-6">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgClass} mb-4`}
      >
        <Icon className={`w-5 h-5 ${colorClass}`} />
      </div>
      <p className="text-xs text-slate-400 uppercase tracking-widest font-medium mb-1">
        {label}
      </p>
      <p className={`text-2xl font-bold leading-none ${colorClass}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-2">{sub}</p>}
      {helpText && (
        <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 leading-relaxed">
          {helpText}
        </p>
      )}
    </div>
  </div>
);

// ── Linha de comparação de dia ────────────────────────────────────────────────
const DayRow = ({ day }) => {
  const isPositive = day.lucro >= 0;
  const pct = day.vendas > 0 ? Math.round((day.lucro / day.vendas) * 100) : 0;
  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3 text-sm font-medium text-slate-700 whitespace-nowrap">
        {formatDate(day.date)}
      </td>
      <td className="px-4 py-3 text-right text-sm font-semibold text-emerald-700">
        {formatCurrency(day.vendas)}
      </td>
      <td className="px-4 py-3 text-right text-sm text-blue-600">
        {formatCurrency(day.compras)}
      </td>
      <td className="px-4 py-3 text-right text-sm text-rose-600">
        {formatCurrency(day.despesas)}
      </td>
      <td className="px-4 py-3 text-right">
        <span
          className={`text-sm font-bold ${isPositive ? "text-emerald-700" : "text-red-700"}`}
        >
          {formatCurrency(day.lucro)}
        </span>
        <span
          className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${isPositive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
        >
          {pct}%
        </span>
      </td>
    </tr>
  );
};

export default function FinancialSummary({ summaryData, period }) {
  const { totalVendas, totalCompras, totalDespesas, totalLucro, dailyData } =
    summaryData;

  const lucroReal = totalVendas - totalDespesas;
  const isProfitable = totalLucro >= 0;
  const isRealPos = lucroReal >= 0;
  const margemPct =
    totalVendas > 0 ? ((totalLucro / totalVendas) * 100).toFixed(1) : "0.0";

  // Apenas dias com movimentação relevante, mais recentes primeiro
  const activeDays = [...dailyData]
    .filter((d) => d.vendas > 0 || d.compras > 0 || d.despesas > 0)
    .reverse()
    .slice(0, 15);

  return (
    <div className="space-y-6">
      {/* ── 4 KPI tiles ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Tile
          icon={TrendingUp}
          label="Receita de vendas"
          value={formatCurrency(totalVendas)}
          sub="Total de vendas no período"
          helpText="Dinheiro que entrou pelas vendas"
          colorClass="text-emerald-700"
          bgClass="bg-emerald-50"
          borderColor="bg-emerald-500"
        />
        <Tile
          icon={ShoppingCart}
          label="Custo de compras"
          value={formatCurrency(totalCompras)}
          sub="Total de compras de material"
          helpText="Material comprado para revenda"
          colorClass="text-blue-700"
          bgClass="bg-blue-50"
          borderColor="bg-blue-500"
        />
        <Tile
          icon={Receipt}
          label="Despesas"
          value={formatCurrency(totalDespesas)}
          sub="Gastos operacionais"
          helpText="Custos fixos e variáveis do período"
          colorClass="text-rose-700"
          bgClass="bg-rose-50"
          borderColor="bg-rose-500"
        />
        <Tile
          icon={isProfitable ? TrendingUp : TrendingDown}
          label={isProfitable ? "Lucro líquido" : "Prejuízo"}
          value={formatCurrency(totalLucro)}
          sub={`Margem: ${margemPct}%`}
          helpText="Resultado final descontando despesas"
          colorClass={isProfitable ? "text-emerald-700" : "text-red-700"}
          bgClass={isProfitable ? "bg-emerald-50" : "bg-red-50"}
          borderColor={isProfitable ? "bg-emerald-500" : "bg-red-500"}
        />
      </div>

      {/* ── Destaque resultado real ── */}
      <div
        className={`rounded-2xl border-2 p-6 ${isRealPos ? "border-blue-200 bg-blue-50/40" : "border-red-200 bg-red-50/40"}`}
      >
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
          Resultado operacional · {period}
        </p>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p
              className={`text-5xl font-black leading-none ${isRealPos ? "text-blue-700" : "text-red-700"}`}
            >
              {formatCurrency(lucroReal)}
            </p>
            <p className="text-sm text-slate-500 mt-2 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              Caixa real: Vendas − Despesas (sem custo de reposição de estoque)
            </p>
          </div>
          <div className="flex gap-6 shrink-0 text-sm">
            <div>
              <p className="text-slate-400 mb-1 text-xs">Vendas</p>
              <p className="font-bold text-emerald-700 text-lg">
                {formatCurrency(totalVendas)}
              </p>
            </div>
            <div className="text-slate-300 text-xl font-light self-end pb-0.5">
              −
            </div>
            <div>
              <p className="text-slate-400 mb-1 text-xs">Despesas</p>
              <p className="font-bold text-rose-700 text-lg">
                {formatCurrency(totalDespesas)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabela de movimentação diária (sem gráfico) ── */}
      {activeDays.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-900 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">
              Movimentação diária
            </h3>
            <span className="text-slate-400 text-xs">
              {activeDays.length} dias com movimento
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {["Data", "Vendas", "Compras", "Despesas", "Resultado"].map(
                    (h, i) => (
                      <th
                        key={h}
                        className={`px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-widest ${i === 0 ? "text-left" : "text-right"}`}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeDays.map((day) => (
                  <DayRow key={String(day.date)} day={day} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
