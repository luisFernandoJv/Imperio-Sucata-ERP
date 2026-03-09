"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  History,
  Phone,
  CreditCard,
  User,
  HandCoins,
  Receipt,
  Info,
  FileDown,
  Filter,
  Search,
  ChevronDown,
  Mail,
  MapPin,
  Clock,
  Download,
  Printer,
  Share2,
  BarChart3,
  Activity,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { useToast } from "./ui/use-toast";
import { getCustomerTransactions } from "../lib/firebaseService";
import * as reportGenerators from "../utils/reportGenerators";

// ─────────────────────────────────────────────────────────────
// CLASSIFICADOR CENTRAL DE DÍVIDA (VERSÃO SÊNIOR OTIMIZADA)
// Regra de Negócio:
// 1. Empréstimos (Despesa Categoria Empréstimo) -> Aumenta o que o cliente deve (+ Saldo)
// 2. Vendas a Prazo (Venda com forma de pagamento 'prazo' ou 'divida') -> Aumenta o que o cliente deve (+ Saldo)
// 3. Pagamentos (Entrada de dinheiro marcada como pagamento) -> Diminui o que o cliente deve (- Saldo)
// 4. Compras de Material (Compra) -> Se marcado para abater dívida, diminui o saldo (- Saldo)
// ─────────────────────────────────────────────────────────────
const classificar = (t) => {
  const valor = Math.abs(Number(t.valorTotal) || 0);
  const obs = (t.observacoes || "").toLowerCase();
  const material = (t.material || "").toLowerCase();
  const forma = (t.formaPagamento || "").toLowerCase();

  const isEmprestimo =
    t.tipo === "despesa" &&
    (t.categoria === "emprestimo" ||
      obs.includes("empréstimo") ||
      material.includes("emprestimo"));
  const isPagamento =
    forma === "pagamento_divida" ||
    material.includes("pagamento") ||
    obs.includes("pagou") ||
    obs.includes("acerto");
  const isVendaPrazo =
    t.tipo === "venda" &&
    (forma === "prazo" ||
      forma === "divida" ||
      obs.includes("marcar") ||
      obs.includes("pendente"));
  const isAbateCompra =
    t.tipo === "compra" &&
    (obs.includes("abater") || obs.includes("descontar") || forma === "abate");

  if (isEmprestimo || isVendaPrazo) {
    return {
      impacto: valor,
      rotulo: isEmprestimo ? "Empréstimo" : "Venda a Prazo",
      cor: "amber",
    };
  }
  if (isPagamento || isAbateCompra) {
    return {
      impacto: -valor,
      rotulo: isPagamento ? "Pagamento" : "Abate em Compra",
      cor: "green",
    };
  }

  return {
    impacto: 0,
    rotulo:
      t.tipo === "venda"
        ? "Venda (Vista)"
        : t.tipo === "compra"
          ? "Compra (Vista)"
          : "Despesa",
    cor: "slate",
  };
};

