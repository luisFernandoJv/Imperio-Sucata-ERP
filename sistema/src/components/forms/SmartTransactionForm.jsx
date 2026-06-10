"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Save, TrendingUp, TrendingDown, DollarSign, Package, User, AlertCircle } from "lucide-react"
import { transactionSchema } from "../../schemas/transactionSchema"
import { useFormValidation } from "../../hooks/useFormValidation"
import { useAddTransaction } from "../../hooks/useFirebaseQuery"
import { formatCurrency } from "../../utils/formatters"
import { materialTypes } from "../../config/designTokens"
import { Card } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"

export default function SmartTransactionForm({ onSuccess, initialType = "compra" }) {
  const [formData, setFormData] = useState({
    tipo: initialType,
    material: "",
    quantidade: "",
    precoUnitario: "",
    valorTotal: 0,
    vendedor: "",
    observacoes: "",
    formaPagamento: "dinheiro",
    numeroTransacao: "",
    data: new Date(),
  })

  const [touched, setTouched] = useState({})
  const { errors, validate, clearError } = useFormValidation(transactionSchema)
  const addTransactionMutation = useAddTransaction()

  // Calculate total automatically
  useEffect(() => {
    const quantidade = Number.parseFloat(formData.quantidade) || 0
    const precoUnitario = Number.parseFloat(formData.precoUnitario) || 0
    const total = quantidade * precoUnitario
    setFormData((prev) => ({ ...prev, valorTotal: total }))
  }, [formData.quantidade, formData.precoUnitario])

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (touched[field]) {
      clearError(field)
    }
  }

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Mark all fields as touched
    const allTouched = Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {})
    setTouched(allTouched)

    // Prepare data for validation
    const validationData = {
      ...formData,
      quantidade: Number.parseFloat(formData.quantidade) || 0,
      precoUnitario: Number.parseFloat(formData.precoUnitario) || 0,
      data: formData.data instanceof Date ? formData.data : new Date(formData.data),
    }

    // Validate
    if (!validate(validationData)) {
      return
    }

    try {
      await addTransactionMutation.mutateAsync(validationData)

      // Reset form
      setFormData({
        tipo: initialType,
        material: "",
        quantidade: "",
        precoUnitario: "",
        valorTotal: 0,
        vendedor: "",
        observacoes: "",
        formaPagamento: "dinheiro",
        numeroTransacao: "",
        data: new Date(),
      })
      setTouched({})

      if (onSuccess) onSuccess()
    } catch (error) {
      console.error("Error adding transaction:", error)
    }
  }

  const getFieldError = (field) => {
    return touched[field] && errors[field]
  }

  const transactionTypes = [
    { value: "compra", label: "Compra", icon: TrendingDown, color: "blue" },
    { value: "venda", label: "Venda", icon: TrendingUp, color: "green" },
    { value: "despesa", label: "Despesa", icon: DollarSign, color: "red" },
  ]

  const paymentMethods = [
    { value: "dinheiro", label: "Dinheiro" },
    { value: "pix", label: "PIX" },
    { value: "cartao_credito", label: "Cartão de Crédito" },
    { value: "cartao_debito", label: "Cartão de Débito" },
    { value: "transferencia", label: "Transferência" },
  ]

  const currentType = transactionTypes.find((t) => t.value === formData.tipo)

  return (
    <div className="max-w-4xl mx-auto p-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <div
            className={`bg-gradient-to-br from-${currentType?.color}-500 to-${currentType?.color}-600 p-3 rounded-2xl shadow-lg`}
          >
            {currentType?.icon && <currentType.icon className="h-8 w-8 text-white" />}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nova {currentType?.label}</h1>
            <p className="text-gray-600">Preencha os dados da transação</p>
          </div>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit}>
        <Card className="p-6">
          <div className="space-y-6">
            {/* Transaction Type */}
            <div>
              <Label htmlFor="tipo">Tipo de Transação</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {transactionTypes.map((type) => {
                  const Icon = type.icon
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleChange("tipo", type.value)}
                      className={`flex items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                        formData.tipo === type.value
                          ? `border-${type.color}-500 bg-${type.color}-50`
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 ${formData.tipo === type.value ? `text-${type.color}-600` : "text-gray-400"}`}
                      />
                      <span
                        className={`font-medium ${formData.tipo === type.value ? `text-${type.color}-900` : "text-gray-700"}`}
                      >
                        {type.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Material */}
            <div>
              <Label htmlFor="material">Material *</Label>
              <select
                id="material"
                value={formData.material}
                onChange={(e) => handleChange("material", e.target.value)}
                onBlur={() => handleBlur("material")}
                className={`w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                  getFieldError("material") ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Selecione um material</option>
                {materialTypes.map((mat) => (
                  <option key={mat.key} value={mat.key}>
                    {mat.icon} {mat.name}
                  </option>
                ))}
              </select>
              {getFieldError("material") && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {getFieldError("material")}
                </p>
              )}
            </div>

            {/* Quantity and Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="quantidade">Quantidade (kg) *</Label>
                <div className="relative mt-1">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="quantidade"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.quantidade}
                    onChange={(e) => handleChange("quantidade", e.target.value)}
                    onBlur={() => handleBlur("quantidade")}
                    className={`pl-10 ${getFieldError("quantidade") ? "border-red-500" : ""}`}
                  />
                </div>
                {getFieldError("quantidade") && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {getFieldError("quantidade")}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="precoUnitario">Preço Unitário (R$/kg) *</Label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="precoUnitario"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.precoUnitario}
                    onChange={(e) => handleChange("precoUnitario", e.target.value)}
                    onBlur={() => handleBlur("precoUnitario")}
                    className={`pl-10 ${getFieldError("precoUnitario") ? "border-red-500" : ""}`}
                  />
                </div>
                {getFieldError("precoUnitario") && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {getFieldError("precoUnitario")}
                  </p>
                )}
              </div>
            </div>

            {/* Total Value - Read Only */}
            <div>
              <Label>Valor Total</Label>
              <div className="mt-1 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
                <p className="text-3xl font-bold text-blue-900">{formatCurrency(formData.valorTotal)}</p>
              </div>
            </div>

            {/* Vendor/Client */}
            {formData.tipo !== "despesa" && (
              <div>
                <Label htmlFor="vendedor">{formData.tipo === "compra" ? "Fornecedor" : "Cliente"}</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="vendedor"
                    type="text"
                    placeholder="Nome"
                    value={formData.vendedor}
                    onChange={(e) => handleChange("vendedor", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div>
              <Label htmlFor="formaPagamento">Forma de Pagamento *</Label>
              <select
                id="formaPagamento"
                value={formData.formaPagamento}
                onChange={(e) => handleChange("formaPagamento", e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                {paymentMethods.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <textarea
                id="observacoes"
                rows={3}
                placeholder="Informações adicionais..."
                value={formData.observacoes}
                onChange={(e) => handleChange("observacoes", e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={addTransactionMutation.isLoading}
                className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Save className="h-5 w-5 mr-2" />
                {addTransactionMutation.isLoading ? "Salvando..." : "Salvar Transação"}
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  )
}
