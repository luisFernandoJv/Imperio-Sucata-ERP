"use client";

import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  HandCoins,
  Search,
  Printer,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Calendar,
} from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { subscribeToCustomers } from "@/lib/firebaseService";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const formatCurrency = (value) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
};

const ClientReports = () => {
  const { transactions } = useData();
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToCustomers((data) => {
      setCustomers(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const clientStats = useMemo(() => {
    if (!customers.length) return [];

    return customers.map((customer) => {
      // Filtrar transações por clienteId ou por nome (vendedor/cliente)
      const customerTransactions = transactions.filter(
        (t) =>
          t.clienteId === customer.id ||
          (t.vendedor &&
            t.vendedor.toLowerCase() === customer.nome.toLowerCase()) ||
          (t.cliente &&
            t.cliente.toLowerCase() === customer.nome.toLowerCase()),
      );

      const totalVendas = customerTransactions
        .filter((t) => t.tipo === "venda")
        .reduce((sum, t) => sum + (Number(t.valorTotal) || 0), 0);

      const totalCompras = customerTransactions
        .filter((t) => t.tipo === "compra")
        .reduce((sum, t) => sum + (Number(t.valorTotal) || 0), 0);

      const totalEmprestimos = customerTransactions
        .filter(
          (t) =>
            t.tipo === "despesa" &&
            (t.categoria === "emprestimo" ||
              t.observacoes?.toLowerCase().includes("empréstimo")),
        )
        .reduce((sum, t) => sum + (Number(t.valorTotal) || 0), 0);

      // Peso total de materiais vendidos pelo cliente para a empresa (compras da empresa)
      const pesoMaterial = customerTransactions
        .filter((t) => t.tipo === "compra")
        .reduce((sum, t) => sum + (Number(t.quantidade) || 0), 0);

      return {
        ...customer,
        stats: {
          totalVendas,
          totalCompras,
          totalEmprestimos,
          pesoMaterial,
          transacoesCount: customerTransactions.length,
        },
      };
    });
  }, [customers, transactions]);

  const filteredStats = clientStats.filter((c) =>
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const topVendas = [...clientStats]
    .sort((a, b) => b.stats.totalVendas - a.stats.totalVendas)
    .slice(0, 5);
  const topDevedores = [...clientStats]
    .sort((a, b) => (b.saldo || 0) - (a.saldo || 0))
    .slice(0, 5);
  const topFornecedoresMaterial = [...clientStats]
    .sort((a, b) => b.stats.pesoMaterial - a.stats.pesoMaterial)
    .slice(0, 5);

  const exportPDF = (type) => {
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString("pt-BR");

    let title = "Relatório de Clientes";
    let data = [];
    let headers = [];

    if (type === "vendas") {
      title = "Ranking de Clientes por Volume de Vendas";
      headers = [["Posição", "Cliente", "Total Comprado", "Transações"]];
      data = [...clientStats]
        .sort((a, b) => b.stats.totalVendas - a.stats.totalVendas)
        .map((c, i) => [
          i + 1,
          c.nome,
          formatCurrency(c.stats.totalVendas),
          c.stats.transacoesCount,
        ]);
    } else if (type === "emprestimos") {
      title = "Relatório de Empréstimos e Saldos Devedores";
      headers = [["Cliente", "Saldo Atual", "Total Emprestado", "Observações"]];
      data = [...clientStats]
        .sort((a, b) => (b.saldo || 0) - (a.saldo || 0))
        .map((c) => [
          c.nome,
          formatCurrency(c.saldo),
          formatCurrency(c.stats.totalEmprestimos),
          c.observacoes || "-",
        ]);
    } else if (type === "materiais") {
      title = "Ranking de Fornecedores por Volume de Material";
      headers = [["Posição", "Cliente", "Peso Total (kg)", "Valor Total"]];
      data = [...clientStats]
        .sort((a, b) => b.stats.pesoMaterial - a.stats.pesoMaterial)
        .map((c, i) => [
          i + 1,
          c.nome,
          `${c.stats.pesoMaterial.toFixed(2)} kg`,
          formatCurrency(c.stats.totalCompras),
        ]);
    }

    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text("Império Sucata", 105, 15, { align: "center" });

    doc.setFontSize(14);
    doc.text(title, 105, 25, { align: "center" });

    doc.setFontSize(10);
    doc.text(`Gerado em: ${dateStr}`, 195, 32, { align: "right" });

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 35,
      theme: "striped",
      headStyles: { fillColor: [30, 41, 59] },
      styles: { fontSize: 9 },
    });

    doc.save(`relatorio-clientes-${type}.pdf`);
  };

  if (loading)
    return (
      <div className="p-8 text-center">Carregando dados dos clientes...</div>
    );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header com busca e exportação */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar cliente para análise..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => exportPDF("vendas")}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4 text-green-600" /> Ranking Vendas
          </Button>
          <Button
            onClick={() => exportPDF("emprestimos")}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <HandCoins className="h-4 w-4 text-amber-600" /> Relatório Dívidas
          </Button>
          <Button
            onClick={() => exportPDF("materiais")}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Package className="h-4 w-4 text-blue-600" /> Volume Material
          </Button>
        </div>
      </div>

      {/* Cards de Destaque */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Top Comprador (Vendas da empresa para ele) */}
        <Card className="p-5 border-l-4 border-l-green-500">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <Badge
              variant="outline"
              className="text-green-600 bg-green-50 border-green-200"
            >
              Top Vendas
            </Badge>
          </div>
          <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            Maior Comprador
          </h4>
          <p className="text-xl font-bold text-slate-900 mt-1">
            {topVendas[0]?.nome || "N/A"}
          </p>
          <div className="flex items-center gap-2 mt-2 text-green-600">
            <ArrowUpRight className="h-4 w-4" />
            <span className="text-sm font-bold">
              {formatCurrency(topVendas[0]?.stats.totalVendas)}
            </span>
          </div>
        </Card>

        {/* Top Devedor */}
        <Card className="p-5 border-l-4 border-l-amber-500">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-amber-50 rounded-lg">
              <HandCoins className="h-5 w-5 text-amber-600" />
            </div>
            <Badge
              variant="outline"
              className="text-amber-600 bg-amber-50 border-amber-200"
            >
              Empréstimos
            </Badge>
          </div>
          <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            Maior Saldo Devedor
          </h4>
          <p className="text-xl font-bold text-slate-900 mt-1">
            {topDevedores[0]?.nome || "N/A"}
          </p>
          <div className="flex items-center gap-2 mt-2 text-amber-600">
            <Info className="h-4 w-4" />
            <span className="text-sm font-bold">
              {formatCurrency(topDevedores[0]?.saldo)}
            </span>
          </div>
        </Card>

        {/* Top Fornecedor Material */}
        <Card className="p-5 border-l-4 border-l-blue-500">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <Badge
              variant="outline"
              className="text-blue-600 bg-blue-50 border-blue-200"
            >
              Fornecedor
            </Badge>
          </div>
          <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            Mais Vende Material
          </h4>
          <p className="text-xl font-bold text-slate-900 mt-1">
            {topFornecedoresMaterial[0]?.nome || "N/A"}
          </p>
          <div className="flex items-center gap-2 mt-2 text-blue-600">
            <ArrowDownRight className="h-4 w-4" />
            <span className="text-sm font-bold">
              {topFornecedoresMaterial[0]?.stats.pesoMaterial.toFixed(1)} kg
              fornecidos
            </span>
          </div>
        </Card>
      </div>

      {/* Tabela Detalhada de Clientes */}
      <Card className="overflow-hidden border-slate-200 shadow-lg">
        <div className="bg-slate-900 p-4 flex items-center justify-between">
          <h3 className="text-white font-bold flex items-center gap-2">
            <Users className="h-5 w-5" /> Análise Profissional de Clientes
          </h3>
          <span className="text-slate-400 text-xs font-mono">
            {filteredStats.length} clientes listados
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-xs font-bold text-slate-600 uppercase">
                  Cliente / Observações
                </th>
                <th className="p-4 text-xs font-bold text-slate-600 uppercase text-right">
                  Total Compras
                </th>
                <th className="p-4 text-xs font-bold text-slate-600 uppercase text-right">
                  Total Vendas
                </th>
                <th className="p-4 text-xs font-bold text-slate-600 uppercase text-right">
                  Empréstimos
                </th>
                <th className="p-4 text-xs font-bold text-slate-600 uppercase text-right">
                  Saldo Atual
                </th>
                <th className="p-4 text-xs font-bold text-slate-600 uppercase text-center">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStats.map((customer) => (
                <tr
                  key={customer.id}
                  className="hover:bg-blue-50/50 transition-colors group"
                >
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 group-hover:text-blue-700">
                        {customer.nome}
                      </span>
                      {customer.observacoes && (
                        <span className="text-xs text-slate-500 mt-1 italic flex items-center gap-1">
                          <Info className="h-3 w-3" /> {customer.observacoes}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <span className="text-sm font-medium text-slate-700">
                      {formatCurrency(customer.stats.totalCompras)}
                    </span>
                    <div className="text-[10px] text-slate-400">
                      {customer.stats.pesoMaterial.toFixed(1)} kg
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <span className="text-sm font-medium text-green-700">
                      {formatCurrency(customer.stats.totalVendas)}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <span className="text-sm font-medium text-amber-700">
                      {formatCurrency(customer.stats.totalEmprestimos)}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Badge
                      className={
                        customer.saldo > 0
                          ? "bg-red-100 text-red-700 border-red-200"
                          : "bg-green-100 text-green-700 border-green-200"
                      }
                    >
                      {formatCurrency(customer.saldo)}
                    </Badge>
                  </td>
                  <td className="p-4 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-full"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredStats.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="p-12 text-center text-slate-500 italic"
                  >
                    Nenhum cliente encontrado com os critérios de busca.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default ClientReports;
