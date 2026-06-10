"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Save,
  Edit3,
  Package,
  Calendar,
  DollarSign,
  Users,
  CreditCard,
  FileText,
  Scale,
  Calculator,
  Hash,
  Clock,
  AlertCircle,
  Banknote,
  Smartphone,
  Receipt,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  CheckCircle2,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const formatCurrency = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0,
  );

const FieldError = ({ message }) =>
  message ? (
    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1 font-medium">
      <AlertCircle className="h-3 w-3 flex-shrink-0" />
      {message}
    </p>
  ) : null;

const SectionLabel = ({ children }) => (
  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3">
    {children}
  </p>
);

const TransactionEditModal = ({ transaction, onSave, onClose: onCancel }) => {
  const [formData, setFormData] = useState({
    id: "",
    tipo: "",
    material: "",
    categoria: "",
    quantidade: "",
    precoUnitario: "",
    valorTotal: "",
    vendedor: "",
    observacoes: "",
    data: "",
    formaPagamento: "",
    numeroTransacao: "",
  });

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (transaction) {
      const initialData = {
        id: transaction.id || "",
        tipo: transaction.tipo || "",
        material: transaction.material || "",
        categoria: transaction.categoria || "",
        quantidade: transaction.quantidade?.toString() || "",
        precoUnitario: transaction.precoUnitario?.toString() || "",
        valorTotal: transaction.valorTotal?.toString() || "",
        vendedor:
          transaction.vendedor ||
          transaction.cliente ||
          transaction.fornecedor ||
          "",
        observacoes: transaction.observacoes || "",
        data: transaction.data
          ? new Date(transaction.data).toISOString().slice(0, 16)
          : "",
        formaPagamento: transaction.formaPagamento || "dinheiro",
        numeroTransacao: transaction.numeroTransacao || "",
      };
      setFormData(initialData);
      setOriginalData(initialData);
    }
  }, [transaction]);

  useEffect(() => {
    if (originalData) {
      const changed = Object.keys(formData).some(
        (key) => formData[key] !== originalData[key],
      );
      setHasChanges(changed);
    }
  }, [formData, originalData]);

  const handleInputChange = useCallback(
    (field, value) => {
      setFormData((prev) => {
        const newData = { ...prev, [field]: value };
        if (field === "quantidade" || field === "precoUnitario") {
          const qty =
            field === "quantidade"
              ? parseFloat(value) || 0
              : parseFloat(prev.quantidade) || 0;
          const price =
            field === "precoUnitario"
              ? parseFloat(value) || 0
              : parseFloat(prev.precoUnitario) || 0;
          newData.valorTotal = (qty * price).toFixed(2);
        }
        return newData;
      });
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    },
    [errors],
  );

  const handleReset = useCallback(() => {
    if (originalData) {
      setFormData(originalData);
      setErrors({});
    }
  }, [originalData]);

  const validateForm = useCallback(() => {
    const newErrors = {};
    if (!formData.tipo) newErrors.tipo = "Selecione o tipo";
    if (!formData.data) newErrors.data = "Data é obrigatória";
    if (formData.tipo !== "despesa") {
      if (!formData.material) newErrors.material = "Selecione o material";
      if (!formData.quantidade || parseFloat(formData.quantidade) <= 0)
        newErrors.quantidade = "Informe uma quantidade válida";
      if (!formData.precoUnitario || parseFloat(formData.precoUnitario) <= 0)
        newErrors.precoUnitario = "Informe um preço válido";
    } else {
      if (!formData.valorTotal || parseFloat(formData.valorTotal) <= 0)
        newErrors.valorTotal = "Informe o valor da despesa";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!validateForm()) return;
      setIsSaving(true);
      try {
        const [datePart, timePart] = (formData.data || "").split("T");
        const [year, month, day] = (datePart || "").split("-").map(Number);
        const [hours, minutes] = (timePart || "00:00").split(":").map(Number);
        const transactionDate = new Date(
          year,
          month - 1,
          day,
          hours,
          minutes,
          0,
          0,
        );

        const updatedTransaction = {
          id: formData.id,
          tipo: formData.tipo,
          material: formData.material,
          categoria: formData.categoria,
          quantidade: formData.quantidade
            ? parseFloat(formData.quantidade)
            : null,
          precoUnitario: formData.precoUnitario
            ? parseFloat(formData.precoUnitario)
            : null,
          valorTotal: parseFloat(formData.valorTotal),
          vendedor: formData.vendedor,
          observacoes: formData.observacoes,
          data: transactionDate,
          formaPagamento: formData.formaPagamento,
          numeroTransacao: formData.numeroTransacao,
        };

        await onSave(updatedTransaction);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      } catch (error) {
        console.error("Erro ao salvar:", error);
      } finally {
        setIsSaving(false);
      }
    },
    [formData, validateForm, onSave],
  );

  const materialOptions = useMemo(
    () => [
      { value: "ferro", label: "Ferro" },
      { value: "aluminio", label: "Alumínio" },
      { value: "cobre", label: "Cobre" },
      { value: "cobre_mel", label: "Cobre Mel" },
      { value: "bronze", label: "Bronze" },
      { value: "magnesio", label: "Magnésio" },
      { value: "latinha", label: "Latinha" },
      { value: "panela", label: "Panela" },
      { value: "bloco2", label: "Bloco 2°" },
      { value: "chapa", label: "Chapa" },
      { value: "perfil pintado", label: "Perfil Pintado" },
      { value: "perfil natural", label: "Perfil Natural" },
      { value: "bloco", label: "Bloco" },
      { value: "metal", label: "Metal" },
      { value: "inox", label: "Inox" },
      { value: "bateria", label: "Bateria" },
      { value: "motor_gel", label: "Motor Gel" },
      { value: "roda", label: "Roda" },
      { value: "papelao", label: "Papelão" },
      { value: "papel_branco", label: "Papel Branco" },
      { value: "rad_metal", label: "Rad. Metal" },
      { value: "rad_cobre", label: "Rad. Cobre" },
      { value: "rad_chapa", label: "Rad. Chapa" },
      { value: "tela", label: "Tela" },
      { value: "antimonio", label: "Antimônio" },
      { value: "cabo_ai", label: "Cabo AI" },
      { value: "tubo_limpo", label: "Tubo Limpo" },
      { value: "chumbo", label: "Chumbo" },
    ],
    [],
  );

  const categoriaOptions = useMemo(
    () => [
      { value: "combustivel", label: "⛽ Combustível" },
      { value: "alimentacao", label: "🍽️ Alimentação" },
      { value: "manutencao", label: "🔧 Manutenção" },
      { value: "transporte", label: "🚛 Transporte" },
      { value: "salario", label: "👤 Salário" },
      { value: "aluguel", label: "🏠 Aluguel" },
      { value: "energia", label: "💡 Energia" },
      { value: "equipamento", label: "🛠️ Equipamento" },
      { value: "outros", label: "📋 Outros" },
    ],
    [],
  );

  const tipoConfig = useMemo(
    () => ({
      venda: {
        gradient: "from-emerald-600 to-green-500",
        bg: "bg-emerald-50",
        border: "border-emerald-300",
        text: "text-emerald-700",
        ring: "ring-emerald-500",
        icon: TrendingUp,
        label: "Venda",
        desc: "Saída de material",
        activeClass:
          "bg-emerald-50 border-emerald-400 text-emerald-700 shadow-emerald-100 shadow-md",
      },
      compra: {
        gradient: "from-blue-600 to-cyan-500",
        bg: "bg-blue-50",
        border: "border-blue-300",
        text: "text-blue-700",
        ring: "ring-blue-500",
        icon: TrendingDown,
        label: "Compra",
        desc: "Entrada de material",
        activeClass:
          "bg-blue-50 border-blue-400 text-blue-700 shadow-blue-100 shadow-md",
      },
      despesa: {
        gradient: "from-red-600 to-rose-500",
        bg: "bg-red-50",
        border: "border-red-300",
        text: "text-red-700",
        ring: "ring-red-500",
        icon: Minus,
        label: "Despesa",
        desc: "Custo operacional",
        activeClass:
          "bg-red-50 border-red-400 text-red-700 shadow-red-100 shadow-md",
      },
    }),
    [],
  );

  const currentConfig = tipoConfig[formData.tipo] || tipoConfig.venda;
  const valorTotalNum = parseFloat(formData.valorTotal) || 0;
  const valorOriginal = parseFloat(transaction?.valorTotal) || 0;
  const valorDiff = valorTotalNum - valorOriginal;

  if (!transaction) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[96vh] sm:max-h-[92vh] overflow-hidden shadow-2xl flex flex-col animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div
          className={`bg-gradient-to-r ${currentConfig.gradient} p-5 text-white flex-shrink-0`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                <Edit3 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight">
                  Editar Transação
                </h2>
                <p className="text-white/70 text-xs font-mono mt-0.5">
                  #{formData.id?.slice(-8) || "N/A"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasChanges && (
                <span className="hidden sm:flex items-center gap-1.5 bg-white/15 text-white text-[11px] font-bold px-2.5 py-1 rounded-full border border-white/20">
                  <Info className="h-3 w-3" />
                  Alterações pendentes
                </span>
              )}
              <button
                onClick={onCancel}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Barra de resumo original */}
          <div className="mt-4 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5 text-xs font-medium">
              <Clock className="h-3.5 w-3.5 text-white/70" />
              {transaction.data
                ? format(new Date(transaction.data), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })
                : "—"}
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5 text-xs font-medium">
              <Receipt className="h-3.5 w-3.5 text-white/70" />
              Valor original:{" "}
              <span className="font-black ml-1">
                {formatCurrency(transaction.valorTotal)}
              </span>
            </div>
            {transaction.material && (
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5 text-xs font-medium capitalize">
                <Package className="h-3.5 w-3.5 text-white/70" />
                {transaction.material}
              </div>
            )}
          </div>
        </div>

        {/* ── Formulário ── */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1 p-5 space-y-6">
            {/* Seção 1: Tipo e Data */}
            <div>
              <SectionLabel>Informações Gerais</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tipo */}
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                    <Receipt className="h-4 w-4 text-slate-400" />
                    Tipo de Transação <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(tipoConfig).map(([key, cfg]) => {
                      const Icon = cfg.icon;
                      const isActive = formData.tipo === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleInputChange("tipo", key)}
                          className={`p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-1.5 ${
                            isActive
                              ? cfg.activeClass
                              : "bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-white"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="text-[11px] font-bold">
                            {cfg.label}
                          </span>
                          <span className="text-[9px] font-medium opacity-70 text-center leading-tight hidden sm:block">
                            {cfg.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <FieldError message={errors.tipo} />
                </div>

                {/* Data e Hora */}
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    Data e Hora <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.data}
                    onChange={(e) => handleInputChange("data", e.target.value)}
                    className={`w-full p-3 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm font-medium ${
                      errors.data
                        ? "border-red-300 bg-red-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  />
                  <FieldError message={errors.data} />
                </div>
              </div>
            </div>

            {/* Seção 2: Material (compra/venda) ou Categoria (despesa) */}
            {formData.tipo !== "despesa" ? (
              <div>
                <SectionLabel>Material</SectionLabel>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                    <Package className="h-4 w-4 text-slate-400" />
                    Tipo de Material <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.material}
                      onChange={(e) =>
                        handleInputChange("material", e.target.value)
                      }
                      className={`w-full p-3 pr-10 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all appearance-none bg-white text-sm font-medium ${
                        errors.material
                          ? "border-red-300 bg-red-50"
                          : formData.material
                            ? "border-emerald-300 bg-emerald-50/40"
                            : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <option value="">Selecione o material...</option>
                      {materialOptions.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                  <FieldError message={errors.material} />
                </div>
              </div>
            ) : (
              <div>
                <SectionLabel>Categoria da Despesa</SectionLabel>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-slate-400" />
                    Categoria
                    <Badge
                      variant="outline"
                      className="text-[10px] py-0 px-1.5 ml-1 font-medium"
                    >
                      Opcional
                    </Badge>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.categoria}
                      onChange={(e) =>
                        handleInputChange("categoria", e.target.value)
                      }
                      className="w-full p-3 pr-10 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all appearance-none bg-white text-sm font-medium hover:border-slate-300"
                    >
                      <option value="">Selecione uma categoria...</option>
                      {categoriaOptions.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            )}

            {/* Seção 3: Valores */}
            <div>
              <SectionLabel>Valores</SectionLabel>
              {formData.tipo !== "despesa" ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Quantidade */}
                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                        <Scale className="h-4 w-4 text-slate-400" />
                        Quantidade <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.quantidade}
                          onChange={(e) =>
                            handleInputChange("quantidade", e.target.value)
                          }
                          className={`w-full p-3 pr-10 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm font-medium ${
                            errors.quantidade
                              ? "border-red-300 bg-red-50"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                          placeholder="0.00"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                          kg
                        </span>
                      </div>
                      <FieldError message={errors.quantidade} />
                    </div>

                    {/* Preço por kg */}
                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                        <DollarSign className="h-4 w-4 text-slate-400" />
                        Preço/kg <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                          R$
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.precoUnitario}
                          onChange={(e) =>
                            handleInputChange("precoUnitario", e.target.value)
                          }
                          className={`w-full p-3 pl-9 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm font-medium ${
                            errors.precoUnitario
                              ? "border-red-300 bg-red-50"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                          placeholder="0.00"
                        />
                      </div>
                      <FieldError message={errors.precoUnitario} />
                    </div>
                  </div>

                  {/* Valor Total — destaque visual */}
                  <div
                    className={`rounded-2xl border-2 p-4 ${currentConfig.bg} ${currentConfig.border} transition-all`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calculator className="h-4 w-4 text-slate-500" />
                        <span className="text-sm font-bold text-slate-700">
                          Valor Total
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] py-0 px-1.5 bg-white/60"
                        >
                          Calculado
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-2xl font-black ${currentConfig.text}`}
                        >
                          {formatCurrency(valorTotalNum)}
                        </p>
                        {hasChanges && valorDiff !== 0 && (
                          <p
                            className={`text-xs font-bold mt-0.5 ${valorDiff > 0 ? "text-emerald-600" : "text-red-600"}`}
                          >
                            {valorDiff > 0 ? "+" : ""}
                            {formatCurrency(valorDiff)} vs original
                          </p>
                        )}
                      </div>
                    </div>
                    {formData.quantidade && formData.precoUnitario && (
                      <p className="text-xs text-slate-500 mt-2 font-medium">
                        {parseFloat(formData.quantidade).toFixed(2)} kg ×{" "}
                        {formatCurrency(parseFloat(formData.precoUnitario))}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                /* Valor para Despesa */
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-slate-400" />
                    Valor da Despesa <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-base font-bold">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.valorTotal}
                      onChange={(e) =>
                        handleInputChange("valorTotal", e.target.value)
                      }
                      className={`w-full p-4 pl-12 text-xl font-black border-2 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all ${
                        errors.valorTotal
                          ? "border-red-300 bg-red-50"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  <FieldError message={errors.valorTotal} />
                  {hasChanges && valorDiff !== 0 && (
                    <p
                      className={`text-xs font-bold mt-2 flex items-center gap-1 ${valorDiff > 0 ? "text-emerald-600" : "text-red-600"}`}
                    >
                      <Info className="h-3 w-3" />
                      {valorDiff > 0 ? "+" : ""}
                      {formatCurrency(valorDiff)} vs valor original
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Seção 4: Pessoa e Pagamento */}
            <div>
              <SectionLabel>Pessoa e Pagamento</SectionLabel>
              <div className="space-y-4">
                {/* Pessoa */}
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-slate-400" />
                    {formData.tipo === "venda"
                      ? "Cliente"
                      : formData.tipo === "compra"
                        ? "Fornecedor"
                        : "Favorecido"}
                    <Badge
                      variant="outline"
                      className="text-[10px] py-0 px-1.5 ml-1"
                    >
                      Opcional
                    </Badge>
                  </label>
                  <input
                    type="text"
                    value={formData.vendedor}
                    onChange={(e) =>
                      handleInputChange("vendedor", e.target.value)
                    }
                    className="w-full p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white hover:border-slate-300 text-sm font-medium"
                    placeholder={
                      formData.tipo === "venda"
                        ? "Nome do cliente..."
                        : formData.tipo === "compra"
                          ? "Nome do fornecedor..."
                          : "Nome do favorecido..."
                    }
                  />
                </div>

                {/* Forma de Pagamento */}
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4 text-slate-400" />
                    Forma de Pagamento
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {
                        value: "dinheiro",
                        label: "Dinheiro",
                        icon: Banknote,
                        activeClass:
                          "bg-green-50 border-green-400 text-green-700 shadow-green-100 shadow-md",
                      },
                      {
                        value: "pix",
                        label: "PIX",
                        icon: Smartphone,
                        activeClass:
                          "bg-purple-50 border-purple-400 text-purple-700 shadow-purple-100 shadow-md",
                      },
                      {
                        value: "pagamento_divida",
                        label: "Dívida",
                        icon: Receipt,
                        activeClass:
                          "bg-orange-50 border-orange-400 text-orange-700 shadow-orange-100 shadow-md",
                      },
                    ].map((method) => {
                      const Icon = method.icon;
                      const isActive = formData.formaPagamento === method.value;
                      return (
                        <button
                          key={method.value}
                          type="button"
                          onClick={() =>
                            handleInputChange("formaPagamento", method.value)
                          }
                          className={`p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-1.5 ${
                            isActive
                              ? method.activeClass
                              : "bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-white"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="text-[11px] font-bold">
                            {method.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Número PIX */}
                {formData.formaPagamento === "pix" && (
                  <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                    <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                      <Hash className="h-4 w-4 text-purple-400" />
                      Código do PIX
                      <Badge
                        variant="outline"
                        className="text-[10px] py-0 px-1.5 ml-1"
                      >
                        Opcional
                      </Badge>
                    </label>
                    <input
                      type="text"
                      value={formData.numeroTransacao}
                      onChange={(e) =>
                        handleInputChange("numeroTransacao", e.target.value)
                      }
                      className="w-full p-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all bg-purple-50/30 text-sm font-medium placeholder:text-slate-400"
                      placeholder="Código de identificação do PIX..."
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Seção 5: Observações */}
            <div>
              <SectionLabel>Observações</SectionLabel>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-slate-400" />
                  Observações
                  <Badge
                    variant="outline"
                    className="text-[10px] py-0 px-1.5 ml-1"
                  >
                    Opcional
                  </Badge>
                </label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) =>
                    handleInputChange("observacoes", e.target.value)
                  }
                  rows={3}
                  className="w-full p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white hover:border-slate-300 resize-none text-sm font-medium placeholder:text-slate-400"
                  placeholder="Informações adicionais sobre a transação..."
                />
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="border-t border-slate-200 p-4 bg-slate-50/80 flex-shrink-0">
            {/* Indicador de alterações */}
            {hasChanges && (
              <div className="mb-3 flex items-center justify-between gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5" />
                  Você tem alterações não salvas
                </span>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1 hover:underline"
                >
                  <RotateCcw className="h-3 w-3" />
                  Desfazer
                </button>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={isSaving || !hasChanges}
                className={`flex-1 py-3 font-bold text-sm transition-all duration-200 rounded-xl ${
                  saveSuccess
                    ? "bg-emerald-500 text-white"
                    : hasChanges
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                {isSaving ? (
                  <>
                    <div className="h-4 w-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Salvando...
                  </>
                ) : saveSuccess ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Salvo!
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {hasChanges ? "Salvar Alterações" : "Sem alterações"}
                  </>
                )}
              </Button>
              <Button
                type="button"
                onClick={onCancel}
                variant="outline"
                className="px-5 py-3 bg-white border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all rounded-xl text-sm font-bold text-slate-600"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionEditModal;
