"use client";

import { useState, useEffect, useRef } from "react";
import {
  Save,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Edit3,
  Trash2,
  User,
  X,
  Search,
  Package,
  Users,
  Plus,
  ChevronDown,
  AlertCircle,
  Zap,
} from "lucide-react";
import { DatePicker } from "./ui/date-picker";
import { useData } from "../contexts/DataContext";
import { addCustomer } from "../lib/firebaseService";

/* ── Componentes base — padrão do sistema ────────────────── */
const Card = ({ children, className = "" }) => (
  <div
    className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}
  >
    {children}
  </div>
);

const Button = ({
  children,
  variant = "default",
  className = "",
  disabled = false,
  type = "button",
  onClick,
  ...props
}) => {
  const base =
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700",
    destructive: "bg-red-600 text-white hover:bg-red-700",
    ghost: "hover:bg-gray-100 text-gray-700",
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${variants[variant]} px-4 py-2 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = ({ className = "", ...props }) => (
  <input
    className={`flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm
                ring-offset-white placeholder:text-gray-400
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600
                focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  />
);

const Label = ({ children, htmlFor, className = "" }) => (
  <label
    htmlFor={htmlFor}
    className={`text-sm font-medium leading-none text-gray-700 ${className}`}
  >
    {children}
  </label>
);

/* ── Helpers ─────────────────────────────────────────────── */
const formatCurrency = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    v || 0,
  );

const useToast = () => {
  const toast = ({
    title,
    description,
    variant = "default",
    className = "",
  }) => {
    const el = document.createElement("div");
    const bg =
      variant === "destructive"
        ? "bg-red-100 border-red-500 text-red-800"
        : className || "bg-green-100 border-green-500 text-green-800";
    el.innerHTML = `<div class="fixed top-4 right-4 z-50 p-4 rounded-lg border ${bg} shadow-lg max-w-sm">
      <div class="font-semibold">${title}</div>
      <div class="text-sm mt-1">${description}</div></div>`;
    document.body.appendChild(el);
    setTimeout(() => document.body.removeChild(el), 4000);
  };
  return { toast };
};

const useSavedNames = () => {
  const [savedNames, setSavedNames] = useState([]);
  useEffect(() => {
    try {
      const s = localStorage.getItem("recycling_saved_names");
      if (s) setSavedNames(JSON.parse(s));
    } catch (_) {}
  }, []);

  const saveName = (name) => {
    if (!name?.trim()) return;
    const t = name.trim();
    setSavedNames((prev) => {
      if (prev.map((n) => n.toLowerCase()).includes(t.toLowerCase()))
        return prev;
      const next = [t, ...prev].slice(0, 20);
      try {
        localStorage.setItem("recycling_saved_names", JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  };
  const removeName = (n) => {
    setSavedNames((prev) => {
      const next = prev.filter((x) => x !== n);
      try {
        localStorage.setItem("recycling_saved_names", JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  };
  return { savedNames, saveName, removeName };
};

/* ── Dados de materiais ──────────────────────────────────── */
const MATERIALS = [
  { value: "ferro", label: "Ferro", color: "bg-gray-600", icon: "⚙️" },
  { value: "aluminio", label: "Alumínio", color: "bg-blue-600", icon: "🔷" },
  { value: "cobre", label: "Cobre", color: "bg-orange-600", icon: "🟠" },
  { value: "cobre_mel", label: "Cobre Mel", color: "bg-amber-600", icon: "🍯" },
  { value: "bronze", label: "Bronze", color: "bg-amber-700", icon: "🥉" },
  { value: "magnesio", label: "Magnésio", color: "bg-slate-600", icon: "⚡" },
  { value: "latinha", label: "Latinha", color: "bg-green-600", icon: "🥫" },
  { value: "panela", label: "Panela", color: "bg-purple-600", icon: "🍳" },
  { value: "bloco2", label: "Bloco 2°", color: "bg-red-600", icon: "🧱" },
  { value: "chapa", label: "Chapa", color: "bg-yellow-600", icon: "📋" },
  {
    value: "perfil pintado",
    label: "Perfil Pintado",
    color: "bg-indigo-600",
    icon: "🎨",
  },
  {
    value: "perfil natural",
    label: "Perfil Natural",
    color: "bg-indigo-500",
    icon: "🔩",
  },
  { value: "bloco", label: "Bloco", color: "bg-pink-600", icon: "🧱" },
  { value: "metal", label: "Metal", color: "bg-gray-700", icon: "🔨" },
  { value: "inox", label: "Inox", color: "bg-blue-700", icon: "✨" },
  { value: "bateria", label: "Bateria", color: "bg-green-700", icon: "🔋" },
  {
    value: "motor_gel",
    label: "Motor Gel",
    color: "bg-purple-700",
    icon: "⚙️",
  },
  { value: "roda", label: "Roda", color: "bg-zinc-800", icon: "⚫" },
  { value: "papelao", label: "Papelão", color: "bg-yellow-700", icon: "📦" },
  {
    value: "papel_branco",
    label: "Papel Branco",
    color: "bg-gray-400",
    icon: "📄",
  },
  { value: "rad_metal", label: "Rad. Metal", color: "bg-rose-600", icon: "🌡️" },
  {
    value: "rad_cobre",
    label: "Rad. Cobre",
    color: "bg-orange-700",
    icon: "🔶",
  },
  {
    value: "rad_chapa",
    label: "Rad. Chapa",
    color: "bg-violet-600",
    icon: "📐",
  },
  { value: "tela", label: "Tela", color: "bg-lime-600", icon: "🕸️" },
  {
    value: "antimonio",
    label: "Antimônio",
    color: "bg-fuchsia-600",
    icon: "💎",
  },
  { value: "cabo_ai", label: "Cabo AI", color: "bg-sky-600", icon: "🔌" },
  {
    value: "tubo_limpo",
    label: "Tubo Limpo",
    color: "bg-teal-600",
    icon: "🚰",
  },
  { value: "chumbo", label: "Chumbo", color: "bg-slate-600", icon: "🔩" },
];

const PAGAMENTOS = [
  { value: "dinheiro", label: "Dinheiro", icon: "💵" },
  { value: "pix", label: "PIX", icon: "📱" },
  { value: "pagamento_divida", label: "Pag. Dívida", icon: "📋" },
];

/* ── Componente principal ────────────────────────────────── */
const TransactionForm = ({
  onSuccess,
  initialType = "compra",
  editingTransaction = null,
  onCancelEdit = null,
}) => {
  // CORREÇÃO: Usar customers do DataContext em vez de criar um listener próprio.
  // O DataContext já mantém um listener ativo para a coleção de clientes.
  // Criar outro listener aqui geraria leituras duplas (ou mais) desnecessárias do Firestore.
  const { addTransaction, editTransaction, deleteTransaction, customers } =
    useData();

  const [formData, setFormData] = useState({
    tipo: initialType,
    material: "ferro",
    quantidade: "",
    precoUnitario: "",
    vendedor: "",
    observacoes: "",
    data: new Date(),
    formaPagamento: "dinheiro",
    numeroTransacao: "",
    clienteId: "",
  });

  const [inventory, setInventory] = useState({});
  const [valorTotal, setValorTotal] = useState(0);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [materialSearch, setMaterialSearch] = useState("");
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);
  const [recentMaterials, setRecentMaterials] = useState([]);
  const materialRef = useRef(null);

  // customers vem do DataContext (linha acima) — não declarar estado local aqui
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const customerRef = useRef(null);

  const { toast } = useToast();
  const { savedNames, saveName } = useSavedNames();

  /* Fecha dropdowns ao clicar fora */
  useEffect(() => {
    const handler = (e) => {
      if (materialRef.current && !materialRef.current.contains(e.target))
        setShowMaterialDropdown(false);
      if (customerRef.current && !customerRef.current.contains(e.target))
        setShowCustomerDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    try {
      const r = localStorage.getItem("recycling_recent_materials");
      if (r) setRecentMaterials(JSON.parse(r));
    } catch (_) {}
  }, []);

  // REMOVIDO: useEffect com subscribeToCustomers — agora vem do DataContext

  useEffect(() => {
    if (editingTransaction) {
      setIsEditing(true);
      setFormData({
        tipo: editingTransaction.tipo || "compra",
        material: editingTransaction.material || "ferro",
        quantidade: String(editingTransaction.quantidade || ""),
        precoUnitario: String(editingTransaction.precoUnitario || ""),
        vendedor: editingTransaction.vendedor || "",
        observacoes: editingTransaction.observacoes || "",
        data: editingTransaction.data
          ? new Date(editingTransaction.data)
          : new Date(),
        formaPagamento: editingTransaction.formaPagamento || "dinheiro",
        numeroTransacao: editingTransaction.numeroTransacao || "",
        clienteId: editingTransaction.clienteId || "",
      });
    }
  }, [editingTransaction]);

  const loadInventory = async () => {
    try {
      const { getInventory } = await import("../lib/firebaseService");
      const inv = await getInventory();
      setInventory(inv);
      return inv;
    } catch (_) {
      const inv = JSON.parse(
        localStorage.getItem("recycling_inventory") || "{}",
      );
      setInventory(inv);
      return inv;
    }
  };

  const updatePrice = (tipo, material, inv) => {
    const price = inv?.[material]
      ? (tipo === "compra"
          ? inv[material].precoCompra
          : inv[material].precoVenda) || 0
      : 0;
    setFormData((p) => ({ ...p, precoUnitario: price.toString() }));
  };

  useEffect(() => {
    loadInventory().then((inv) =>
      updatePrice(formData.tipo, formData.material, inv),
    );
  }, [formData.tipo, formData.material]);

  useEffect(() => {
    const q = parseFloat(formData.quantidade) || 0;
    const p = parseFloat(formData.precoUnitario) || 0;
    setValorTotal(q * p);
  }, [formData.quantidade, formData.precoUnitario]);

  const saveRecentMaterial = (m) => {
    setRecentMaterials((prev) => {
      const next = [m, ...prev.filter((x) => x !== m)].slice(0, 5);
      try {
        localStorage.setItem(
          "recycling_recent_materials",
          JSON.stringify(next),
        );
      } catch (_) {}
      return next;
    });
  };

  const handleInputChange = (field, value) => {
    setFormData((p) => ({ ...p, [field]: value }));
    if ((field === "material" || field === "tipo") && value) {
      loadInventory().then((inv) =>
        updatePrice(
          field === "tipo" ? value : formData.tipo,
          field === "material" ? value : formData.material,
          inv,
        ),
      );
      if (field === "material") {
        saveRecentMaterial(value);
        setMaterialSearch("");
        setShowMaterialDropdown(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      tipo: "compra",
      material: "ferro",
      quantidade: "",
      precoUnitario: "",
      vendedor: "",
      observacoes: "",
      data: new Date(),
      formaPagamento: "dinheiro",
      numeroTransacao: "",
      clienteId: "",
    });
    setIsEditing(false);
    setSelectedCustomer(null);
    setCustomerSearch("");
    loadInventory().then((inv) => updatePrice("compra", "ferro", inv));
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    onCancelEdit?.();
    resetForm();
  };

  const handleDeleteTransaction = async () => {
    if (!editingTransaction?.id) return;
    try {
      setSaving(true);
      await deleteTransaction(editingTransaction.id);
      toast({
        title: "Transação Excluída!",
        description: "Removida com sucesso.",
        className: "bg-green-100 border-green-500 text-green-800",
      });
      setShowDeleteConfirm(false);
      onCancelEdit?.();
      resetForm();
    } catch (_) {
      toast({
        title: "Erro ao Excluir",
        description: "Não foi possível excluir.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.quantidade || !formData.precoUnitario) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha quantidade e preço/kg.",
        variant: "destructive",
      });
      return;
    }
    const quantidade = Number(parseFloat(formData.quantidade).toFixed(3));
    const precoUnitario = Number(parseFloat(formData.precoUnitario).toFixed(3));
    if (quantidade <= 0 || precoUnitario <= 0) {
      toast({
        title: "Valores inválidos",
        description: "Quantidade e preço devem ser maiores que zero.",
        variant: "destructive",
      });
      return;
    }
    if (formData.tipo === "venda" && !isEditing) {
      const stock = Number(
        (inventory[formData.material]?.quantidade || 0).toFixed(3),
      );
      if (quantidade > stock) {
        // CORREÇÃO: Para datas retroativas (transação no passado), o estoque atual
        // pode não refletir a realidade histórica — a venda pode ter ocorrido quando
        // havia mais estoque. Bloqueamos apenas vendas com data de HOJE ou futuro.
        // Para o passado, exibimos aviso mas permitimos o registro.
        const transactionDate =
          formData.data instanceof Date
            ? formData.data
            : new Date(formData.data);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        const isPastTransaction = transactionDate < today;

        if (!isPastTransaction) {
          // Data de hoje ou futura: bloquear normalmente
          toast({
            title: "Estoque insuficiente",
            description: `Disponível: ${stock.toFixed(3)} kg · Solicitado: ${quantidade.toFixed(3)} kg`,
            variant: "destructive",
          });
          return;
        } else {
          // Data retroativa: apenas avisar, não bloquear
          toast({
            title: "⚠️ Atenção: Estoque atual insuficiente",
            description: `Estoque atual: ${stock.toFixed(3)} kg · Solicitado: ${quantidade.toFixed(3)} kg. Transação retroativa registrada assim mesmo.`,
            variant: "default",
            className: "bg-yellow-50 border-yellow-400 text-yellow-900",
          });
          // Não retorna — permite continuar
        }
      }
    }
    try {
      setSaving(true);
      // CORREÇÃO: preservar a hora exata escolhida pelo usuário no DatePicker.
      // O setHours(12) anterior forçava meio-dia e apagava o horário real da transação.
      // Usamos meio-dia apenas como fallback quando não há componente de hora definido.
      const transactionDate =
        formData.data instanceof Date ? formData.data : new Date(formData.data);
      // Se a data não tiver hora definida (vem de date-only picker), usa meio-dia local
      // para evitar que UTC-3 jogue a data para o dia anterior (00:00 local - 3h = 21h anterior UTC).
      if (
        transactionDate.getHours() === 0 &&
        transactionDate.getMinutes() === 0
      ) {
        transactionDate.setHours(12, 0, 0, 0);
      }
      const valorTotalFinal = Number((quantidade * precoUnitario).toFixed(3));
      const transaction = {
        ...formData,
        quantidade,
        precoUnitario,
        valorTotal: valorTotalFinal,
        data: transactionDate,
        clienteId: selectedCustomer?.id || formData.clienteId || "",
      };

      if (formData.vendedor?.trim()) saveName(formData.vendedor.trim());
      saveRecentMaterial(formData.material);

      if (isEditing && editingTransaction?.id) {
        await editTransaction(editingTransaction.id, transaction);
        if (formData.clienteId) {
          const { updateCustomerBalance } =
            await import("../lib/firebaseService");
          if (formData.formaPagamento === "pagamento_divida")
            await updateCustomerBalance(
              formData.clienteId,
              valorTotalFinal,
              "pagamento",
            );
        }
        toast({
          title: "Transação Atualizada!",
          description: "Alterações salvas com sucesso.",
          className: "bg-green-100 border-green-500 text-green-800",
        });
        onCancelEdit?.();
      } else {
        await addTransaction(transaction);
        if (
          formData.clienteId &&
          formData.formaPagamento === "pagamento_divida"
        ) {
          const { updateCustomerBalance } =
            await import("../lib/firebaseService");
          await updateCustomerBalance(
            formData.clienteId,
            valorTotalFinal,
            "pagamento",
          );
        }
        toast({
          title: "Transação Registrada!",
          description: `${formData.tipo === "compra" ? "Compra" : "Venda"} de ${quantidade.toFixed(3)} kg — ${formatCurrency(valorTotalFinal)}`,
          className: "bg-green-100 border-green-500 text-green-800",
        });
      }

      await loadInventory();
      if (!isEditing) {
        setFormData((p) => ({
          ...p,
          quantidade: "",
          vendedor: "",
          observacoes: "",
          data: new Date(),
          formaPagamento: "dinheiro",
          numeroTransacao: "",
        }));
        const inv = await loadInventory();
        updatePrice(formData.tipo, formData.material, inv);
      } else {
        resetForm();
      }
    } catch (err) {
      toast({
        title: "Erro ao Salvar",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndContinue = async (e) => {
    e.preventDefault();
    await handleSubmit(e);
    setFormData((p) => ({
      ...p,
      quantidade: "",
      vendedor: "",
      observacoes: "",
      numeroTransacao: "",
    }));
    setTimeout(() => document.getElementById("quantidade")?.focus(), 100);
  };

  /* ── Dados derivados ─────────────────────────────────────── */
  const selectedMaterial = MATERIALS.find((m) => m.value === formData.material);
  const filteredMaterials = MATERIALS.filter((m) =>
    m.label.toLowerCase().includes(materialSearch.toLowerCase()),
  );
  const recentObjs = recentMaterials
    .map((v) => MATERIALS.find((m) => m.value === v))
    .filter(Boolean);
  const filteredCustomers = customers.filter((c) =>
    c.nome.toLowerCase().includes(customerSearch.toLowerCase()),
  );
  const currentStock = inventory[formData.material]?.quantidade || 0;
  const profitMargin =
    formData.tipo === "venda" && inventory[formData.material]?.precoCompra
      ? (parseFloat(formData.precoUnitario) || 0) -
        (inventory[formData.material].precoCompra || 0)
      : 0;

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-10">
      {/* ── Cabeçalho ─────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isEditing
                ? "bg-blue-600"
                : formData.tipo === "venda"
                  ? "bg-green-600"
                  : "bg-red-500"
            }`}
          >
            {isEditing ? (
              <Edit3 size={18} className="text-white" />
            ) : formData.tipo === "venda" ? (
              <TrendingUp size={18} className="text-white" />
            ) : (
              <TrendingDown size={18} className="text-white" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              {isEditing ? "Editar Transação" : "Nova Transação"}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Registre compras e vendas de materiais
            </p>
          </div>
        </div>

        {/* Preview do total */}
        {valorTotal > 0 && (
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
              formData.tipo === "venda"
                ? "border-green-200 bg-green-50"
                : "border-red-200 bg-red-50"
            }`}
          >
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Total
            </span>
            <span
              className={`text-lg font-bold tabular-nums ${
                formData.tipo === "venda" ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatCurrency(valorTotal)}
            </span>
          </div>
        )}
      </div>

      {/* ── Modal confirmar exclusão ──────────────────────── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 size={18} className="text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Confirmar Exclusão
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              Esta ação remove permanentemente a transação e não pode ser
              desfeita.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={handleDeleteTransaction}
                disabled={saving}
                className="flex-1 bg-red-600 hover:bg-red-700 h-10"
              >
                {saving ? "Excluindo..." : "Sim, Excluir"}
              </Button>
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                variant="outline"
                className="flex-1 h-10"
              >
                Cancelar
              </Button>
            </div>
          </Card>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ── Card principal ────────────────────────────────── */}
        <Card className="overflow-hidden">
          {/* Barra colorida no topo */}
          <div
            className={`h-1 ${
              formData.tipo === "venda"
                ? "bg-gradient-to-r from-green-500 to-green-400"
                : "bg-gradient-to-r from-red-500 to-red-400"
            }`}
          />

          <div className="p-5 space-y-5">
            {/* ── Tipo: Compra / Venda ──────────────────────── */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  value: "compra",
                  label: "Compra",
                  Icon: TrendingDown,
                  active: "border-red-500 bg-red-50 shadow-sm",
                  iconColor: "text-red-600",
                  textColor: "text-red-700",
                },
                {
                  value: "venda",
                  label: "Venda",
                  Icon: TrendingUp,
                  active: "border-green-500 bg-green-50 shadow-sm",
                  iconColor: "text-green-600",
                  textColor: "text-green-700",
                },
              ].map(({ value, label, Icon, active, iconColor, textColor }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleInputChange("tipo", value)}
                  className={`h-14 rounded-xl border-2 transition-all flex items-center justify-center gap-2 font-semibold ${
                    formData.tipo === value
                      ? active
                      : "border-gray-200 bg-white hover:border-gray-300 text-gray-500"
                  }`}
                >
                  <Icon
                    size={18}
                    className={
                      formData.tipo === value ? iconColor : "text-gray-400"
                    }
                  />
                  <span
                    className={
                      formData.tipo === value ? textColor : "text-gray-600"
                    }
                  >
                    {label}
                  </span>
                </button>
              ))}
            </div>

            {/* ── Seleção de material ───────────────────────── */}
            <div className="space-y-2" ref={materialRef}>
              <Label className="flex items-center gap-1.5">
                <Package size={13} className="text-gray-400" />
                Material <span className="text-red-400">*</span>
              </Label>

              <button
                type="button"
                onClick={() => setShowMaterialDropdown((s) => !s)}
                className={`w-full h-11 px-3 rounded-md border-2 bg-white flex items-center gap-3
                            transition-all text-left font-medium text-sm
                            ${
                              showMaterialDropdown
                                ? "border-blue-500 ring-2 ring-blue-100"
                                : "border-gray-300 hover:border-gray-400"
                            }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg ${selectedMaterial?.color} flex items-center justify-center text-sm flex-shrink-0`}
                >
                  {selectedMaterial?.icon}
                </div>
                <span className="flex-1 text-gray-800">
                  {selectedMaterial?.label}
                </span>
                {/* Estoque do material */}
                {currentStock > 0 && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 flex-shrink-0">
                    {currentStock.toFixed(2)} kg
                  </span>
                )}
                <ChevronDown
                  size={15}
                  className={`text-gray-400 flex-shrink-0 transition-transform ${showMaterialDropdown ? "rotate-180" : ""}`}
                />
              </button>

              {showMaterialDropdown && (
                <div className="border border-gray-200 rounded-lg shadow-lg bg-white overflow-hidden z-50 relative">
                  {/* Busca */}
                  <div className="p-2 border-b border-gray-100 bg-gray-50">
                    <div className="relative">
                      <Search
                        size={13}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="text"
                        value={materialSearch}
                        onChange={(e) => setMaterialSearch(e.target.value)}
                        placeholder="Buscar material..."
                        className="w-full h-8 pl-7 pr-3 text-sm bg-white rounded border border-gray-200
                                   focus:outline-none focus:border-blue-400"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Recentes */}
                  {recentObjs.length > 0 && !materialSearch && (
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                        Recentes
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {recentObjs.map((m) => (
                          <button
                            key={m.value}
                            type="button"
                            onClick={() => {
                              handleInputChange("material", m.value);
                              setShowMaterialDropdown(false);
                            }}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium
                                       border border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 transition-colors"
                          >
                            <span>{m.icon}</span>
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Grid de materiais */}
                  <div className="max-h-56 overflow-y-auto p-2 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {filteredMaterials.map((m) => (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => {
                          handleInputChange("material", m.value);
                          setShowMaterialDropdown(false);
                        }}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-sm transition-all
                                    ${
                                      formData.material === m.value
                                        ? "border-blue-400 bg-blue-50"
                                        : "border-gray-100 bg-white hover:border-gray-300 hover:bg-gray-50"
                                    }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg ${m.color} flex items-center justify-center text-sm flex-shrink-0`}
                        >
                          {m.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 text-xs truncate">
                            {m.label}
                          </p>
                          {inventory[m.value] && (
                            <p className="text-[10px] text-blue-600 font-medium">
                              {inventory[m.value].quantidade.toFixed(2)} kg
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Quantidade, Preço, Total ──────────────────── */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="quantidade">
                  Quantidade (kg) <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="quantidade"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.quantidade}
                  onChange={(e) =>
                    handleInputChange("quantidade", e.target.value)
                  }
                  className="h-11 font-semibold text-base"
                  placeholder="0,00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="precoUnitario">
                  Preço/kg (R$) <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="precoUnitario"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.precoUnitario}
                  onChange={(e) =>
                    handleInputChange("precoUnitario", e.target.value)
                  }
                  className="h-11 font-semibold text-base"
                  placeholder="0,00"
                />
              </div>

              <div className="space-y-2">
                <Label>Valor Total</Label>
                <div
                  className={`h-11 rounded-md border-2 px-3 flex items-center justify-center
                                 font-bold text-base ${
                                   formData.tipo === "venda"
                                     ? "bg-green-50 border-green-300 text-green-700"
                                     : "bg-red-50 border-red-300 text-red-700"
                                 }`}
                >
                  {formatCurrency(valorTotal)}
                </div>
              </div>
            </div>

            {/* Margem de lucro (só na venda) */}
            {profitMargin > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200">
                <Zap size={14} className="text-green-600 flex-shrink-0" />
                <span className="text-sm text-gray-700">Margem: </span>
                <span className="text-sm font-bold text-green-600">
                  {formatCurrency(profitMargin)}/kg
                </span>
              </div>
            )}

            {/* Aviso estoque baixo (compras) */}
            {formData.tipo === "venda" &&
              currentStock > 0 &&
              (parseFloat(formData.quantidade) || 0) > currentStock && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
                  <AlertCircle
                    size={14}
                    className="text-red-600 flex-shrink-0"
                  />
                  <span className="text-sm text-red-700 font-medium">
                    Estoque insuficiente — disponível:{" "}
                    <strong>{currentStock.toFixed(2)} kg</strong>
                  </span>
                </div>
              )}

            {/* ── Pagamento + Data ──────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Forma de Pagamento</Label>
                <div className="flex gap-2 flex-wrap">
                  {PAGAMENTOS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => {
                        handleInputChange("formaPagamento", p.value);
                        if (p.value !== "pix")
                          handleInputChange("numeroTransacao", "");
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium
                                  transition-all ${
                                    formData.formaPagamento === p.value
                                      ? "bg-gray-900 text-white border-gray-900"
                                      : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                                  }`}
                    >
                      <span>{p.icon}</span>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>
                  Data <span className="text-red-400">*</span>
                </Label>
                <DatePicker
                  selected={formData.data}
                  onSelect={(d) => handleInputChange("data", d)}
                  placeholder="Data"
                  className="w-full h-10 text-sm border-2"
                />
              </div>
            </div>

            {/* ── Vendedor / Cliente ────────────────────────── */}
            <div className="space-y-2" ref={customerRef}>
              <Label className="flex items-center gap-1.5">
                <Users size={13} className="text-gray-400" />
                {formData.tipo === "compra"
                  ? "Vendedor / Fornecedor"
                  : "Cliente"}
              </Label>

              <button
                type="button"
                onClick={() => setShowCustomerDropdown((s) => !s)}
                className={`w-full h-10 px-3 rounded-md border text-sm font-medium bg-white
                            flex items-center gap-2 text-left transition-all
                            ${
                              showCustomerDropdown
                                ? "border-blue-500 ring-2 ring-blue-100"
                                : "border-gray-300 hover:border-gray-400"
                            }`}
              >
                {selectedCustomer ? (
                  <>
                    <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {selectedCustomer.nome.charAt(0).toUpperCase()}
                    </div>
                    <span className="flex-1 text-gray-800">
                      {selectedCustomer.nome}
                    </span>
                    {selectedCustomer.saldo < 0 && (
                      <span className="text-xs font-semibold text-red-600 px-2 py-0.5 rounded-full bg-red-50 flex-shrink-0">
                        {formatCurrency(selectedCustomer.saldo)}
                      </span>
                    )}
                  </>
                ) : formData.vendedor ? (
                  <>
                    <User size={15} className="text-gray-400 flex-shrink-0" />
                    <span className="flex-1 text-gray-700">
                      {formData.vendedor}
                    </span>
                  </>
                ) : (
                  <>
                    <Search size={15} className="text-gray-400 flex-shrink-0" />
                    <span className="text-gray-400 font-normal">
                      Selecionar ou digitar nome...
                    </span>
                  </>
                )}
                <ChevronDown
                  size={14}
                  className={`text-gray-400 flex-shrink-0 transition-transform ${showCustomerDropdown ? "rotate-180" : ""}`}
                />
              </button>

              {showCustomerDropdown && (
                <div className="border border-gray-200 rounded-lg shadow-lg bg-white overflow-hidden z-50 relative">
                  <div className="p-2 border-b border-gray-100 bg-gray-50">
                    <div className="relative">
                      <Search
                        size={13}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="text"
                        value={customerSearch}
                        onChange={(e) => {
                          setCustomerSearch(e.target.value);
                          handleInputChange("vendedor", e.target.value);
                        }}
                        placeholder="Buscar ou digitar nome..."
                        className="w-full h-8 pl-7 pr-3 text-sm bg-white rounded border border-gray-200
                                   focus:outline-none focus:border-blue-400"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="max-h-48 overflow-y-auto">
                    {filteredCustomers.length > 0 && (
                      <div className="p-1.5">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 py-1">
                          Clientes Cadastrados
                        </p>
                        {filteredCustomers.slice(0, 8).map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedCustomer(c);
                              handleInputChange("vendedor", c.nome);
                              handleInputChange("clienteId", c.id);
                              setShowCustomerDropdown(false);
                              setCustomerSearch("");
                            }}
                            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg
                                       hover:bg-blue-50 transition-colors text-left"
                          >
                            <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {c.nome.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">
                                {c.nome}
                              </p>
                              {c.telefone && (
                                <p className="text-xs text-gray-400">
                                  {c.telefone}
                                </p>
                              )}
                            </div>
                            {c.saldo !== 0 && (
                              <span
                                className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                                  c.saldo < 0
                                    ? "bg-red-100 text-red-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {formatCurrency(c.saldo)}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Nomes recentes sem cadastro */}
                    {savedNames.filter(
                      (n) =>
                        n
                          .toLowerCase()
                          .includes(customerSearch.toLowerCase()) &&
                        !customers.some(
                          (c) => c.nome.toLowerCase() === n.toLowerCase(),
                        ),
                    ).length > 0 && (
                      <div className="p-1.5 border-t border-gray-100">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 py-1">
                          Nomes Recentes
                        </p>
                        {savedNames
                          .filter(
                            (n) =>
                              n
                                .toLowerCase()
                                .includes(customerSearch.toLowerCase()) &&
                              !customers.some(
                                (c) => c.nome.toLowerCase() === n.toLowerCase(),
                              ),
                          )
                          .slice(0, 4)
                          .map((name, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                setSelectedCustomer(null);
                                handleInputChange("vendedor", name);
                                handleInputChange("clienteId", "");
                                setShowCustomerDropdown(false);
                                setCustomerSearch("");
                              }}
                              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg
                                       hover:bg-gray-50 transition-colors text-left"
                            >
                              <User
                                size={15}
                                className="text-gray-400 flex-shrink-0"
                              />
                              <span className="text-sm font-medium text-gray-700">
                                {name}
                              </span>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Rodapé do dropdown */}
                  <div className="flex gap-2 p-2 border-t border-gray-100 bg-gray-50">
                    {customerSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(null);
                          handleInputChange("vendedor", customerSearch);
                          handleInputChange("clienteId", "");
                          setShowCustomerDropdown(false);
                          saveName(customerSearch);
                          setCustomerSearch("");
                        }}
                        className="flex-1 h-8 rounded-lg bg-white border border-gray-300 text-xs font-medium
                                   text-gray-700 flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors"
                      >
                        <User size={12} />
                        Usar "{customerSearch}"
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomerDropdown(false);
                        setShowAddCustomerModal(true);
                      }}
                      className="flex-1 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-medium
                                 text-white flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Plus size={12} />
                      Novo Cliente
                    </button>
                  </div>
                </div>
              )}

              {/* Alerta dívida */}
              {selectedCustomer?.saldo < 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
                  <AlertCircle
                    size={13}
                    className="text-red-500 flex-shrink-0"
                  />
                  <p className="text-xs font-medium text-red-700">
                    Cliente com dívida de{" "}
                    {formatCurrency(Math.abs(selectedCustomer.saldo))}
                  </p>
                </div>
              )}
            </div>

            {/* ── Nº PIX ou Observações ─────────────────────── */}
            <div className="space-y-2">
              {formData.formaPagamento === "pix" ? (
                <>
                  <Label htmlFor="numeroTransacao">Nº Transação PIX</Label>
                  <Input
                    id="numeroTransacao"
                    type="text"
                    value={formData.numeroTransacao}
                    onChange={(e) =>
                      handleInputChange("numeroTransacao", e.target.value)
                    }
                    className="h-10"
                    placeholder="E12345..."
                  />
                </>
              ) : (
                <>
                  <Label htmlFor="observacoes">Observações</Label>
                  <Input
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) =>
                      handleInputChange("observacoes", e.target.value)
                    }
                    className="h-10"
                    placeholder="Detalhes adicionais..."
                  />
                </>
              )}
            </div>
          </div>
        </Card>

        {/* ── Botões de ação ────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          {isEditing ? (
            <>
              <Button
                type="submit"
                disabled={saving}
                className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 font-semibold"
              >
                <Edit3 size={15} className="mr-2" />
                {saving ? "Salvando..." : "Salvar Alterações"}
              </Button>
              <Button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="h-11 bg-red-600 hover:bg-red-700 font-semibold"
              >
                <Trash2 size={15} className="mr-2" />
                Excluir
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelEdit}
                className="h-11"
              >
                Cancelar
              </Button>
            </>
          ) : (
            <>
              <Button
                type="submit"
                disabled={saving}
                className={`flex-1 h-11 font-semibold ${
                  formData.tipo === "venda"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-gray-900 hover:bg-gray-800"
                }`}
              >
                <Save size={15} className="mr-2" />
                {saving ? "Salvando..." : "Salvar Transação"}
              </Button>
              <Button
                type="button"
                onClick={handleSaveAndContinue}
                disabled={saving}
                className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 font-semibold"
              >
                <Zap size={15} className="mr-2" />
                Salvar e Continuar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                className="h-11"
              >
                <RotateCcw size={14} className="mr-2" />
                Limpar
              </Button>
            </>
          )}
        </div>
      </form>

      {/* ── Modal Novo Cliente ────────────────────────────── */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Users size={17} className="text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  Novo Cliente
                </h3>
              </div>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const f = e.target;
                const data = {
                  nome: f.customerName.value,
                  telefone: f.customerPhone.value || "",
                  tipo: "pessoa_fisica",
                  saldo: 0,
                };
                try {
                  const id = await addCustomer(data);
                  const nc = { id, ...data };
                  setSelectedCustomer(nc);
                  handleInputChange("vendedor", data.nome);
                  handleInputChange("clienteId", id);
                  setShowAddCustomerModal(false);
                  toast({
                    title: "Cliente Adicionado",
                    description: `${data.nome} cadastrado com sucesso.`,
                    className: "bg-green-100 border-green-500 text-green-800",
                  });
                } catch (_) {
                  toast({
                    title: "Erro",
                    description: "Não foi possível adicionar o cliente.",
                    variant: "destructive",
                  });
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="customerName">
                  Nome <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="customerName"
                  name="customerName"
                  placeholder="Nome do cliente"
                  defaultValue={customerSearch}
                  required
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Telefone</Label>
                <Input
                  id="customerPhone"
                  name="customerPhone"
                  placeholder="(00) 00000-0000"
                  className="h-10"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1 h-10">
                  <Save size={14} className="mr-2" />
                  Salvar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="h-10"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TransactionForm;
