"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Edit,
  Save,
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Scale,
  RefreshCw,
  Wifi,
  WifiOff,
  Search,
  Grid,
  List,
  AlertTriangle,
  Sparkles,
  Printer,
  Download,
  Plus,
  Trash2,
  Lock,
  CheckCircle2,
  PlusCircle,
  Settings,
} from "lucide-react";
import { useData } from "../contexts/DataContext";
import { toast } from "react-toastify";
import {
  addMaterialToInventory,
  deleteMaterialFromInventory,
} from "../lib/firebaseService";
import {
  printInventory,
  exportInventoryToCSV,
} from "../utils/inventoryPrintUtils";

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-lg shadow-md border ${className}`}>
    {children}
  </div>
);

const Button = ({
  children,
  onClick,
  disabled,
  variant = "default",
  size = "default",
  className = "",
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    outline:
      "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500",
    ghost: "text-gray-700 hover:bg-gray-100 focus:ring-blue-500",
  };
  const sizes = {
    default: "px-3 py-2 text-sm min-h-[40px]",
    sm: "px-2 py-1.5 text-xs min-h-[32px]",
    lg: "px-4 py-3 text-base min-h-[48px]",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = ({
  type = "text",
  value,
  onChange,
  placeholder,
  className = "",
  ...props
}) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`w-full px-3 py-2 min-h-[40px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${className}`}
    {...props}
  />
);

const Label = ({ children, className = "", htmlFor }) => (
  <label
    htmlFor={htmlFor}
    className={`block text-sm font-medium text-gray-700 mb-1 ${className}`}
  >
    {children}
  </label>
);

// ─── Modal de Confirmação de Senha ────────────────────────────────────────────
const ADMIN_PASSWORD = "imperio2025";

const PasswordModal = ({ isOpen, onConfirm, onCancel, action }) => {
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (senha !== ADMIN_PASSWORD) {
      setErro("Senha incorreta. Tente novamente.");
      setSenha("");
      return;
    }
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
      setSenha("");
      setErro("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onCancel} />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-amber-100 rounded-xl">
            <Lock className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">
              Confirmação de Segurança
            </h3>
            <p className="text-sm text-slate-500">{action}</p>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Senha do Administrador
          </label>
          <input
            type="password"
            value={senha}
            onChange={(e) => {
              setSenha(e.target.value);
              setErro("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="••••••••••••"
            autoFocus
            className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-sm"
          />
          {erro && (
            <p className="mt-2 text-xs font-semibold text-red-600 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" /> {erro}
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !senha}
            className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 rounded-xl text-sm font-bold text-white transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Confirmar
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Modal de Criar / Editar Material ─────────────────────────────────────────
const CATEGORIES = [
  { key: "ferrosos", name: "Metais Ferrosos" },
  { key: "nao-ferrosos", name: "Metais Não-Ferrosos" },
  { key: "cabos", name: "Cabos e Fios" },
  { key: "tubos", name: "Tubos e Estruturas" },
  { key: "eletronicos", name: "Eletrônicos" },
  { key: "automotivo", name: "Automotivo" },
  { key: "papel", name: "Papel" },
  { key: "outros", name: "Outros" },
];

const ICONS = [
  "⚙️",
  "🔲",
  "📐",
  "🪝",
  "🧱",
  "🔳",
  "🔧",
  "🔶",
  "🍯",
  "⚗️",
  "🔥",
  "⚡",
  "🥤",
  "✨",
  "💎",
  "🔌",
  "🕸️",
  "🚰",
  "🍳",
  "🔩",
  "🔋",
  "🛞",
  "📦",
  "📄",
  "🏭",
  "🪙",
  "🔑",
  "🪣",
];

const MaterialModal = ({ isOpen, onClose, onSave, editingMaterial = null }) => {
  const isEdit = !!editingMaterial;
  const [form, setForm] = useState(
    editingMaterial
      ? {
          key: editingMaterial.key,
          name: editingMaterial.name,
          category: editingMaterial.category,
          icon: editingMaterial.icon || "🔩",
          minStock: editingMaterial.minStock ?? 20,
          precoCompra: editingMaterial.precoCompra ?? 0,
          precoVenda: editingMaterial.precoVenda ?? 0,
        }
      : {
          key: "",
          name: "",
          category: "outros",
          icon: "🔩",
          minStock: 20,
          precoCompra: 0,
          precoVenda: 0,
        },
  );
  const [keyError, setKeyError] = useState("");

  const handleKeyChange = (val) => {
    // normalizar: lowercase, sem acentos problemáticos, underscores para espaços entre palavras únicas
    const clean = val.toLowerCase().replace(/[^a-z0-9_ ]/g, "");
    setForm((f) => ({ ...f, key: clean }));
    setKeyError("");
  };

  const handleNameChange = (val) => {
    setForm((f) => ({ ...f, name: val }));
    // Auto-sugerir chave se ainda vazia
    if (!isEdit && !form.key) {
      const autoKey = val
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");
      setForm((f) => ({ ...f, name: val, key: autoKey }));
    }
  };

  const validate = () => {
    if (!form.key.trim()) {
      setKeyError("Chave obrigatória");
      return false;
    }
    if (!form.name.trim()) {
      setKeyError("Nome obrigatório");
      return false;
    }
    return true;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 overflow-hidden"
      >
        {/* Header */}
        <div
          className={`p-5 ${isEdit ? "bg-blue-600" : "bg-emerald-600"} text-white flex items-center justify-between`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              {isEdit ? (
                <Edit className="h-5 w-5" />
              ) : (
                <PlusCircle className="h-5 w-5" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg">
                {isEdit ? "Editar Material" : "Novo Material"}
              </h3>
              <p className="text-xs text-white/80">
                {isEdit
                  ? `Editando: ${editingMaterial.name}`
                  : "Adicionar ao inventário"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Ícone */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Ícone
            </label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((icon) => (
                <button
                  key={icon}
                  onClick={() => setForm((f) => ({ ...f, icon }))}
                  className={`w-9 h-9 text-xl rounded-lg flex items-center justify-center transition-all ${
                    form.icon === icon
                      ? "bg-blue-100 ring-2 ring-blue-500 scale-110"
                      : "bg-slate-100 hover:bg-slate-200"
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Nome */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Nome *
              </label>
              <input
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ex: Chumbo"
                className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            {/* Chave */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Chave (ID) *
                {!isEdit && (
                  <span className="text-slate-400 font-normal ml-1">auto</span>
                )}
              </label>
              <input
                value={form.key}
                onChange={(e) => handleKeyChange(e.target.value)}
                disabled={isEdit}
                placeholder="Ex: chumbo"
                className={`w-full px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                  isEdit
                    ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed"
                    : "border-slate-200"
                } ${keyError ? "border-red-400" : ""}`}
              />
              {keyError && (
                <p className="text-xs text-red-500 mt-1">{keyError}</p>
              )}
              {!isEdit && (
                <p className="text-[10px] text-slate-400 mt-1">
                  Apenas letras minúsculas, números e _
                </p>
              )}
            </div>
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Categoria
            </label>
            <select
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value }))
              }
              className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Estoque mínimo */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Mín. Estoque (kg)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.minStock}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    minStock: Number(e.target.value) || 0,
                  }))
                }
                className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            {/* Preço Compra */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Preço Compra (R$/kg)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.precoCompra}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    precoCompra: Number(e.target.value) || 0,
                  }))
                }
                className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            {/* Preço Venda */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Preço Venda (R$/kg)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.precoVenda}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    precoVenda: Number(e.target.value) || 0,
                  }))
                }
                className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          {form.precoCompra > 0 && form.precoVenda > 0 && (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-sm">
              <span className="text-emerald-700 font-semibold">
                Margem estimada:{" "}
                {(
                  ((form.precoVenda - form.precoCompra) / form.precoVenda) *
                  100
                ).toFixed(1)}
                %
              </span>
              <span className="text-emerald-600 text-xs ml-2">
                (R$ {(form.precoVenda - form.precoCompra).toFixed(2)}/kg de
                lucro)
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 flex gap-3 bg-slate-50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              if (validate()) onSave(form);
            }}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-colors flex items-center justify-center gap-2 ${
              isEdit
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            <Lock className="h-4 w-4" />
            {isEdit ? "Salvar Alterações" : "Criar Material"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const Inventory = () => {
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [viewMode, setViewMode] = useState("grid");
  const [showLowStock, setShowLowStock] = useState(false);
  const [editingMinLevel, setEditingMinLevel] = useState(null);
  const [minLevelForm, setMinLevelForm] = useState({});

  // ── Gestão dinâmica de materiais ──
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [editingMaterialMeta, setEditingMaterialMeta] = useState(null); // null = novo
  const [pendingAction, setPendingAction] = useState(null); // { type, data, description }
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  // Lista de materiais dinâmica: começa com os hardcoded + materiais extras do inventário
  const [customMaterials, setCustomMaterials] = useState([]);

  const dataContext = useData();
  const {
    inventory = {},
    firebaseConnected = false,
    syncing: globalSyncing = false,
    lastSyncTime = null,
    updateInventory,
    refreshData,
  } = dataContext || {};

  const materials = [
    // Metais Ferrosos
    {
      key: "ferro",
      name: "Ferro",
      category: "ferrosos",
      color: "bg-gray-100",
      icon: "⚙️",
      minStock: 100,
    },
    {
      key: "chapa",
      name: "Chapa",
      category: "ferrosos",
      color: "bg-gray-200",
      icon: "🔲",
      minStock: 50,
    },
    {
      key: "perfil pintado",
      name: "Perfil pintado",
      category: "ferrosos",
      color: "bg-gray-300",
      icon: "📐",
      minStock: 30,
    },
    {
      key: "perfil natural",
      name: "Perfil natural",
      category: "ferrosos",
      color: "bg-gray-300",
      icon: "🪝",
      minStock: 30,
    },
    {
      key: "bloco",
      name: "Bloco",
      category: "ferrosos",
      color: "bg-gray-400",
      icon: "🧱",
      minStock: 20,
    },
    {
      key: "bloco2",
      name: "Bloco 2°",
      category: "ferrosos",
      color: "bg-gray-500",
      icon: "🔳",
      minStock: 15,
    },
    {
      key: "rad_chapa",
      name: "Rad. Chapa",
      category: "ferrosos",
      color: "bg-gray-600",
      icon: "🔧",
      minStock: 25,
    },

    // Metais Não-Ferrosos
    {
      key: "aluminio",
      name: "Alumínio",
      category: "nao-ferrosos",
      color: "bg-blue-100",
      icon: "🔧",
      minStock: 80,
    },
    {
      key: "cobre",
      name: "Cobre",
      category: "nao-ferrosos",
      color: "bg-orange-100",
      icon: "🔶",
      minStock: 50,
    },
    {
      key: "bronze",
      name: "Bronze",
      category: "nao-ferrosos",
      color: "bg-orange-100",
      icon: "🔶",
      minStock: 55,
    },
    {
      key: "cobre_mel",
      name: "Cobre Mel",
      category: "nao-ferrosos",
      color: "bg-amber-100",
      icon: "🍯",
      minStock: 40,
    },
    {
      key: "magnesio",
      name: "Magnésio",
      category: "nao-ferrosos",
      color: "bg-slate-100",
      icon: "⚗️",
      minStock: 35,
    },
    {
      key: "rad_cobre",
      name: "Rad. Cobre",
      category: "nao-ferrosos",
      color: "bg-orange-200",
      icon: "🔥",
      minStock: 30,
    },
    {
      key: "rad_metal",
      name: "Rad. Metal",
      category: "nao-ferrosos",
      color: "bg-orange-300",
      icon: "⚡",
      minStock: 35,
    },
    {
      key: "latinha",
      name: "Latinha",
      category: "nao-ferrosos",
      color: "bg-green-100",
      icon: "🥤",
      minStock: 200,
    },
    {
      key: "inox",
      name: "Inox",
      category: "nao-ferrosos",
      color: "bg-silver-100",
      icon: "✨",
      minStock: 30,
    },
    {
      key: "antimonio",
      name: "Antimônio",
      category: "nao-ferrosos",
      color: "bg-purple-100",
      icon: "💎",
      minStock: 10,
    },

    // Cabos e Fios
    {
      key: "cabo_ai",
      name: "Cabo AI",
      category: "cabos",
      color: "bg-yellow-100",
      icon: "🔌",
      minStock: 40,
    },
    {
      key: "tela",
      name: "Tela",
      category: "cabos",
      color: "bg-yellow-200",
      icon: "🕸️",
      minStock: 50,
    },

    // Tubos e Estruturas
    {
      key: "tubo_limpo",
      name: "Tubo Limpo",
      category: "tubos",
      color: "bg-cyan-100",
      icon: "🚰",
      minStock: 20,
    },

    // Outros Materiais
    {
      key: "panela",
      name: "Panela",
      category: "outros",
      color: "bg-yellow-300",
      icon: "🍳",
      minStock: 25,
    },
    {
      key: "metal",
      name: "Metal",
      category: "outros",
      color: "bg-purple-200",
      icon: "🔩",
      minStock: 60,
    },
    {
      key: "bateria",
      name: "Bateria",
      category: "eletronicos",
      color: "bg-red-100",
      icon: "🔋",
      minStock: 40,
    },
    {
      key: "motor_gel",
      name: "Motor Gel",
      category: "eletronicos",
      color: "bg-indigo-100",
      icon: "⚡",
      minStock: 10,
    },
    {
      key: "roda",
      name: "Roda",
      category: "automotivo",
      color: "bg-black-100",
      icon: "🛞",
      minStock: 15,
    },
    {
      key: "papelao",
      name: "Papelão",
      category: "papel",
      color: "bg-brown-100",
      icon: "📦",
      minStock: 100,
    },
    {
      key: "papel_branco",
      name: "Papel branco",
      category: "papel",
      color: "bg-white",
      icon: "📄",
      minStock: 80,
    },
    // Metais Pesados
    {
      key: "chumbo",
      name: "Chumbo",
      category: "nao-ferrosos",
      color: "bg-slate-200",
      icon: "🔩",
      minStock: 20,
    },
  ];

  // Mesclar materiais hardcoded com materiais dinâmicos do Firestore
  // (materiais que existem no inventory mas não estão na lista hardcoded)
  const allMaterials = (() => {
    const hardcodedKeys = new Set(materials.map((m) => m.key));
    const dynamicFromFirestore = Object.keys(inventory)
      .filter((k) => k !== "updatedAt" && !hardcodedKeys.has(k))
      .map((k) => ({
        key: k,
        name: k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        category: "outros",
        color: "bg-purple-100",
        icon: "🔩",
        minStock: 0,
        isDynamic: true,
        ...customMaterials.find((cm) => cm.key === k),
      }));
    return [...materials, ...dynamicFromFirestore];
  })();

  const categories = [
    { key: "todos", name: "Todos os Materiais", icon: "📋" },
    { key: "ferrosos", name: "Metais Ferrosos", icon: "⚙️" },
    { key: "nao-ferrosos", name: "Metais Não-Ferrosos", icon: "🔧" },
    { key: "cabos", name: "Cabos e Fios", icon: "🔌" },
    { key: "tubos", name: "Tubos e Estruturas", icon: "🚰" },
    { key: "eletronicos", name: "Eletrônicos", icon: "🔋" },
    { key: "automotivo", name: "Automotivo", icon: "🛞" },
    { key: "papel", name: "Papel", icon: "📦" },
    { key: "outros", name: "Outros", icon: "📦" },
  ];

  const handleSave = async () => {
    try {
      setSyncing(true);
      await updateInventory(editingItem, editForm);

      setEditingItem(null);
      setEditForm({});

      // Toast simples
      alert("Preços atualizados com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar alterações");
    } finally {
      setSyncing(false);
    }
  };

  const handleEdit = (material) => {
    setEditingItem(material);
    setEditForm(
      inventory[material] || { quantidade: 0, precoCompra: 0, precoVenda: 0 },
    );
  };

  const handleCancel = () => {
    setEditingItem(null);
    setEditForm({});
  };

  const handleEditMinLevel = (material, currentMinLevel) => {
    setEditingMinLevel(material);
    setMinLevelForm({ minLevel: currentMinLevel });
  };

  const handleSaveMinLevel = async () => {
    try {
      // Salvar nível mínimo no Firestore
      const materialRef = doc(db, "inventory_config", editingMinLevel);
      await updateDoc(materialRef, {
        minLevel: Number.parseFloat(minLevelForm.minLevel),
        updatedAt: new Date(),
      });

      toast({
        title: "Nível mínimo atualizado",
        description: `Nível mínimo de ${editingMinLevel} definido para ${minLevelForm.minLevel}kg`,
        className: "bg-green-100 border-green-500 text-green-800",
      });

      setEditingMinLevel(null);
    } catch (error) {
      console.error("Erro ao salvar nível mínimo:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar o nível mínimo",
        variant: "destructive",
      });
    }
  };

  // ── Handlers de gestão dinâmica de materiais ──────────────────────────────

  // Abre o modal de novo material
  const handleOpenNewMaterial = () => {
    setEditingMaterialMeta(null);
    setShowMaterialModal(true);
  };

  // Abre o modal de editar metadados de um material existente
  const handleOpenEditMaterial = (material) => {
    const item = inventory[material.key] || {};
    setEditingMaterialMeta({
      ...material,
      precoCompra: item.precoCompra ?? 0,
      precoVenda: item.precoVenda ?? 0,
    });
    setShowMaterialModal(true);
  };

  // Chamado quando o usuário clica em "Criar Material" ou "Salvar Alterações" no modal
  // → armazena os dados e abre o modal de senha
  const handleMaterialModalSave = (formData) => {
    setShowMaterialModal(false);
    const isEdit = !!editingMaterialMeta;
    setPendingAction({
      type: isEdit ? "edit_material" : "new_material",
      data: formData,
      description: isEdit
        ? `Editar material "${formData.name}"`
        : `Criar novo material "${formData.name}"`,
    });
    setShowPasswordModal(true);
  };

  // Confirmação de senha bem-sucedida → executar ação pendente
  const handlePasswordConfirm = async () => {
    if (!pendingAction) return;

    try {
      if (pendingAction.type === "new_material") {
        const { data } = pendingAction;
        const result = await addMaterialToInventory(data.key, {
          quantidade: 0,
          precoCompra: data.precoCompra,
          precoVenda: data.precoVenda,
        });
        if (result?.success === false && result.reason === "already_exists") {
          toast.error(
            `Material com chave "${data.key}" já existe no inventário.`,
          );
        } else {
          // Adicionar aos customMaterials para refletir na UI sem reload
          setCustomMaterials((prev) => [
            ...prev.filter((m) => m.key !== data.key),
            {
              key: data.key,
              name: data.name,
              category: data.category,
              icon: data.icon,
              minStock: data.minStock,
              isDynamic: true,
            },
          ]);
          toast.success(`✅ Material "${data.name}" criado com sucesso!`);
          await refreshData();
        }
      } else if (pendingAction.type === "edit_material") {
        const { data } = pendingAction;
        // Atualizar preços no Firestore via updateInventory existente
        await updateInventory(data.key, {
          precoCompra: data.precoCompra,
          precoVenda: data.precoVenda,
        });
        // Atualizar metadados locais (nome, ícone, categoria, minStock)
        setCustomMaterials((prev) => [
          ...prev.filter((m) => m.key !== data.key),
          {
            key: data.key,
            name: data.name,
            category: data.category,
            icon: data.icon,
            minStock: data.minStock,
            isDynamic: editingMaterialMeta?.isDynamic ?? false,
          },
        ]);
        toast.success(`✅ Material "${data.name}" atualizado com sucesso!`);
        await refreshData();
      } else if (pendingAction.type === "delete_material") {
        const { data } = pendingAction;
        const result = await deleteMaterialFromInventory(data.key);
        if (result?.success === false && result.reason === "has_stock") {
          toast.error(
            `Não é possível remover "${data.name}": ainda há ${result.quantidade.toFixed(2)}kg em estoque.`,
          );
        } else if (result?.success) {
          setCustomMaterials((prev) => prev.filter((m) => m.key !== data.key));
          toast.success(`🗑️ Material "${data.name}" removido do inventário.`);
          await refreshData();
        }
      }
    } finally {
      setShowPasswordModal(false);
      setPendingAction(null);
      setEditingMaterialMeta(null);
    }
  };

  // Solicita exclusão de material dinâmico
  const handleDeleteMaterial = (material) => {
    setPendingAction({
      type: "delete_material",
      data: material,
      description: `Remover material "${material.name}" do inventário`,
    });
    setShowPasswordModal(true);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0);
  };

  const calculateMargin = (precoCompra, precoVenda) => {
    if (!precoCompra || precoCompra === 0) return 0;
    return ((precoVenda - precoCompra) / precoCompra) * 100;
  };

  const calculateProfit = (quantidade, precoCompra, precoVenda) => {
    return quantidade * (precoVenda - precoCompra);
  };

  const calculateTotalValue = (quantidade, preco) => {
    return quantidade * preco;
  };

  const filteredMaterials = allMaterials.filter((material) => {
    const matchesSearch = material.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "todos" || material.category === selectedCategory;
    const item = inventory[material.key] || { quantidade: 0 };
    const matchesLowStock =
      !showLowStock || item.quantidade <= material.minStock;

    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const isLowStock = (material) => {
    const item = inventory[material.key] || { quantidade: 0 };
    return item.quantidade <= material.minStock;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 lg:space-y-8">
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2"
          >
            Controle de Estoque
          </motion.h1>
          <p className="text-gray-600 text-sm sm:text-base lg:text-lg px-4">
            Gerencie seu estoque e preços de materiais recicláveis
          </p>

          <div className="mt-4 flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4">
            {firebaseConnected ? (
              <div
                className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                role="status"
                aria-label="Status da conexão"
              >
                <Wifi className="h-4 w-4" aria-hidden="true" />
                <span>Conectado</span>
              </div>
            ) : (
              <div
                className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm"
                role="status"
                aria-label="Status da conexão"
              >
                <WifiOff className="h-4 w-4" aria-hidden="true" />
                <span>Modo offline</span>
              </div>
            )}

            {globalSyncing && (
              <div
                className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                role="status"
                aria-label="Status de sincronização"
              >
                <RefreshCw
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
                <span>Sincronizando...</span>
              </div>
            )}

            <Button
              onClick={refreshData}
              disabled={globalSyncing}
              variant="outline"
              size="sm"
              aria-label="Atualizar dados do estoque"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${globalSyncing ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
              Atualizar
            </Button>
          </div>
        </div>

        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Ações de Estoque
            </h3>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleOpenNewMaterial}
                variant="default"
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4" />
                Novo Material
              </Button>
              <Button
                onClick={() => printInventory(inventory, allMaterials)}
                variant="default"
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Imprimir Estoque
              </Button>
              <Button
                onClick={() => exportInventoryToCSV(inventory, allMaterials)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 lg:p-6">
          <div className="space-y-4">
            <div
              className="flex flex-wrap gap-2"
              role="tablist"
              aria-label="Categorias de materiais"
            >
              {categories.map((category) => (
                <Button
                  key={category.key}
                  onClick={() => setSelectedCategory(category.key)}
                  variant={
                    selectedCategory === category.key ? "default" : "outline"
                  }
                  size="sm"
                  className="flex items-center gap-2 text-xs sm:text-sm lg:text-base"
                  role="tab"
                  aria-selected={selectedCategory === category.key}
                  aria-controls="materials-grid"
                >
                  <span aria-hidden="true">{category.icon}</span>
                  <span className="hidden sm:inline">{category.name}</span>
                  <span className="sm:hidden">
                    {category.name.split(" ")[0]}
                  </span>
                </Button>
              ))}
            </div>

            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                <div className="relative flex-1 sm:flex-none">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4"
                    aria-hidden="true"
                  />
                  <Input
                    placeholder="Buscar material..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                    aria-label="Buscar materiais"
                  />
                </div>

                <Button
                  onClick={() => setShowLowStock(!showLowStock)}
                  variant={showLowStock ? "default" : "outline"}
                  size="sm"
                  className="flex items-center gap-2 justify-center"
                  aria-pressed={showLowStock}
                  aria-label={
                    showLowStock
                      ? "Mostrar todos os materiais"
                      : "Mostrar apenas estoque baixo"
                  }
                >
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Estoque Baixo</span>
                  <span className="sm:hidden">Baixo</span>
                </Button>
              </div>

              <div
                className="flex gap-2 justify-center"
                role="radiogroup"
                aria-label="Modo de visualização"
              >
                <Button
                  onClick={() => setViewMode("grid")}
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  role="radio"
                  aria-checked={viewMode === "grid"}
                  aria-label="Visualização em grade"
                >
                  <Grid className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  onClick={() => setViewMode("list")}
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  role="radio"
                  aria-checked={viewMode === "list"}
                  aria-label="Visualização em lista"
                >
                  <List className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <AnimatePresence>
          <div
            id="materials-grid"
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6"
                : "space-y-3 sm:space-y-4"
            }
            role="tabpanel"
            aria-labelledby="category-tabs"
          >
            {filteredMaterials.map((material, index) => {
              const item = inventory[material.key] || {
                quantidade: 0,
                precoCompra: 0,
                precoVenda: 0,
              };
              const isEditing = editingItem === material.key;
              const margin = calculateMargin(item.precoCompra, item.precoVenda);
              const lowStock = isLowStock(material);

              return (
                <motion.div
                  key={material.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  layout
                >
                  <Card
                    className={`p-3 sm:p-4 lg:p-6 ${material.color} border-l-4 ${
                      lowStock
                        ? "border-l-red-500 ring-2 ring-red-200 shadow-red-100"
                        : "border-l-blue-500"
                    } hover:shadow-2xl transition-all duration-300 ${
                      viewMode === "list" ? "flex items-center" : ""
                    } relative overflow-hidden group`}
                    role="article"
                    aria-label={`Material: ${material.name}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    {lowStock && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                        }}
                        className="absolute -top-2 -right-2 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-full p-2 shadow-lg z-10"
                        role="alert"
                        aria-label="Estoque baixo"
                      >
                        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                      </motion.div>
                    )}

                    <div
                      className={`relative z-10 ${viewMode === "list" ? "flex items-center justify-between w-full gap-4" : ""}`}
                    >
                      <div
                        className={`flex items-center justify-between mb-4 ${viewMode === "list" ? "mb-0 flex-1 min-w-0" : ""}`}
                      >
                        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                          <motion.div
                            whileHover={{ scale: 1.2 }}
                            transition={{ duration: 0.3 }}
                            className="bg-gradient-to-br from-white to-slate-50 p-2 rounded-xl shadow-md flex-shrink-0"
                          >
                            <span
                              className="text-xl sm:text-2xl"
                              aria-hidden="true"
                            >
                              {material.icon}
                            </span>
                          </motion.div>
                          <div className="min-w-0">
                            <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent truncate">
                              {material.name}
                            </h3>
                            {lowStock && (
                              <span className="text-xs text-red-600 font-bold flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Estoque Baixo!
                              </span>
                            )}
                          </div>
                        </div>
                        {!isEditing && (
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {/* Botão editar preços */}
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(material.key)}
                                className="bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 border-2 border-blue-200 hover:border-blue-300 shadow-md"
                                aria-label={`Editar preços do ${material.name}`}
                              >
                                <Edit
                                  className="h-4 w-4 mr-1 sm:mr-2 text-blue-600"
                                  aria-hidden="true"
                                />
                                <span className="hidden sm:inline font-semibold text-blue-700">
                                  Editar
                                </span>
                              </Button>
                            </motion.div>

                            {/* Botão configurar material (nome/ícone/categoria) */}
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenEditMaterial(material)}
                                className="bg-gradient-to-r from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 border-2 border-purple-200 hover:border-purple-300 shadow-md"
                                aria-label={`Configurar ${material.name}`}
                                title="Configurar material"
                              >
                                <Settings
                                  className="h-4 w-4 text-purple-600"
                                  aria-hidden="true"
                                />
                              </Button>
                            </motion.div>

                            {/* Botão excluir — somente materiais dinâmicos criados pelo usuário */}
                            {material.isDynamic && (
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteMaterial(material)}
                                  className="bg-gradient-to-r from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 border-2 border-red-200 hover:border-red-300 shadow-md"
                                  aria-label={`Remover ${material.name}`}
                                  title="Remover material"
                                >
                                  <Trash2
                                    className="h-4 w-4 text-red-600"
                                    aria-hidden="true"
                                  />
                                </Button>
                              </motion.div>
                            )}
                          </div>
                        )}
                      </div>

                      {viewMode === "grid" && (
                        <>
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="mb-4 sm:mb-6 p-4 sm:p-5 bg-gradient-to-br from-white via-slate-50 to-blue-50 rounded-xl shadow-lg border-2 border-slate-200"
                          >
                            <div className="flex items-center justify-center">
                              <Scale
                                className="h-6 sm:h-8 w-6 sm:w-8 text-blue-600 mr-2 sm:mr-3 flex-shrink-0"
                                aria-hidden="true"
                              />
                              <div className="text-center min-w-0">
                                <p className="text-xs sm:text-sm font-semibold text-slate-600">
                                  Estoque Atual
                                </p>
                                <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent truncate">
                                  {item.quantidade.toFixed(2)} kg
                                </p>
                                <p className="text-xs text-slate-500 font-medium mt-1">
                                  Mín: {material.minStock} kg
                                </p>
                              </div>
                            </div>
                          </motion.div>

                          {isEditing ? (
                            <div className="space-y-4">
                              {/* Modo de Edição com melhor acessibilidade */}
                              <div className="grid grid-cols-1 gap-4">
                                <div>
                                  <Label htmlFor={`compra-${material.key}`}>
                                    Preço de Compra (R$/kg)
                                  </Label>
                                  <Input
                                    id={`compra-${material.key}`}
                                    type="number"
                                    step="0.01"
                                    value={editForm.precoCompra || ""}
                                    onChange={(e) =>
                                      setEditForm({
                                        ...editForm,
                                        precoCompra:
                                          Number.parseFloat(e.target.value) ||
                                          0,
                                      })
                                    }
                                    aria-describedby={`compra-help-${material.key}`}
                                  />
                                  <p
                                    id={`compra-help-${material.key}`}
                                    className="sr-only"
                                  >
                                    Digite o preço de compra por quilograma
                                  </p>
                                </div>
                                <div>
                                  <Label htmlFor={`venda-${material.key}`}>
                                    Preço de Venda (R$/kg)
                                  </Label>
                                  <Input
                                    id={`venda-${material.key}`}
                                    type="number"
                                    step="0.01"
                                    value={editForm.precoVenda || ""}
                                    onChange={(e) =>
                                      setEditForm({
                                        ...editForm,
                                        precoVenda:
                                          Number.parseFloat(e.target.value) ||
                                          0,
                                      })
                                    }
                                    aria-describedby={`venda-help-${material.key}`}
                                  />
                                  <p
                                    id={`venda-help-${material.key}`}
                                    className="sr-only"
                                  >
                                    Digite o preço de venda por quilograma
                                  </p>
                                </div>
                                <div>
                                  <Label htmlFor={`minLevel-${material.key}`}>
                                    Nível Mínimo de Estoque (kg)
                                  </Label>
                                  <Input
                                    id={`minLevel-${material.key}`}
                                    type="number"
                                    step="0.1"
                                    value={
                                      editForm.minLevel || material.minStock
                                    }
                                    onChange={(e) =>
                                      setEditForm({
                                        ...editForm,
                                        minLevel:
                                          Number.parseFloat(e.target.value) ||
                                          0,
                                      })
                                    }
                                  />
                                  <p className="text-xs text-gray-500 mt-1">
                                    Você será notificado quando o estoque
                                    atingir este nível
                                  </p>
                                </div>
                              </div>

                              <div className="flex space-x-2">
                                <Button
                                  onClick={handleSave}
                                  disabled={syncing}
                                  className="flex-1 bg-green-600 hover:bg-green-700"
                                  aria-label={`Salvar alterações para ${material.name}`}
                                >
                                  <Save
                                    className="h-4 w-4 mr-2"
                                    aria-hidden="true"
                                  />
                                  {syncing ? "Salvando..." : "Salvar"}
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={handleCancel}
                                  aria-label="Cancelar edição"
                                >
                                  <X className="h-4 w-4" aria-hidden="true" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 gap-4">
                                <motion.div
                                  whileHover={{ scale: 1.02, x: 4 }}
                                  className="bg-gradient-to-br from-red-50 via-white to-rose-50 p-3 sm:p-4 rounded-xl shadow-md border-2 border-red-100 hover:border-red-200 transition-all"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center min-w-0">
                                      <div className="bg-gradient-to-br from-red-500 to-red-600 p-2 rounded-lg shadow-md">
                                        <TrendingDown
                                          className="h-4 sm:h-5 w-4 sm:w-5 text-white flex-shrink-0"
                                          aria-hidden="true"
                                        />
                                      </div>
                                      <span className="text-sm font-bold text-red-700 ml-2">
                                        Compra
                                      </span>
                                    </div>
                                    <span className="text-base sm:text-lg font-bold text-red-600 truncate ml-2">
                                      {formatCurrency(item.precoCompra)}
                                    </span>
                                  </div>
                                </motion.div>

                                <motion.div
                                  whileHover={{ scale: 1.02, x: 4 }}
                                  className="bg-gradient-to-br from-green-50 via-white to-emerald-50 p-3 sm:p-4 rounded-xl shadow-md border-2 border-green-100 hover:border-green-200 transition-all"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center min-w-0">
                                      <div className="bg-gradient-to-br from-green-500 to-green-600 p-2 rounded-lg shadow-md">
                                        <TrendingUp
                                          className="h-4 sm:h-5 w-4 sm:w-5 text-white flex-shrink-0"
                                          aria-hidden="true"
                                        />
                                      </div>
                                      <span className="text-sm font-bold text-green-700 ml-2">
                                        Venda
                                      </span>
                                    </div>
                                    <span className="text-base sm:text-lg font-bold text-green-600 truncate ml-2">
                                      {formatCurrency(item.precoVenda)}
                                    </span>
                                  </div>
                                </motion.div>
                              </div>

                              <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="bg-gradient-to-br from-purple-50 via-white to-violet-50 p-3 sm:p-4 rounded-xl shadow-md border-2 border-purple-100"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center min-w-0">
                                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-2 rounded-lg shadow-md">
                                      <DollarSign
                                        className="h-4 sm:h-5 w-4 sm:w-5 text-white flex-shrink-0"
                                        aria-hidden="true"
                                      />
                                    </div>
                                    <span className="text-sm font-bold text-purple-700 ml-2">
                                      Margem
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <span
                                      className={`text-base sm:text-lg font-bold ${margin >= 0 ? "text-green-600" : "text-red-600"}`}
                                    >
                                      {margin.toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                              </motion.div>

                              <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 p-4 sm:p-5 rounded-xl shadow-xl border-2 border-blue-300"
                              >
                                <div className="text-center">
                                  <p className="text-sm font-bold text-white/90 mb-1 flex items-center justify-center gap-2">
                                    <Sparkles className="h-4 w-4" />
                                    Valor Total em Estoque
                                  </p>
                                  <p className="text-xl sm:text-2xl font-bold text-white truncate">
                                    {formatCurrency(
                                      item.quantidade * item.precoCompra,
                                    )}
                                  </p>
                                </div>
                              </motion.div>
                            </div>
                          )}
                        </>
                      )}

                      {viewMode === "list" && (
                        <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm overflow-x-auto">
                          <div className="text-center flex-shrink-0">
                            <p className="text-gray-600">Estoque</p>
                            <p className="font-bold">
                              {item.quantidade.toFixed(2)} kg
                            </p>
                          </div>
                          <div className="text-center flex-shrink-0">
                            <p className="text-gray-600">Compra</p>
                            <p className="font-bold text-red-600">
                              {formatCurrency(item.precoCompra)}
                            </p>
                          </div>
                          <div className="text-center flex-shrink-0">
                            <p className="text-gray-600">Venda</p>
                            <p className="font-bold text-green-600">
                              {formatCurrency(item.precoVenda)}
                            </p>
                          </div>
                          <div className="text-center flex-shrink-0">
                            <p className="text-gray-600">Margem</p>
                            <p
                              className={`font-bold ${margin >= 0 ? "text-green-600" : "text-red-600"}`}
                            >
                              {margin.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>

        <Card className="p-3 sm:p-4 lg:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Package
              className="h-5 sm:h-6 w-5 sm:w-6 mr-2 text-blue-600 flex-shrink-0"
              aria-hidden="true"
            />
            <span>Resumo Geral do Estoque</span>
          </h2>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
            <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">
                Total em Estoque
              </p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                {Object.values(inventory)
                  .reduce((total, item) => total + (item.quantidade || 0), 0)
                  .toFixed(2)}{" "}
                kg
              </p>
            </div>

            <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
              <p className="text-xs sm:text-sm text-blue-600 mb-1">
                Valor Investido
              </p>
              <p className="text-lg sm:text-2xl font-bold text-blue-600 truncate">
                {formatCurrency(
                  Object.entries(inventory).reduce(
                    (total, [_, item]) =>
                      total + (item.quantidade || 0) * (item.precoCompra || 0),
                    0,
                  ),
                )}
              </p>
            </div>

            <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
              <p className="text-xs sm:text-sm text-green-600 mb-1">
                Valor a Receber (Venda)
              </p>
              <p className="text-lg sm:text-2xl font-bold text-green-600 truncate">
                {formatCurrency(
                  Object.values(inventory).reduce(
                    (total, item) =>
                      total + (item.quantidade || 0) * (item.precoVenda || 0),
                    0,
                  ),
                )}
              </p>
            </div>

            <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg">
              <p className="text-xs sm:text-sm text-purple-600 mb-1">
                Lucro Potencial
              </p>
              <p className="text-lg sm:text-2xl font-bold text-purple-600">
                {formatCurrency(
                  Object.values(inventory).reduce(
                    (total, item) =>
                      total +
                      calculateProfit(
                        item.quantidade || 0,
                        item.precoCompra || 0,
                        item.precoVenda || 0,
                      ),
                    0,
                  ),
                )}
              </p>
            </div>

            <div className="text-center p-3 sm:p-4 bg-red-50 rounded-lg">
              <p className="text-xs sm:text-sm text-red-600 mb-1">
                Estoque Baixo
              </p>
              <p className="text-lg sm:text-2xl font-bold text-red-600">
                {allMaterials.filter((material) => isLowStock(material)).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Modais de Gestão de Materiais ───────────────────────────────── */}
      <AnimatePresence>
        {showMaterialModal && (
          <MaterialModal
            isOpen={showMaterialModal}
            onClose={() => {
              setShowMaterialModal(false);
              setEditingMaterialMeta(null);
            }}
            onSave={handleMaterialModalSave}
            editingMaterial={editingMaterialMeta}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPasswordModal && (
          <PasswordModal
            isOpen={showPasswordModal}
            action={pendingAction?.description || "Confirmar operação"}
            onConfirm={handlePasswordConfirm}
            onCancel={() => {
              setShowPasswordModal(false);
              setPendingAction(null);
              setEditingMaterialMeta(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Inventory;
