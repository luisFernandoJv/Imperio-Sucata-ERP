"use client";

import { useState } from "react";
import {
  Edit,
  Trash2,
  Calendar,
  User,
  Package,
  DollarSign,
  AlertCircle,
  Receipt,
  HandCoins,
  Tag,
  ShoppingCart,
  TrendingUp,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useData } from "../contexts/DataContext";

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
  size = "default",
  className = "",
  disabled = false,
  onClick,
  ...props
}) => {
  const base =
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700",
    destructive: "bg-red-600 text-white hover:bg-red-700",
    ghost: "hover:bg-gray-100 text-gray-600",
  };
  const sizes = {
    default: "px-4 py-2",
    sm: "px-3 py-1.5 text-xs",
    icon: "h-8 w-8",
  };
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

/* ── Helpers ─────────────────────────────────────────────── */
const formatCurrency = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    v || 0,
  );

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

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

/* ── Mapeamento de materiais ─────────────────────────────── */
const MATERIALS = {
  ferro: { label: "Ferro", color: "bg-gray-600" },
  aluminio: { label: "Alumínio", color: "bg-blue-600" },
  cobre: { label: "Cobre", color: "bg-orange-600" },
  bronze: { label: "Bronze", color: "bg-amber-700" },
  cobre_mel: { label: "Cobre Mel", color: "bg-amber-600" },
  magnesio: { label: "Magnésio", color: "bg-slate-500" },
  latinha: { label: "Latinha", color: "bg-green-600" },
  panela: { label: "Panela", color: "bg-purple-600" },
  bloco2: { label: "Bloco 2°", color: "bg-red-600" },
  chapa: { label: "Chapa", color: "bg-yellow-600" },
  "perfil pintado": { label: "Perfil Pintado", color: "bg-indigo-600" },
  "perfil natural": { label: "Perfil Natural", color: "bg-indigo-500" },
  bloco: { label: "Bloco", color: "bg-pink-600" },
  metal: { label: "Metal", color: "bg-gray-700" },
  inox: { label: "Inox", color: "bg-blue-700" },
  bateria: { label: "Bateria", color: "bg-green-700" },
  motor_gel: { label: "Motor Gel", color: "bg-purple-700" },
  roda: { label: "Roda", color: "bg-zinc-800" },
  papelao: { label: "Papelão", color: "bg-yellow-700" },
  papel_branco: { label: "Papel Branco", color: "bg-gray-400" },
  rad_metal: { label: "Rad. Metal", color: "bg-rose-600" },
  rad_cobre: { label: "Rad. Cobre", color: "bg-orange-700" },
  rad_chapa: { label: "Rad. Chapa", color: "bg-violet-600" },
  tela: { label: "Tela", color: "bg-lime-600" },
  antimonio: { label: "Antimônio", color: "bg-fuchsia-600" },
  cabo_ai: { label: "Cabo AI", color: "bg-sky-600" },
  tubo_limpo: { label: "Tubo Limpo", color: "bg-teal-600" },
  chumbo: { label: "Chumbo", color: "bg-slate-600" },
  despesa: { label: "Despesa", color: "bg-red-500" },
};

/* ── Config por tipo de transação ────────────────────────── */
const TYPE_CONFIG = {
  compra: {
    Icon: ShoppingCart,
    badgeBg: "bg-red-100",
    badgeText: "text-red-800",
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
    borderLeft: "border-l-red-500",
    label: "Compra",
    valueColor: "text-red-600",
    sign: "−",
  },
  venda: {
    Icon: TrendingUp,
    badgeBg: "bg-green-100",
    badgeText: "text-green-800",
    iconBg: "bg-green-50",
    iconColor: "text-green-600",
    borderLeft: "border-l-green-500",
    label: "Venda",
    valueColor: "text-green-600",
    sign: "+",
  },
  despesa_emprestimo: {
    Icon: HandCoins,
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-800",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    borderLeft: "border-l-amber-500",
    label: "Empréstimo",
    valueColor: "text-amber-700",
    sign: "−",
  },
  despesa: {
    Icon: Receipt,
    badgeBg: "bg-rose-100",
    badgeText: "text-rose-800",
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
    borderLeft: "border-l-rose-500",
    label: "Despesa",
    valueColor: "text-rose-600",
    sign: "−",
  },
};

const getTypeKey = (t) => {
  if (t.tipo !== "despesa") return t.tipo;
  const isEmprestimo =
    t.categoria === "emprestimo" ||
    t.observacoes?.toLowerCase().includes("empréstimo");
  return isEmprestimo ? "despesa_emprestimo" : "despesa";
};

