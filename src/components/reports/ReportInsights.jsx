"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  Target,
  Calendar,
  DollarSign,
  Package,
  Zap,
  Award,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";

const InsightCard = ({
  icon: Icon,
  title,
  description,
  type = "info",
  trend,
}) => {
  const typeConfig = {
    success: {
      bg: "from-green-50 to-emerald-50",
      border: "border-green-200",
      iconBg: "bg-green-500",
      textColor: "text-green-800",
    },
    warning: {
      bg: "from-yellow-50 to-amber-50",
      border: "border-yellow-200",
      iconBg: "bg-yellow-500",
      textColor: "text-yellow-800",
    },
    danger: {
      bg: "from-red-50 to-rose-50",
      border: "border-red-200",
      iconBg: "bg-red-500",
      textColor: "text-red-800",
    },
    info: {
      bg: "from-blue-50 to-cyan-50",
      border: "border-blue-200",
      iconBg: "bg-blue-500",
      textColor: "text-blue-800",
    },
  };

  const config = typeConfig[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.3 }}
      className={`bg-gradient-to-br ${config.bg} ${config.border} border-2 rounded-xl p-4 shadow-md hover:shadow-lg transition-all`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`${config.iconBg} p-2 rounded-lg shadow-md flex-shrink-0`}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`font-bold text-sm mb-1 ${config.textColor}`}>
            {title}
          </h4>
          <p className="text-xs text-gray-700 leading-relaxed">{description}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trend > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span
                className={`text-xs font-semibold ${trend > 0 ? "text-green-600" : "text-red-600"}`}
              >
                {Math.abs(trend).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const KPICard = ({ label, value, subtitle, icon: Icon, color = "blue" }) => {
  const colorConfig = {
    blue: "from-blue-500 to-cyan-500",
    green: "from-green-500 to-emerald-500",
    purple: "from-purple-500 to-violet-500",
    orange: "from-orange-500 to-amber-500",
    red: "from-red-500 to-rose-500",
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-md border-2 border-gray-100 hover:shadow-lg transition-all">
      <div className="flex items-center justify-between mb-2">
        <div
          className={`bg-gradient-to-br ${colorConfig[color]} p-2 rounded-lg shadow-md`}
        >
          <Icon className="h-4 w-4 text-white" />
        </div>
        <Badge variant="outline" className="text-xs">
          KPI
        </Badge>
      </div>
      <p className="text-xs text-gray-600 mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
};

const ReportInsights = ({ transactions, stats, dateRange }) => {
  const insights = useMemo(() => {
    if (!transactions || transactions.length === 0 || !stats) return null;

    const vendas = transactions.filter((t) => t.tipo === "venda");
    const compras = transactions.filter((t) => t.tipo === "compra");

    // Análise por material
    const materialStats = {};
    transactions.forEach((t) => {
      if (!t.material) return;
      if (!materialStats[t.material]) {
        materialStats[t.material] = {
          vendas: 0,
          compras: 0,
          lucro: 0,
          quantidade: 0,
          transacoes: 0,
        };
      }
      materialStats[t.material].transacoes++;
      if (t.tipo === "venda") {
        materialStats[t.material].vendas += t.valorTotal || 0;
        materialStats[t.material].quantidade += t.quantidade || 0;
      } else if (t.tipo === "compra") {
        materialStats[t.material].compras += t.valorTotal || 0;
      }
      materialStats[t.material].lucro =
        materialStats[t.material].vendas - materialStats[t.material].compras;
    });

    // Material mais lucrativo
    const mostProfitable = Object.entries(materialStats)
      .map(([material, data]) => ({
        material,
        ...data,
        margem: data.vendas > 0 ? (data.lucro / data.vendas) * 100 : 0,
      }))
      .sort((a, b) => b.lucro - a.lucro)[0];

    // Material com maior margem
    const highestMargin = Object.entries(materialStats)
      .map(([material, data]) => ({
        material,
        ...data,
        margem: data.vendas > 0 ? (data.lucro / data.vendas) * 100 : 0,
      }))
      .filter((m) => m.vendas > 0)
      .sort((a, b) => b.margem - a.margem)[0];

    // Material com menor participação mas alta margem
    const totalVendas = stats.totalSales || 0;
    const opportunities = Object.entries(materialStats)
      .map(([material, data]) => ({
        material,
        ...data,
        margem: data.vendas > 0 ? (data.lucro / data.vendas) * 100 : 0,
        participacao: totalVendas > 0 ? (data.vendas / totalVendas) * 100 : 0,
      }))
      .filter((m) => m.margem > 50 && m.participacao < 10 && m.vendas > 0)
      .sort((a, b) => b.margem - a.margem)[0];

    // Análise por dia da semana
    const dayStats = {};
    transactions.forEach((t) => {
      const day = new Date(t.data).getDay();
      const dayName = [
        "Domingo",
        "Segunda",
        "Terça",
        "Quarta",
        "Quinta",
        "Sexta",
        "Sábado",
      ][day];
      if (!dayStats[dayName]) {
        dayStats[dayName] = { count: 0, valor: 0 };
      }
      dayStats[dayName].count++;
      dayStats[dayName].valor += t.valorTotal || 0;
    });

    const busiestDay = Object.entries(dayStats).sort(
      (a, b) => b[1].count - a[1].count,
    )[0];

    // Análise de custos (comparação com período anterior se possível)
    const avgPurchasePrice = {};
    compras.forEach((t) => {
      if (!t.material || !t.precoUnitario) return;
      if (!avgPurchasePrice[t.material]) {
        avgPurchasePrice[t.material] = { total: 0, count: 0, prices: [] };
      }
      avgPurchasePrice[t.material].total += t.precoUnitario;
      avgPurchasePrice[t.material].count++;
      avgPurchasePrice[t.material].prices.push({
        price: t.precoUnitario,
        date: new Date(t.data),
      });
    });

    // Detectar aumento de custo
    let costIncreaseAlert = null;
    Object.entries(avgPurchasePrice).forEach(([material, data]) => {
      if (data.prices.length >= 3) {
        const sorted = data.prices.sort((a, b) => a.date - b.date);
        const recent =
          sorted.slice(-3).reduce((sum, p) => sum + p.price, 0) / 3;
        const older =
          sorted.slice(0, -3).reduce((sum, p) => sum + p.price, 0) /
          Math.max(1, sorted.length - 3);
        const increase = ((recent - older) / older) * 100;
        if (increase > 10 && !costIncreaseAlert) {
          costIncreaseAlert = { material, increase };
        }
      }
    });

    // KPIs
    const ticketMedio =
      stats.totalTransactions > 0
        ? (stats.totalSales + stats.totalPurchases) / stats.totalTransactions
        : 0;
    const margemLucro =
      stats.totalSales > 0 ? (stats.totalProfit / stats.totalSales) * 100 : 0;
    const roi =
      stats.totalPurchases > 0
        ? (stats.totalProfit / stats.totalPurchases) * 100
        : 0;
    const diasPeriodo =
      Math.ceil((dateRange.to - dateRange.from) / (1000 * 60 * 60 * 24)) || 1;
    const lucroMedioDiario = stats.totalProfit / diasPeriodo;

    return {
      mostProfitable,
      highestMargin,
      opportunities,
      busiestDay,
      costIncreaseAlert,
      kpis: {
        ticketMedio,
        margemLucro,
        roi,
        lucroMedioDiario,
      },
    };
  }, [transactions, stats, dateRange]);

  if (!insights) return null;

  return (
    <div className="space-y-6">
      {/* KPIs Section */}
      <Card className="p-6 bg-gradient-to-br from-white to-slate-50 shadow-xl border-2 border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-br from-purple-500 to-violet-500 p-2 rounded-lg shadow-lg">
            <Target className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900">
            Indicadores de Performance (KPIs)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Ticket Médio"
            value={`R$ ${insights.kpis.ticketMedio.toFixed(2)}`}
            subtitle="Por transação"
            icon={DollarSign}
            color="blue"
          />
          <KPICard
            label="Margem de Lucro"
            value={`${insights.kpis.margemLucro.toFixed(1)}%`}
            subtitle={
              insights.kpis.margemLucro >= 30
                ? "Excelente"
                : insights.kpis.margemLucro >= 15
                  ? "Boa"
                  : "Melhorar"
            }
            icon={Target}
            color={
              insights.kpis.margemLucro >= 30
                ? "green"
                : insights.kpis.margemLucro >= 15
                  ? "orange"
                  : "red"
            }
          />
          <KPICard
            label="ROI"
            value={`${insights.kpis.roi.toFixed(1)}%`}
            subtitle="Retorno sobre investimento"
            icon={TrendingUp}
            color="purple"
          />
          <KPICard
            label="Lucro Médio Diário"
            value={`R$ ${insights.kpis.lucroMedioDiario.toFixed(2)}`}
            subtitle="Por dia no período"
            icon={Calendar}
            color={insights.kpis.lucroMedioDiario >= 0 ? "green" : "red"}
          />
        </div>
      </Card>

      {/* Insights Section */}
      <Card className="p-6 bg-gradient-to-br from-white to-blue-50 shadow-xl border-2 border-blue-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-2 rounded-lg shadow-lg">
            <Lightbulb className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900">
            Insights Inteligentes
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.mostProfitable && (
            <InsightCard
              icon={Award}
              title="Material Mais Lucrativo"
              description={`${insights.mostProfitable.material} gerou R$ ${insights.mostProfitable.lucro.toFixed(2)} de lucro com margem de ${insights.mostProfitable.margem.toFixed(1)}%. Este é seu produto estrela!`}
              type="success"
            />
          )}

          {insights.highestMargin &&
            insights.highestMargin.material !==
              insights.mostProfitable?.material && (
              <InsightCard
                icon={Zap}
                title="Maior Margem de Lucro"
                description={`${insights.highestMargin.material} tem a melhor margem: ${insights.highestMargin.margem.toFixed(1)}%. Considere aumentar o volume deste material.`}
                type="success"
              />
            )}

          {insights.busiestDay && (
            <InsightCard
              icon={Calendar}
              title="Dia Mais Movimentado"
              description={`${insights.busiestDay[0]} foi seu dia mais ativo com ${insights.busiestDay[1].count} transações totalizando R$ ${insights.busiestDay[1].valor.toFixed(2)}.`}
              type="info"
            />
          )}

          {insights.opportunities && (
            <InsightCard
              icon={Target}
              title="Oportunidade de Crescimento"
              description={`${insights.opportunities.material} tem margem de ${insights.opportunities.margem.toFixed(1)}% mas representa apenas ${insights.opportunities.participacao.toFixed(1)}% do faturamento. Potencial de expansão!`}
              type="info"
            />
          )}
        </div>
      </Card>

      {/* Alerts Section */}
      {insights.costIncreaseAlert && (
        <Card className="p-6 bg-gradient-to-br from-yellow-50 to-amber-50 shadow-xl border-2 border-yellow-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-br from-yellow-500 to-amber-500 p-2 rounded-lg shadow-lg">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-yellow-900">
              Alertas Importantes
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <InsightCard
              icon={AlertCircle}
              title="Aumento de Custo Detectado"
              description={`O custo de compra do ${insights.costIncreaseAlert.material} subiu ${insights.costIncreaseAlert.increase.toFixed(1)}% recentemente. Considere revisar preços de venda ou negociar com fornecedores.`}
              type="warning"
              trend={insights.costIncreaseAlert.increase}
            />
          </div>
        </Card>
      )}

      {/* Performance Summary */}
      <Card className="p-6 bg-gradient-to-br from-slate-50 to-gray-100 shadow-xl border-2 border-slate-300">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-gradient-to-br from-slate-600 to-gray-700 p-2 rounded-lg shadow-lg">
            <Package className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900">
            Resumo de Performance
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border-2 border-slate-200">
            <p className="text-sm text-gray-600 mb-2">Status Financeiro</p>
            <div className="flex items-center gap-2">
              {stats.totalProfit >= 0 ? (
                <>
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span className="text-lg font-bold text-green-600">
                    Lucrativo
                  </span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  <span className="text-lg font-bold text-red-600">
                    Prejuízo
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border-2 border-slate-200">
            <p className="text-sm text-gray-600 mb-2">Eficiência Operacional</p>
            <div className="flex items-center gap-2">
              {insights.kpis.margemLucro >= 20 ? (
                <>
                  <Zap className="h-5 w-5 text-green-600" />
                  <span className="text-lg font-bold text-green-600">Alta</span>
                </>
              ) : insights.kpis.margemLucro >= 10 ? (
                <>
                  <Target className="h-5 w-5 text-yellow-600" />
                  <span className="text-lg font-bold text-yellow-600">
                    Média
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-lg font-bold text-red-600">Baixa</span>
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border-2 border-slate-200">
            <p className="text-sm text-gray-600 mb-2">Volume de Negócios</p>
            <div className="flex items-center gap-2">
              {stats.totalTransactions >= 50 ? (
                <>
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span className="text-lg font-bold text-green-600">Alto</span>
                </>
              ) : stats.totalTransactions >= 20 ? (
                <>
                  <Target className="h-5 w-5 text-blue-600" />
                  <span className="text-lg font-bold text-blue-600">Médio</span>
                </>
              ) : (
                <>
                  <Package className="h-5 w-5 text-gray-600" />
                  <span className="text-lg font-bold text-gray-600">Baixo</span>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ReportInsights;