// ─────────────────────────────────────────────────────────────
const CustomerDetailsPage = ({ customer, onBack }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTransactions();
  }, [customer]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await getCustomerTransactions(customer.id, customer.nome);
      setTransactions(data);
    } catch (error) {
      console.error("Erro ao buscar transações:", error);
      toast({
        title: "Erro ao carregar transações",
        description: "Não foi possível carregar o histórico completo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Estatísticas centrais calculadas pelo classificador ──
  const stats = useMemo(() => {
    let totalEmprestimos = 0,
      quantEmprestimos = 0;
    let totalVendas = 0,
      quantVendas = 0; // empresa → cliente (aumenta)
    let totalCompras = 0,
      quantCompras = 0; // cliente → empresa (diminui)
    let totalAumento = 0;
    let totalDiminuicao = 0;

    transactions.forEach((t) => {
      const { impacto } = classificar(t);
      const valor = Math.abs(Number(t.valorTotal) || 0);

      if (impacto > 0) totalAumento += impacto;
      if (impacto < 0) totalDiminuicao += Math.abs(impacto);

      const isEmprestimo =
        t.tipo === "despesa" &&
        (t.categoria === "emprestimo" ||
          t.observacoes?.toLowerCase().includes("empréstimo"));

      if (isEmprestimo) {
        totalEmprestimos += valor;
        quantEmprestimos++;
      } else if (t.tipo === "venda") {
        totalVendas += valor;
        quantVendas++;
      } else if (t.tipo === "compra") {
        totalCompras += valor;
        quantCompras++;
      }
    });

    const saldoDivida = totalAumento - totalDiminuicao; // positivo = cliente deve

    return {
      totalAumento,
      totalDiminuicao,
      saldoDivida,
      totalEmprestimos,
      quantEmprestimos,
      totalVendas,
      quantVendas,
      totalCompras,
      quantCompras,
      count: transactions.length,
      ticketMedioVenda: quantVendas > 0 ? totalVendas / quantVendas : 0,
      ticketMedioCompra: quantCompras > 0 ? totalCompras / quantCompras : 0,
    };
  }, [transactions]);

  // ── Mapa de saldo acumulado por transação (ordem cronológica) ──
  // Usado na tabela para mostrar "Saldo após" em cada linha
  const saldoMap = useMemo(() => {
    const sorted = [...transactions].sort(
      (a, b) => new Date(a.data) - new Date(b.data),
    );
    const map = {};
    let acum = 0;
    sorted.forEach((t) => {
      acum += classificar(t).impacto;
      map[t.id] = acum;
    });
    return map;
  }, [transactions]);

  // ── Evolução da dívida no tempo (para o gráfico de barras) ──
  const evolucaoDivida = useMemo(() => {
    const sorted = [...transactions].sort(
      (a, b) => new Date(a.data) - new Date(b.data),
    );
    let acum = 0;
    return sorted.map((t) => {
      acum += classificar(t).impacto;
      return { data: t.data, saldo: acum };
    });
  }, [transactions]);

  // ── Filtros aplicados ──
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    if (filterType !== "all") {
      if (filterType === "aumenta") {
        filtered = filtered.filter((t) => classificar(t).impacto > 0);
      } else if (filterType === "diminui") {
        filtered = filtered.filter((t) => classificar(t).impacto < 0);
      } else if (filterType === "emprestimo") {
        filtered = filtered.filter(
          (t) =>
            t.tipo === "despesa" &&
            (t.categoria === "emprestimo" ||
              t.observacoes?.toLowerCase().includes("empréstimo")),
        );
      } else {
        filtered = filtered.filter((t) => t.tipo === filterType);
      }
    }

    if (dateFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();
      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case "quarter":
          filterDate.setMonth(now.getMonth() - 3);
          break;
        case "year":
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      filtered = filtered.filter((t) => new Date(t.data) >= filterDate);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.material?.toLowerCase().includes(term) ||
          t.vendedor?.toLowerCase().includes(term) ||
          t.observacoes?.toLowerCase().includes(term) ||
          t.tipo?.toLowerCase().includes(term),
      );
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.data);
      const dateB = new Date(b.data);
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [transactions, filterType, dateFilter, searchTerm, sortOrder]);

  // ── Formatadores ──
  const fmt = (value) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0);

  const formatDate = (date) => {
    if (!date) return "-";
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateShort = (date) => {
    if (!date) return "-";
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ── Ações ──
  const handleExportPDF = () => {
    try {
      reportGenerators.generateCustomerStatementPDF(
        customer,
        filteredTransactions,
        stats,
      );
      toast({
        title: "PDF Gerado!",
        description: "Extrato com controle de dívida exportado com sucesso.",
        className: "bg-green-100 border-green-500 text-green-800",
      });
    } catch {
      toast({ title: "Erro ao gerar PDF", variant: "destructive" });
    }
  };

  const handlePrint = () => window.print();

  const handleShare = async () => {
    const shareData = {
      title: `Extrato - ${customer.nome}`,
      text: `Saldo da dívida: ${fmt(stats.saldoDivida)}\nTransações: ${transactions.length}`,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {}
    } else {
      toast({ title: "Compartilhamento não disponível" });
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterType("all");
    setDateFilter("all");
    setSortOrder("desc");
  };

  // ── Cores dos badges por classificação ──
  const corBadge = {
    amber: "bg-amber-100 text-amber-700 border-amber-300",
    red: "bg-red-100 text-red-700 border-red-300",
    green: "bg-green-100 text-green-700 border-green-300",
    slate: "bg-slate-100 text-slate-600 border-slate-300",
  };

  // ─────────────── RENDER ──────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-4 md:p-6 space-y-6 animate-in fade-in duration-500">
      {/* ── Header ── */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="rounded-full hover:bg-slate-100 self-start"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg">
              {customer.nome.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                {customer.nome}
              </h1>
              <p className="text-slate-500 font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                {stats.count} transações registradas
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleExportPDF}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl h-11 px-6 shadow-lg gap-2"
            >
              <FileDown className="h-5 w-5" />
              <span className="hidden sm:inline">Exportar PDF</span>
            </Button>
            <Button
              onClick={handlePrint}
              variant="outline"
              className="border-2 border-slate-300 hover:bg-slate-100 font-bold rounded-xl h-11 px-4"
            >
              <Printer className="h-5 w-5" />
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              className="border-2 border-slate-300 hover:bg-slate-100 font-bold rounded-xl h-11 px-4"
            >
              <Share2 className="h-5 w-5" />
            </Button>
            <Button
              onClick={fetchTransactions}
              variant="outline"
              className="border-2 border-slate-300 hover:bg-slate-100 font-bold rounded-xl h-11 px-4"
            >
              <RefreshCw className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Layout: perfil | stats ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Perfil do Cliente */}
        <Card className="lg:col-span-1 border-slate-200 shadow-lg bg-white">
          <CardHeader className="pb-3 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-t-lg">
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <User className="h-4 w-4" /> Dados do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {[
              {
                icon: Phone,
                bg: "blue",
                label: "Telefone",
                value: customer.telefone,
              },
              {
                icon: CreditCard,
                bg: "indigo",
                label: "CPF",
                value: customer.cpf,
              },
              {
                icon: Mail,
                bg: "purple",
                label: "E-mail",
                value: customer.email,
              },
              {
                icon: MapPin,
                bg: "green",
                label: "Endereço",
                value: customer.endereco,
              },
            ].map((item) =>
              item.value ? (
                <div
                  key={item.label}
                  className={`flex items-start gap-3 p-3 bg-${item.bg}-50 rounded-xl hover:shadow-md transition-all`}
                >
                  <div className={`p-2 bg-${item.bg}-600 rounded-lg shadow-sm`}>
                    <item.icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">
                      {item.label}
                    </p>
                    <p className="text-sm font-bold text-slate-900 break-all">
                      {item.value}
                    </p>
                  </div>
                </div>
              ) : null,
            )}
            {/* Telefone sempre aparece mesmo vazio */}
            {!customer.telefone && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
                <div className="p-2 bg-blue-600 rounded-lg shadow-sm">
                  <Phone className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">
                    Telefone
                  </p>
                  <p className="text-sm font-bold text-slate-400 italic">
                    Não informado
                  </p>
                </div>
              </div>
            )}
            {customer.observacoes && (
              <div className="p-4 bg-amber-50 rounded-xl border-2 border-amber-200">
                <p className="text-[10px] text-amber-700 uppercase font-bold mb-2 flex items-center gap-1">
                  <Info className="h-3 w-3" /> Observações
                </p>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {customer.observacoes}
                </p>
              </div>
            )}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-2 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Cliente desde
              </p>
              <p className="text-sm font-bold text-slate-900">
                {customer.dataCadastro
                  ? formatDateShort(customer.dataCadastro)
                  : "Não disponível"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stats à direita */}
        <div className="lg:col-span-3 space-y-6">
          {/* ── Painel principal: Saldo da Dívida ── */}
          <Card
            className={`shadow-lg border-0 overflow-hidden ${stats.saldoDivida > 0 ? "ring-2 ring-red-300" : "ring-2 ring-emerald-300"}`}
          >
            <div
              className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${stats.saldoDivida > 0 ? "bg-gradient-to-r from-red-500 to-rose-600" : "bg-gradient-to-r from-emerald-500 to-teal-600"} text-white`}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-2xl">
                  {stats.saldoDivida > 0 ? (
                    <AlertTriangle className="h-7 w-7" />
                  ) : (
                    <CheckCircle2 className="h-7 w-7" />
                  )}
                </div>
                <div>
                  <p className="text-sm opacity-80 font-bold uppercase tracking-wide">
                    Saldo da Dívida
                  </p>
                  <h2 className="text-4xl font-black mt-0.5">
                    {fmt(stats.saldoDivida)}
                  </h2>
                </div>
              </div>
              <p className="text-sm opacity-80 font-semibold text-right">
                {stats.saldoDivida > 0
                  ? "Cliente deve à empresa"
                  : stats.saldoDivida < 0
                    ? "Empresa deve ao cliente"
                    : "Conta zerada"}
              </p>
            </div>

            {/* Barra proporção aumentou vs diminuiu */}
            <div className="p-5 bg-white">
              <div className="flex gap-4 text-xs font-bold text-slate-500 uppercase mb-2">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded-full bg-red-400"></span>{" "}
                  Aumentou dívida
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded-full bg-emerald-400"></span>{" "}
                  Diminuiu dívida
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                {(() => {
                  const total = stats.totalAumento + stats.totalDiminuicao;
                  const pctAum =
                    total > 0 ? (stats.totalAumento / total) * 100 : 0;
                  const pctDim =
                    total > 0 ? (stats.totalDiminuicao / total) * 100 : 0;
                  return (
                    <>
                      <div
                        className="bg-red-400 h-full transition-all duration-500"
                        style={{ width: `${pctAum}%` }}
                      />
                      <div
                        className="bg-emerald-400 h-full transition-all duration-500"
                        style={{ width: `${pctDim}%` }}
                      />
                    </>
                  );
                })()}
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-red-600 font-bold flex items-center gap-1">
                  <ArrowUp className="h-3 w-3" /> +{fmt(stats.totalAumento)}
                </span>
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <ArrowDown className="h-3 w-3" /> −
                  {fmt(stats.totalDiminuicao)}
                </span>
              </div>
            </div>
          </Card>

          {/* ── 4 cards de detalhe ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg border-0 hover:shadow-xl transition-all">
              <CardContent className="p-5">
                <div className="p-2 bg-white/20 rounded-lg w-fit mb-3">
                  <HandCoins className="h-5 w-5" />
                </div>
                <p className="text-xs opacity-90 font-bold uppercase">
                  Empréstimos
                </p>
                <h3 className="text-xl font-black mt-1">
                  {fmt(stats.totalEmprestimos)}
                </h3>
                <p className="text-xs opacity-75 mt-1 flex items-center gap-1">
                  <ArrowUp className="h-3 w-3" /> {stats.quantEmprestimos}{" "}
                  empréstimo(s) · aumenta dívida
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg border-0 hover:shadow-xl transition-all">
              <CardContent className="p-5">
                <div className="p-2 bg-white/20 rounded-lg w-fit mb-3">
                  <TrendingDown className="h-5 w-5" />
                </div>
                <p className="text-xs opacity-90 font-bold uppercase">
                  Comprou da Empresa
                </p>
                <h3 className="text-xl font-black mt-1">
                  {fmt(stats.totalVendas)}
                </h3>
                <p className="text-xs opacity-75 mt-1 flex items-center gap-1">
                  <ArrowUp className="h-3 w-3" /> {stats.quantVendas}{" "}
                  transação(ões) · aumenta dívida
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg border-0 hover:shadow-xl transition-all">
              <CardContent className="p-5">
                <div className="p-2 bg-white/20 rounded-lg w-fit mb-3">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <p className="text-xs opacity-90 font-bold uppercase">
                  Vendeu p/ Empresa
                </p>
                <h3 className="text-xl font-black mt-1">
                  {fmt(stats.totalCompras)}
                </h3>
                <p className="text-xs opacity-75 mt-1 flex items-center gap-1">
                  <ArrowDown className="h-3 w-3" /> {stats.quantCompras}{" "}
                  transação(ões) · diminui dívida
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-md hover:shadow-lg transition-all">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                  <Badge className="bg-indigo-100 text-indigo-700 border-0">
                    Média
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 font-bold uppercase">
                  Ticket Médio
                </p>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  {fmt(stats.ticketMedioVenda)}
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">
                  por compra da empresa
                </p>
              </CardContent>
            </Card>
          </div>

          {/* ── Gráfico: Evolução da dívida no tempo ── */}
          {evolucaoDivida.length > 0 && (
            <Card className="bg-white border-slate-200 shadow-md">
              <CardContent className="p-5">
                <h4 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-indigo-600" /> Evolução da
                  Dívida no Tempo
                </h4>
                <div className="flex items-end gap-1 h-28 w-full">
                  {(() => {
                    const max = Math.max(
                      ...evolucaoDivida.map((e) => Math.abs(e.saldo)),
                      1,
                    );
                    return evolucaoDivida.map((item, i) => {
                      const heightPct = (Math.abs(item.saldo) / max) * 100;
                      return (
                        <div
                          key={i}
                          className="flex-1 flex flex-col items-center gap-1 group relative"
                        >
                          <div
                            className={`w-full rounded-t-sm transition-all duration-300 ${item.saldo > 0 ? "bg-red-400" : "bg-emerald-400"}`}
                            style={{ height: `${Math.max(heightPct, 4)}%` }}
                          />
                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            <div className="bg-slate-900 text-white text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg">
                              <p className="font-bold">{fmt(item.saldo)}</p>
                              <p className="opacity-60">
                                {formatDateShort(item.data)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-bold">
                  <span>{formatDateShort(evolucaoDivida[0]?.data)}</span>
                  <span>
                    {formatDateShort(
                      evolucaoDivida[evolucaoDivida.length - 1]?.data,
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ── Histórico de Transações ── */}
      <Card className="border-slate-200 shadow-xl overflow-hidden bg-white">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-white font-bold text-xl flex items-center gap-2 mb-1">
                <History className="h-6 w-6" /> Histórico de Movimentações
              </h3>
              <p className="text-slate-400 text-sm">
                Cada linha mostra como impacta a dívida do cliente
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-slate-800 text-slate-300 border-slate-700 px-4 py-2 text-sm">
                {filteredTransactions.length} de {transactions.length} registros
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
                <ChevronDown
                  className={`h-4 w-4 ml-2 transition-transform ${showFilters ? "rotate-180" : ""}`}
                />
              </Button>
            </div>
          </div>

          {/* Filtros expansíveis */}
          {showFilters && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="space-y-2">
                <label className="text-xs text-slate-300 font-bold uppercase">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Material, descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-300 font-bold uppercase">
                  Impacto na Dívida
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
                >
                  <option value="all" className="bg-slate-800">
                    Todas
                  </option>
                  <option value="aumenta" className="bg-slate-800">
                    ↑ Aumenta Dívida
                  </option>
                  <option value="diminui" className="bg-slate-800">
                    ↓ Diminui Dívida
                  </option>
                  <option value="emprestimo" className="bg-slate-800">
                    Empréstimos
                  </option>
                  <option value="venda" className="bg-slate-800">
                    Compras da Empresa
                  </option>
                  <option value="compra" className="bg-slate-800">
                    Vendas p/ Empresa
                  </option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-300 font-bold uppercase">
                  Período
                </label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
                >
                  <option value="all" className="bg-slate-800">
                    Todo período
                  </option>
                  <option value="today" className="bg-slate-800">
                    Hoje
                  </option>
                  <option value="week" className="bg-slate-800">
                    Últimos 7 dias
                  </option>
                  <option value="month" className="bg-slate-800">
                    Último mês
                  </option>
                  <option value="quarter" className="bg-slate-800">
                    Últimos 3 meses
                  </option>
                  <option value="year" className="bg-slate-800">
                    Último ano
                  </option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-300 font-bold uppercase">
                  Ordenar
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
                >
                  <option value="desc" className="bg-slate-800">
                    Mais recentes
                  </option>
                  <option value="asc" className="bg-slate-800">
                    Mais antigas
                  </option>
                </select>
              </div>
              <div className="md:col-span-4 flex justify-end">
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          )}
        </div>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mb-4"></div>
              <p className="text-slate-500 font-medium">
                Carregando transações...
              </p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-20 px-4">
              <Receipt className="h-20 w-20 mx-auto mb-6 text-slate-300" />
              <h4 className="text-xl font-bold text-slate-700 mb-2">
                Nenhuma transação encontrada
              </h4>
              <p className="text-slate-500">
                {searchTerm || filterType !== "all" || dateFilter !== "all"
                  ? "Tente ajustar os filtros"
                  : "Ainda não há movimentações registradas"}
              </p>
              {(searchTerm || filterType !== "all" || dateFilter !== "all") && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="mt-4"
                >
                  Limpar Filtros
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-blue-50 border-b-2 border-slate-200">
                    <th className="py-4 px-6 text-[10px] uppercase font-black text-slate-600 tracking-tight">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" /> Data
                      </div>
                    </th>
                    <th className="py-4 px-6 text-[10px] uppercase font-black text-slate-600 tracking-tight">
                      Tipo
                    </th>
                    <th className="py-4 px-6 text-[10px] uppercase font-black text-slate-600 tracking-tight">
                      Descrição
                    </th>
                    <th className="py-4 px-6 text-[10px] uppercase font-black text-slate-600 tracking-tight text-right">
                      Quantidade
                    </th>
                    <th className="py-4 px-6 text-[10px] uppercase font-black text-slate-600 tracking-tight text-right">
                      Valor
                    </th>
                    <th className="py-4 px-6 text-[10px] uppercase font-black text-slate-600 tracking-tight text-right">
                      <div className="flex items-center justify-end gap-1">
                        <DollarSign className="h-3.5 w-3.5" /> Saldo Após
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.map((t, index) => {
                    const { impacto, rotulo, cor } = classificar(t);
                    const saldoApos = saldoMap[t.id] ?? 0;
                    const aumenta = impacto > 0;
                    const diminui = impacto < 0;

                    return (
                      <tr
                        key={t.id || index}
                        className="hover:bg-blue-50/50 transition-all duration-200 group"
                      >
                        {/* Data */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-slate-400" />
                            <span className="text-sm text-slate-600 font-medium">
                              {formatDate(t.data)}
                            </span>
                          </div>
                        </td>

                        {/* Tipo com badge + seta de impacto */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            {aumenta && (
                              <ArrowUp className="h-4 w-4 text-red-500" />
                            )}
                            {diminui && (
                              <ArrowDown className="h-4 w-4 text-emerald-500" />
                            )}
                            {!aumenta && !diminui && (
                              <span className="h-4 w-4 text-center text-slate-300 text-sm">
                                —
                              </span>
                            )}
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black border ${corBadge[cor]}`}
                            >
                              {rotulo}
                            </span>
                          </div>
                        </td>

                        {/* Descrição */}
                        <td className="py-4 px-6">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {t.tipo === "despesa"
                                ? t.vendedor || "Despesa Geral"
                                : t.material || "Sem descrição"}
                            </span>
                            {t.observacoes && (
                              <span className="text-xs text-slate-500 italic line-clamp-1 bg-slate-50 px-2 py-0.5 rounded">
                                {t.observacoes}
                              </span>
                            )}
                            {t.formaPagamento && (
                              <span className="text-[10px] text-slate-400">
                                💳 {t.formaPagamento}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Quantidade */}
                        <td className="py-4 px-6 text-right">
                          <span className="text-sm text-slate-600 font-mono font-semibold">
                            {t.quantidade ? `${t.quantidade} kg` : "-"}
                          </span>
                        </td>

                        {/* Valor com sinal */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex flex-col items-end gap-0.5">
                            <span
                              className={`text-base font-black ${aumenta ? "text-red-600" : diminui ? "text-emerald-600" : "text-slate-500"}`}
                            >
                              {aumenta ? "+" : diminui ? "−" : ""}
                              {fmt(Math.abs(impacto))}
                            </span>
                            {t.precoUnitario && t.quantidade && (
                              <span className="text-[10px] text-slate-400">
                                {fmt(t.precoUnitario)}/kg
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Saldo acumulado após esta transação */}
                        <td className="py-4 px-6 text-right">
                          <span
                            className={`text-sm font-black px-2.5 py-1 rounded-lg ${saldoApos > 0 ? "bg-red-50 text-red-700" : saldoApos < 0 ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-600"}`}
                          >
                            {fmt(saldoApos)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>

        {/* ── Rodapé resumo ── */}
        {filteredTransactions.length > 0 && (
          <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-5 border-t-2 border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase">
                    Visualizados
                  </p>
                  <p className="text-lg font-black text-slate-900">
                    {filteredTransactions.length} transação(ões)
                  </p>
                </div>
                <div className="h-8 w-px bg-slate-300"></div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase">
                    Saldo da Dívida
                  </p>
                  <p
                    className={`text-lg font-black ${stats.saldoDivida > 0 ? "text-red-600" : "text-emerald-600"}`}
                  >
                    {fmt(stats.saldoDivida)}
                  </p>
                </div>
                <div className="h-8 w-px bg-slate-300"></div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase">
                    Aumentou
                  </p>
                  <p className="text-lg font-black text-red-600">
                    +{fmt(stats.totalAumento)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase">
                    Diminuiu
                  </p>
                  <p className="text-lg font-black text-emerald-600">
                    −{fmt(stats.totalDiminuicao)}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleExportPDF}
                variant="outline"
                className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-bold"
              >
                <Download className="h-4 w-4 mr-2" /> Exportar PDF
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default CustomerDetailsPage;