/* ── Item da lista ───────────────────────────────────────── */
const TransactionItem = ({ transaction, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const typeKey = getTypeKey(transaction);
  const cfg = TYPE_CONFIG[typeKey] || TYPE_CONFIG.despesa;
  const { Icon } = cfg;
  const isDespesa = transaction.tipo === "despesa";
  const material = MATERIALS[transaction.material] || {
    label: transaction.material || (isDespesa ? "Despesa" : "Outro"),
    color: isDespesa ? "bg-red-500" : "bg-gray-500",
  };

  return (
    <div
      className={`bg-white border-l-4 ${cfg.borderLeft} border border-gray-100
                     rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden`}
    >
      {/* Linha principal */}
      <div className="flex items-center gap-3 p-4">
        {/* Ícone de tipo */}
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.iconBg}`}
        >
          <Icon size={17} className={cfg.iconColor} />
        </div>

        {/* Conteúdo central */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {/* Badge tipo */}
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold
                              ${cfg.badgeBg} ${cfg.badgeText}`}
            >
              {cfg.label}
            </span>

            {/* Nome principal */}
            <span className="font-semibold text-gray-900 text-sm truncate">
              {isDespesa ? transaction.vendedor || "Despesa" : material.label}
            </span>

            {/* Badge material (só transações) */}
            {!isDespesa && (
              <span
                className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold
                                px-2 py-0.5 rounded-full text-white ${material.color}`}
              >
                {material.label}
              </span>
            )}

            {!transaction.synced && (
              <AlertCircle
                size={13}
                className="text-yellow-500 flex-shrink-0"
                title="Não sincronizado"
              />
            )}
          </div>

          {/* Metadados em linha */}
          <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              {formatDate(transaction.data)}
            </span>
            {!isDespesa && transaction.quantidade && (
              <span className="flex items-center gap-1">
                <Package size={11} />
                {Number(transaction.quantidade).toFixed(2)} kg
              </span>
            )}
            {!isDespesa && transaction.precoUnitario && (
              <span className="flex items-center gap-1">
                <Tag size={11} />
                {formatCurrency(transaction.precoUnitario)}/kg
              </span>
            )}
            {transaction.formaPagamento && (
              <span className="flex items-center gap-1 capitalize">
                <DollarSign size={11} />
                {transaction.formaPagamento}
              </span>
            )}
            {transaction.vendedor && !isDespesa && (
              <span className="flex items-center gap-1 truncate max-w-[120px]">
                <User size={11} />
                {transaction.vendedor}
              </span>
            )}
          </div>
        </div>

        {/* Valor */}
        <div className="text-right flex-shrink-0 mr-2">
          <p className={`text-base font-bold tabular-nums ${cfg.valueColor}`}>
            {cfg.sign} {formatCurrency(transaction.valorTotal)}
          </p>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {transaction.observacoes && (
            <button
              onClick={() => setExpanded((s) => !s)}
              className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-gray-100
                         text-gray-400 hover:text-gray-600 transition-colors"
            >
              {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit?.(transaction)}
            className="text-gray-400 hover:text-blue-600 hover:bg-blue-50"
          >
            <Edit size={15} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(transaction)}
            className="text-gray-400 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 size={15} />
          </Button>
        </div>
      </div>

      {/* Observações expansíveis */}
      {expanded && transaction.observacoes && (
        <div className="px-4 pb-3 pt-0 border-t border-gray-50">
          <p className="text-xs text-gray-500 italic flex items-start gap-1.5">
            <AlertCircle
              size={12}
              className="mt-0.5 flex-shrink-0 text-gray-400"
            />
            {transaction.observacoes}
          </p>
        </div>
      )}
    </div>
  );
};

/* ── Componente principal ────────────────────────────────── */
const TransactionsList = ({ onEdit }) => {
  const { transactions, loading, refreshData, deleteTransaction } = useData();
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const { toast } = useToast();

  const handleDelete = async (transaction) => {
    try {
      // CORREÇÃO: Usar deleteTransaction do DataContext (não do firebaseService diretamente).
      // O DataContext atualiza o estado local e o localStorage após a exclusão.
      await deleteTransaction(transaction.id);
      toast({
        title: "Transação excluída",
        description: "Removida com sucesso.",
        className: "bg-green-100 border-green-500 text-green-800",
      });
    } catch (_) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir.",
        variant: "destructive",
      });
    } finally {
      setDeleteConfirm(null);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center p-10 gap-3">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600" />
        <span className="text-sm text-gray-500">Carregando transações...</span>
      </div>
    );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Transações Recentes
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {transactions.length} registro{transactions.length !== 1 ? "s" : ""}{" "}
            encontrado{transactions.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          onClick={refreshData}
          variant="outline"
          size="sm"
          className="gap-1.5"
        >
          <RefreshCw size={13} />
          Atualizar
        </Button>
      </div>

      {/* Lista */}
      {transactions.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Package size={22} className="text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-500">
            Nenhuma transação encontrada
          </p>
          <p className="text-xs text-gray-400 mt-1">
            As transações aparecem aqui em tempo real
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {transactions.map((t) => (
            <TransactionItem
              key={t.id}
              transaction={t}
              onEdit={onEdit}
              onDelete={setDeleteConfirm}
            />
          ))}
        </div>
      )}

      {/* Modal confirmação exclusão */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle size={18} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Excluir Transação?
                </h3>
                <p className="text-xs text-gray-500">
                  Esta ação não pode ser desfeita
                </p>
              </div>
            </div>

            <div className="mb-5 p-3 rounded-lg bg-gray-50 border border-gray-200">
              <p className="text-sm text-gray-700">
                Transação de{" "}
                <span className="font-bold text-gray-900">
                  {formatCurrency(deleteConfirm.valorTotal)}
                </span>
                {deleteConfirm.vendedor && (
                  <>
                    {" "}
                    com{" "}
                    <span className="font-semibold">
                      {deleteConfirm.vendedor}
                    </span>
                  </>
                )}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-10"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="flex-1 h-10"
                onClick={() => handleDelete(deleteConfirm)}
              >
                <Trash2 size={14} className="mr-2" />
                Excluir
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TransactionsList;
