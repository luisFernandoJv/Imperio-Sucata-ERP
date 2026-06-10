"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Package,
  Target,
  Award,
  Warehouse,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const MaterialsReport = ({ transactions }) => {
  const [sortBy, setSortBy] = useState("lucro");
  const [sortDirection, setSortDirection] = useState("desc");

  const materialStats = useMemo(() => {
    const stats = {};

    transactions.forEach((t) => {
      if (t.tipo === "despesa") return;
      if (!t.material) return;

      const valor = Number(t.valorTotal) || 0;
      const qtd = Number(t.quantidade) || 0;

      if (!stats[t.material]) {
        stats[t.material] = {
          vendas: 0,
          compras: 0,
          quantidadeVendida: 0,
          quantidadeComprada: 0,
          transacoesVenda: 0,
          transacoesCompra: 0,
          precoMedioVenda: 0,
          precoMedioCompra: 0,
        };
      }

      if (t.tipo === "venda") {
        // Venda = saída do estoque
        stats[t.material].vendas += valor;
        stats[t.material].quantidadeVendida += qtd;
        stats[t.material].transacoesVenda++;
      } else if (t.tipo === "compra") {
        // Compra = entrada no estoque
        stats[t.material].compras += valor;
        stats[t.material].quantidadeComprada += qtd;
        stats[t.material].transacoesCompra++;
      }
    });

    Object.keys(stats).forEach((material) => {
      const data = stats[material];

      // Estoque atual = quantidade comprada (entrou) - quantidade vendida (saiu)
      data.estoqueAtual = data.quantidadeComprada - data.quantidadeVendida;

      // Lucro do período = receita de vendas − custo das compras no período (fluxo de caixa)
      data.lucro = data.vendas - data.compras;

      // Margem = lucro / vendas × 100
      data.margem = data.vendas > 0 ? (data.lucro / data.vendas) * 100 : 0;

      data.precoMedioVenda =
        data.quantidadeVendida > 0 ? data.vendas / data.quantidadeVendida : 0;
      data.precoMedioCompra =
        data.quantidadeComprada > 0
          ? data.compras / data.quantidadeComprada
          : 0;

      // Giro = total de kg movimentados
      data.giro = data.quantidadeVendida + data.quantidadeComprada;

      // ROI = lucro / custo de compras × 100
      data.roi = data.compras > 0 ? (data.lucro / data.compras) * 100 : 0;

      // Valor estimado do estoque em mãos (pelo preço médio de compra)
      data.valorEstoque =
        data.estoqueAtual > 0 ? data.estoqueAtual * data.precoMedioCompra : 0;
    });

    return stats;
  }, [transactions]);

  const sortedMaterials = useMemo(() => {
    return Object.entries(materialStats).sort((a, b) => {
      const aValue = a[1][sortBy];
      const bValue = b[1][sortBy];
      return sortDirection === "desc" ? bValue - aValue : aValue - bValue;
    });
  }, [materialStats, sortBy, sortDirection]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === "desc" ? "asc" : "desc");
    } else {
      setSortBy(field);
      setSortDirection("desc");
    }
  };

  const overallStats = useMemo(() => {
    const materials = Object.values(materialStats);
    const totalVendas = materials.reduce((sum, m) => sum + m.vendas, 0);
    const totalCompras = materials.reduce((sum, m) => sum + m.compras, 0);
    const totalLucro = totalVendas - totalCompras;
    const totalEstoque = materials.reduce(
      (sum, m) => sum + Math.max(0, m.estoqueAtual),
      0,
    );
    const totalValorEstoque = materials.reduce(
      (sum, m) => sum + m.valorEstoque,
      0,
    );

    return {
      totalMateriais: materials.length,
      totalVendas,
      totalCompras,
      totalLucro,
      totalEstoque,
      totalValorEstoque,
      margemGeral: totalVendas > 0 ? (totalLucro / totalVendas) * 100 : 0,
      materialMaisLucrativo:
        materials.length > 0
          ? Object.entries(materialStats).reduce(
              (max, [name, data]) =>
                data.lucro > max.lucro ? { name, ...data } : max,
              { name: "", lucro: Number.NEGATIVE_INFINITY },
            )
          : null,
    };
  }, [materialStats]);

  return (
    <Card className="p-6 shadow-lg border-0 bg-white">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center mb-4 lg:mb-0">
          <BarChart3 className="h-6 w-6 mr-2 text-purple-600" />
          🏭 Análise Detalhada por Material
        </h3>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={sortBy === "lucro" ? "default" : "outline"}
            size="sm"
            onClick={() => handleSort("lucro")}
            className="text-xs"
          >
            💰 Por Lucro
          </Button>
          <Button
            variant={sortBy === "vendas" ? "default" : "outline"}
            size="sm"
            onClick={() => handleSort("vendas")}
            className="text-xs"
          >
            📈 Por Vendas
          </Button>
          <Button
            variant={sortBy === "margem" ? "default" : "outline"}
            size="sm"
            onClick={() => handleSort("margem")}
            className="text-xs"
          >
            📊 Por Margem
          </Button>
          <Button
            variant={sortBy === "giro" ? "default" : "outline"}
            size="sm"
            onClick={() => handleSort("giro")}
            className="text-xs"
          >
            🔄 Por Giro
          </Button>
          <Button
            variant={sortBy === "estoqueAtual" ? "default" : "outline"}
            size="sm"
            onClick={() => handleSort("estoqueAtual")}
            className="text-xs"
          >
            📦 Por Estoque
          </Button>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
        <div className="text-center">
          <Package className="h-5 w-5 text-purple-600 mx-auto mb-1" />
          <p className="text-xs text-gray-600">Materiais</p>
          <p className="text-lg font-bold text-purple-600">
            {overallStats.totalMateriais}
          </p>
        </div>
        <div className="text-center">
          <TrendingUp className="h-5 w-5 text-green-600 mx-auto mb-1" />
          <p className="text-xs text-gray-600">Total Vendas</p>
          <p className="text-sm font-bold text-green-600">
            {formatCurrency(overallStats.totalVendas)}
          </p>
        </div>
        <div className="text-center">
          <TrendingDown className="h-5 w-5 text-blue-600 mx-auto mb-1" />
          <p className="text-xs text-gray-600">Total Compras</p>
          <p className="text-sm font-bold text-blue-600">
            {formatCurrency(overallStats.totalCompras)}
          </p>
        </div>
        <div className="text-center">
          <Target className="h-5 w-5 text-indigo-600 mx-auto mb-1" />
          <p className="text-xs text-gray-600">Margem Geral</p>
          <p className="text-lg font-bold text-indigo-600">
            {overallStats.margemGeral.toFixed(1)}%
          </p>
        </div>
        <div className="text-center">
          <Warehouse className="h-5 w-5 text-amber-600 mx-auto mb-1" />
          <p className="text-xs text-gray-600">Em Estoque</p>
          <p className="text-lg font-bold text-amber-600">
            {overallStats.totalEstoque.toFixed(2)} kg
          </p>
        </div>
        <div className="text-center">
          <Award className="h-5 w-5 text-yellow-600 mx-auto mb-1" />
          <p className="text-xs text-gray-600">Lucro Período</p>
          <p
            className={`text-sm font-bold ${overallStats.totalLucro >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {formatCurrency(overallStats.totalLucro)}
          </p>
        </div>
      </div>

      {/* Info note */}
      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
        <strong>📦 Estoque em kg</strong> = Kg Comprados − Kg Vendidos no
        período. Valores negativos indicam que foram vendidos mais do que
        comprado no período (estoque consumido de períodos anteriores).
      </div>

      {sortedMaterials.length === 0 ? (
        <div className="text-center py-12">
          <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-lg text-gray-500 mb-2">
            Nenhum material encontrado
          </p>
          <p className="text-sm text-gray-400">
            Adicione transações de compra e venda para visualizar a análise
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedMaterials.map(([material, data]) => (
            <div
              key={material}
              className="p-6 border-2 rounded-xl bg-gradient-to-br from-white to-gray-50 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-gray-900 capitalize flex items-center">
                  🏭 {material}
                </h4>
                <div className="flex items-center gap-2">
                  {data.margem >= 30 && (
                    <span className="text-green-500 text-xl">🚀</span>
                  )}
                  {data.margem >= 15 && data.margem < 30 && (
                    <span className="text-yellow-500 text-xl">⚡</span>
                  )}
                  {data.margem < 15 && data.margem >= 0 && (
                    <span className="text-orange-500 text-xl">⚠️</span>
                  )}
                  {data.margem < 0 && (
                    <span className="text-red-500 text-xl">🔻</span>
                  )}
                </div>
              </div>

              {/* Estoque em destaque */}
              <div
                className={`text-center p-3 rounded-lg border mb-4 ${
                  data.estoqueAtual > 0
                    ? "bg-amber-50 border-amber-200"
                    : data.estoqueAtual < 0
                      ? "bg-red-50 border-red-200"
                      : "bg-gray-50 border-gray-200"
                }`}
              >
                <Warehouse
                  className={`h-5 w-5 mx-auto mb-1 ${
                    data.estoqueAtual > 0
                      ? "text-amber-600"
                      : data.estoqueAtual < 0
                        ? "text-red-600"
                        : "text-gray-500"
                  }`}
                />
                <p className="text-xs font-medium text-gray-600">
                  📦 Estoque do Período
                </p>
                <p
                  className={`text-xl font-bold ${
                    data.estoqueAtual > 0
                      ? "text-amber-600"
                      : data.estoqueAtual < 0
                        ? "text-red-600"
                        : "text-gray-500"
                  }`}
                >
                  {data.estoqueAtual.toFixed(2)} kg
                </p>
                {data.estoqueAtual > 0 && (
                  <p className="text-xs text-amber-700">
                    ≈ {formatCurrency(data.valorEstoque)} em estoque
                  </p>
                )}
                {data.estoqueAtual < 0 && (
                  <p className="text-xs text-red-600">
                    Consumiu estoque anterior
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center p-3 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-xs text-green-700 font-medium">💰 Lucro</p>
                  <p
                    className={`text-lg font-bold ${data.lucro >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {formatCurrency(data.lucro)}
                  </p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs text-blue-700 font-medium">📊 Margem</p>
                  <p
                    className={`text-lg font-bold ${data.margem >= 0 ? "text-blue-600" : "text-red-600"}`}
                  >
                    {data.margem.toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center p-2 rounded bg-green-50">
                  <span className="text-gray-600 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
                    Vendas (R$):
                  </span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(data.vendas)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-2 rounded bg-blue-50">
                  <span className="text-gray-600 flex items-center">
                    <TrendingDown className="h-4 w-4 mr-1 text-blue-600" />
                    Compras (R$):
                  </span>
                  <span className="font-semibold text-blue-600">
                    {formatCurrency(data.compras)}
                  </span>
                </div>

                <div className="pt-3 border-t border-gray-200 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">
                      📤 Kg Vendidos (saída):
                    </span>
                    <span className="font-medium text-green-700">
                      {data.quantidadeVendida.toFixed(2)} kg
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">
                      📥 Kg Comprados (entrada):
                    </span>
                    <span className="font-medium text-blue-700">
                      {data.quantidadeComprada.toFixed(2)} kg
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold border-t border-gray-100 pt-1 mt-1">
                    <span className="text-gray-600">📦 Saldo Estoque:</span>
                    <span
                      className={
                        data.estoqueAtual >= 0
                          ? "text-amber-600"
                          : "text-red-600"
                      }
                    >
                      {data.estoqueAtual.toFixed(2)} kg
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">💵 Preço Médio Venda:</span>
                    <span className="font-medium">
                      {formatCurrency(data.precoMedioVenda)}/kg
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">
                      💵 Preço Médio Compra:
                    </span>
                    <span className="font-medium">
                      {formatCurrency(data.precoMedioCompra)}/kg
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-gray-500">🎯 ROI:</span>
                    <span
                      className={`font-semibold ${data.roi >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {data.roi.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">📊 Transações:</span>
                    <span className="font-medium">
                      {data.transacoesVenda + data.transacoesCompra}
                      <span className="text-gray-400 ml-1">
                        ({data.transacoesVenda}V/{data.transacoesCompra}C)
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default MaterialsReport;
