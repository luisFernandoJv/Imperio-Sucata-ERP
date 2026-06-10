"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Users,
  TrendingUp,
  Package,
  HandCoins,
  Search,
  Info,
  X,
  FileDown,
  ArrowUpDown,
} from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { subscribeToCustomers } from "@/lib/firebaseService";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const fmt = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    v || 0,
  );

// ── Card de destaque ──────────────────────────────────────────────────────────
const HighlightCard = ({
  icon: Icon,
  label,
  name,
  value,
  valueLabel,
  accent,
}) => (
  <div
    className={`relative bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden`}
  >
    <div className={`absolute top-0 left-0 right-0 h-1 ${accent.topBar}`} />
    <div className="p-5 pt-6">
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent.bg}`}
        >
          <Icon className={`w-5 h-5 ${accent.icon}`} />
        </div>
        <span
          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${accent.pill}`}
        >
          {label}
        </span>
      </div>
      <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">
        {valueLabel}
      </p>
      <p className="text-base font-bold text-slate-900 truncate">
        {name || "—"}
      </p>
      <p className={`text-sm font-bold mt-1 ${accent.value}`}>{value}</p>
    </div>
  </div>
);

// ── Cabeçalho de coluna ordenável ─────────────────────────────────────────────
const SortTh = ({ label, field, active, onSort, align = "right" }) => (
  <th
    className={`px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-widest cursor-pointer select-none hover:text-slate-800 transition-colors ${align === "right" ? "text-right" : "text-left"}`}
    onClick={() => onSort(field)}
  >
    <span
      className={`inline-flex items-center gap-1 ${align === "right" ? "justify-end" : ""}`}
    >
      {label}
      <ArrowUpDown
        className={`w-3 h-3 ${active ? "text-blue-500" : "text-slate-300"}`}
      />
    </span>
  </th>
);

