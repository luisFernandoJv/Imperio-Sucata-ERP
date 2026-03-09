"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  BarChart3,
  Calculator,
  Percent,
  Target,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const StatCard = ({
  icon: Icon,
  title,
  value,
  subtitle,
  color,
  bgColor,
  trend,
}) => (
  <div
    className={`relative p-6 ${bgColor} rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100`}
  >
    <div className="flex items-center justify-between mb-3">
      <Icon className={`h-8 w-8 ${color}`} />
      {trend && (
        <div
          className={`text-xs px-2 py-1 rounded-full ${trend > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
        >
          {trend > 0 ? "+" : ""}
          {trend.toFixed(1)}%
        </div>
      )}
    </div>
    <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
    <p className={`text-2xl font-bold ${color} mb-1`}>{value}</p>
    {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
  </div>
);

const AdvancedMetrics = ({ stats }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
      <div className="flex items-center mb-2">
        <Percent className="h-5 w-5 text-blue-600 mr-2" />
        <span className="font-semibold text-blue-800">Margem de Lucro</span>
      </div>
      <p className="text-2xl font-bold text-blue-600">
        {stats.margemLucro.toFixed(1)}%
      </p>
      <p className="text-xs text-blue-600 mt-1">
        {stats.margemLucro >= 30
          ? "Excelente margem"
          : stats.margemLucro >= 15
            ? "Boa margem"
            : "Margem baixa"}
      </p>
    </div>

    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-100">
      <div className="flex items-center mb-2">
        <Calculator className="h-5 w-5 text-purple-600 mr-2" />
        <span className="font-semibold text-purple-800">Ticket Médio</span>
      </div>
      <p className="text-2xl font-bold text-purple-600">
        {formatCurrency(stats.ticketMedio)}
      </p>
      <p className="text-xs text-purple-600 mt-1">Por transação</p>
    </div>

    <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border border-orange-100">
      <div className="flex items-center mb-2">
        <Target className="h-5 w-5 text-orange-600 mr-2" />
        <span className="font-semibold text-orange-800">ROI</span>
      </div>
      <p className="text-2xl font-bold text-orange-600">
        {stats.roi.toFixed(1)}%
      </p>
      <p className="text-xs text-orange-600 mt-1">Retorno sobre investimento</p>
    </div>
  </div>
);

const InteractiveCharts = ({ transactions, stats }) => {
  // Preparar dados para gráfico de linha (Receita vs Custo vs Lucro ao longo do tempo)
  const timelineData = useMemo(() => {
    const dataByDate = {};

    transactions.forEach((t) => {
      const date = format(new Date(t.data), "dd/MM", { locale: ptBR });

      if (!dataByDate[date]) {
        dataByDate[date] = { date, receita: 0, custo: 0, lucro: 0 };
      }

      if (t.tipo === "venda") {
        dataByDate[date].receita += t.valorTotal || 0;
      } else if (t.tipo === "compra") {
        dataByDate[date].custo += t.valorTotal || 0;
      } else if (t.tipo === "despesa") {
        dataByDate[date].custo += t.valorTotal || 0;
      }
    });

    // Calcular lucro
    Object.values(dataByDate).forEach((day) => {
      day.lucro = day.receita - day.custo;
    });

    return Object.values(dataByDate).sort((a, b) => {
      const [dayA, monthA] = a.date.split("/");
      const [dayB, monthB] = b.date.split("/");
      return Number(monthA) - Number(monthB) || Number(dayA) - Number(dayB);
    });
  }, [transactions]);

  // Dados para gráfico de pizza (Composição da Receita por Material)
  const revenueByMaterial = useMemo(() => {
    const materialRevenue = {};

    transactions
      .filter((t) => t.tipo === "venda")
      .forEach((t) => {
        const material = t.material || "Outros";
        materialRevenue[material] =
          (materialRevenue[material] || 0) + (t.valorTotal || 0);
      });

    return Object.entries(materialRevenue)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 materiais
  }, [transactions]);

  // Dados para gráfico de pizza (Análise de Pagamentos)
  const paymentAnalysis = useMemo(() => {
    const paymentMethods = {};

    transactions.forEach((t) => {
      const method = (t.formaPagamento || "dinheiro").toUpperCase();
      paymentMethods[method] =
        (paymentMethods[method] || 0) + (t.valorTotal || 0);
    });

    return Object.entries(paymentMethods).map(([name, value]) => ({
      name,
      value,
    }));
  }, [transactions]);

  // Dados para gráfico de barras (Top 5 Materiais)
  const topMaterials = useMemo(() => {
    const materialStats = {};

    transactions.forEach((t) => {
      const material = t.material || "Outros";
      if (!materialStats[material]) {
        materialStats[material] = { vendas: 0, compras: 0, lucro: 0 };
      }

      if (t.tipo === "venda") {
        materialStats[material].vendas += t.valorTotal || 0;
      } else if (t.tipo === "compra") {
        materialStats[material].compras += t.valorTotal || 0;
      }
    });

    Object.values(materialStats).forEach((stat) => {
      stat.lucro = stat.vendas - stat.compras;
    });

    return Object.entries(materialStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.lucro - a.lucro)
      .slice(0, 5);
  }, [transactions]);

  // Dados para gráfico de barras (Top 5 Clientes)
  const topClients = useMemo(() => {
    const clientStats = {};

    transactions
      .filter((t) => t.tipo === "venda")
      .forEach((t) => {
        const client = t.cliente || t.vendedor || "Cliente Desconhecido";
        clientStats[client] = (clientStats[client] || 0) + (t.valorTotal || 0);
      });

    return Object.entries(clientStats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [transactions]);

  const COLORS = [
    "#10b981",
    "#3b82f6",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
  ];

  return (
    <div className="space-y-6 mt-6">
      {/* Gráfico de Linha: Receita vs Custo vs Lucro */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
          Evolução Financeira
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip
              formatter={(value) => `R$ ${value.toFixed(2)}`}
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e2e8f0",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="receita"
              stroke="#10b981"
              strokeWidth={2}
              name="Receita"
            />
            <Line
              type="monotone"
              dataKey="custo"
              stroke="#ef4444"
              strokeWidth={2}
              name="Custo"
            />
            <Line
              type="monotone"
              dataKey="lucro"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Lucro"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Pizza: Composição da Receita */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
            Receita por Material (Top 5)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={revenueByMaterial}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {revenueByMaterial.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Gráfico de Pizza: Análise de Pagamentos */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-purple-600" />
            Formas de Pagamento
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={paymentAnalysis}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {paymentAnalysis.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Barras: Top 5 Materiais */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-orange-600" />
            Top 5 Materiais (Lucro)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topMaterials}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value) => `R$ ${value.toFixed(2)}`}
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                }}
              />
              <Legend />
              <Bar dataKey="vendas" fill="#10b981" name="Vendas" />
              <Bar dataKey="compras" fill="#ef4444" name="Compras" />
              <Bar dataKey="lucro" fill="#3b82f6" name="Lucro" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Gráfico de Barras: Top 5 Clientes */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2 text-blue-600" />
            Top 5 Clientes (Receita)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topClients}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value) => `R$ ${value.toFixed(2)}`}
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                }}
              />
              <Bar dataKey="value" fill="#3b82f6" name="Receita Total" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};

const ReportSummary = ({ transactions }) => {
  const stats = useMemo(() => {
    const vendas = transactions.filter((t) => t.tipo === "venda");
    const compras = transactions.filter((t) => t.tipo === "compra");
    const despesas = transactions.filter((t) => t.tipo === "despesa");

    const totalVendas = vendas.reduce((sum, t) => sum + t.valorTotal, 0);
    const totalCompras = compras.reduce((sum, t) => sum + t.valorTotal, 0);
    const totalDespesas = despesas.reduce((sum, t) => sum + t.valorTotal, 0);

    const lucroTotal = totalVendas - totalDespesas;
    const margemLucro = totalVendas > 0 ? (lucroTotal / totalVendas) * 100 : 0;
    const ticketMedio =
      transactions.length > 0
        ? (totalVendas + totalCompras) / transactions.length
        : 0;
    const roi = totalCompras > 0 ? (lucroTotal / totalCompras) * 100 : 0;

    return {
      totalVendas,
      totalCompras,
      totalDespesas,
      lucroTotal,
      margemLucro,
      ticketMedio,
      roi,
      totalTransacoes: transactions.length,
      totalVendasCount: vendas.length,
      totalComprasCount: compras.length,
      totalDespesasCount: despesas.length,
    };
  }, [transactions]);

  return (
    <div className="space-y-6">
      <Card className="p-6 shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="h-7 w-7 mr-3 text-green-600" />
            Dashboard Executivo
          </h2>
          <div className="text-sm text-gray-500">
            Período analisado: {transactions.length} transações
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard
            icon={TrendingUp}
            title="Receita Total"
            value={formatCurrency(stats.totalVendas)}
            subtitle={`${stats.totalVendasCount} vendas realizadas`}
            color="text-green-600"
            bgColor="bg-green-50"
          />
          <StatCard
            icon={TrendingDown}
            title="Investimento"
            value={formatCurrency(stats.totalCompras)}
            subtitle={`${stats.totalComprasCount} compras realizadas`}
            color="text-blue-600"
            bgColor="bg-blue-50"
          />
          <StatCard
            icon={FileText}
            title="Despesas"
            value={formatCurrency(stats.totalDespesas)}
            subtitle={`${stats.totalDespesasCount} despesas registradas`}
            color="text-red-600"
            bgColor="bg-red-50"
          />
          <StatCard
            icon={DollarSign}
            title="Lucro Líquido"
            value={formatCurrency(stats.lucroTotal)}
            subtitle={
              stats.lucroTotal >= 0
                ? "Resultado positivo"
                : "Resultado negativo"
            }
            color={stats.lucroTotal >= 0 ? "text-green-600" : "text-red-600"}
            bgColor={stats.lucroTotal >= 0 ? "bg-green-50" : "bg-red-50"}
          />
        </div>

        <AdvancedMetrics stats={stats} />

        <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
            <Target className="h-5 w-5 mr-2 text-blue-600" />
            Indicadores de Performance
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Status Financeiro:</span>
              <span
                className={`font-semibold ${stats.lucroTotal >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {stats.lucroTotal >= 0 ? "Lucrativo" : "Prejuízo"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Eficiência:</span>
              <span
                className={`font-semibold ${stats.margemLucro >= 20 ? "text-green-600" : stats.margemLucro >= 10 ? "text-yellow-600" : "text-red-600"}`}
              >
                {stats.margemLucro >= 20
                  ? "Alta"
                  : stats.margemLucro >= 10
                    ? "Média"
                    : "Baixa"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Volume de Negócios:</span>
              <span
                className={`font-semibold ${stats.totalTransacoes >= 50 ? "text-green-600" : stats.totalTransacoes >= 20 ? "text-yellow-600" : "text-blue-600"}`}
              >
                {stats.totalTransacoes >= 50
                  ? "Alto"
                  : stats.totalTransacoes >= 20
                    ? "Médio"
                    : "Baixo"}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <InteractiveCharts transactions={transactions} stats={stats} />
    </div>
  );
};

export default ReportSummary;
