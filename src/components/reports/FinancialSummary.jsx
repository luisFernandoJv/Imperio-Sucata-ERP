import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Receipt,
  Activity,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency, formatDate } from "../../utils/reportUtils";

export default function FinancialSummary({ summaryData, period }) {
  const { totalVendas, totalCompras, totalDespesas, totalLucro, dailyData } =
    summaryData;

  // Lucro Real solicitado: VENDA - DESPESAS
  const lucroReal = totalVendas - totalDespesas;
  const isLucroRealPositivo = lucroReal >= 0;

  const profitMargin =
    totalVendas > 0 ? ((totalLucro / totalVendas) * 100).toFixed(2) : 0;
  const isProfitable = totalLucro >= 0;

  // Prepare chart data
  const chartData = dailyData.map((day) => ({
    data: formatDate(day.date),
    Vendas: day.vendas,
    Compras: day.compras,
    Lucro: day.lucro,
  }));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Receita de Vendas
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalVendas)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total de vendas no período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Custo de Compras
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(totalCompras)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total de compras no período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <Receipt className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalDespesas)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Despesas operacionais
            </p>
          </CardContent>
        </Card>

        <Card
          className={
            isProfitable
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isProfitable ? "Lucro Líquido" : "Prejuízo Líquido"}
            </CardTitle>
            {isProfitable ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${isProfitable ? "text-green-600" : "text-red-600"}`}
            >
              {formatCurrency(totalLucro)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              (Vendas - Compras - Despesas)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Seção de Lucro Real (Venda - Despesas) */}
      <Card
        className={`border-2 ${isLucroRealPositivo ? "border-blue-200 bg-blue-50" : "border-red-200 bg-red-50"}`}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Análise de Lucro Real (Vendas - Despesas)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500">
                Total de Vendas
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {formatCurrency(totalVendas)}
              </p>
            </div>
            <div className="text-xl font-bold text-slate-400 flex justify-center">
              <span className="bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                -
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500">
                Total de Despesas
              </p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(totalDespesas)}
              </p>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                Resultado Operacional (Lucro Real)
              </p>
              <p
                className={`text-4xl font-black ${isLucroRealPositivo ? "text-blue-600" : "text-red-600"}`}
              >
                {formatCurrency(lucroReal)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm max-w-md">
              <p className="text-xs text-slate-500 leading-relaxed">
                Este cálculo representa o <strong>Lucro Real</strong>{" "}
                operacional, subtraindo apenas as despesas fixas e variáveis do
                total de vendas, sem considerar o custo de aquisição de estoque
                (compras).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Análise Financeira - {period}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="data" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="Vendas" fill="#16a34a" />
              <Bar dataKey="Compras" fill="#ea580c" />
              <Bar dataKey="Lucro" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
