"use client"

import { memo } from "react"
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
} from "recharts"
import { formatCurrency } from "../../utils/formatters"
import { Card } from "../ui/card"

// Paleta de Cores Moderna (Tokens de Design)
const THEME = {
  vendas: {
    main: "#10b981", // Emerald 500
    gradientStart: "#10b981",
    gradientEnd: "#ecfdf5", // Emerald 50
    stroke: "#059669", // Emerald 600
  },
  compras: {
    main: "#6366f1", // Indigo 500
    gradientStart: "#6366f1",
    gradientEnd: "#eef2ff", // Indigo 50
    stroke: "#4f46e5", // Indigo 600
  },
  despesas: {
    main: "#f43f5e", // Rose 500
    gradientStart: "#f43f5e",
    gradientEnd: "#fff1f2", // Rose 50
    stroke: "#e11d48", // Rose 600
  },
  neutral: "#94a3b8", // Slate 400
  grid: "#f1f5f9",    // Slate 100
  text: "#64748b",    // Slate 500
}

const COLORS_PIE = ["#6366f1", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4"]

// Tooltip com efeito Glassmorphism (Vidro)
const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="bg-white/90 backdrop-blur-md px-4 py-3 rounded-xl shadow-2xl border border-white/20 ring-1 ring-black/5 text-sm">
      <p className="font-bold text-slate-800 mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-3 py-1">
          <div 
            className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.2)]" 
            style={{ backgroundColor: entry.color }} 
          />
          <span className="text-slate-500 font-medium">{entry.name}:</span>
          <span className="font-bold text-slate-700 font-mono">
            {formatter ? formatter(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export const DailyTrendChart = memo(({ data, height = 300 }) => {
  return (
    <Card className="p-6 shadow-sm hover:shadow-md transition-shadow duration-300 border-slate-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Fluxo de Caixa Diário</h3>
          <p className="text-xs text-slate-400">Entradas e saídas nos últimos dias</p>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            {/* Gradientes Suaves */}
            <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={THEME.vendas.main} stopOpacity={0.3} />
              <stop offset="95%" stopColor={THEME.vendas.main} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorCompras" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={THEME.compras.main} stopOpacity={0.3} />
              <stop offset="95%" stopColor={THEME.compras.main} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={THEME.despesas.main} stopOpacity={0.3} />
              <stop offset="95%" stopColor={THEME.despesas.main} stopOpacity={0} />
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} vertical={false} />
          
          <XAxis
            dataKey="day"
            stroke={THEME.neutral}
            tick={{ fontSize: 11, fill: THEME.text }}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          
          <YAxis 
            stroke={THEME.neutral} 
            tick={{ fontSize: 11, fill: THEME.text }} 
            tickFormatter={(value) => `R$${value/1000}k`} 
            tickLine={false}
            axisLine={false}
          />
          
          <Tooltip content={<CustomTooltip formatter={formatCurrency} />} cursor={{ stroke: THEME.grid, strokeWidth: 2 }} />
          
          <Legend 
            iconType="circle" 
            wrapperStyle={{ paddingTop: "20px", fontSize: "12px", fontFamily: "inherit" }} 
            formatter={(value) => <span className="text-slate-600 font-medium ml-1">{value}</span>}
          />

          {/* Curvas Monotone (Suaves) em vez de lineares */}
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
          <Area
            type="monotone"
            dataKey="despesas"
            stroke={THEME.despesas.stroke}
            strokeWidth={2}
            strokeDasharray="5 5"
            fillOpacity={1}
            fill="url(#colorDespesas)"
            name="Despesas"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  )
})

DailyTrendChart.displayName = "DailyTrendChart"

export const TopMaterialsChart = memo(({ data, height = 300 }) => {
  return (
    <Card className="p-6 shadow-sm hover:shadow-md transition-shadow duration-300 border-slate-100">
      <h3 className="text-lg font-bold text-slate-800 mb-6">Top Materiais (Receita)</h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} horizontal={false} />
          
          <XAxis
            type="number"
            stroke={THEME.neutral}
            tick={{ fontSize: 11, fill: THEME.text }}
            tickFormatter={(value) => `R$${value/1000}k`}
            tickLine={false}
            axisLine={false}
          />
          
          <YAxis 
            dataKey="material" 
            type="category" 
            stroke={THEME.text} 
            tick={{ fontSize: 12, fontWeight: 600, fill: "#334155" }} 
            width={90} 
            tickLine={false}
            axisLine={false}
          />
          
          <Tooltip content={<CustomTooltip formatter={formatCurrency} />} cursor={{fill: '#f8fafc'}} />
          
          {/* Barras com gradiente e bordas arredondadas */}
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={THEME.vendas.main} />
              <stop offset="100%" stopColor={THEME.vendas.stroke} />
            </linearGradient>
          </defs>
          
          <Bar 
            dataKey="revenue" 
            fill="url(#barGradient)" 
            name="Receita" 
            radius={[0, 6, 6, 0]} 
            barSize={20}
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
})

TopMaterialsChart.displayName = "TopMaterialsChart"

export const PaymentDistributionChart = memo(({ data, height = 300 }) => {
  const formattedData = data.map((item) => ({
    ...item,
    name: item.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
  }))

  return (
    <Card className="p-6 shadow-sm hover:shadow-md transition-shadow duration-300 border-slate-100">
      <h3 className="text-lg font-bold text-slate-800 mb-6">Formas de Pagamento</h3>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={formattedData}
            cx="50%"
            cy="50%"
            innerRadius={60} // Donut Chart (Moderno)
            outerRadius={85}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {formattedData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS_PIE[index % COLORS_PIE.length]} 
                style={{ filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.1))" }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip formatter={formatCurrency} />} />
          <Legend 
            iconType="circle" 
            verticalAlign="bottom" 
            height={36}
            formatter={(value) => <span className="text-slate-600 font-medium text-xs ml-1">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  )
})

PaymentDistributionChart.displayName = "PaymentDistributionChart"

export const MonthlyComparisonChart = memo(({ currentMonth, previousMonth, height = 300 }) => {
  const data = [
    { name: "Vendas", "Atual": currentMonth.vendas, "Anterior": previousMonth.vendas },
    { name: "Compras", "Atual": currentMonth.compras, "Anterior": previousMonth.compras },
    { name: "Lucro", "Atual": currentMonth.lucro, "Anterior": previousMonth.lucro },
  ]

  return (
    <Card className="p-6 shadow-sm hover:shadow-md transition-shadow duration-300 border-slate-100">
      <div className="flex justify-between items-center mb-6">
         <h3 className="text-lg font-bold text-slate-800">Comparativo Mensal</h3>
         <div className="flex gap-2">
            <span className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
               <div className="w-2 h-2 rounded-full bg-slate-300"></div> Mês Anterior
            </span>
            <span className="flex items-center gap-1 text-[10px] text-slate-600 bg-indigo-50 px-2 py-1 rounded-full">
               <div className="w-2 h-2 rounded-full bg-indigo-500"></div> Mês Atual
            </span>
         </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} barGap={8}>
          <CartesianGrid strokeDasharray="3 3" stroke={THEME.grid} vertical={false} />
          
          <XAxis 
            dataKey="name" 
            stroke={THEME.neutral} 
            tick={{ fontSize: 12, fill: THEME.text }} 
            tickLine={false} 
            axisLine={false} 
            dy={5}
          />
          
          <YAxis 
            stroke={THEME.neutral} 
            tick={{ fontSize: 11, fill: THEME.text }} 
            tickFormatter={(value) => `R$${value/1000}k`} 
            tickLine={false} 
            axisLine={false} 
          />
          
          <Tooltip content={<CustomTooltip formatter={formatCurrency} />} cursor={{fill: 'transparent'}} />
          
          {/* Barra Mês Atual */}
          <Bar 
            dataKey="Atual" 
            fill={THEME.compras.main} 
            name="Mês Atual"
            radius={[6, 6, 6, 6]} 
            barSize={32}
            animationDuration={1500}
          />
          
          {/* Barra Mês Anterior (Cor neutra para não competir) */}
          <Bar 
            dataKey="Anterior" 
            fill="#cbd5e1" 
            name="Mês Anterior"
            radius={[6, 6, 6, 6]} 
            barSize={32}
            animationDuration={1500}
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
})

MonthlyComparisonChart.displayName = "MonthlyComparisonChart"