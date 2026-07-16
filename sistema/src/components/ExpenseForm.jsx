"use client";

import { useState, useRef, useEffect } from "react";
import {
  Save,
  RotateCcw,
  Search,
  Tag,
  User,
  Users,
  X,
  FileText,
  Calendar,
  ChevronDown,
  PieChart,
  DownloadCloud,
  CalendarDays,
  Receipt,
  Banknote,
  AlertCircle,
  Check,
} from "lucide-react";

import { useToast } from "@/components/ui/use-toast";
import {
  subscribeToCustomers,
  getTransactionsByPeriod,
} from "@/lib/firebaseService";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/* ── Componentes inline alinhados ao padrão do sistema ───── */
const Card = ({ children, className = "" }) => (
  <div
    className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}
  >
    {children}
  </div>
);

const Label = ({ children, htmlFor, className = "" }) => (
  <label
    htmlFor={htmlFor}
    className={`text-sm font-medium leading-none text-gray-700 ${className}`}
  >
    {children}
  </label>
);

const Input = ({ className = "", ...props }) => (
  <input
    className={`flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm
                ring-offset-white placeholder:text-gray-400 placeholder:font-normal
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600
                focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50
                ${className}`}
    {...props}
  />
);

/* ── Helpers ─────────────────────────────────────────────── */
const formatCurrency = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0,
  );

/* Converte um objeto Date para "yyyy-MM-dd" usando os componentes
   LOCAIS (getFullYear/getMonth/getDate), evitando o bug clássico de
   toISOString() que converte para UTC e pode "voltar" um dia em
   fusos negativos (ex: Brasil, UTC-3). */
const formatDateForInput = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/* Recebe o valor "yyyy-MM-dd" do <input type="date"> e monta um Date
   usando o construtor (ano, mês, dia, ...) — que o JS sempre interpreta
   em horário LOCAL, ao contrário de new Date("yyyy-MM-dd") que é
   interpretado como UTC meia-noite e "volta" um dia em fusos negativos.
   Preserva o horário atual (hora/min/seg) para registrar o momento real
   do lançamento, em vez de fixar sempre meio-dia. */
const parseDateInputPreservingTime = (value, previousDate) => {
  const [year, month, day] = value.split("-").map(Number);
  const base = previousDate instanceof Date ? previousDate : new Date();
  return new Date(
    year,
    month - 1,
    day,
    base.getHours(),
    base.getMinutes(),
    base.getSeconds(),
    base.getMilliseconds(),
  );
};

/* ── Dados estáticos ─────────────────────────────────────── */
const CATEGORIAS = [
  { value: "operacional", label: "Operacional", icon: "⚙️" },
  { value: "emprestimo", label: "Empréstimo (Cliente)", icon: "💰" },
  { value: "manutencao", label: "Manutenção", icon: "🔧" },
  { value: "combustivel", label: "Combustível", icon: "⛽" },
  { value: "energia", label: "Energia Elétrica", icon: "⚡" },
  { value: "agua", label: "Água", icon: "💧" },
  { value: "telefone", label: "Telefone/Internet", icon: "📞" },
  { value: "aluguel", label: "Aluguel", icon: "🏠" },
  { value: "funcionarios", label: "Funcionários", icon: "👥" },
  { value: "impostos", label: "Impostos/Taxas", icon: "📋" },
  { value: "equipamentos", label: "Equipamentos", icon: "🛠️" },
  { value: "p_casa", label: "P/Casa", icon: "🏡" },
  { value: "devolucao", label: "Devolução", icon: "↩️" },
  { value: "refeicao", label: "Refeição", icon: "🍽️" },
  { value: "outros", label: "Outros", icon: "📦" },
];

const PAGAMENTOS = [
  { value: "dinheiro", label: "Dinheiro", icon: "💵" },
  { value: "pix", label: "PIX", icon: "📱" },
  { value: "transferencia", label: "Transferência", icon: "🏦" },
  { value: "cartao", label: "Cartão", icon: "💳" },
  { value: "cheque", label: "Cheque", icon: "✍️" },
];

/* ── Separador de seção ──────────────────────────────────── */
const SectionDivider = ({ label }) => (
  <div className="flex items-center gap-3 py-1">
    <div className="flex-1 h-px bg-gray-100" />
    <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex-shrink-0">
      {label}
    </span>
    <div className="flex-1 h-px bg-gray-100" />
  </div>
);

