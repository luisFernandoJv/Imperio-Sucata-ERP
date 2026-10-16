"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Wallet,
  RotateCcw,
  Save,
  Edit3,
  Check,
  X,
  TrendingUp,
  TrendingDown,
  Receipt,
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Trash2,
  Plus,
  Package,
  Lock,
  Unlock,
  User,
  Users,
  Search,
  Clock,
  Banknote,
  Link2,
  FileDown,
} from "lucide-react";
import { useData } from "../contexts/DataContext";
import { materialTypes } from "@/config/designTokens";
import TransactionEditModal from "@/components/TransactionEditModal";
import { FormFeedback } from "./ui/form-feedback";
import { useFormFeedback } from "../hooks/useFormFeedback";
import "../styles/cash-daily.css";

/* ── Componentes base — padrão do sistema (mesmo visual das outras páginas) ── */
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
                ring-offset-white placeholder:text-gray-400
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600
                focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  />
);

/* ── Helpers ─────────────────────────────────────────────── */
// Anel de foco visível e consistente — todo botão "feito à mão" (não são
// <button> nativos com estilo do browser) precisa disso pra navegação por
// teclado/leitor de tela não ficar perdida.
const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1";

const formatCurrency = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(v) || 0,
  );

const formatDateKeyForDisplay = (dateKey) => {
  const [y, m, d] = dateKey.split("-");
  return `${d}/${m}/${y}`;
};

