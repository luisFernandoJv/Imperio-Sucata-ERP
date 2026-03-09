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
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Formatador de moeda
const formatCurrency = (value) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
};

const TransactionEditModal = ({ transaction, onSave, onClose: onCancel }) => {
  const [formData, setFormData] = useState({
    id: "",
    tipo: "",
    material: "",
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

  // Dados originais para comparação
  const [originalData, setOriginalData] = useState(null);

  useEffect(() => {
    if (transaction) {
      const initialData = {
        id: transaction.id || "",
        tipo: transaction.tipo || "",
        material: transaction.material || "",
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

  // Detectar mudanças
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

        // Cálculo automático do valor total
        if (field === "quantidade" || field === "precoUnitario") {
          const quantidade =
            field === "quantidade"
              ? Number.parseFloat(value) || 0
              : Number.parseFloat(prev.quantidade) || 0;
          const precoUnitario =
            field === "precoUnitario"
              ? Number.parseFloat(value) || 0
              : Number.parseFloat(prev.precoUnitario) || 0;
          const valorTotal = quantidade * precoUnitario;
          newData.valorTotal = valorTotal.toFixed(2);
        }

        return newData;
      });

      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    },
    [errors],
  );

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.tipo) newErrors.tipo = "Tipo é obrigatório";
    if (!formData.data) newErrors.data = "Data é obrigatória";

    if (formData.tipo !== "despesa") {
      if (!formData.material) newErrors.material = "Material é obrigatório";
      if (!formData.quantidade || Number.parseFloat(formData.quantidade) <= 0) {
        newErrors.quantidade = "Quantidade deve ser maior que zero";
      }
      if (
        !formData.precoUnitario ||
        Number.parseFloat(formData.precoUnitario) <= 0
      ) {
        newErrors.precoUnitario = "Preço deve ser maior que zero";
      }
    } else {
      if (!formData.valorTotal || Number.parseFloat(formData.valorTotal) <= 0) {
        newErrors.valorTotal = "Valor deve ser maior que zero";
      }
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
        const updatedTransaction = {
          id: formData.id,
          tipo: formData.tipo,
          material: formData.material,
          quantidade: formData.quantidade
            ? Number.parseFloat(formData.quantidade)
            : null,
          precoUnitario: formData.precoUnitario
            ? Number.parseFloat(formData.precoUnitario)
            : null,
          valorTotal: Number.parseFloat(formData.valorTotal),
          vendedor: formData.vendedor,
          observacoes: formData.observacoes,
          data: new Date(formData.data).toISOString(),
          formaPagamento: formData.formaPagamento,
          numeroTransacao: formData.numeroTransacao,
        };

        await onSave(updatedTransaction);
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
      "Alumínio (Lata)",
      "Alumínio (Perfil)",
      "Cobre",
      "Cobre Mel",
      "Bronze",
      "Magnésio",
      "Ferro",
      "Aço",
      "Latão",
      "Chumbo",
      "Inox",
      "Radiador",
      "Motor Elétrico",
      "Bateria",
      "Sucata Eletrônica",
    ],
    [],
  );

  // Estilos baseados no tipo
  const tipoStyles = useMemo(
    () => ({
      venda: {
        gradient: "from-emerald-600 to-green-600",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        text: "text-emerald-700",
        icon: TrendingUp,
        label: "Venda",
      },
      compra: {
        gradient: "from-blue-600 to-cyan-600",
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-700",
        icon: TrendingDown,
        label: "Compra",
      },
      despesa: {
        gradient: "from-red-600 to-rose-600",
        bg: "bg-red-50",
        border: "border-red-200",
        text: "text-red-700",
        icon: Minus,
        label: "Despesa",
      },
    }),
    [],
  );

  const currentStyle = tipoStyles[formData.tipo] || tipoStyles.venda;

  if (!transaction) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[95vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header com Gradiente */}
        <div
          className={`bg-gradient-to-r ${currentStyle.gradient} p-5 text-white`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <Edit3 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Editar Transação</h2>
                <p className="text-white/80 text-sm font-mono flex items-center gap-2">
                  <Hash className="h-3 w-3" />
                  {formData.id?.slice(-8) || "N/A"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {hasChanges && (
                <Badge className="bg-white/20 text-white border-white/30 text-xs px-2 py-1">
                  <Info className="h-3 w-3 mr-1" />
                  Alterações pendentes
                </Badge>
              )}
              <button
                onClick={onCancel}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Fechar modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Informações Originais */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <Clock className="h-4 w-4 text-slate-400" />
              <span>Criado em: </span>
              <span className="font-medium text-slate-800">
                {transaction.data
                  ? format(
                      new Date(transaction.data),
                      "dd/MM/yyyy 'às' HH:mm",
                      { locale: ptBR },
                    )
                  : "Data não disponível"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Receipt className="h-4 w-4 text-slate-400" />
              <span>Valor Original: </span>
              <span className={`font-bold ${currentStyle.text}`}>
                {formatCurrency(transaction.valorTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto max-h-[calc(95vh-280px)]"
        >
          <div className="p-5 space-y-5">
            {/* Tipo e Data - Seção Principal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tipo de Transação */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <Receipt className="h-4 w-4 text-slate-400" />
                  Tipo de Transação
                  <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(tipoStyles).map(([key, style]) => {
                    const Icon = style.icon;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleInputChange("tipo", key)}
                        className={`p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-1 ${
                          formData.tipo === key
                            ? `${style.bg} ${style.border} ${style.text} shadow-md`
                            : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-xs font-semibold">
                          {style.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {errors.tipo && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.tipo}
                  </p>
                )}
              </div>

              {/* Data e Hora */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  Data e Hora
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.data}
                  onChange={(e) => handleInputChange("data", e.target.value)}
                  className={`w-full p-3 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${
                    errors.data
                      ? "border-red-300 bg-red-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                />
                {errors.data && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.data}
                  </p>
                )}
              </div>
            </div>

            {/* Material - Apenas para compra/venda */}
            {formData.tipo !== "despesa" && (
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <Package className="h-4 w-4 text-slate-400" />
                  Material
                  <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.material}
                  onChange={(e) =>
                    handleInputChange("material", e.target.value)
                  }
                  className={`w-full p-3 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all appearance-none bg-white ${
                    errors.material
                      ? "border-red-300 bg-red-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <option value="">Selecione o material</option>
                  {materialOptions.map((material) => (
                    <option key={material} value={material}>
                      {material}
                    </option>
                  ))}
                </select>
                {errors.material && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.material}
                  </p>
                )}
              </div>
            )}

            {/* Valores - Grid de 3 colunas para compra/venda */}
            {formData.tipo !== "despesa" ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Quantidade */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                    <Scale className="h-4 w-4 text-slate-400" />
                    Quantidade (kg)
                    <span className="text-red-500">*</span>
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
                      className={`w-full p-3 pr-12 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${
                        errors.quantidade
                          ? "border-red-300 bg-red-50"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                      placeholder="0.00"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
                      kg
                    </span>
                  </div>
                  {errors.quantidade && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.quantidade}
                    </p>
                  )}
                </div>

                {/* Preço por kg */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                    <DollarSign className="h-4 w-4 text-slate-400" />
                    Preço por kg
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
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
                      className={`w-full p-3 pl-10 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${
                        errors.precoUnitario
                          ? "border-red-300 bg-red-50"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.precoUnitario && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.precoUnitario}
                    </p>
                  )}
                </div>

                {/* Valor Total - Calculado */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                    <Calculator className="h-4 w-4 text-slate-400" />
                    Valor Total
                    <Badge
                      variant="outline"
                      className="text-[10px] py-0 px-1.5 ml-1"
                    >
                      Auto
                    </Badge>
                  </label>
                  <div
                    className={`p-3 rounded-xl ${currentStyle.bg} ${currentStyle.border} border-2`}
                  >
                    <p className={`text-xl font-bold ${currentStyle.text}`}>
                      {formatCurrency(
                        Number.parseFloat(formData.valorTotal) || 0,
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Valor para Despesa */
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <DollarSign className="h-4 w-4 text-slate-400" />
                  Valor da Despesa
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
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
                    className={`w-full p-3 pl-10 text-lg font-semibold border-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${
                      errors.valorTotal
                        ? "border-red-300 bg-red-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                    placeholder="0.00"
                  />
                </div>
                {errors.valorTotal && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.valorTotal}
                  </p>
                )}
              </div>
            )}

            {/* Pessoa/Vendedor */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <Users className="h-4 w-4 text-slate-400" />
                Pessoa / Vendedor / Cliente
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
                onChange={(e) => handleInputChange("vendedor", e.target.value)}
                className="w-full p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white hover:border-slate-300"
                placeholder="Nome da pessoa envolvida na transação"
              />
            </div>

            {/* Forma de Pagamento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <CreditCard className="h-4 w-4 text-slate-400" />
                  Forma de Pagamento
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      value: "dinheiro",
                      label: "Dinheiro",
                      icon: Banknote,
                      color: "green",
                    },
                    {
                      value: "pix",
                      label: "PIX",
                      icon: Smartphone,
                      color: "purple",
                    },
                    {
                      value: "pagamento_divida",
                      label: "Dívida",
                      icon: Receipt,
                      color: "orange",
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
                        className={`p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-1 ${
                          isActive
                            ? `bg-${method.color}-50 border-${method.color}-300 text-${method.color}-700 shadow-md`
                            : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-xs font-semibold">
                          {method.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Número da Transação PIX */}
              {formData.formaPagamento === "pix" && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                    <Hash className="h-4 w-4 text-slate-400" />
                    Número da Transação PIX
                  </label>
                  <input
                    type="text"
                    value={formData.numeroTransacao}
                    onChange={(e) =>
                      handleInputChange("numeroTransacao", e.target.value)
                    }
                    className="w-full p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white hover:border-slate-300"
                    placeholder="Código de identificação do PIX"
                  />
                </div>
              )}
            </div>

            {/* Observações */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
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
                className="w-full p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white hover:border-slate-300 resize-none"
                placeholder="Adicione observações ou detalhes adicionais sobre a transação..."
              />
            </div>
          </div>

          {/* Footer com Ações */}
          <div className="border-t border-slate-200 p-4 bg-slate-50 flex flex-col sm:flex-row gap-3">
            <Button
              type="submit"
              disabled={isSaving || !hasChanges}
              className={`flex-1 py-3 font-semibold transition-all duration-200 ${
                hasChanges
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl"
                  : "bg-slate-300 text-slate-500 cursor-not-allowed"
              }`}
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
            <Button
              type="button"
              onClick={onCancel}
              variant="outline"
              className="flex-1 py-3 bg-white border-2 border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200"
            >
              <X className="h-5 w-5 mr-2" />
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionEditModal;
