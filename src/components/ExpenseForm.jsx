"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Save,
  RotateCcw,
  Search,
  Tag,
  User,
  Users,
  X,
  Printer,
  FileText,
  Filter,
  Calendar,
  ChevronDown,
  ArrowRight,
  PieChart,
  DownloadCloud,
  Zap,
  CalendarDays,
} from "lucide-react";

import { useToast } from "@/components/ui/use-toast";
import {
  subscribeToCustomers,
  getTransactionsByPeriod,
} from "@/lib/firebaseService";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const ExpenseForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    nome: "",
    valor: "",
    categoria: "operacional",
    observacoes: "",
    data: new Date(),
    formaPagamento: "dinheiro",
    numeroTransacao: "",
    clienteId: "",
  });
  const [saving, setSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [reportCategory, setReportCategory] = useState("all");
  const [reportStartDate, setReportStartDate] = useState(
    startOfMonth(new Date()),
  );
  const [reportEndDate, setReportEndDate] = useState(endOfMonth(new Date()));
  const categoryInputRef = useRef(null);

  // Customer selection state
  const [customers, setCustomers] = useState([]);
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const customerInputRef = useRef(null);

  const { toast } = useToast();

  // Subscribe to customers
  useEffect(() => {
    const unsubscribe = subscribeToCustomers((data) => {
      setCustomers(data);
    });
    return () => unsubscribe();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      valor: "",
      categoria: "operacional",
      observacoes: "",
      data: new Date(),
      formaPagamento: "dinheiro",
      numeroTransacao: "",
      clienteId: "",
    });
    setCategorySearch("");
    setSelectedCustomer(null);
    setCustomerSearch("");
  };

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setFormData((prev) => ({
      ...prev,
      clienteId: customer.id,
      nome: customer.nome,
    }));
    setShowCustomerSelect(false);
    setCustomerSearch("");
  };

  const clearCustomer = () => {
    setSelectedCustomer(null);
    setFormData((prev) => ({
      ...prev,
      clienteId: "",
    }));
  };

  // MANTIDO: Lógica de envio original
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nome || !formData.valor) {
      toast({
        title: "Erro de Validação",
        description: "Por favor, preencha o nome da despesa e o valor.",
        variant: "destructive",
      });
      return;
    }

    const valor = Number.parseFloat(formData.valor);
    if (valor <= 0) {
      toast({
        title: "Valor Inválido",
        description: "O valor da despesa deve ser maior que zero.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      const transactionDate =
        formData.data instanceof Date ? formData.data : new Date(formData.data);
      transactionDate.setHours(12, 0, 0, 0);

      const expense = {
        ...formData,
        valor,
        data: transactionDate.toISOString(),
        tipo: "despesa",
        id: Date.now().toString(),
      };

      const transactions = JSON.parse(
        localStorage.getItem("recycling_transactions") || "[]",
      );
      transactions.push(expense);
      localStorage.setItem(
        "recycling_transactions",
        JSON.stringify(transactions),
      );

      try {
        const { addTransaction, updateCustomerBalance } =
          await import("../lib/firebaseService");

        await addTransaction({
          tipo: "despesa",
          material: "despesa",
          quantidade: 1,
          precoUnitario: valor,
          valorTotal: valor,
          vendedor: formData.nome,
          observacoes: `${formData.categoria}: ${formData.observacoes}`,
          data: transactionDate,
          formaPagamento: formData.formaPagamento,
          numeroTransacao: formData.numeroTransacao,
          clienteId: formData.clienteId,
          categoria: formData.categoria,
        });

        if (formData.clienteId && formData.categoria === "emprestimo") {
          if (typeof updateCustomerBalance === "function") {
            await updateCustomerBalance(
              formData.clienteId,
              valor,
              "emprestimo",
            );
          }
        }
      } catch (firebaseError) {
        console.error(
          "[v0] Erro ao salvar despesa no Firebase:",
          firebaseError,
        );
      }

      toast({
        title: "Despesa Registrada!",
        description: `Despesa "${formData.nome}" de ${new Intl.NumberFormat(
          "pt-BR",
          { style: "currency", currency: "BRL" },
        ).format(valor)} foi registrada com sucesso.`,
        className: "bg-green-100 border-green-500 text-green-800",
      });

      resetForm();
    } catch (error) {
      console.error("[v0] Erro ao registrar despesa:", error);
      toast({
        title: "Erro ao Registrar",
        description: "Não foi possível registrar a despesa. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const categorias = [
    {
      value: "operacional",
      label: "Operacional",
      icon: "⚙️",
      color: "bg-blue-600",
    },
    {
      value: "emprestimo",
      label: "Empréstimo (Cliente)",
      icon: "💰",
      color: "bg-amber-600",
    },
    {
      value: "manutencao",
      label: "Manutenção",
      icon: "🔧",
      color: "bg-orange-600",
    },
    {
      value: "combustivel",
      label: "Combustível",
      icon: "⛽",
      color: "bg-yellow-600",
    },
    {
      value: "energia",
      label: "Energia Elétrica",
      icon: "⚡",
      color: "bg-amber-600",
    },
    { value: "agua", label: "Água", icon: "💧", color: "bg-cyan-600" },
    {
      value: "telefone",
      label: "Telefone/Internet",
      icon: "📞",
      color: "bg-indigo-600",
    },
    { value: "aluguel", label: "Aluguel", icon: "🏠", color: "bg-purple-600" },
    {
      value: "funcionarios",
      label: "Funcionários",
      icon: "👥",
      color: "bg-green-600",
    },
    {
      value: "impostos",
      label: "Impostos/Taxas",
      icon: "📋",
      color: "bg-red-600",
    },
    {
      value: "equipamentos",
      label: "Equipamentos",
      icon: "🛠️",
      color: "bg-gray-600",
    },
    { value: "p_casa", label: "P/Casa", icon: "🏡", color: "bg-pink-600" },
    {
      value: "devolucao",
      label: "Devolução",
      icon: "↩️",
      color: "bg-rose-600",
    },
    { value: "refeicao", label: "Refeição", icon: "🍽️", color: "bg-lime-600" },
    { value: "outros", label: "Outros", icon: "📦", color: "bg-slate-600" },
  ];

  const filteredCategories = categorias.filter((cat) =>
    cat.label.toLowerCase().includes(categorySearch.toLowerCase()),
  );

  const selectedCategory = categorias.find(
    (c) => c.value === formData.categoria,
  );
  const filteredCustomers = customers.filter((c) =>
    c.nome.toLowerCase().includes(customerSearch.toLowerCase()),
  );

  // --- Engenharia de Dados: Lógica de Exportação Sênior ---

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0);
  };

  const generateSmartReport = async () => {
    try {
      setIsExporting(true);
      const start = reportStartDate;
      const end = reportEndDate;

      const transactions = await getTransactionsByPeriod(start, end);
      let despesas = transactions.filter((t) => t.tipo === "despesa");

      if (reportCategory !== "all") {
        despesas = despesas.filter((t) => t.categoria === reportCategory);
      }

      if (despesas.length === 0) {
        toast({
          title: "Nenhum dado encontrado",
          description: "Não existem registros para os filtros selecionados.",
          variant: "destructive",
        });
        return;
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header Tecnológico
      doc.setFillColor(15, 23, 42); // Slate 900
      doc.rect(0, 0, pageWidth, 45, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("IMPÉRIO SUCATA", 15, 25);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.text("FINANCEIRO", 15, 33);

      // Badge de Categoria
      const catLabel =
        reportCategory === "all"
          ? "TODAS AS CATEGORIAS"
          : categorias
              .find((c) => c.value === reportCategory)
              ?.label.toUpperCase();
      doc.setFillColor(30, 41, 59);
      doc.roundedRect(pageWidth - 85, 15, 70, 20, 3, 3, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text("FILTRO ATIVO", pageWidth - 80, 22);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(catLabel, pageWidth - 80, 29);

      // Título do Relatório
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(18);
      doc.text("RELATÓRIO DE DESPESAS", 15, 60);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      const periodText = `Período: ${format(start, "dd/MM/yyyy")} até ${format(end, "dd/MM/yyyy")}`;
      doc.text(periodText, 15, 67);

      const total = despesas.reduce(
        (acc, t) => acc + (Number(t.valorTotal) || 0),
        0,
      );

      autoTable(doc, {
        startY: 75,
        head: [
          ["DATA", "DESCRIÇÃO / FAVORECIDO", "CATEGORIA", "PAGAMENTO", "VALOR"],
        ],
        body: despesas.map((t) => [
          format(new Date(t.data), "dd/MM/yyyy"),
          (t.vendedor || t.cliente || "NÃO INFORMADO").toUpperCase(),
          (
            categorias.find((c) => c.value === t.categoria)?.label || "GERAL"
          ).toUpperCase(),
          (t.formaPagamento || "DINHEIRO").toUpperCase(),
          formatCurrency(t.valorTotal),
        ]),
        theme: "grid",
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 9,
        },
        styles: { fontSize: 8, cellPadding: 4 },
        columnStyles: { 4: { fontStyle: "bold", halign: "right" } },
        foot: [["", "", "", "TOTAL ACUMULADO", formatCurrency(total)]],
        footStyles: {
          fillColor: [241, 245, 249],
          textColor: [15, 23, 42],
          fontStyle: "bold",
          fontSize: 10,
          halign: "right",
        },
      });

      // Rodapé
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Página ${i} de ${pageCount} | Gerado em ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" },
        );
      }

      doc.save(
        `Relatorio_Despesas_${reportCategory}_${format(start, "dd_MM_yyyy")}_a_${format(end, "dd_MM_yyyy")}.pdf`,
      );

      toast({
        title: "Relatório Gerado",
        description: "O documento tecnológico foi processado e baixado.",
      });
    } catch (error) {
      console.error("Erro na exportação:", error);
      toast({
        title: "Falha no Processamento",
        description: "Ocorreu um erro ao gerar o relatório de dados.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 sm:p-6 ">
      {/* Header Tecnológico & Centro de Comando de Dados */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 p-8 rounded-[1rem] text-white shadow-2xl relative overflow-hidden group">
          <div className="relative z-10">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter mb-2">
              Registrar <span className="text-red-500">Despesa</span>
            </h1>
            <p className="text-slate-400 font-medium max-w-md">
              Controle suas despesas com tecnologia e inovação.
            </p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[1rem] border border-slate-250 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-4 -top-4 bg-slate-50 w-24 h-24 rounded-full" />
          <div>
            <h3 className="text-slate-900 font-black text-xl mb-4 flex items-center gap-2">
              <Printer size={20} className="text-red-500" />
              Impressão por categorias
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <CalendarDays size={14} className="text-red-500" /> Data
                    Inicial
                  </Label>
                  <div className="relative group">
                    <input
                      type="date"
                      value={reportStartDate.toISOString().split("T")[0]}
                      onChange={(e) =>
                        setReportStartDate(
                          new Date(e.target.value + "T00:00:00"),
                        )
                      }
                      className="w-full h-12 px-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-700 hover:border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:bg-white transition-all duration-200 cursor-pointer"
                    />
                    <CalendarDays
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      size={18}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <CalendarDays size={14} className="text-red-500" /> Data
                    Final
                  </Label>
                  <div className="relative group">
                    <input
                      type="date"
                      value={reportEndDate.toISOString().split("T")[0]}
                      onChange={(e) =>
                        setReportEndDate(new Date(e.target.value + "T23:59:59"))
                      }
                      className="w-full h-12 px-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-700 hover:border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:bg-white transition-all duration-200 cursor-pointer"
                    />
                    <CalendarDays
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      size={18}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Tag size={14} className="text-red-500" /> Filtrar por
                  Categoria
                </Label>
                <div className="relative group">
                  <select
                    value={reportCategory}
                    onChange={(e) => setReportCategory(e.target.value)}
                    className="w-full h-12 pl-4 pr-10 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-700 appearance-none hover:border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:bg-white transition-all duration-200 cursor-pointer"
                  >
                    <option value="all">Todas as Categorias</option>
                    {categorias.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.icon} {c.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-slate-600 transition-colors"
                    size={18}
                  />
                </div>
              </div>

              <Button
                onClick={generateSmartReport}
                disabled={isExporting}
                className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-sm tracking-widest shadow-lg shadow-slate-200 group transition-all"
              >
                {isExporting ? (
                  <RotateCcw className="animate-spin mr-2" />
                ) : (
                  <DownloadCloud className="mr-2 group-hover:translate-y-0.5 transition-transform" />
                )}
                {isExporting ? "PROCESSANDO..." : "GERAR RELATÓRIO PDF"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Formulário de Registro (Lógica de Envio Preservada) */}
      <form onSubmit={handleSubmit} className="relative">
        <Card className="p-6 sm:p-10 shadow-2xl border-none bg-white rounded-[3rem] overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-red-600 via-orange-500 to-red-600"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div className="space-y-3">
              <Label
                htmlFor="nome"
                className="text-xs font-black text-slate-800 uppercase tracking-widest ml-1"
              >
                Favorecido / Descrição
              </Label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-red-500 transition-colors">
                  <User size={22} />
                </div>
                <Input
                  id="nome"
                  type="text"
                  value={formData.nome}
                  onChange={(e) => handleInputChange("nome", e.target.value)}
                  className="pl-14 h-16 border-2 border-slate-50 bg-slate-50/50 focus:bg-white focus:border-red-500 rounded-2xl font-bold text-slate-800 transition-all text-lg"
                  placeholder="Ex: Conta de Energia"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="valor"
                className="text-xs font-black text-slate-800 uppercase tracking-widest ml-1"
              >
                Valor da Transação
              </Label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-red-500 text-xl">
                  R$
                </div>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor}
                  onChange={(e) => handleInputChange("valor", e.target.value)}
                  className="pl-16 h-16 border-2 border-slate-50 bg-slate-50/50 focus:bg-white focus:border-red-500 rounded-2xl font-black text-red-600 transition-all text-2xl"
                  placeholder="0,00"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
            {/* Categoria Selection */}
            <div className="space-y-4">
              <Label className="text-xs font-black text-slate-800 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Tag size={14} className="text-red-500" />
                Classificação de Despesa
              </Label>

              <div className="relative" ref={categoryInputRef}>
                <div
                  onClick={() =>
                    setShowCategorySuggestions(!showCategorySuggestions)
                  }
                  className={`flex items-center justify-between h-16 px-6 border-2 rounded-2xl cursor-pointer transition-all ${showCategorySuggestions ? "border-red-500 bg-white ring-8 ring-red-50" : "border-slate-50 bg-slate-50/50 hover:border-slate-200"}`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl grayscale group-hover:grayscale-0 transition-all">
                      {selectedCategory?.icon}
                    </span>
                    <span className="font-black text-slate-700 text-lg">
                      {selectedCategory?.label}
                    </span>
                  </div>
                  <ChevronDown
                    className={`text-slate-800 transition-transform duration-300 ${showCategorySuggestions ? "rotate-180" : ""}`}
                  />
                </div>

                {showCategorySuggestions && (
                  <div className="absolute z-50 w-full mt-4 bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-slate-50">
                      <div className="relative">
                        <Search
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                          size={18}
                        />
                        <Input
                          placeholder="Pesquisar categoria..."
                          value={categorySearch}
                          onChange={(e) => setCategorySearch(e.target.value)}
                          className="pl-12 h-12 bg-slate-50 border-none rounded-xl font-bold"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    <div className="max-h-72 overflow-y-auto p-3 grid grid-cols-1 gap-1">
                      {filteredCategories.map((cat) => (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => {
                            handleInputChange("categoria", cat.value);
                            setShowCategorySuggestions(false);
                          }}
                          className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${formData.categoria === cat.value ? "bg-red-500 text-white shadow-lg shadow-red-100" : "hover:bg-slate-50 text-slate-600"}`}
                        >
                          <span className="text-2xl">{cat.icon}</span>
                          <span className="font-black uppercase text-xs tracking-widest">
                            {cat.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Cliente Selection (Only for Empréstimo) */}
            <div
              className={`space-y-4 transition-all duration-500 ${formData.categoria === "emprestimo" ? "opacity-100 translate-y-0" : "opacity-30 pointer-events-none translate-y-4"}`}
            >
              <Label className="text-xs font-black text-slate-800 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Users size={14} className="text-amber-500" />
                Vínculo com Cliente
              </Label>

              <div className="relative" ref={customerInputRef}>
                {selectedCustomer ? (
                  <div className="flex items-center justify-between h-16 px-6 border-2 border-amber-200 bg-amber-50 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className="bg-amber-500 text-white p-2 rounded-xl shadow-md">
                        <User size={18} />
                      </div>
                      <span className="font-black text-amber-900">
                        {selectedCustomer.nome}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={clearCustomer}
                      className="p-2 hover:bg-amber-200 rounded-full text-amber-600 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => setShowCustomerSelect(!showCustomerSelect)}
                    className="flex items-center justify-between h-16 px-6 border-2 border-slate-50 bg-slate-50/50 rounded-2xl cursor-pointer hover:border-slate-200 transition-all"
                  >
                    <span className="text-slate-800 font-bold">
                      Vincular cliente...
                    </span>
                    <Search size={20} className="text-slate-800" />
                  </div>
                )}

                {showCustomerSelect && (
                  <div className="absolute z-50 w-full mt-4 bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-slate-50">
                      <Input
                        placeholder="Buscar por nome..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="h-12 bg-slate-50 border-none rounded-xl font-bold"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="max-h-64 overflow-y-auto p-3">
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((customer) => (
                          <button
                            key={customer.id}
                            type="button"
                            onClick={() => selectCustomer(customer)}
                            className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-all text-left group"
                          >
                            <div className="bg-slate-100 p-3 rounded-xl text-slate-800 group-hover:bg-red-100 group-hover:text-red-500 transition-colors">
                              <User size={18} />
                            </div>
                            <div>
                              <p className="font-black text-slate-800 text-sm uppercase tracking-tight">
                                {customer.nome}
                              </p>
                              <p className="text-[10px] font-bold text-slate-400">
                                {customer.telefone || "SEM CONTATO"}
                              </p>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-8 text-center">
                          <p className="text-slate-800 font-bold text-sm">
                            Nenhum registro encontrado
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div className="space-y-3">
              <Label
                htmlFor="formaPagamento"
                className="text-xs font-black text-slate-800 uppercase tracking-widest ml-1"
              >
                Método de Pagamento
              </Label>
              <div className="relative">
                <select
                  id="formaPagamento"
                  value={formData.formaPagamento}
                  onChange={(e) =>
                    handleInputChange("formaPagamento", e.target.value)
                  }
                  className="w-full h-16 px-6 border-2 border-slate-50 bg-slate-50/50 focus:bg-white focus:border-red-500 rounded-2xl font-black text-slate-700 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="dinheiro">💵 DINHEIRO EM ESPÉCIE</option>
                  <option value="pix">📱 TRANSFERÊNCIA PIX</option>
                  <option value="transferencia">🏦 TED / DOC BANCÁRIO</option>
                  <option value="cartao">💳 CARTÃO DÉBITO/CRÉDITO</option>
                  <option value="cheque">✍️ CHEQUE NOMINAL</option>
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-800 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="data"
                className="text-xs font-black text-slate-800 uppercase tracking-widest ml-1 flex items-center gap-2"
              >
                <Calendar size={14} className="text-blue-500" />
                Data do Registro
              </Label>
              <Input
                id="data"
                type="date"
                value={
                  formData.data instanceof Date
                    ? formData.data.toISOString().split("T")[0]
                    : formData.data
                }
                onChange={(e) =>
                  handleInputChange("data", new Date(e.target.value))
                }
                className="h-16 border-2 border-slate-50 bg-slate-50/50 focus:bg-white focus:border-red-500 rounded-2xl font-black text-slate-700 transition-all"
              />
            </div>
          </div>

          <div className="space-y-3 mb-12">
            <Label
              htmlFor="observacoes"
              className="text-xs font-black text-slate-800 uppercase tracking-widest ml-1"
            >
              Notas e Observações Estratégicas
            </Label>
            <textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => handleInputChange("observacoes", e.target.value)}
              placeholder="Detalhes adicionais sobre esta despesa..."
              className="w-full p-6 rounded-[2rem] border-2 border-slate-50 bg-slate-50/50 focus:bg-white focus:border-red-500 focus:outline-none min-h-[140px] resize-none font-bold text-slate-700 transition-all text-lg"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-6">
            <Button
              type="submit"
              disabled={saving}
              className="flex-[2] h-20 bg-slate-900 hover:bg-red-600 text-white font-black text-xl rounded-[2rem] shadow-2xl shadow-slate-200 hover:shadow-red-200 hover:-translate-y-1 transition-all duration-300 group"
            >
              {saving ? (
                <RotateCcw className="animate-spin mr-4" size={28} />
              ) : (
                <Save
                  className="mr-4 group-hover:scale-110 transition-transform"
                  size={28}
                />
              )}
              {saving ? "PROCESSANDO..." : "REGISTRAR AGORA"}
              <ArrowRight className="ml-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
            </Button>
            <Button
              type="button"
              onClick={resetForm}
              variant="outline"
              className="flex-1 h-20 border-2 border-slate-100 text-slate-400 font-black text-lg rounded-[2rem] hover:bg-slate-50 hover:text-slate-600 transition-all"
            >
              LIMPAR
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default ExpenseForm;
