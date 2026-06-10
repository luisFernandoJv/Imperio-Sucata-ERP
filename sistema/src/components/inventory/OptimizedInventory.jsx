"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Lock,
  X,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Edit,
  PlusCircle,
  Plus,
} from "lucide-react";
import { useInventory, useUpdateInventory } from "../../hooks/useFirebaseQuery";
import { useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "../../hooks/useDebounce";
import { materialTypes } from "../../config/designTokens";
import { InventoryCard } from "./InventoryCard";
import { InventoryTableView } from "./InventoryTableView";
import { InventoryFilters } from "./InventoryFilters";
import { InventoryStats } from "./InventoryStats";
import { LoadingOverlay } from "../ui/loading";
import { EmptyState } from "../ui/empty-state";
import { printInventory, exportInventoryToCSV } from "../../lib/utils";
import {
  addMaterialToInventory,
  deleteMaterialFromInventory,
  updateInventoryItem,
} from "../../lib/firebaseService";

// ─── Constantes ──────────────────────────────────────────────────────────────
const ADMIN_PASSWORD = "imperio2025";

const MAT_CATEGORIES = [
  { key: "ferrosos", name: "Metais Ferrosos" },
  { key: "nao-ferrosos", name: "Metais Não-Ferrosos" },
  { key: "cabos", name: "Cabos e Fios" },
  { key: "tubos", name: "Tubos e Estruturas" },
  { key: "eletronicos", name: "Eletrônicos" },
  { key: "automotivo", name: "Automotivo" },
  { key: "papel", name: "Papel" },
  { key: "outros", name: "Outros" },
];

const MAT_ICONS = [
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

// ─── Modal de Confirmação de Senha ───────────────────────────────────────────
const PasswordModal = ({ isOpen, action, onConfirm, onCancel }) => {
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
            <p className="text-sm text-slate-500 mt-0.5">{action}</p>
          </div>
        </div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          Senha do Administrador
        </label>
        <input
          type="password"
          value={senha}
          autoFocus
          onChange={(e) => {
            setSenha(e.target.value);
            setErro("");
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="••••••••••••"
          className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
        />
        {erro && (
          <p className="text-xs font-semibold text-red-600 flex items-center gap-1 mt-2">
            <AlertTriangle className="h-3.5 w-3.5" />
            {erro}
          </p>
        )}
        <div className="flex gap-3 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !senha}
            className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-colors"
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

// ─── Modal Criar / Editar Material ───────────────────────────────────────────
const MaterialFormModal = ({
  isOpen,
  onClose,
  onSave,
  editingMaterial = null,
}) => {
  const isEdit = !!editingMaterial;
  const autoKey = (name) =>
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

  const [form, setForm] = useState(() =>
    editingMaterial
      ? {
          key: editingMaterial.key,
          name: editingMaterial.name,
          category: editingMaterial.category || "outros",
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

  const handleNameChange = (val) => {
    setForm((f) => {
      const shouldAuto = !isEdit && (f.key === "" || f.key === autoKey(f.name));
      return { ...f, name: val, ...(shouldAuto ? { key: autoKey(val) } : {}) };
    });
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

  const margem =
    form.precoCompra > 0 && form.precoVenda > 0
      ? (
          ((form.precoVenda - form.precoCompra) / form.precoVenda) *
          100
        ).toFixed(1)
      : null;

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
        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Ícone */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Ícone
            </p>
            <div className="flex flex-wrap gap-2">
              {MAT_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, icon }))}
                  className={`w-9 h-9 text-xl rounded-lg flex items-center justify-center transition-all ${form.icon === icon ? "bg-blue-100 ring-2 ring-blue-500 scale-110" : "bg-slate-100 hover:bg-slate-200"}`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Nome + Chave */}
          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Chave (ID) *
                {!isEdit && (
                  <span className="text-slate-400 font-normal ml-1">auto</span>
                )}
              </label>
              <input
                value={form.key}
                onChange={(e) => {
                  setForm((f) => ({
                    ...f,
                    key: e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9_ ]/g, ""),
                  }));
                  setKeyError("");
                }}
                disabled={isEdit}
                placeholder="ex: chumbo"
                className={`w-full px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${isEdit ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed" : "border-slate-200"} ${keyError ? "border-red-400" : ""}`}
              />
              {keyError ? (
                <p className="text-xs text-red-500 mt-1">{keyError}</p>
              ) : (
                !isEdit && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Letras minúsculas, números e _
                  </p>
                )
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
              {MAT_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Valores numéricos */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Mín. Estoque (kg)", field: "minStock", step: "1" },
              {
                label: "Preço Compra (R$/kg)",
                field: "precoCompra",
                step: "0.01",
              },
              {
                label: "Preço Venda (R$/kg)",
                field: "precoVenda",
                step: "0.01",
              },
            ].map(({ label, field, step }) => (
              <div key={field}>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  {label}
                </label>
                <input
                  type="number"
                  min="0"
                  step={step}
                  value={form[field]}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      [field]: Number(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            ))}
          </div>

          {margem && (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-sm">
              <span className="text-emerald-700 font-semibold">
                Margem estimada: {margem}%
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
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-colors ${isEdit ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700"}`}
          >
            <Lock className="h-4 w-4" />
            {isEdit ? "Salvar Alterações" : "Criar Material"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default function OptimizedInventory() {
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [viewMode, setViewMode] = useState("grid");
  const [showLowStock, setShowLowStock] = useState(false);

  // ── Gestão dinâmica de materiais ──────────────────────────────────────────
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [editingMaterialMeta, setEditingMaterialMeta] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [customMaterials, setCustomMaterials] = useState([]);

  const queryClient = useQueryClient();
  const debouncedSearch = useDebounce(searchTerm, 300);
  const { data: inventory = {}, isLoading, error } = useInventory();
  const updateInventoryMutation = useUpdateInventory();

  // Força busca fresca do Firestore toda vez que a página abre,
  // ignorando cache antigo que pode conter chaves corrompidas
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["inventory"] });
  }, []);

  // Lista dinâmica: base hardcoded + materiais extras que existem no Firestore
  const allMaterials = useMemo(() => {
    const baseKeys = new Set(materialTypes.map((m) => m.key));
    const extras = Object.keys(inventory)
      .filter((k) => k !== "updatedAt" && !baseKeys.has(k))
      .map((k) => {
        const custom = customMaterials.find((c) => c.key === k);
        return {
          key: k,
          name:
            custom?.name ||
            k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          category: custom?.category || "outros",
          icon: custom?.icon || "🔩",
          minStock: custom?.minStock ?? 0,
          isDynamic: true,
        };
      });
    return [...materialTypes, ...extras];
  }, [inventory, customMaterials]);

  const filteredMaterials = useMemo(() => {
    return allMaterials.filter((material) => {
      const matchesSearch = material.name
        .toLowerCase()
        .includes(debouncedSearch.toLowerCase());
      const matchesCategory =
        selectedCategory === "todos" || material.category === selectedCategory;
      const item = inventory[material.key] || {};
      const qtd = Number(item.quantidade) || 0;
      const isNegative = qtd < 0;
      const matchesLowStock =
        !showLowStock || (qtd <= (material.minStock || 0) && !isNegative);
      return matchesSearch && matchesCategory && matchesLowStock;
    });
  }, [
    debouncedSearch,
    selectedCategory,
    showLowStock,
    inventory,
    allMaterials,
  ]);

  const handleEdit = (materialKey) => {
    setEditingItem(materialKey);
    setEditForm(
      inventory[materialKey] || {
        quantidade: 0,
        precoCompra: 0,
        precoVenda: 0,
      },
    );
  };

  const handleSave = async () => {
    if (!editingItem) return;
    try {
      await updateInventoryMutation.mutateAsync({
        material: editingItem,
        data: editForm,
      });
      setEditingItem(null);
      setEditForm({});
    } catch (error) {
      console.error("Error updating inventory:", error);
      alert("Erro ao salvar alterações");
    }
  };

  const handleCancel = () => {
    setEditingItem(null);
    setEditForm({});
  };

  // ── Handlers de gestão dinâmica de materiais ─────────────────────────────

  const handleOpenNewMaterial = useCallback(() => {
    setEditingMaterialMeta(null);
    setShowMaterialModal(true);
  }, []);

  const handleConfigure = useCallback(
    (material) => {
      const item = inventory[material.key] || {};
      setEditingMaterialMeta({
        ...material,
        precoCompra: item.precoCompra ?? 0,
        precoVenda: item.precoVenda ?? 0,
      });
      setShowMaterialModal(true);
    },
    [inventory],
  );

  const handleModalSave = useCallback(
    (formData) => {
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
    },
    [editingMaterialMeta],
  );

  const handleDeleteRequest = useCallback((material) => {
    setPendingAction({
      type: "delete_material",
      data: material,
      description: `Remover material "${material.name}" do inventário`,
    });
    setShowPasswordModal(true);
  }, []);

  const showToast = useCallback((msg, type = "success") => {
    const el = document.createElement("div");
    const bg =
      type === "success"
        ? "bg-green-100 border-l-4 border-green-500 text-green-800"
        : "bg-blue-100 border-l-4 border-blue-500 text-blue-800";
    el.innerHTML = `<div class="fixed top-4 right-4 z-[999] p-4 rounded-xl shadow-xl max-w-sm text-sm font-semibold ${bg} animate-in slide-in-from-right">${msg}</div>`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }, []);

  const handlePasswordConfirm = useCallback(async () => {
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
          alert(`Material com chave "${data.key}" já existe no inventário.`);
        } else {
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
          queryClient.invalidateQueries({ queryKey: ["inventory"] });
          showToast(`✅ Material "${data.name}" criado com sucesso!`);
        }
      } else if (pendingAction.type === "edit_material") {
        const { data } = pendingAction;
        await updateInventoryItem(data.key, {
          precoCompra: data.precoCompra,
          precoVenda: data.precoVenda,
        });
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
        queryClient.invalidateQueries({ queryKey: ["inventory"] });
        showToast(`✅ Material "${data.name}" atualizado com sucesso!`);
      } else if (pendingAction.type === "delete_material") {
        const { data } = pendingAction;
        const result = await deleteMaterialFromInventory(data.key);
        if (result?.success === false && result.reason === "has_stock") {
          alert(
            `Não é possível remover "${data.name}": ainda há ${result.quantidade?.toFixed(2)}kg em estoque.`,
          );
        } else if (result?.success) {
          setCustomMaterials((prev) => prev.filter((m) => m.key !== data.key));
          queryClient.invalidateQueries({ queryKey: ["inventory"] });
          showToast(
            `🗑️ Material "${data.name}" removido do inventário.`,
            "info",
          );
        }
      }
    } finally {
      setShowPasswordModal(false);
      setPendingAction(null);
      setEditingMaterialMeta(null);
    }
  }, [pendingAction, editingMaterialMeta, queryClient, showToast]);

  if (isLoading) return <LoadingOverlay message="Carregando estoque..." />;
  if (error)
    return (
      <EmptyState
        title="Erro de Conexão"
        description="Não foi possível carregar os dados."
      />
    );

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 pl-1">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20 text-white">
              <Package className="h-7 w-7" />
            </div>
            Gestão de Estoque
          </h1>
          <p className="text-slate-500 mt-2 text-lg ml-14">
            Controle inteligente de materiais e precificação.
          </p>
        </div>

        {/* Widgets KPIs */}
        <InventoryStats inventory={inventory} materials={allMaterials} />

        {/* Barra de Filtros */}
        <InventoryFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          viewMode={viewMode}
          setViewMode={setViewMode}
          showLowStock={showLowStock}
          setShowLowStock={setShowLowStock}
          onPrint={() => printInventory(inventory, allMaterials)}
          onExport={() => exportInventoryToCSV(inventory, allMaterials)}
          onNewMaterial={handleOpenNewMaterial}
        />

        {/* Grid de Conteúdo */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            {filteredMaterials.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <EmptyState
                  title="Nenhum material encontrado"
                  description="Tente ajustar seus filtros."
                  icon={Package}
                />
              </motion.div>
            ) : viewMode === "list" ? (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <InventoryTableView
                  materials={filteredMaterials}
                  inventory={inventory}
                  onEdit={handleEdit}
                />
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6"
              >
                {filteredMaterials.map((material) => {
                  const item = inventory[material.key] || {
                    quantidade: 0,
                    precoCompra: 0,
                    precoVenda: 0,
                  };
                  return (
                    <InventoryCard
                      key={material.key}
                      material={material}
                      item={item}
                      isEditing={editingItem === material.key}
                      onEdit={handleEdit}
                      onSave={handleSave}
                      onCancel={handleCancel}
                      onConfigure={handleConfigure}
                      onDelete={handleDeleteRequest}
                      editForm={editForm}
                      setEditForm={setEditForm}
                      isLowStock={item.quantidade <= material.minStock}
                    />
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Modais de Gestão de Materiais ─────────────────────────────── */}
      <AnimatePresence>
        {showMaterialModal && (
          <MaterialFormModal
            isOpen={showMaterialModal}
            onClose={() => {
              setShowMaterialModal(false);
              setEditingMaterialMeta(null);
            }}
            onSave={handleModalSave}
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
}