/* ── Componente principal ────────────────────────────────── */
const ExpenseForm = ({ onSuccess }) => {
  /* Estado — lógica original preservada */
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

  const [customers, setCustomers] = useState([]);
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const customerInputRef = useRef(null);

  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = subscribeToCustomers((data) => setCustomers(data));
    return () => unsubscribe();
  }, []);

  /* Fecha dropdowns ao clicar fora */
  useEffect(() => {
    const handler = (e) => {
      if (
        categoryInputRef.current &&
        !categoryInputRef.current.contains(e.target)
      )
        setShowCategorySuggestions(false);
      if (
        customerInputRef.current &&
        !customerInputRef.current.contains(e.target)
      )
        setShowCustomerSelect(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Handlers — lógica original preservada integralmente ── */
  const handleInputChange = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

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
    setFormData((prev) => ({ ...prev, clienteId: "" }));
  };

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
        if (
          formData.clienteId &&
          formData.categoria === "emprestimo" &&
          typeof updateCustomerBalance === "function"
        )
          await updateCustomerBalance(formData.clienteId, valor, "emprestimo");
      } catch (firebaseError) {
        console.error("[v0] Erro Firebase:", firebaseError);
      }

      toast({
        title: "Despesa Registrada!",
        description: `Despesa "${formData.nome}" de ${formatCurrency(valor)} foi registrada com sucesso.`,
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

  const generateSmartReport = async () => {
    try {
      setIsExporting(true);
      const transactions = await getTransactionsByPeriod(
        reportStartDate,
        reportEndDate,
      );
      let despesas = transactions.filter((t) => t.tipo === "despesa");
      if (reportCategory !== "all")
        despesas = despesas.filter((t) => t.categoria === reportCategory);

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
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 45, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("IMPÉRIO SUCATA", 15, 25);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184);
      doc.text("FINANCEIRO", 15, 33);

      const catLabel =
        reportCategory === "all"
          ? "TODAS AS CATEGORIAS"
          : CATEGORIAS.find(
              (c) => c.value === reportCategory,
            )?.label.toUpperCase();
      doc.setFillColor(30, 41, 59);
      doc.roundedRect(pageWidth - 85, 15, 70, 20, 3, 3, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text("FILTRO ATIVO", pageWidth - 80, 22);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(catLabel, pageWidth - 80, 29);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(18);
      doc.text("RELATÓRIO DE DESPESAS", 15, 60);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Período: ${format(reportStartDate, "dd/MM/yyyy")} até ${format(reportEndDate, "dd/MM/yyyy")}`,
        15,
        67,
      );

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
            CATEGORIAS.find((c) => c.value === t.categoria)?.label || "GERAL"
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
        `Relatorio_Despesas_${reportCategory}_${format(reportStartDate, "dd_MM_yyyy")}_a_${format(reportEndDate, "dd_MM_yyyy")}.pdf`,
      );
      toast({
        title: "Relatório Gerado",
        description: "O documento foi processado e baixado.",
      });
    } catch (error) {
      console.error("Erro na exportação:", error);
      toast({
        title: "Falha no Processamento",
        description: "Ocorreu um erro ao gerar o relatório.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  /* ── Dados derivados ─────────────────────────────────────── */
  const selectedCategory = CATEGORIAS.find(
    (c) => c.value === formData.categoria,
  );
  const filteredCategories = CATEGORIAS.filter((c) =>
    c.label.toLowerCase().includes(categorySearch.toLowerCase()),
  );
  const filteredCustomers = customers.filter((c) =>
    c.nome.toLowerCase().includes(customerSearch.toLowerCase()),
  );
  const valorNum = parseFloat(formData.valor) || 0;
  const isEmprestimo = formData.categoria === "emprestimo";

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      {/* ── Cabeçalho ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)" }}
          >
            <Receipt size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              Registrar Despesa
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Preencha os dados e confirme o lançamento
            </p>
          </div>
        </div>

        {/* Preview do valor digitado */}
        {valorNum > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 bg-red-50">
            <span className="text-xs font-semibold text-red-400 uppercase tracking-wide">
              Total
            </span>
            <span className="text-lg font-bold text-red-600 tabular-nums">
              {formatCurrency(valorNum)}
            </span>
          </div>
        )}
      </div>

      {/* ── Layout principal ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* ── Formulário (2/3) ──────────────────────────── */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-4">
          <Card className="overflow-hidden">
            {/* Barra colorida no topo */}
            <div className="h-1 bg-gradient-to-r from-red-500 to-red-400" />

            <div className="p-6 space-y-5">
              <SectionDivider label="Identificação" />

              {/* Nome + Valor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome" className="flex items-center gap-1.5">
                    <User size={13} className="text-gray-400" />
                    Favorecido / Descrição
                    <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="nome"
                    type="text"
                    value={formData.nome}
                    onChange={(e) => handleInputChange("nome", e.target.value)}
                    placeholder="Ex: Conta de energia"
                    required
                    className="h-10 font-medium text-gray-800"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor" className="flex items-center gap-1.5">
                    <Banknote size={13} className="text-gray-400" />
                    Valor
                    <span className="text-red-400">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-red-500 pointer-events-none select-none">
                      R$
                    </span>
                    <Input
                      id="valor"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.valor}
                      onChange={(e) =>
                        handleInputChange("valor", e.target.value)
                      }
                      placeholder="0,00"
                      required
                      className="h-10 pl-9 font-semibold text-red-600 text-base"
                    />
                  </div>
                </div>
              </div>

              <SectionDivider label="Classificação" />

              {/* Categoria + Cliente */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Categoria */}
                <div className="space-y-2" ref={categoryInputRef}>
                  <Label className="flex items-center gap-1.5">
                    <Tag size={13} className="text-gray-400" />
                    Categoria
                    <span className="text-red-400">*</span>
                  </Label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCategorySuggestions((s) => !s)}
                      className={`w-full h-10 flex items-center gap-2 px-3 rounded-md border text-sm
                                  font-medium bg-white transition-all duration-150 text-left
                                  ${
                                    showCategorySuggestions
                                      ? "border-blue-500 ring-2 ring-blue-600 ring-offset-2"
                                      : "border-gray-300 hover:border-gray-400"
                                  }`}
                    >
                      <span className="text-base leading-none">
                        {selectedCategory?.icon}
                      </span>
                      <span className="flex-1 text-gray-800 truncate">
                        {selectedCategory?.label}
                      </span>
                      <ChevronDown
                        size={15}
                        className={`text-gray-400 flex-shrink-0 transition-transform duration-200
                                    ${showCategorySuggestions ? "rotate-180" : ""}`}
                      />
                    </button>

                    {showCategorySuggestions && (
                      <div
                        className="absolute z-50 left-0 right-0 mt-1 bg-white rounded-lg border border-gray-200
                                      shadow-lg overflow-hidden"
                      >
                        <div className="p-2 border-b border-gray-100">
                          <div className="relative">
                            <Search
                              size={13}
                              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                              type="text"
                              placeholder="Buscar categoria..."
                              value={categorySearch}
                              onChange={(e) =>
                                setCategorySearch(e.target.value)
                              }
                              onClick={(e) => e.stopPropagation()}
                              className="w-full h-8 pl-7 pr-3 text-sm bg-gray-50 rounded border border-gray-200
                                         focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                            />
                          </div>
                        </div>
                        <div className="max-h-56 overflow-y-auto p-1">
                          {filteredCategories.map((cat) => {
                            const isSelected = formData.categoria === cat.value;
                            return (
                              <button
                                key={cat.value}
                                type="button"
                                onClick={() => {
                                  handleInputChange("categoria", cat.value);
                                  setShowCategorySuggestions(false);
                                  setCategorySearch("");
                                }}
                                className={`flex items-center gap-2.5 w-full px-3 py-2 rounded text-sm
                                            font-medium text-left transition-colors duration-100
                                            ${
                                              isSelected
                                                ? "bg-blue-50 text-blue-700"
                                                : "text-gray-700 hover:bg-gray-50"
                                            }`}
                              >
                                <span className="text-base leading-none flex-shrink-0">
                                  {cat.icon}
                                </span>
                                <span className="flex-1 truncate">
                                  {cat.label}
                                </span>
                                {isSelected && (
                                  <Check
                                    size={13}
                                    className="text-blue-600 flex-shrink-0"
                                  />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cliente */}
                <div className="space-y-2" ref={customerInputRef}>
                  <Label
                    className={`flex items-center gap-1.5 ${!isEmprestimo ? "text-gray-400" : ""}`}
                  >
                    <Users
                      size={13}
                      className={
                        isEmprestimo ? "text-gray-400" : "text-gray-300"
                      }
                    />
                    Vínculo com Cliente
                    {!isEmprestimo && (
                      <span className="text-xs text-gray-400 font-normal normal-case tracking-normal ml-1">
                        (empréstimo)
                      </span>
                    )}
                  </Label>

                  <div
                    className={`relative transition-opacity duration-200 ${!isEmprestimo ? "opacity-40 pointer-events-none" : ""}`}
                  >
                    {selectedCustomer ? (
                      <div className="h-10 flex items-center gap-2 px-3 rounded-md border border-amber-300 bg-amber-50">
                        <div className="w-5 h-5 rounded bg-amber-400 flex items-center justify-center flex-shrink-0">
                          <User size={11} className="text-white" />
                        </div>
                        <span className="flex-1 text-sm font-medium text-amber-900 truncate">
                          {selectedCustomer.nome}
                        </span>
                        <button
                          type="button"
                          onClick={clearCustomer}
                          className="p-0.5 rounded hover:bg-amber-200 text-amber-600 transition-colors flex-shrink-0"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowCustomerSelect((s) => !s)}
                        className={`w-full h-10 flex items-center gap-2 px-3 rounded-md border text-sm
                                    font-medium bg-white transition-all text-left
                                    ${
                                      showCustomerSelect
                                        ? "border-blue-500 ring-2 ring-blue-600 ring-offset-2"
                                        : "border-gray-300 hover:border-gray-400"
                                    }`}
                      >
                        <Search
                          size={14}
                          className="text-gray-400 flex-shrink-0"
                        />
                        <span className="text-gray-400 font-normal">
                          Selecionar cliente...
                        </span>
                      </button>
                    )}

                    {showCustomerSelect && (
                      <div
                        className="absolute z-50 left-0 right-0 mt-1 bg-white rounded-lg border border-gray-200
                                      shadow-lg overflow-hidden"
                      >
                        <div className="p-2 border-b border-gray-100">
                          <input
                            type="text"
                            placeholder="Buscar cliente..."
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                            autoFocus
                            className="w-full h-8 px-3 text-sm bg-gray-50 rounded border border-gray-200
                                       focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                          />
                        </div>
                        <div className="max-h-52 overflow-y-auto p-1">
                          {filteredCustomers.length > 0 ? (
                            filteredCustomers.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => selectCustomer(c)}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded text-sm
                                         font-medium text-gray-700 hover:bg-gray-50 text-left transition-colors"
                              >
                                <div className="w-7 h-7 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                                  <User size={13} className="text-gray-500" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-800 truncate">
                                    {c.nome}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {c.telefone || "Sem contato"}
                                  </p>
                                </div>
                              </button>
                            ))
                          ) : (
                            <p className="text-center py-6 text-sm text-gray-400">
                              Nenhum cliente encontrado
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <SectionDivider label="Detalhes" />

              {/* Forma de pagamento + Data */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Pagamento — pills seguindo padrão do sistema */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    Forma de Pagamento
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {PAGAMENTOS.map((p) => {
                      const isActive = formData.formaPagamento === p.value;
                      return (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() =>
                            handleInputChange("formaPagamento", p.value)
                          }
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm
                                      font-medium transition-all duration-150
                                      ${
                                        isActive
                                          ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                                          : "bg-white text-gray-600 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                                      }`}
                        >
                          <span className="text-sm leading-none">{p.icon}</span>
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Data */}
                <div className="space-y-2">
                  <Label htmlFor="data" className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-gray-400" />
                    Data do Registro
                  </Label>
                  <Input
                    id="data"
                    type="date"
                    value={formatDateForInput(formData.data)}
                    onChange={(e) =>
                      handleInputChange(
                        "data",
                        parseDateInputPreservingTime(
                          e.target.value,
                          formData.data,
                        ),
                      )
                    }
                    className="h-10 font-medium text-gray-700 cursor-pointer"
                  />
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <Label
                  htmlFor="observacoes"
                  className="flex items-center gap-1.5"
                >
                  <FileText size={13} className="text-gray-400" />
                  Observações
                </Label>
                <textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) =>
                    handleInputChange("observacoes", e.target.value)
                  }
                  placeholder="Detalhes adicionais sobre esta despesa..."
                  rows={3}
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm
                             ring-offset-white placeholder:text-gray-400
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600
                             focus-visible:ring-offset-2 resize-none font-medium text-gray-700"
                />
              </div>
            </div>
          </Card>

          {/* Botões de ação */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-11 rounded-lg text-sm font-semibold text-white
                         flex items-center justify-center gap-2 transition-all duration-150
                         bg-gray-900 hover:bg-gray-800 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <RotateCcw size={15} className="animate-spin" />{" "}
                  Processando...
                </>
              ) : (
                <>
                  <Save size={15} /> Registrar Despesa
                </>
              )}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="h-11 px-5 rounded-lg text-sm font-medium text-gray-600
                         border border-gray-300 bg-white hover:bg-gray-50 hover:text-gray-800
                         flex items-center gap-2 transition-colors duration-150"
            >
              <RotateCcw size={14} />
              Limpar
            </button>
          </div>
        </form>

        {/* ── Painel de relatório (1/3) ─────────────────── */}
        <div className="space-y-3">
          <Card className="overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-gray-700 to-gray-500" />

            <div className="p-5 space-y-4">
              {/* Header */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center flex-shrink-0">
                  <PieChart size={14} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 leading-tight">
                    Relatório PDF
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Exportar por período
                  </p>
                </div>
              </div>

              <div className="h-px bg-gray-100" />

              {/* Data inicial */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="rptStart"
                  className="flex items-center gap-1.5 text-xs"
                >
                  <CalendarDays size={12} className="text-gray-400" />
                  Data Inicial
                </Label>
                <Input
                  id="rptStart"
                  type="date"
                  value={reportStartDate.toISOString().split("T")[0]}
                  onChange={(e) =>
                    setReportStartDate(new Date(e.target.value + "T00:00:00"))
                  }
                  className="h-9 text-sm font-medium text-gray-700 cursor-pointer"
                />
              </div>

              {/* Data final */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="rptEnd"
                  className="flex items-center gap-1.5 text-xs"
                >
                  <CalendarDays size={12} className="text-gray-400" />
                  Data Final
                </Label>
                <Input
                  id="rptEnd"
                  type="date"
                  value={reportEndDate.toISOString().split("T")[0]}
                  onChange={(e) =>
                    setReportEndDate(new Date(e.target.value + "T23:59:59"))
                  }
                  className="h-9 text-sm font-medium text-gray-700 cursor-pointer"
                />
              </div>

              {/* Categoria do relatório */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="rptCat"
                  className="flex items-center gap-1.5 text-xs"
                >
                  <Tag size={12} className="text-gray-400" />
                  Categoria
                </Label>
                <div className="relative">
                  <select
                    id="rptCat"
                    value={reportCategory}
                    onChange={(e) => setReportCategory(e.target.value)}
                    className="w-full h-9 pl-3 pr-8 text-sm font-medium text-gray-700
                               rounded-md border border-gray-300 bg-white appearance-none
                               focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2
                               cursor-pointer"
                  >
                    <option value="all">Todas as categorias</option>
                    {CATEGORIAS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.icon} {c.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
              </div>

              {/* Botão gerar */}
              <button
                onClick={generateSmartReport}
                disabled={isExporting}
                className="w-full h-10 rounded-lg text-sm font-semibold text-white
                           flex items-center justify-center gap-2 transition-all duration-150
                           bg-gray-900 hover:bg-gray-800 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <>
                    <RotateCcw size={14} className="animate-spin" /> Gerando...
                  </>
                ) : (
                  <>
                    <DownloadCloud size={14} /> Gerar Relatório
                  </>
                )}
              </button>
            </div>
          </Card>

          {/* Aviso para empréstimo */}
          {isEmprestimo && (
            <div className="flex gap-2.5 p-3 rounded-lg border border-amber-200 bg-amber-50">
              <AlertCircle
                size={14}
                className="text-amber-500 flex-shrink-0 mt-0.5"
              />
              <p className="text-xs font-medium text-amber-700 leading-relaxed">
                Ao registrar um empréstimo, o saldo do cliente vinculado será
                atualizado automaticamente.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseForm;