// Data por extenso (ex: "quinta-feira, 16 de julho de 2026") para o
// cabeçalho do relatório impresso/baixado.
const formatDateExtenso = (dateKey) => {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const texto = date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

const todayKey = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const shiftDateKey = (dateKey, days) => {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const PAGAMENTOS = [
  { value: "dinheiro", label: "Dinheiro", icon: "💵" },
  { value: "pix", label: "PIX", icon: "📱" },
  { value: "cartao", label: "Cartão", icon: "💳" },
  { value: "transferencia", label: "Transferência", icon: "🏦" },
  // Mesmo value ("pagamento_divida") usado em TransactionForm.jsx — assim uma
  // venda fiado lançada aqui é tratada de forma idêntica na tela de Transações.
  { value: "pagamento_divida", label: "Fiado", icon: "📋" },
];

// Categoria de despesa — mesmo conceito de ExpenseForm.jsx (lá é um seletor
// completo com várias categorias; aqui, no lançamento rápido, só o essencial:
// diferenciar despesa comum de empréstimo vinculado a cliente).
const CATEGORIAS_DESPESA = [
  { value: "operacional", label: "Despesa comum" },
  { value: "emprestimo", label: "💰 Empréstimo (cliente)" },
];

const pagamentoLabel = (value) =>
  PAGAMENTOS.find((p) => p.value === value)?.label || value;
const pagamentoIcon = (value) =>
  PAGAMENTOS.find((p) => p.value === value)?.icon || "💰";

const TIPOS = [
  {
    value: "compra",
    label: "Compra",
    desc: "Material comprado (entra no estoque, sai dinheiro)",
    icon: Package,
  },
  {
    value: "venda",
    label: "Venda",
    desc: "Material vendido (sai do estoque, entra dinheiro)",
    icon: TrendingUp,
  },
  {
    value: "despesa",
    label: "Despesa",
    desc: "Gasto do dia (sai dinheiro, não mexe estoque)",
    icon: Receipt,
  },
  {
    value: "sangria",
    label: "Sangria",
    desc: "Retirada de dinheiro do caixa (não mexe estoque)",
    icon: Banknote,
  },
];

// Formata a hora de uma transação a partir do campo "data" (Date). Usado na
// tabela de movimentações e para ordenar o dia por horário de lançamento.
const formatHorario = (dateValue) => {
  const d = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};

// Nome do operador é lembrado localmente (não há login por usuário no
// sistema hoje, só uma senha compartilhada) para evitar redigitar toda hora.
const USUARIO_STORAGE_KEY = "caixa_diario_ultimo_usuario";

/* ── Vínculo com cliente cadastrado ──────────────────────────
   Mesma lógica de TransactionForm.jsx (venda fiado) e ExpenseForm.jsx
   (despesa/empréstimo): busca por nome entre os clientes do DataContext e
   guarda o clienteId — é esse id que o updateCustomerBalance usa depois para
   debitar/creditar o saldo. Aqui, no lançamento rápido, uma versão mais
   enxuta do mesmo dropdown (sem modal de "criar cliente"). */
const CustomerLinkField = ({
  customers,
  selectedCustomer,
  showDropdown,
  setShowDropdown,
  search,
  setSearch,
  onSelect,
  onClear,
  containerRef,
  label,
  helper,
}) => {
  const filtered = (customers || []).filter((c) =>
    c.nome.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="space-y-1.5" ref={containerRef}>
      <Label className="flex items-center gap-1.5 text-xs">
        <Users size={12} className="text-gray-400" /> {label}
      </Label>

      {selectedCustomer ? (
        <div className="h-10 flex items-center gap-2 px-3 rounded-md border border-amber-300 bg-amber-50">
          <User size={13} className="text-amber-600 flex-shrink-0" />
          <span className="flex-1 text-sm font-medium text-amber-900 truncate">
            {selectedCustomer.nome}
          </span>
          <button
            type="button"
            onClick={onClear}
            className={`p-1 rounded hover:bg-amber-200 text-amber-600 ${FOCUS_RING}`}
            aria-label="Remover vínculo com cliente"
          >
            <X size={13} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowDropdown((s) => !s)}
            aria-expanded={showDropdown}
            className={`w-full h-10 flex items-center gap-2 px-3 rounded-md border text-sm bg-white text-left ${FOCUS_RING} ${
              showDropdown
                ? "border-blue-500 ring-2 ring-blue-600 ring-offset-1"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <Search size={13} className="text-gray-400 flex-shrink-0" />
            <span className="text-gray-400 font-normal truncate">
              Buscar cliente cadastrado...
            </span>
          </button>

          {showDropdown && (
            <div className="absolute z-50 left-0 right-0 mt-1 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">
              <div className="p-2 border-b border-gray-100">
                <input
                  type="text"
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Digite o nome..."
                  aria-label="Buscar cliente cadastrado"
                  className={`w-full h-9 px-2.5 text-sm bg-gray-50 rounded border border-gray-200 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-600/30`}
                />
              </div>
              <div className="max-h-44 overflow-y-auto p-1">
                {filtered.length > 0 ? (
                  filtered.slice(0, 8).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => onSelect(c)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded hover:bg-gray-50 text-left ${FOCUS_RING}`}
                    >
                      <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <User size={12} className="text-gray-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {c.nome}
                        </p>
                      </div>
                      {c.saldo !== 0 && (
                        <span
                          className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                            c.saldo < 0
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {formatCurrency(c.saldo)}
                        </span>
                      )}
                    </button>
                  ))
                ) : (
                  <p className="text-center py-4 text-xs text-gray-400">
                    Nenhum cliente encontrado
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {helper && <p className="text-[11px] text-gray-400">{helper}</p>}
    </div>
  );
};

/* ── Divisor de seção dentro do formulário — agrupa visualmente os campos
   em blocos (Tipo → Detalhes → Pagamento → Operador) em vez de uma lista
   corrida de inputs, igual ao padrão já usado em ExpenseForm.jsx. ── */
const SectionDivider = ({ label }) => (
  <div className="flex items-center gap-2 pt-1">
    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
      {label}
    </span>
    <div className="h-px flex-1 bg-gray-100" />
  </div>
);

/* ── Cartão de resumo do dia (Inicial / Vendas / Compras / Despesas)
   Um único template visual — ícone num badge colorido, rótulo em eyebrow,
   valor em destaque — para que o olho compare igual e rápido. O "sign"
   (+ / −) antes do rótulo mostra como o número entra na conta do dia, sem
   depender de conectores frágeis entre os cartões. ── */
const StatCard = ({
  icon: Icon,
  label,
  value,
  tone = "neutral",
  sub,
  sign,
  action,
}) => {
  const tones = {
    neutral: { badge: "bg-gray-100 text-gray-500", value: "text-gray-900" },
    green: { badge: "bg-green-50 text-green-600", value: "text-green-600" },
    red: { badge: "bg-red-50 text-red-600", value: "text-red-600" },
    orange: { badge: "bg-orange-50 text-orange-600", value: "text-orange-600" },
  };
  const t = tones[tone] || tones.neutral;
  const StatIcon = Icon;

  return (
    <Card className="p-3.5 sm:p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <div
            className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center flex-shrink-0 ${t.badge}`}
          >
            <StatIcon size={13} />
          </div>
          <p className="text-[10.5px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-wide truncate">
            {sign && <span className="mr-0.5">{sign}</span>}
            {label}
          </p>
        </div>
        {action}
      </div>
      <p
        className={`text-lg sm:text-xl font-bold tabular-nums leading-tight break-words ${t.value}`}
      >
        {value}
      </p>
      {sub && (
        <p className="text-[11px] text-gray-500 mt-1.5 leading-snug">{sub}</p>
      )}
    </Card>
  );
};

/* ── Selo de forma de pagamento usado na tabela de movimentações ── */
const PaymentBadge = ({ value }) => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[11px] font-medium whitespace-nowrap">
    <span>{pagamentoIcon(value)}</span>
    {pagamentoLabel(value)}
  </span>
);

/* ── Componente principal ────────────────────────────────── */
const CaixaDiario = () => {
  const { addTransaction, deleteTransaction, customers, inventory } = useData();
  const { toast, feedback, dismiss } = useFormFeedback();

  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [caixa, setCaixa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const loadRequestRef = useRef(0);

  // Edição do caixa inicial manual
  const [editingInicial, setEditingInicial] = useState(false);
  const [inicialManualInput, setInicialManualInput] = useState("");

  // Fechamento do caixa (contagem física do dinheiro na gaveta)
  const [editingFechamento, setEditingFechamento] = useState(false);
  const [valorContadoInput, setValorContadoInput] = useState("");
  const [savingFechamento, setSavingFechamento] = useState(false);

  // Nome de quem está usando o caixa agora — lembrado localmente
  const [usuario, setUsuario] = useState(
    () => localStorage.getItem(USUARIO_STORAGE_KEY) || "",
  );

  // Formulário de lançamento (mesma lógica de estoque do formulário de Transações)
  const [formData, setFormData] = useState({
    tipo: "compra",
    material: "ferro",
    quantidade: "",
    precoUnitario: "",
    nome: "",
    observacoes: "",
    formaPagamento: "dinheiro",
    clienteId: "",
    categoria: "operacional",
  });
  const [savingMovimento, setSavingMovimento] = useState(false);

  // Vínculo com cliente cadastrado — usado tanto na venda fiado quanto na
  // despesa/empréstimo, igual a TransactionForm.jsx e ExpenseForm.jsx.
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const customerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (customerRef.current && !customerRef.current.contains(e.target)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const {
    fetchCaixaDiario,
    setCaixaInicialManual: salvarInicialManual,
    fecharCaixaDia,
    reabrirCaixaDia,
    refreshCaixaDiario,
    editTransaction,
  } = useData();

  const loadCaixa = useCallback(
    async (dateKey) => {
      const request = ++loadRequestRef.current;
      setLoading(true);
      setLoadError(false);
      setCaixa(null);
      try {
        const data = await fetchCaixaDiario(dateKey);
        if (!data) throw new Error("Caixa indisponível");
        if (request === loadRequestRef.current) setCaixa(data);
      } catch {
        if (request === loadRequestRef.current) setLoadError(true);
      } finally {
        if (request === loadRequestRef.current) setLoading(false);
      }
    },
    [fetchCaixaDiario],
  );

  useEffect(() => {
    loadCaixa(selectedDate);
    setEditingInicial(false);
    setEditingFechamento(false);
    return () => {
      loadRequestRef.current += 1;
    };
  }, [selectedDate, loadCaixa]);

  const isVenda = formData.tipo === "venda";
  const isCompra = formData.tipo === "compra";
  const isDespesa = formData.tipo === "despesa";
  const isSangria = formData.tipo === "sangria";
  const isValorDireto = isDespesa || isSangria; // despesa/sangria: "quantidade" guarda o valor direto, não peso
  const afetaEstoque = isVenda || isCompra;

  const valorTotalCalculado = useMemo(() => {
    if (isValorDireto) return Number(formData.quantidade) || 0;
    const q = Number(formData.quantidade) || 0;
    const p = Number(formData.precoUnitario) || 0;
    return Number((q * p).toFixed(2));
  }, [formData.quantidade, formData.precoUnitario, isValorDireto]);

  const handleField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Trocar o tipo de lançamento invalida qualquer vínculo de cliente que
    // estivesse selecionado para o tipo anterior (fiado numa venda não tem
    // o mesmo sentido numa despesa, por exemplo).
    if (field === "tipo") {
      setSelectedCustomer(null);
      setCustomerSearch("");
      setFormData((prev) => ({
        ...prev,
        clienteId: "",
        formaPagamento:
          prev.formaPagamento === "pagamento_divida"
            ? "dinheiro"
            : prev.formaPagamento,
      }));
    }
  };

  // Mesma lógica de seleção de cliente de TransactionForm.jsx/ExpenseForm.jsx:
  // guarda o clienteId (usado depois pelo updateCustomerBalance). Só
  // sobrescreve o campo "nome" quando é venda — na despesa, "nome" já guarda
  // a descrição do gasto e não deve ser trocado pelo nome do cliente.
  const selectCustomer = (c) => {
    setSelectedCustomer(c);
    setFormData((prev) => ({
      ...prev,
      clienteId: c.id,
      nome: prev.tipo === "venda" ? c.nome : prev.nome,
    }));
    setShowCustomerDropdown(false);
    setCustomerSearch("");
  };

  const clearCustomer = () => {
    setSelectedCustomer(null);
    setFormData((prev) => ({ ...prev, clienteId: "" }));
  };

  const resetForm = () => {
    setFormData({
      tipo: formData.tipo,
      material: "ferro",
      quantidade: "",
      precoUnitario: "",
      nome: "",
      observacoes: "",
      formaPagamento: "dinheiro",
      clienteId: "",
      categoria: "operacional",
    });
    setSelectedCustomer(null);
    setCustomerSearch("");
  };

  /* ── Salvar Caixa Inicial manual (para comparar com o automático) ── */
  const handleSalvarInicialManual = async () => {
    try {
      const valor =
        inicialManualInput === "" ? null : Number(inicialManualInput);
      const updated = await salvarInicialManual(selectedDate, valor);
      setCaixa(updated);
      setEditingInicial(false);
      toast({
        title:
          valor === null
            ? "Voltou para o valor automático"
            : "Caixa inicial atualizado",
        description:
          valor === null
            ? `Usando o saldo puxado do dia anterior: ${formatCurrency(updated.caixaInicialAuto)}`
            : `Caixa inicial de ${formatDateKeyForDisplay(selectedDate)} definido como ${formatCurrency(valor)}`,
      });
    } catch {
      toast({
        title: "Erro ao salvar caixa inicial",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
    }
  };

  /* ── Lançar movimentação do dia (compra/venda/despesa) ─────
     Reaproveita addTransaction do DataContext — mesma função usada na
     página de Transações — para já cuidar da baixa/entrada de estoque
     automaticamente, sem duplicar lógica. */
  const handleSubmitMovimento = async (e) => {
    e.preventDefault();

    if (isValorDireto) {
      if (
        !formData.quantidade ||
        !Number.isFinite(Number(formData.quantidade)) ||
        Number(formData.quantidade) <= 0
      ) {
        toast({
          title: "Informe o valor",
          description: `O valor da ${isSangria ? "sangria" : "despesa"} deve ser maior que zero.`,
          variant: "destructive",
        });
        return;
      }
      if (isSangria && !formData.nome.trim()) {
        toast({
          title: "Informe o motivo",
          description:
            "Descreva o motivo da sangria (ex: retirada para o cofre).",
          variant: "destructive",
        });
        return;
      }
      if (
        isDespesa &&
        formData.categoria === "emprestimo" &&
        !formData.clienteId
      ) {
        toast({
          title: "Selecione o cliente",
          description:
            "Empréstimo precisa estar vinculado a um cliente cadastrado.",
          variant: "destructive",
        });
        return;
      }
    } else {
      if (
        !Number.isFinite(Number(formData.quantidade)) ||
        !Number.isFinite(Number(formData.precoUnitario)) ||
        Number(formData.quantidade) <= 0 ||
        Number(formData.precoUnitario) <= 0 ||
        !Number.isFinite(
          Number(formData.quantidade) * Number(formData.precoUnitario),
        )
      ) {
        toast({
          title: "Campos obrigatórios",
          description:
            "Informe peso e valor por kg válidos e maiores que zero.",
          variant: "destructive",
        });
        return;
      }
      if (
        isVenda &&
        formData.formaPagamento === "pagamento_divida" &&
        !formData.clienteId
      ) {
        toast({
          title: "Selecione o cliente",
          description:
            "Venda fiado precisa estar vinculada a um cliente cadastrado.",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      setSavingMovimento(true);

      // Usa a data selecionada na página, no horário atual, para não
      // "voltar" um dia por causa do fuso horário (UTC-3).
      const [y, m, d] = selectedDate.split("-").map(Number);
      const now = new Date();
      const dataLancamento = new Date(
        y,
        m - 1,
        d,
        now.getHours(),
        now.getMinutes(),
        now.getSeconds(),
      );

      // Checagem de estoque — mesma regra do TransactionForm: bloqueia venda
      // maior que o disponível para hoje/futuro; para datas passadas, apenas
      // avisa e permite (o estoque atual pode não refletir o histórico).
      if (isVenda) {
        const stock = Number(
          Number(inventory[formData.material]?.quantidade || 0).toFixed(3),
        );
        const quantidadePedida = Number(parseFloat(formData.quantidade)) || 0;
        if (quantidadePedida > stock) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const isPastTransaction = dataLancamento < today;

          if (!isPastTransaction) {
            toast({
              title: "Estoque insuficiente",
              description: `Disponível: ${stock.toFixed(3)} kg · Solicitado: ${quantidadePedida.toFixed(3)} kg`,
              variant: "destructive",
            });
            setSavingMovimento(false);
            return;
          } else {
            toast({
              title: "Atenção: estoque atual insuficiente",
              description: `Estoque atual: ${stock.toFixed(3)} kg · Solicitado: ${quantidadePedida.toFixed(3)} kg. Lançamento retroativo registrado assim mesmo.`,
              className: "bg-yellow-50 border-yellow-400 text-yellow-900",
            });
            // Não retorna — permite continuar, igual ao TransactionForm.
          }
        }
      }

      const quantidade = isValorDireto
        ? 1
        : Number(parseFloat(formData.quantidade).toFixed(3));
      const precoUnitario = isValorDireto
        ? Number(formData.quantidade)
        : Number(parseFloat(formData.precoUnitario).toFixed(3));
      const valorTotal = isValorDireto
        ? Number(formData.quantidade)
        : Number((quantidade * precoUnitario).toFixed(2));

      const transaction = {
        tipo: formData.tipo,
        material: isValorDireto
          ? formData.nome || (isSangria ? "sangria" : "despesa")
          : formData.material,
        quantidade,
        precoUnitario,
        valorTotal,
        vendedor: formData.nome,
        observacoes: formData.observacoes,
        data: dataLancamento,
        formaPagamento: formData.formaPagamento,
        clienteId: formData.clienteId,
        usuario: usuario || null,
        // Igual a ExpenseForm.jsx: só despesa carrega categoria (operacional/
        // emprestimo) — é esse campo que a página de Despesas usa pra saber
        // se o lançamento é um empréstimo vinculado a cliente.
        ...(isDespesa ? { categoria: formData.categoria } : {}),
      };

      await addTransaction(transaction);

      // Vincula ao saldo do cliente — mesma função e mesmas regras usadas em
      // TransactionForm.jsx (venda fiado) e ExpenseForm.jsx (despesa/empréstimo):
      // venda fiado debita o valor do saldo do cliente ("pagamento"), empréstimo
      // credita a dívida do cliente ("emprestimo").
      if (formData.clienteId) {
        if (isVenda && formData.formaPagamento === "pagamento_divida") {
          const { updateCustomerBalance } = await import(
            "../lib/firebaseService"
          );
          await updateCustomerBalance(
            formData.clienteId,
            valorTotal,
            "pagamento",
          );
        } else if (isDespesa && formData.categoria === "emprestimo") {
          const { updateCustomerBalance } = await import(
            "../lib/firebaseService"
          );
          await updateCustomerBalance(
            formData.clienteId,
            valorTotal,
            "emprestimo",
          );
        }
      }

      // Lembra o nome do operador para os próximos lançamentos do dia
      if (usuario.trim()) {
        localStorage.setItem(USUARIO_STORAGE_KEY, usuario.trim());
      }

      toast({
        title: "Lançamento registrado!",
        description: `${TIPOS.find((t) => t.value === formData.tipo)?.label} — ${formatCurrency(valorTotal)}`,
      });

      resetForm();
      const refreshed = await refreshCaixaDiario(selectedDate);
      setCaixa((prev) => (prev ? { ...prev, ...refreshed } : refreshed));
    } catch {
      toast({
        title: "Erro ao registrar",
        description: "Não foi possível salvar o lançamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSavingMovimento(false);
    }
  };

  /* ── Fechamento do caixa: informar o valor contado na gaveta e comparar
     com o saldo esperado calculado a partir das movimentações do dia ── */
  const handleFecharCaixa = async () => {
    if (valorContadoInput === "" || Number.isNaN(Number(valorContadoInput))) {
      toast({
        title: "Informe o valor contado",
        description: "Digite o valor que está fisicamente no caixa.",
        variant: "destructive",
      });
      return;
    }
    try {
      setSavingFechamento(true);
      const updated = await fecharCaixaDia(selectedDate, {
        valorContado: Number(valorContadoInput),
        usuario: usuario || null,
      });
      if (usuario.trim()) {
        localStorage.setItem(USUARIO_STORAGE_KEY, usuario.trim());
      }
      setCaixa((prev) => (prev ? { ...prev, ...updated } : updated));
      setEditingFechamento(false);
      const diff = updated.diferencaFechamento || 0;
      toast({
        title: "Caixa fechado",
        description:
          Math.abs(diff) < 0.01
            ? "O caixa bateu certinho."
            : `Diferença de ${formatCurrency(diff)} em relação ao esperado.`,
        variant: Math.abs(diff) >= 0.01 ? "destructive" : "default",
      });
    } catch {
      toast({
        title: "Erro ao fechar o caixa",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setSavingFechamento(false);
    }
  };

  const handleReabrirCaixa = async () => {
    if (!window.confirm("Reabrir o caixa deste dia para novos lançamentos?"))
      return;
    try {
      setSavingFechamento(true);
      const updated = await reabrirCaixaDia(selectedDate);
      setCaixa((prev) => (prev ? { ...prev, ...updated } : updated));
      toast({ title: "Caixa reaberto" });
    } catch {
      toast({
        title: "Erro ao reabrir o caixa",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setSavingFechamento(false);
    }
  };

  /* ── Baixar/imprimir relatório do dia ──────────────────────
     Aciona a impressão do navegador; o CSS de impressão abaixo (ver
     <style> perto do fim do componente) esconde tudo, exceto a folha de
     relatório dedicada. No diálogo de impressão, o usuário escolhe
     "Salvar como PDF" — não precisamos de nenhuma biblioteca extra para
     gerar o arquivo. */
  const handleBaixarRelatorio = () => {
    if (!caixa) return;
    window.print();
  };

  const handleDeleteMovimento = async (id) => {
    if (
      !window.confirm(
        "Excluir esta movimentação? O estoque será ajustado automaticamente.",
      )
    )
      return;
    try {
      await deleteTransaction(id);
      const refreshed = await refreshCaixaDiario(selectedDate);
      setCaixa((prev) => (prev ? { ...prev, ...refreshed } : refreshed));
      toast({ title: "Movimentação excluída" });
    } catch {
      toast({
        title: "Erro ao excluir",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
    }
  };

  // Edição de movimentação — mesmo componente e mesmo fluxo de
  // OptimizedReports.jsx: abre o TransactionEditModal e, ao salvar, chama
  // editTransaction e recarrega o caixa do dia (o estoque/saldo do cliente
  // já são recalculados pelo próprio editTransaction no DataContext).
  const [editingMovimento, setEditingMovimento] = useState(null);

  const handleSaveEditMovimento = async (updatedData) => {
    try {
      await editTransaction(editingMovimento.id, updatedData);
      setEditingMovimento(null);
      const refreshed = await refreshCaixaDiario(selectedDate);
      setCaixa((prev) => (prev ? { ...prev, ...refreshed } : refreshed));
      toast({ title: "Movimentação atualizada" });
    } catch {
      toast({
        title: "Erro ao atualizar",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
    }
  };

  const movimentos = useMemo(() => caixa?.movimentos || [], [caixa]);
  // A folha de caixa é lida na ordem em que o dinheiro entrou/saiu — do
  // primeiro lançamento da manhã ao último da noite.
  const movimentosOrdenados = useMemo(
    () => [...movimentos].sort((a, b) => new Date(a.data) - new Date(b.data)),
    [movimentos],
  );
  const isHoje = selectedDate === todayKey();
  const temDiferenca =
    caixa?.caixaInicialManual !== null &&
    caixa?.caixaInicialManual !== undefined &&
    Math.abs(caixa?.diferenca || 0) > 0.009;

  const materialLabel = (key) =>
    materialTypes.find((m) => m.key === key)?.name || key;
  const materialIcon = (key) =>
    materialTypes.find((m) => m.key === key)?.icon || "📦";

  return (
    <div className="cash-workspace max-w-6xl mx-auto space-y-6">
      <FormFeedback feedback={feedback} onDismiss={dismiss} />
      {/* Header + navegação de data */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm shadow-blue-600/20">
            <Wallet size={19} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight tracking-tight">
              Caixa Diário
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Lançamentos, estoque e conferência do caixa em um só lugar
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center rounded-lg border border-gray-300 bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => setSelectedDate((d) => shiftDateKey(d, -1))}
              className={`h-10 w-10 flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 text-gray-500 border-r border-gray-200 ${FOCUS_RING}`}
              aria-label="Dia anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="relative">
              <Calendar
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) setSelectedDate(e.target.value);
                }}
                aria-label="Data selecionada"
                className={`h-10 pl-8 pr-2 text-sm font-semibold text-gray-700 cursor-pointer w-[9.5rem]
                           bg-transparent border-0 ${FOCUS_RING}`}
              />
            </div>
            <button
              type="button"
              onClick={() => setSelectedDate((d) => shiftDateKey(d, 1))}
              className={`h-10 w-10 flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 text-gray-500 border-l border-gray-200 ${FOCUS_RING}`}
              aria-label="Próximo dia"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          {!isHoje && (
            <button
              type="button"
              onClick={() => setSelectedDate(todayKey())}
              className={`h-10 px-3 text-xs font-semibold rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 whitespace-nowrap ${FOCUS_RING}`}
            >
              Voltar para hoje
            </button>
          )}
          <button
            type="button"
            onClick={handleBaixarRelatorio}
            disabled={loading || loadError || !caixa}
            title="Baixar relatório do dia"
            className={`h-10 w-10 flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-500
                       hover:bg-gray-50 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed ${FOCUS_RING}`}
            aria-label="Baixar relatório do dia"
          >
            <FileDown size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <div
          role="status"
          className="flex items-center justify-center gap-3 h-40 text-sm text-gray-600"
        >
          <div className="loading-spinner h-6 w-6" aria-hidden="true" />{" "}
          Carregando caixa do dia…
        </div>
      ) : loadError || !caixa ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-white p-6"
        >
          <h2 className="font-semibold text-gray-900">
            Não foi possível carregar o caixa
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Os dados de {formatDateKeyForDisplay(selectedDate)} estão
            indisponíveis no momento.
          </p>
          <button
            type="button"
            onClick={() => loadCaixa(selectedDate)}
            className={`mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white ${FOCUS_RING}`}
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <>
          {/* Resumo do caixa — 4 cartões de mesmo tamanho, sempre em grade
              simples (2 colunas no celular, 4 no desktop) para nunca
              espremer o conteúdo. O Saldo Final ganha uma faixa própria,
              em largura total, para nunca ficar cortado ou pequeno demais —
              é o número mais importante da tela. */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              icon={Wallet}
              label="Caixa Inicial"
              value={formatCurrency(caixa.caixaInicial)}
              sub={
                caixa.modo === "manual"
                  ? "Digitado manualmente"
                  : "Puxado do dia anterior"
              }
              action={
                !editingInicial && (
                  <button
                    onClick={() => {
                      setInicialManualInput(
                        caixa.caixaInicialManual !== null
                          ? String(caixa.caixaInicialManual)
                          : "",
                      );
                      setEditingInicial(true);
                    }}
                    className={`p-1 -m-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 ${FOCUS_RING}`}
                    aria-label="Editar caixa inicial"
                  >
                    <Edit3 size={13} />
                  </button>
                )
              }
            />

            <StatCard
              icon={TrendingUp}
              label="Vendas"
              value={formatCurrency(caixa.totalVendas)}
              tone="green"
              sign="+"
            />

            <StatCard
              icon={TrendingDown}
              label="Compras"
              value={formatCurrency(caixa.totalCompras)}
              tone="red"
              sign="−"
            />

            <StatCard
              icon={Receipt}
              label="Despesas"
              value={formatCurrency(caixa.totalDespesas)}
              tone="orange"
              sign="−"
              sub={
                caixa.totalSangrias > 0
                  ? `+ ${formatCurrency(caixa.totalSangrias)} em sangrias`
                  : null
              }
            />
          </div>

          {/* Saldo Final — faixa de destaque em largura total, sempre visível
              e com contraste alto (não depende de espremer numa grade de 5
              colunas, onde o valor podia cortar em telas médias). */}
          <Card className="p-5 !bg-gray-900 !border-gray-900 relative overflow-hidden">
            <div className="absolute -right-6 -top-10 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Banknote size={19} className="text-white" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                    Saldo Final do Dia
                  </p>
                  <p className="text-3xl font-bold text-white tabular-nums leading-tight break-all">
                    {formatCurrency(caixa.saldoFinal)}
                  </p>
                </div>
              </div>
              <p className="text-xs font-mono text-gray-400 tabular-nums sm:text-right leading-relaxed">
                {formatCurrency(caixa.caixaInicial)}{" "}
                <span className="text-gray-500">+</span>{" "}
                {formatCurrency(caixa.totalVendas)}{" "}
                <span className="text-gray-500">−</span>{" "}
                {formatCurrency(caixa.totalCompras)}{" "}
                <span className="text-gray-500">−</span>{" "}
                {formatCurrency(caixa.totalDespesas)}{" "}
                {Number(caixa.totalSangrias) > 0 && (
                  <>
                    <span className="text-gray-500">−</span>{" "}
                    {formatCurrency(caixa.totalSangrias)}{" "}
                  </>
                )}
                <span className="text-gray-500">=</span>{" "}
                <strong className="text-white">
                  {formatCurrency(caixa.saldoFinal)}
                </strong>
              </p>
            </div>
          </Card>

          {/* Edição do caixa inicial manual — some pra fora do cartão quando
              ativa, assim não distorce a altura da grade de resumo acima. */}
          {editingInicial && (
            <Card className="p-4 !border-blue-200 !bg-blue-50/40">
              <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                <div className="space-y-1.5 flex-1 sm:max-w-xs">
                  <Label htmlFor="caixaInicialManual" className="text-xs">
                    Definir caixa inicial manualmente
                  </Label>
                  <Input
                    id="caixaInicialManual"
                    type="number"
                    step="0.01"
                    autoFocus
                    placeholder={`Auto: ${formatCurrency(caixa.caixaInicialAuto)}`}
                    value={inicialManualInput}
                    onChange={(e) => setInicialManualInput(e.target.value)}
                    className="h-9 font-semibold bg-white"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSalvarInicialManual}
                    className={`h-10 px-4 rounded-md bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 flex items-center justify-center gap-1.5 ${FOCUS_RING}`}
                  >
                    <Check size={13} /> Salvar
                  </button>
                  <button
                    onClick={() => setEditingInicial(false)}
                    className={`h-10 px-3 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 flex items-center justify-center gap-1.5 text-xs font-semibold ${FOCUS_RING}`}
                  >
                    <X size={13} /> Cancelar
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* Resumo de vendas por forma de pagamento — barra de proporção
              rápida, pra ver de relance qual meio domina o dia sem ter que
              calcular percentuais na cabeça. */}
          {Object.keys(caixa.vendasPorFormaPagamento || {}).length > 0 && (
            <Card className="p-4">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Vendas por forma de pagamento
              </p>
              <div className="space-y-2.5">
                {Object.entries(caixa.vendasPorFormaPagamento)
                  .sort((a, b) => b[1] - a[1])
                  .map(([forma, valor]) => {
                    const pct = caixa.totalVendas
                      ? Math.round((valor / caixa.totalVendas) * 100)
                      : 0;
                    return (
                      <div
                        key={forma}
                        className="flex items-center gap-3 text-sm"
                      >
                        <span className="w-28 flex items-center gap-1.5 text-xs text-gray-500 flex-shrink-0">
                          <span>{pagamentoIcon(forma)}</span>
                          {pagamentoLabel(forma)}
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-24 text-right text-sm font-bold text-gray-900 tabular-nums flex-shrink-0">
                          {formatCurrency(valor)}
                        </span>
                        <span className="w-9 text-right text-[11px] text-gray-400 flex-shrink-0">
                          {pct}%
                        </span>
                      </div>
                    );
                  })}
              </div>
            </Card>
          )}

          {/* Alerta de diferença entre caixa inicial manual x automático */}
          {temDiferenca && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-lg border border-amber-200 bg-amber-50">
              <AlertTriangle
                size={16}
                className="text-amber-500 flex-shrink-0 mt-0.5"
              />
              <p className="text-xs font-medium text-amber-700 leading-relaxed">
                Diferença entre o valor digitado e o saldo automático do dia
                anterior: <strong>{formatCurrency(caixa.diferenca)}</strong>{" "}
                (auto: {formatCurrency(caixa.caixaInicialAuto)} · manual:{" "}
                {formatCurrency(caixa.caixaInicialManual)})
              </p>
            </div>
          )}

          <div className="cash-ledger-layout grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Formulário de lançamento rápido */}
            <Card className="cash-entry-panel lg:col-span-1 p-5 space-y-4 h-fit lg:sticky lg:top-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center">
                  <Plus size={14} className="text-blue-600" />
                </div>
                <h2 className="text-sm font-bold text-gray-900">
                  Novo Lançamento
                </h2>
              </div>

              {/* Tipo */}
              <div className="space-y-1.5">
                <div
                  className="grid grid-cols-2 sm:grid-cols-4 gap-1.5"
                  role="group"
                  aria-label="Tipo de lançamento"
                >
                  {TIPOS.map((t) => {
                    const TipoIcon = t.icon;
                    const active = formData.tipo === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => handleField("tipo", t.value)}
                        aria-pressed={active}
                        className={`h-14 rounded-md text-[10.5px] font-semibold border flex flex-col items-center justify-center gap-1 transition-colors ${FOCUS_RING} ${
                          active
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                        }`}
                      >
                        <TipoIcon size={15} />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-gray-500 leading-snug">
                  {TIPOS.find((t) => t.value === formData.tipo)?.desc}
                </p>
              </div>

              <form onSubmit={handleSubmitMovimento} aria-busy={savingMovimento} className="space-y-3.5">
                <SectionDivider label="Detalhes" />

                {afetaEstoque && (
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="material"
                      className="flex items-center gap-1.5 text-xs"
                    >
                      <Package size={12} className="text-gray-400" /> Material
                    </Label>
                    <select
                      id="material"
                      value={formData.material}
                      onChange={(e) => handleField("material", e.target.value)}
                      className="w-full h-9 px-3 text-sm rounded-md border border-gray-300 bg-white
                                 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-1"
                    >
                      {materialTypes.map((m) => (
                        <option key={m.key} value={m.key}>
                          {m.icon} {m.name}
                        </option>
                      ))}
                    </select>
                    {isVenda && (
                      <p className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-gray-50 border border-gray-200 rounded-full px-2 py-0.5">
                        Estoque atual:
                        <strong className="text-gray-700">
                          {(
                            inventory[formData.material]?.quantidade || 0
                          ).toFixed(2)}{" "}
                          kg
                        </strong>
                      </p>
                    )}
                  </div>
                )}

                {isValorDireto ? (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="nomeDespesa" className="text-xs">
                        {isSangria ? "Motivo da sangria" : "Descrição"}
                      </Label>
                      <Input
                        id="nomeDespesa"
                        placeholder={
                          isSangria
                            ? "Ex: Retirada para o cofre, troco..."
                            : "Ex: Aluguel, combustível..."
                        }
                        value={formData.nome}
                        onChange={(e) => handleField("nome", e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="valorDespesa" className="text-xs">
                        Valor (R$)
                      </Label>
                      <Input
                        id="valorDespesa"
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={formData.quantidade}
                        onChange={(e) =>
                          handleField("quantidade", e.target.value)
                        }
                        className="h-9 font-semibold"
                      />
                    </div>

                    {/* Categoria — igual a ExpenseForm.jsx: "emprestimo" é o
                        que faz a despesa também debitar/creditar o saldo do
                        cliente. Só aparece para despesa (sangria não tem). */}
                    {isDespesa && (
                      <>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Categoria</Label>
                          <div
                            className="grid grid-cols-2 gap-1.5"
                            role="group"
                            aria-label="Categoria da despesa"
                          >
                            {CATEGORIAS_DESPESA.map((cat) => {
                              const active = formData.categoria === cat.value;
                              return (
                                <button
                                  key={cat.value}
                                  type="button"
                                  onClick={() =>
                                    handleField("categoria", cat.value)
                                  }
                                  aria-pressed={active}
                                  className={`h-10 rounded-md text-[11px] font-semibold border transition-colors ${FOCUS_RING} ${
                                    active
                                      ? cat.value === "emprestimo"
                                        ? "bg-amber-50 text-amber-700 border-amber-300 ring-1 ring-amber-200"
                                        : "bg-blue-50 text-blue-700 border-blue-300 ring-1 ring-blue-200"
                                      : "bg-white text-gray-500 border-gray-300 hover:bg-gray-50"
                                  }`}
                                >
                                  {cat.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {formData.categoria === "emprestimo" && (
                          <CustomerLinkField
                            customers={customers}
                            selectedCustomer={selectedCustomer}
                            showDropdown={showCustomerDropdown}
                            setShowDropdown={setShowCustomerDropdown}
                            search={customerSearch}
                            setSearch={setCustomerSearch}
                            onSelect={selectCustomer}
                            onClear={clearCustomer}
                            containerRef={customerRef}
                            label="Cliente do empréstimo"
                            helper="Soma ao saldo devedor do cliente, igual à página de Despesas."
                          />
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="quantidade" className="text-xs">
                          Peso (kg)
                        </Label>
                        <Input
                          id="quantidade"
                          type="number"
                          step="0.001"
                          placeholder="0,000"
                          value={formData.quantidade}
                          onChange={(e) =>
                            handleField("quantidade", e.target.value)
                          }
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="precoUnitario" className="text-xs">
                          Valor/kg (R$)
                        </Label>
                        <Input
                          id="precoUnitario"
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          value={formData.precoUnitario}
                          onChange={(e) =>
                            handleField("precoUnitario", e.target.value)
                          }
                          className="h-9"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cliente" className="text-xs">
                        Cliente / Fornecedor
                      </Label>
                      <Input
                        id="cliente"
                        list="caixa-clientes"
                        placeholder="Nome (opcional)"
                        value={formData.nome}
                        onChange={(e) => {
                          handleField("nome", e.target.value);
                          // Digitar por cima do nome invalida o vínculo com o
                          // cliente cadastrado (evita mandar fiado pro
                          // cliente errado se o operador corrigir o nome).
                          if (isVenda && selectedCustomer) clearCustomer();
                        }}
                        className="h-9"
                      />
                      <datalist id="caixa-clientes">
                        {(customers || []).map((c) => (
                          <option key={c.id} value={c.nome} />
                        ))}
                      </datalist>
                    </div>

                    {/* Vínculo com cliente cadastrado — só faz sentido na
                        venda, pra habilitar o "Fiado" e debitar do saldo do
                        cliente, igual a TransactionForm.jsx. */}
                    {isVenda && (
                      <CustomerLinkField
                        customers={customers}
                        selectedCustomer={selectedCustomer}
                        showDropdown={showCustomerDropdown}
                        setShowDropdown={setShowCustomerDropdown}
                        search={customerSearch}
                        setSearch={setCustomerSearch}
                        onSelect={selectCustomer}
                        onClear={clearCustomer}
                        containerRef={customerRef}
                        label="Vincular cliente cadastrado (p/ fiado)"
                        helper="Necessário para pagamento 'Fiado' — debita do saldo do cliente."
                      />
                    )}
                  </>
                )}

                {/* Forma de pagamento */}
                <div className="space-y-1.5">
                  <SectionDivider label="Pagamento" />
                  <div
                    className={`grid grid-cols-3 gap-1.5 ${isVenda ? "sm:grid-cols-5" : "sm:grid-cols-4"}`}
                    role="group"
                    aria-label="Forma de pagamento"
                  >
                    {PAGAMENTOS.filter(
                      (p) => p.value !== "pagamento_divida" || isVenda,
                    ).map((p) => {
                      const active = formData.formaPagamento === p.value;
                      return (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => handleField("formaPagamento", p.value)}
                          aria-pressed={active}
                          className={`h-12 rounded-md text-[10px] font-semibold border flex flex-col items-center justify-center gap-0.5 leading-tight transition-colors ${FOCUS_RING} ${
                            active
                              ? "bg-blue-50 text-blue-700 border-blue-300 ring-1 ring-blue-200"
                              : "bg-white text-gray-500 border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <span className="text-sm leading-none">{p.icon}</span>
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                  {formData.formaPagamento === "pagamento_divida" &&
                    !formData.clienteId && (
                      <p className="text-[11px] text-amber-600">
                        Selecione um cliente cadastrado acima para o fiado.
                      </p>
                    )}
                </div>

                <SectionDivider label="Operador" />

                {/* Operador — quem está lançando (fica salvo p/ os próximos) */}
                <div className="space-y-1.5">
                  <Input
                    id="usuario"
                    placeholder="Seu nome"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    className={`h-10 ${FOCUS_RING}`}
                  />
                </div>

                {/* Valor total calculado */}
                {!isValorDireto && (
                  <div className="flex items-center justify-between px-3.5 py-2.5 rounded-md bg-blue-50/60 border border-blue-100">
                    <span className="text-xs font-semibold text-blue-900/70">
                      Total do lançamento
                    </span>
                    <span className="text-base font-bold text-blue-900 tabular-nums">
                      {formatCurrency(valorTotalCalculado)}
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={savingMovimento}
                  className={`w-full h-11 rounded-lg text-sm font-semibold text-white
                             flex items-center justify-center gap-2 transition-all duration-150
                             bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed ${FOCUS_RING}`}
                >
                  {savingMovimento ? (
                    <>
                      <RotateCcw size={14} className="animate-spin" />{" "}
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save size={14} /> Registrar Lançamento
                    </>
                  )}
                </button>
              </form>
            </Card>

            {/* Tabela de movimentações do dia — mesmo formato da folha em papel */}
            <Card className="cash-ledger-panel lg:col-span-2 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                <h2 className="text-sm font-bold text-gray-900">
                  Movimentações de {formatDateKeyForDisplay(selectedDate)}
                </h2>
                <span className="text-xs font-medium text-gray-400 bg-gray-50 border border-gray-200 rounded-full px-2.5 py-0.5">
                  {movimentos.length} lançamento
                  {movimentos.length !== 1 ? "s" : ""}
                </span>
              </div>

              {movimentos.length === 0 ? (
                <div className="p-10 flex flex-col items-center text-center gap-2">
                  <div className="w-11 h-11 rounded-full bg-gray-50 flex items-center justify-center">
                    <Receipt size={18} className="text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">
                    Nenhuma movimentação neste dia ainda
                  </p>
                  <p className="text-xs text-gray-400">
                    Use o formulário ao lado para registrar a primeira.
                  </p>
                </div>
              ) : (
                <>
                  {/* Tabela — telas médias/grandes */}
                  <div
                    role="region"
                    aria-label="Movimentos do caixa: tabela com rolagem"
                    tabIndex={0}
                    className="cash-table-scroll hidden md:block overflow-auto max-h-[520px]"
                  >
                    <table className="w-full text-sm border-collapse">
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-wide shadow-[0_1px_0_0_rgba(0,0,0,0.06)]">
                          <th
                            scope="col"
                            className="text-left font-semibold px-4 py-2.5"
                          >
                            Horário
                          </th>
                          <th
                            scope="col"
                            className="text-left font-semibold px-2 py-2.5"
                          >
                            Mercadoria
                          </th>
                          <th
                            scope="col"
                            className="text-right font-semibold px-2 py-2.5"
                          >
                            Peso
                          </th>
                          <th
                            scope="col"
                            className="text-right font-semibold px-2 py-2.5"
                          >
                            V. Unit.
                          </th>
                          <th
                            scope="col"
                            className="text-right font-semibold px-2 py-2.5"
                          >
                            V. Total
                          </th>
                          <th
                            scope="col"
                            className="text-left font-semibold px-2 py-2.5"
                          >
                            Cliente
                          </th>
                          <th
                            scope="col"
                            className="text-left font-semibold px-2 py-2.5"
                          >
                            Pagamento
                          </th>
                          <th
                            scope="col"
                            aria-label="Ações"
                            className="px-2 py-2.5"
                          />
                        </tr>
                      </thead>
                      <tbody>
                        {movimentosOrdenados.map((mv, idx) => {
                          const isEntradaOuSaida =
                            mv.tipo === "despesa" || mv.tipo === "sangria";
                          return (
                            <tr
                              key={mv.id}
                              className={`border-t border-gray-100 hover:bg-blue-50/40 transition-colors ${
                                idx % 2 === 1 ? "bg-gray-50/40" : ""
                              }`}
                            >
                              <td className="px-4 py-2.5 text-gray-500 text-xs whitespace-nowrap">
                                <span className="flex items-center gap-1.5">
                                  <Clock size={11} className="text-gray-300" />
                                  {formatHorario(mv.data)}
                                </span>
                              </td>
                              <td className="px-2 py-2.5">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                      mv.tipo === "compra"
                                        ? "bg-red-500"
                                        : mv.tipo === "venda"
                                          ? "bg-green-500"
                                          : mv.tipo === "sangria"
                                            ? "bg-purple-500"
                                            : "bg-orange-500"
                                    }`}
                                  />
                                  <span className="font-medium text-gray-800">
                                    {isEntradaOuSaida ? (
                                      mv.material
                                    ) : (
                                      <>
                                        {materialIcon(mv.material)}{" "}
                                        {materialLabel(mv.material)}
                                      </>
                                    )}
                                  </span>
                                  {mv.tipo === "sangria" && (
                                    <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full">
                                      Sangria
                                    </span>
                                  )}
                                  {mv.categoria === "emprestimo" && (
                                    <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                                      Empréstimo
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-2 py-2.5 text-right text-gray-600 tabular-nums">
                                {isEntradaOuSaida
                                  ? "—"
                                  : `${Number(mv.quantidade).toFixed(2)} kg`}
                              </td>
                              <td className="px-2 py-2.5 text-right text-gray-600 tabular-nums">
                                {isEntradaOuSaida
                                  ? "—"
                                  : formatCurrency(mv.precoUnitario)}
                              </td>
                              <td
                                className={`px-2 py-2.5 text-right font-semibold tabular-nums ${
                                  mv.tipo === "venda"
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {mv.tipo === "venda" ? "+" : "-"}
                                {formatCurrency(mv.valorTotal)}
                              </td>
                              <td className="px-2 py-2.5 text-gray-500">
                                <span className="flex items-center gap-1 truncate max-w-[120px]">
                                  {mv.clienteId && (
                                    <Link2
                                      size={11}
                                      className="text-blue-400 flex-shrink-0"
                                    />
                                  )}
                                  <span className="truncate">
                                    {mv.vendedor || "—"}
                                  </span>
                                </span>
                              </td>
                              <td className="px-2 py-2.5">
                                <PaymentBadge value={mv.formaPagamento} />
                              </td>
                              <td className="px-2 py-2.5">
                                <div className="flex items-center justify-end gap-1">
                                  {mv.tipo !== "sangria" && (
                                    <button
                                      onClick={() => setEditingMovimento(mv)}
                                      className={`p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 ${FOCUS_RING}`}
                                      aria-label={`Editar movimentação de ${formatCurrency(mv.valorTotal)}`}
                                    >
                                      <Edit3 size={14} />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteMovimento(mv.id)}
                                    className={`p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 ${FOCUS_RING}`}
                                    aria-label={`Excluir movimentação de ${formatCurrency(mv.valorTotal)}`}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Lista em cartões — celular e telas estreitas, onde uma
                      tabela de 8 colunas obrigaria a rolar de lado e ficaria
                      difícil de ler e tocar. Mesmas informações, empilhadas. */}
                  <div className="md:hidden divide-y divide-gray-100 max-h-[520px] overflow-y-auto">
                    {movimentosOrdenados.map((mv) => {
                      const isEntradaOuSaida =
                        mv.tipo === "despesa" || mv.tipo === "sangria";
                      return (
                        <div key={mv.id} className="p-3.5 flex gap-3">
                          <span
                            className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${
                              mv.tipo === "compra"
                                ? "bg-red-500"
                                : mv.tipo === "venda"
                                  ? "bg-green-500"
                                  : mv.tipo === "sangria"
                                    ? "bg-purple-500"
                                    : "bg-orange-500"
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-800 text-sm truncate">
                                  {isEntradaOuSaida ? (
                                    mv.material
                                  ) : (
                                    <>
                                      {materialIcon(mv.material)}{" "}
                                      {materialLabel(mv.material)}
                                    </>
                                  )}
                                </p>
                                <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                                  <Clock size={10} className="text-gray-300" />
                                  {formatHorario(mv.data)}
                                  {!isEntradaOuSaida && (
                                    <>
                                      {" "}
                                      · {Number(mv.quantidade).toFixed(2)} kg ×{" "}
                                      {formatCurrency(mv.precoUnitario)}
                                    </>
                                  )}
                                </p>
                              </div>
                              <span
                                className={`text-sm font-bold tabular-nums whitespace-nowrap ${
                                  mv.tipo === "venda"
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {mv.tipo === "venda" ? "+" : "-"}
                                {formatCurrency(mv.valorTotal)}
                              </span>
                            </div>

                            <div className="flex items-center flex-wrap gap-1.5 mt-2">
                              <PaymentBadge value={mv.formaPagamento} />
                              {mv.vendedor && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[11px] font-medium truncate max-w-[140px]">
                                  {mv.clienteId && (
                                    <Link2
                                      size={10}
                                      className="text-blue-400"
                                    />
                                  )}
                                  {mv.vendedor}
                                </span>
                              )}
                              {mv.tipo === "sangria" && (
                                <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full">
                                  Sangria
                                </span>
                              )}
                              {mv.categoria === "emprestimo" && (
                                <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                                  Empréstimo
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 flex-shrink-0">
                            {mv.tipo !== "sangria" && (
                              <button
                                onClick={() => setEditingMovimento(mv)}
                                className={`self-start p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 ${FOCUS_RING}`}
                                aria-label={`Editar movimentação de ${formatCurrency(mv.valorTotal)}`}
                              >
                                <Edit3 size={15} />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteMovimento(mv.id)}
                              className={`self-start p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 ${FOCUS_RING}`}
                              aria-label={`Excluir movimentação de ${formatCurrency(mv.valorTotal)}`}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Rodapé com o cálculo, igual à folha em papel */}
              <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-gray-600 flex-shrink-0">
                <span>
                  Inicial{" "}
                  <strong className="text-gray-900 tabular-nums">
                    {formatCurrency(caixa.caixaInicial)}
                  </strong>
                </span>
                <ArrowRight size={12} className="text-gray-300" />
                <span className="text-green-600">
                  + Vendas{" "}
                  <strong className="tabular-nums">
                    {formatCurrency(caixa.totalVendas)}
                  </strong>
                </span>
                <span className="text-red-600">
                  − Compras{" "}
                  <strong className="tabular-nums">
                    {formatCurrency(caixa.totalCompras)}
                  </strong>
                </span>
                <span className="text-orange-600">
                  − Despesas{" "}
                  <strong className="tabular-nums">
                    {formatCurrency(caixa.totalDespesas)}
                  </strong>
                </span>
                {caixa.totalSangrias > 0 && (
                  <span className="text-purple-600">
                    − Sangrias{" "}
                    <strong className="tabular-nums">
                      {formatCurrency(caixa.totalSangrias)}
                    </strong>
                  </span>
                )}
                <ArrowRight size={12} className="text-gray-300" />
                <span>
                  Final{" "}
                  <strong className="text-gray-900 tabular-nums">
                    {formatCurrency(caixa.saldoFinal)}
                  </strong>
                </span>
              </div>
            </Card>
          </div>

          {/* Fechamento do caixa — contagem física e diferença */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-md flex items-center justify-center ${
                    caixa.fechado
                      ? "bg-gray-100 text-gray-600"
                      : "bg-blue-50 text-blue-600"
                  }`}
                >
                  {caixa.fechado ? <Lock size={14} /> : <Unlock size={14} />}
                </div>
                <h2 className="text-sm font-bold text-gray-900">
                  Fechamento do Caixa
                </h2>
              </div>
              {caixa.fechado && (
                <button
                  onClick={handleReabrirCaixa}
                  disabled={savingFechamento}
                  className={`h-9 px-2 -mr-2 rounded text-xs font-semibold text-gray-500 hover:text-blue-600 hover:bg-blue-50 flex items-center gap-1 ${FOCUS_RING}`}
                >
                  <Unlock size={12} /> Reabrir
                </button>
              )}
            </div>

            {caixa.fechado ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-sm">
                  <span className="text-gray-500">
                    Saldo esperado{" "}
                    <strong className="text-gray-900 tabular-nums">
                      {formatCurrency(caixa.saldoFinal)}
                    </strong>
                  </span>
                  <span className="text-gray-500">
                    Valor contado{" "}
                    <strong className="text-gray-900 tabular-nums">
                      {formatCurrency(caixa.valorContado)}
                    </strong>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      Math.abs(caixa.diferencaFechamento || 0) < 0.01
                        ? "bg-green-50 text-green-600"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    Diferença: {formatCurrency(caixa.diferencaFechamento)}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500">
                  Fechado {caixa.fechadoPor ? `por ${caixa.fechadoPor} ` : ""}
                  {caixa.fechadoEm
                    ? `em ${new Date(caixa.fechadoEm).toLocaleString("pt-BR")}`
                    : ""}
                </p>

                <div className="pt-1 flex flex-wrap gap-2">
                  <button
                    onClick={handleBaixarRelatorio}
                    className={`h-10 px-4 rounded-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700
                               flex items-center justify-center gap-2 transition-colors ${FOCUS_RING}`}
                  >
                    <FileDown size={15} />
                    Baixar relatório do dia
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-600 flex-1 h-10">
                  <Banknote size={16} className="text-gray-400 flex-shrink-0" />
                  <span>
                    Saldo esperado:{" "}
                    <strong className="text-gray-900 tabular-nums">
                      {formatCurrency(caixa.saldoFinal)}
                    </strong>
                  </span>
                </div>
                <div className="space-y-1.5 sm:w-48">
                  <Label htmlFor="valorContado" className="text-xs">
                    Valor contado na gaveta
                  </Label>
                  <Input
                    id="valorContado"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={valorContadoInput}
                    onChange={(e) => {
                      setValorContadoInput(e.target.value);
                      setEditingFechamento(true);
                    }}
                    className="h-10 font-semibold"
                  />
                </div>
                <button
                  onClick={handleFecharCaixa}
                  disabled={savingFechamento}
                  className={`h-10 px-4 rounded-md text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 active:bg-black
                             flex items-center justify-center gap-2 disabled:opacity-60 transition-colors ${FOCUS_RING}`}
                >
                  <Lock size={14} />
                  {savingFechamento ? "Fechando..." : "Fechar Caixa"}
                </button>
              </div>
            )}

            {!caixa.fechado &&
              editingFechamento &&
              valorContadoInput !== "" &&
              !Number.isNaN(Number(valorContadoInput)) && (
                <p
                  className={`mt-2.5 text-xs font-medium ${
                    Math.abs(Number(valorContadoInput) - caixa.saldoFinal) <
                    0.01
                      ? "text-green-600"
                      : "text-amber-600"
                  }`}
                >
                  Diferença prevista:{" "}
                  {formatCurrency(Number(valorContadoInput) - caixa.saldoFinal)}
                </p>
              )}
          </Card>

          {/* ── Relatório do dia — impressão / "Salvar como PDF" ─────────
              Só aparece na impressão (escondido na tela). O CSS abaixo
              esconde o resto da página inteira (inclusive o menu do
              sistema, que não faz parte deste componente) e mostra só
              esta folha — é assim que o botão "Baixar relatório do dia"
              vira um PDF sem precisar de nenhuma biblioteca extra: o
              próprio diálogo de impressão do navegador tem a opção
              "Salvar como PDF". */}
          <style>{`
            @media print {
              body * { visibility: hidden; }
              #relatorio-caixa-print, #relatorio-caixa-print * { visibility: visible; }
              #relatorio-caixa-print {
                position: absolute; left: 0; top: 0; width: 100%;
              }
              @page { margin: 14mm; }
            }
          `}</style>

          <div
            id="relatorio-caixa-print"
            className="hidden print:block text-black text-sm"
          >
            {/* Cabeçalho / letterhead */}
            <div className="flex items-start justify-between border-b-2 border-black pb-3 mb-4">
              <div>
                <p className="text-xl font-bold tracking-tight">
                  Império Sucata
                </p>
                <p className="text-xs text-gray-600">Gestão</p>
              </div>
              <div className="text-right">
                <p className="text-base font-bold">Relatório de Caixa Diário</p>
                <p className="text-xs text-gray-600">
                  {formatDateExtenso(selectedDate)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap justify-between gap-2 text-[11px] text-gray-600 mb-5">
              <span>Operador: {usuario || "Não informado"}</span>
              <span>Gerado em {new Date().toLocaleString("pt-BR")}</span>
            </div>

            {/* Resumo do dia */}
            <table className="w-full border-collapse mb-5">
              <thead>
                <tr>
                  {[
                    "Caixa Inicial",
                    "Vendas",
                    "Compras",
                    "Despesas",
                    "Saldo Final",
                  ].map((h) => (
                    <th
                      key={h}
                      className="border border-gray-400 bg-gray-100 text-[10px] font-bold uppercase tracking-wide py-1.5 px-2 text-left"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-400 py-1.5 px-2 font-semibold tabular-nums">
                    {formatCurrency(caixa.caixaInicial)}
                  </td>
                  <td className="border border-gray-400 py-1.5 px-2 font-semibold tabular-nums">
                    + {formatCurrency(caixa.totalVendas)}
                  </td>
                  <td className="border border-gray-400 py-1.5 px-2 font-semibold tabular-nums">
                    − {formatCurrency(caixa.totalCompras)}
                  </td>
                  <td className="border border-gray-400 py-1.5 px-2 font-semibold tabular-nums">
                    − {formatCurrency(caixa.totalDespesas)}
                    {caixa.totalSangrias > 0 && (
                      <span className="block text-[10px] font-normal text-gray-600">
                        (+ {formatCurrency(caixa.totalSangrias)} sangrias)
                      </span>
                    )}
                  </td>
                  <td className="border border-gray-400 py-1.5 px-2 font-bold tabular-nums bg-gray-50">
                    = {formatCurrency(caixa.saldoFinal)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Vendas por forma de pagamento */}
            {Object.keys(caixa.vendasPorFormaPagamento || {}).length > 0 && (
              <div className="mb-5">
                <p className="text-[11px] font-bold uppercase tracking-wide mb-1.5">
                  Vendas por forma de pagamento
                </p>
                <table className="w-full border-collapse">
                  <tbody>
                    {Object.entries(caixa.vendasPorFormaPagamento)
                      .sort((a, b) => b[1] - a[1])
                      .map(([forma, valor]) => (
                        <tr key={forma}>
                          <td className="border border-gray-300 py-1 px-2 w-1/2">
                            {pagamentoLabel(forma)}
                          </td>
                          <td className="border border-gray-300 py-1 px-2 text-right font-semibold tabular-nums">
                            {formatCurrency(valor)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Movimentações do dia */}
            <div className="mb-5">
              <p className="text-[11px] font-bold uppercase tracking-wide mb-1.5">
                Movimentações do dia ({movimentos.length})
              </p>
              {movimentos.length === 0 ? (
                <p className="text-xs text-gray-500 italic">
                  Nenhuma movimentação registrada neste dia.
                </p>
              ) : (
                <table className="w-full border-collapse text-[11px]">
                  <thead>
                    <tr>
                      {[
                        "Horário",
                        "Tipo",
                        "Mercadoria / Descrição",
                        "Peso",
                        "V. Unit.",
                        "V. Total",
                        "Cliente",
                        "Pagamento",
                      ].map((h) => (
                        <th
                          key={h}
                          className="border border-gray-300 bg-gray-100 font-bold uppercase tracking-wide py-1 px-1.5 text-left"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {movimentosOrdenados.map((mv) => {
                      const isEntradaOuSaida =
                        mv.tipo === "despesa" || mv.tipo === "sangria";
                      return (
                        <tr key={mv.id}>
                          <td className="border border-gray-300 py-1 px-1.5 whitespace-nowrap">
                            {formatHorario(mv.data)}
                          </td>
                          <td className="border border-gray-300 py-1 px-1.5 capitalize">
                            {mv.tipo}
                          </td>
                          <td className="border border-gray-300 py-1 px-1.5">
                            {isEntradaOuSaida
                              ? mv.material
                              : materialLabel(mv.material)}
                          </td>
                          <td className="border border-gray-300 py-1 px-1.5 text-right tabular-nums">
                            {isEntradaOuSaida
                              ? "—"
                              : `${Number(mv.quantidade).toFixed(2)} kg`}
                          </td>
                          <td className="border border-gray-300 py-1 px-1.5 text-right tabular-nums">
                            {isEntradaOuSaida
                              ? "—"
                              : formatCurrency(mv.precoUnitario)}
                          </td>
                          <td className="border border-gray-300 py-1 px-1.5 text-right font-semibold tabular-nums">
                            {mv.tipo === "venda" ? "+" : "-"}
                            {formatCurrency(mv.valorTotal)}
                          </td>
                          <td className="border border-gray-300 py-1 px-1.5">
                            {mv.vendedor || "—"}
                          </td>
                          <td className="border border-gray-300 py-1 px-1.5">
                            {pagamentoLabel(mv.formaPagamento)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Fechamento */}
            <div className="mb-2">
              <p className="text-[11px] font-bold uppercase tracking-wide mb-1.5">
                Fechamento do caixa
              </p>
              {caixa.fechado ? (
                <table className="w-full border-collapse text-[11px]">
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 py-1 px-2 font-semibold w-1/3">
                        Saldo esperado
                      </td>
                      <td className="border border-gray-300 py-1 px-2 tabular-nums">
                        {formatCurrency(caixa.saldoFinal)}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 py-1 px-2 font-semibold">
                        Valor contado na gaveta
                      </td>
                      <td className="border border-gray-300 py-1 px-2 tabular-nums">
                        {formatCurrency(caixa.valorContado)}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 py-1 px-2 font-semibold">
                        Diferença
                      </td>
                      <td className="border border-gray-300 py-1 px-2 font-bold tabular-nums">
                        {formatCurrency(caixa.diferencaFechamento)}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 py-1 px-2 font-semibold">
                        Fechado por
                      </td>
                      <td className="border border-gray-300 py-1 px-2">
                        {caixa.fechadoPor || "—"}
                        {caixa.fechadoEm
                          ? ` em ${new Date(caixa.fechadoEm).toLocaleString("pt-BR")}`
                          : ""}
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <p className="text-xs text-gray-500 italic">
                  Caixa ainda aberto no momento em que este relatório foi gerado
                  — os valores acima podem mudar até o fechamento.
                </p>
              )}
            </div>

            <p className="text-[10px] text-gray-400 text-center border-t border-gray-300 pt-2 mt-5">
              Império Sucata · Gestão — relatório gerado automaticamente pelo
              sistema
            </p>
          </div>
        </>
      )}

      {/* Editar movimentação — mesmo modal usado em OptimizedReports.jsx */}
      {editingMovimento && (
        <TransactionEditModal
          transaction={editingMovimento}
          onSave={handleSaveEditMovimento}
          onClose={() => setEditingMovimento(null)}
        />
      )}
    </div>
  );
};

export default CaixaDiario;
