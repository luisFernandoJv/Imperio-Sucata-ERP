"use client";

import { memo } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "../../utils/formatters";
import { Card } from "../ui/card";

const THEME = {
  vendas: {
    main: "#10b981",
    gradientStart: "#10b981",
    gradientEnd: "#ecfdf5",
    stroke: "#059669",
  },
  compras: {
    main: "#6366f1",
    gradientStart: "#6366f1",
    gradientEnd: "#eef2ff",
    stroke: "#4f46e5",
  },
  despesas: {
    main: "#f43f5e",
    gradientStart: "#f43f5e",
    gradientEnd: "#fff1f2",
    stroke: "#e11d48",
  },
  neutral: "#94a3b8",
  grid: "#f1f5f9",
  text: "#64748b",
};

const COLORS_PIE = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#f43f5e",
];

const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white/95 backdrop-blur-sm px-4 py-3 rounded-2xl shadow-xl border border-slate-100 text-sm ring-1 ring-black/5">
      <p className="font-black text-slate-900 mb-2 border-b border-slate-50 pb-1">
        Dia {label}
      </p>
      <div className="space-y-1.5">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-slate-500 font-bold text-xs uppercase tracking-tighter">
                {entry.name}:
              </span>
            </div>
            <span className="font-black text-slate-800 font-mono">
              {formatter ? formatter(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const DailyTrendChart = memo(({ data = [], height = 320 }) => {
  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={THEME.vendas.main}
                stopOpacity={0.2}
              />
              <stop
                offset="95%"
                stopColor={THEME.vendas.main}
                stopOpacity={0}
              />
            </linearGradient>
            <linearGradient id="colorCompras" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={THEME.compras.main}
                stopOpacity={0.2}
              />
              <stop
                offset="95%"
                stopColor={THEME.compras.main}
                stopOpacity={0}
              />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke={THEME.grid}
            vertical={false}
          />

          <XAxis
            dataKey="day"
            stroke={THEME.neutral}
            tick={{ fontSize: 10, fontWeight: 700, fill: THEME.text }}
            tickLine={false}
            axisLine={false}
            dy={10}
          />

          <YAxis
            stroke={THEME.neutral}
            tick={{ fontSize: 10, fontWeight: 700, fill: THEME.text }}
            tickFormatter={(value) =>
              `R$${value >= 1000 ? (value / 1000).toFixed(0) + "k" : value}`
            }
            tickLine={false}
            axisLine={false}
          />

          <Tooltip
            content={<CustomTooltip formatter={formatCurrency} />}
            cursor={{ stroke: THEME.grid, strokeWidth: 2 }}
          />

          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{
              paddingBottom: "20px",
              fontSize: "10px",
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
          />

          <Area
            type="monotone"
            dataKey="vendas"
            stroke={THEME.vendas.stroke}
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorVendas)"
            name="Vendas"
            activeDot={{ r: 6, strokeWidth: 0, fill: THEME.vendas.stroke }}
          />
          <Area
            type="monotone"
            dataKey="compras"
            stroke={THEME.compras.stroke}
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorCompras)"
            name="Compras"
            activeDot={{ r: 6, strokeWidth: 0, fill: THEME.compras.stroke }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

DailyTrendChart.displayName = "DailyTrendChart";

export const TopMaterialsChart = memo(({ data = [], height = 300 }) => {
  return (
    <Card className="p-6 shadow-sm border-slate-100 bg-white rounded-3xl">
      <div className="mb-6">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
          Top Materiais
        </h3>
        <p className="text-[10px] text-slate-400 font-bold uppercase">
          Por volume de receita
        </p>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 10, right: 30 }}
        >
          <XAxis type="number" hide />
          <YAxis
            dataKey="material"
            type="category"
            stroke={THEME.text}
            tick={{ fontSize: 10, fontWeight: 800, fill: "#334155" }}
            width={80}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={<CustomTooltip formatter={formatCurrency} />}
            cursor={{ fill: "#f8fafc", radius: 4 }}
          />
          <Bar
            dataKey="revenue"
            fill={THEME.compras.main}
            name="Receita"
            radius={[0, 10, 10, 0]}
            barSize={18}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS_PIE[index % COLORS_PIE.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
});

TopMaterialsChart.displayName = "TopMaterialsChart";

export const PaymentDistributionChart = memo(({ data = [], height = 300 }) => {
  const formattedData = data.map((item) => ({
    ...item,
    name: item.name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
  }));

  return (
    <Card className="p-6 shadow-sm border-slate-100 bg-white rounded-3xl">
      <div className="mb-6">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
          Pagamentos
        </h3>
        <p className="text-[10px] text-slate-400 font-bold uppercase">
          Distribuição por método
        </p>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={formattedData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={8}
            dataKey="value"
            stroke="none"
          >
            {formattedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS_PIE[index % COLORS_PIE.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip formatter={formatCurrency} />} />
          <Legend
            iconType="circle"
            verticalAlign="bottom"
            formatter={(value) => (
              <span className="text-slate-500 font-bold text-[10px] uppercase tracking-tighter ml-1">
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
});

PaymentDistributionChart.displayName = "PaymentDistributionChart";

export const MonthlyComparisonChart = memo(
  ({ currentMonth, previousMonth, height = 350 }) => {
    const data = [
      {
        name: "Vendas",
        Atual: currentMonth.vendas,
        Anterior: previousMonth.vendas,
      },
      {
        name: "Compras",
        Atual: currentMonth.compras,
        Anterior: previousMonth.compras,
      },
      {
        name: "Lucro",
        Atual: currentMonth.lucro,
        Anterior: previousMonth.lucro,
      },
    ];

    return (
      <Card className="p-6 shadow-sm border-slate-100 bg-white rounded-3xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
              Comparativo
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase">
              Mês Atual vs Anterior
            </p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} barGap={12}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={THEME.grid}
              vertical={false}
            />
            <XAxis
              dataKey="name"
              stroke={THEME.neutral}
              tick={{ fontSize: 11, fontWeight: 800, fill: THEME.text }}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke={THEME.neutral}
              tick={{ fontSize: 10, fontWeight: 700, fill: THEME.text }}
              tickFormatter={(value) =>
                `R$${value >= 1000 ? (value / 1000).toFixed(0) + "k" : value}`
              }
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={<CustomTooltip formatter={formatCurrency} />}
              cursor={{ fill: "transparent" }}
            />
            <Bar
              dataKey="Anterior"
              fill="#e2e8f0"
              name="Mês Anterior"
              radius={[6, 6, 6, 6]}
              barSize={24}
            />
            <Bar
              dataKey="Atual"
              fill={THEME.compras.main}
              name="Mês Atual"
              radius={[6, 6, 6, 6]}
              barSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    );
  },
);

MonthlyComparisonChart.displayName = "MonthlyComparisonChart";