const ClientReports = () => {
  const { transactions } = useData();
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("totalVendas");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToCustomers((data) => {
      setCustomers(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const clientStats = useMemo(() => {
    if (!customers.length) return [];
    return customers.map((customer) => {
      const ct = transactions.filter(
        (t) =>
          t.clienteId === customer.id ||
          t.vendedor?.toLowerCase() === customer.nome.toLowerCase() ||
          t.cliente?.toLowerCase() === customer.nome.toLowerCase(),
      );
      const totalVendas = ct
        .filter((t) => t.tipo === "venda")
        .reduce((s, t) => s + (Number(t.valorTotal) || 0), 0);
      const totalCompras = ct
        .filter((t) => t.tipo === "compra")
        .reduce((s, t) => s + (Number(t.valorTotal) || 0), 0);
      const totalEmprestimos = ct
        .filter(
          (t) =>
            t.tipo === "despesa" &&
            (t.categoria === "emprestimo" ||
              t.observacoes?.toLowerCase().includes("empréstimo")),
        )
        .reduce((s, t) => s + (Number(t.valorTotal) || 0), 0);
      const pesoMaterial = ct
        .filter((t) => t.tipo === "compra")
        .reduce((s, t) => s + (Number(t.quantidade) || 0), 0);
      return {
        ...customer,
        stats: {
          totalVendas,
          totalCompras,
          totalEmprestimos,
          pesoMaterial,
          count: ct.length,
        },
      };
    });
  }, [customers, transactions]);

  const filtered = clientStats
    .filter((c) => c.nome.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort(
      (a, b) =>
        (b.stats[sortField] || b.saldo || 0) -
        (a.stats[sortField] || a.saldo || 0),
    );

  const topVendas = [...clientStats].sort(
    (a, b) => b.stats.totalVendas - a.stats.totalVendas,
  )[0];
  const topDevedor = [...clientStats].sort(
    (a, b) => (b.saldo || 0) - (a.saldo || 0),
  )[0];
  const topForn = [...clientStats].sort(
    (a, b) => b.stats.pesoMaterial - a.stats.pesoMaterial,
  )[0];

  const exportPDF = (type) => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString("pt-BR");
    let title = "",
      headers = [],
      data = [];
    if (type === "vendas") {
      title = "Ranking por Volume de Vendas";
      headers = [["Pos.", "Cliente", "Total Comprado", "Transações"]];
      data = [...clientStats]
        .sort((a, b) => b.stats.totalVendas - a.stats.totalVendas)
        .map((c, i) => [
          i + 1,
          c.nome,
          fmt(c.stats.totalVendas),
          c.stats.count,
        ]);
    } else if (type === "emprestimos") {
      title = "Empréstimos e Saldos Devedores";
      headers = [["Cliente", "Saldo Atual", "Total Emprestado", "Obs."]];
      data = [...clientStats]
        .sort((a, b) => (b.saldo || 0) - (a.saldo || 0))
        .map((c) => [
          c.nome,
          fmt(c.saldo),
          fmt(c.stats.totalEmprestimos),
          c.observacoes || "-",
        ]);
    } else {
      title = "Ranking por Volume de Material";
      headers = [["Pos.", "Cliente", "Peso (kg)", "Valor Total"]];
      data = [...clientStats]
        .sort((a, b) => b.stats.pesoMaterial - a.stats.pesoMaterial)
        .map((c, i) => [
          i + 1,
          c.nome,
          `${c.stats.pesoMaterial.toFixed(2)} kg`,
          fmt(c.stats.totalCompras),
        ]);
    }
    doc.setFontSize(16);
    doc.text("Império Sucata", 105, 14, { align: "center" });
    doc.setFontSize(12);
    doc.text(title, 105, 23, { align: "center" });
    doc.setFontSize(9);
    doc.text(`Gerado em: ${date}`, 195, 30, { align: "right" });
    autoTable(doc, {
      head: headers,
      body: data,
      startY: 34,
      theme: "striped",
      headStyles: { fillColor: [15, 23, 42] },
      styles: { fontSize: 9 },
    });
    doc.save(`clientes-${type}.pdf`);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <div className="text-center">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Carregando clientes…</p>
        </div>
      </div>
    );

  return (
    <div className="space-y-5">
      {/* ── 3 destaques ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <HighlightCard
          icon={TrendingUp}
          label="Top vendas"
          valueLabel="Maior comprador"
          name={topVendas?.nome}
          value={fmt(topVendas?.stats.totalVendas)}
          accent={{
            topBar: "bg-emerald-500",
            bg: "bg-emerald-50",
            icon: "text-emerald-600",
            pill: "bg-emerald-100 text-emerald-700",
            value: "text-emerald-700",
          }}
        />
        <HighlightCard
          icon={HandCoins}
          label="Empréstimos"
          valueLabel="Maior saldo devedor"
          name={topDevedor?.nome}
          value={fmt(topDevedor?.saldo)}
          accent={{
            topBar: "bg-amber-500",
            bg: "bg-amber-50",
            icon: "text-amber-600",
            pill: "bg-amber-100 text-amber-700",
            value: "text-amber-700",
          }}
        />
        <HighlightCard
          icon={Package}
          label="Fornecedor"
          valueLabel="Mais fornece material"
          name={topForn?.nome}
          value={`${topForn?.stats.pesoMaterial.toFixed(1)} kg`}
          accent={{
            topBar: "bg-blue-500",
            bg: "bg-blue-50",
            icon: "text-blue-600",
            pill: "bg-blue-100 text-blue-700",
            value: "text-blue-700",
          }}
        />
      </div>

      {/* ── Barra de busca + exportar ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Campo de busca */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar cliente por nome…"
              className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Exportar */}
          <div className="flex gap-2 shrink-0">
            {[
              {
                type: "vendas",
                label: "Vendas",
                icon: TrendingUp,
                color: "text-emerald-600",
              },
              {
                type: "emprestimos",
                label: "Dívidas",
                icon: HandCoins,
                color: "text-amber-600",
              },
              {
                type: "materiais",
                label: "Material",
                icon: Package,
                color: "text-blue-600",
              },
            ].map(({ type, label, icon: Icon, color }) => (
              <button
                key={type}
                onClick={() => exportPDF(type)}
                className="px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5 text-slate-600"
              >
                <Icon className={`w-3.5 h-3.5 ${color}`} />
                <span className="hidden sm:inline">{label}</span>
                <FileDown className="w-3 h-3 text-slate-400" />
              </button>
            ))}
          </div>
        </div>

        {/* Resultado da busca */}
        {searchTerm && (
          <p className="text-xs text-slate-400 mt-2 px-1">
            {filtered.length === 0
              ? "Nenhum cliente encontrado"
              : `${filtered.length} cliente${filtered.length !== 1 ? "s" : ""} encontrado${filtered.length !== 1 ? "s" : ""}`}
          </p>
        )}
      </div>

      {/* ── Tabela de clientes ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-900 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4" />
            Análise de clientes
          </h3>
          <span className="text-slate-400 text-xs">
            {filtered.length} clientes
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <SortTh
                  label="Cliente"
                  field="nome"
                  active={sortField === "nome"}
                  onSort={setSortField}
                  align="left"
                />
                <SortTh
                  label="Compras (material)"
                  field="totalCompras"
                  active={sortField === "totalCompras"}
                  onSort={setSortField}
                />
                <SortTh
                  label="Vendas"
                  field="totalVendas"
                  active={sortField === "totalVendas"}
                  onSort={setSortField}
                />
                <SortTh
                  label="Empréstimos"
                  field="totalEmprestimos"
                  active={sortField === "totalEmprestimos"}
                  onSort={setSortField}
                />
                <SortTh
                  label="Saldo devedor"
                  field="saldo"
                  active={sortField === "saldo"}
                  onSort={setSortField}
                />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-blue-50/30 transition-colors group"
                >
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
                      {c.nome}
                    </p>
                    {c.observacoes && (
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        <Info className="w-3 h-3 shrink-0" />
                        {c.observacoes}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <p className="font-medium text-slate-700">
                      {fmt(c.stats.totalCompras)}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {c.stats.pesoMaterial.toFixed(1)} kg
                    </p>
                  </td>
                  <td className="px-4 py-3.5 text-right font-semibold text-emerald-700">
                    {fmt(c.stats.totalVendas)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-medium text-amber-700">
                    {fmt(c.stats.totalEmprestimos)}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${(c.saldo || 0) > 0 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}
                    >
                      {fmt(c.saldo)}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-12 text-center">
                    <Users className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                    <p className="text-slate-400 font-medium">
                      Nenhum cliente encontrado.
                    </p>
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="mt-2 text-xs text-blue-500 hover:underline"
                      >
                        Limpar busca
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClientReports;
