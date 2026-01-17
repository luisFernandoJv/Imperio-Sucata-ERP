"use client"

import { useState, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save, RotateCcw, Search, Tag } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

const ExpenseForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    nome: "",
    valor: "",
    categoria: "operacional",
    observacoes: "",
    data: new Date(),
    formaPagamento: "dinheiro",
    numeroTransacao: "",
  })
  const [saving, setSaving] = useState(false)
  const [categorySearch, setCategorySearch] = useState("")
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false)
  const categoryInputRef = useRef(null)

  const { toast } = useToast()

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setFormData({
      nome: "",
      valor: "",
      categoria: "operacional",
      observacoes: "",
      data: new Date(),
      formaPagamento: "dinheiro",
      numeroTransacao: "",
    })
    setCategorySearch("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.nome || !formData.valor) {
      toast({
        title: "Erro de Validação",
        description: "Por favor, preencha o nome da despesa e o valor.",
        variant: "destructive",
      })
      return
    }

    const valor = Number.parseFloat(formData.valor)
    if (valor <= 0) {
      toast({
        title: "Valor Inválido",
        description: "O valor da despesa deve ser maior que zero.",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)

      const transactionDate = formData.data instanceof Date ? formData.data : new Date(formData.data)
      transactionDate.setHours(12, 0, 0, 0)

      const expense = {
        ...formData,
        valor,
        data: transactionDate.toISOString(),
        tipo: "despesa",
        id: Date.now().toString(),
      }

      const transactions = JSON.parse(localStorage.getItem("recycling_transactions") || "[]")
      transactions.push(expense)
      localStorage.setItem("recycling_transactions", JSON.stringify(transactions))

      try {
        const { addTransaction } = await import("../lib/firebaseService")
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
        })
      } catch (firebaseError) {
        console.error("[v0] Erro ao salvar despesa no Firebase:", firebaseError)
      }

      toast({
        title: "Despesa Registrada!",
        description: `Despesa "${formData.nome}" de ${new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(valor)} foi registrada com sucesso e aparecerá na lista de transações.`,
        className: "bg-green-100 border-green-500 text-green-800",
      })

      resetForm()
    } catch (error) {
      console.error("[v0] Erro ao registrar despesa:", error)
      toast({
        title: "Erro ao Registrar",
        description: "Não foi possível registrar a despesa. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const categorias = [
    { value: "operacional", label: "Operacional", icon: "⚙️", color: "bg-blue-600" },
    { value: "manutencao", label: "Manutenção", icon: "🔧", color: "bg-orange-600" },
    { value: "combustivel", label: "Combustível", icon: "⛽", color: "bg-yellow-600" },
    { value: "energia", label: "Energia Elétrica", icon: "⚡", color: "bg-amber-600" },
    { value: "agua", label: "Água", icon: "💧", color: "bg-cyan-600" },
    { value: "telefone", label: "Telefone/Internet", icon: "📞", color: "bg-indigo-600" },
    { value: "aluguel", label: "Aluguel", icon: "🏠", color: "bg-purple-600" },
    { value: "funcionarios", label: "Funcionários", icon: "👥", color: "bg-green-600" },
    { value: "impostos", label: "Impostos/Taxas", icon: "📋", color: "bg-red-600" },
    { value: "equipamentos", label: "Equipamentos", icon: "🛠️", color: "bg-gray-600" },
    { value: "p_casa", label: "P/Casa", icon: "🏡", color: "bg-pink-600" },
    { value: "devolucao", label: "Devolução", icon: "↩️", color: "bg-rose-600" },
    { value: "refeicao", label: "Refeição", icon: "🍽️", color: "bg-lime-600" },
    { value: "outros", label: "Outros", icon: "📦", color: "bg-slate-600" },
  ]

  const filteredCategories = categorias.filter((cat) => cat.label.toLowerCase().includes(categorySearch.toLowerCase()))

  const selectedCategory = categorias.find((c) => c.value === formData.categoria)

  return (
    <div className="max-w-6xl mx-auto space-y-4 p-4 sm:p-6">
      <div className="text-center bg-gradient-to-r from-red-50 via-orange-50 to-red-50 p-4 rounded-xl border border-red-100 shadow-sm">
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
          💸 Registrar Despesa
        </h1>
        <p className="text-sm text-gray-600 mt-1">Controle todas as despesas do seu negócio</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="p-4 sm:p-6 shadow-md hover:shadow-lg transition-shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-sm font-medium text-gray-700">
                Nome da Despesa *
              </Label>
              <Input
                id="nome"
                type="text"
                value={formData.nome}
                onChange={(e) => handleInputChange("nome", e.target.value)}
                className="text-base h-12 border-2 focus:border-red-500 font-medium"
                placeholder="Ex: Conta de luz"
                required
                aria-required="true"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor" className="text-sm font-medium text-gray-700">
                Valor (R$) *
              </Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor}
                onChange={(e) => handleInputChange("valor", e.target.value)}
                className="text-base h-12 border-2 focus:border-red-500 font-bold text-red-700"
                placeholder="0.00"
                required
                aria-required="true"
              />
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <Label htmlFor="category-search" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Tag className="h-4 w-4 text-red-600" />
              Categoria *
            </Label>

            {/* Selected Category Display */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowCategorySuggestions(!showCategorySuggestions)
                  setTimeout(() => categoryInputRef.current?.focus(), 100)
                }}
                className="w-full h-12 px-4 rounded-xl border-2 border-gray-300 bg-white hover:border-red-400 transition-all flex items-center justify-between group"
                aria-label="Selecionar categoria"
                aria-expanded={showCategorySuggestions}
                aria-haspopup="listbox"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg ${selectedCategory?.color} flex items-center justify-center text-white font-bold shadow-sm`}
                  >
                    {selectedCategory?.icon}
                  </div>
                  <span className="font-semibold text-gray-800">{selectedCategory?.label}</span>
                </div>
                <Search className="h-4 w-4 text-gray-400 group-hover:text-red-600 transition-colors" />
              </button>

              {/* Category Search Dropdown */}
              {showCategorySuggestions && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-red-200 rounded-xl shadow-2xl z-50 max-h-96 overflow-hidden">
                  {/* Search Input */}
                  <div className="p-3 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        ref={categoryInputRef}
                        type="text"
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        placeholder="Buscar categoria..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border-2 border-gray-300 focus:border-red-500 focus:outline-none text-sm"
                        aria-label="Buscar categoria"
                      />
                    </div>
                  </div>

                  {/* Category List */}
                  <div className="max-h-64 overflow-y-auto p-2" role="listbox">
                    {filteredCategories.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {filteredCategories.map((categoria) => (
                          <button
                            key={categoria.value}
                            type="button"
                            onClick={() => {
                              handleInputChange("categoria", categoria.value)
                              setShowCategorySuggestions(false)
                              setCategorySearch("")
                            }}
                            role="option"
                            aria-selected={formData.categoria === categoria.value}
                            className={`p-3 rounded-lg border-2 transition-all text-left hover:shadow-md ${
                              formData.categoria === categoria.value
                                ? "border-red-500 bg-red-50 shadow-sm"
                                : "border-gray-200 bg-white hover:border-red-300"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-8 h-8 rounded-lg ${categoria.color} flex items-center justify-center text-white font-bold shadow-sm flex-shrink-0`}
                              >
                                {categoria.icon}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-sm text-gray-800 truncate">{categoria.label}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Tag className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">Nenhuma categoria encontrada</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data" className="text-sm font-medium text-gray-700">
                Data *
              </Label>
              <input
                type="date"
                id="data"
                value={formData.data.toISOString().split("T")[0]}
                onChange={(e) => handleInputChange("data", new Date(e.target.value))}
                className="flex w-full rounded-xl border-2 border-gray-300 bg-white px-3 py-2.5 text-sm h-12 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                required
                aria-required="true"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="formaPagamento" className="text-sm font-medium text-gray-700">
                Pagamento
              </Label>
              <select
                id="formaPagamento"
                value={formData.formaPagamento}
                onChange={(e) => {
                  handleInputChange("formaPagamento", e.target.value)
                  if (e.target.value !== "pix") handleInputChange("numeroTransacao", "")
                }}
                className="flex w-full rounded-xl border-2 border-gray-300 bg-white px-3 py-2.5 text-sm h-12 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                aria-label="Forma de pagamento"
              >
                <option value="dinheiro">💵 Dinheiro</option>
                <option value="pix">📱 PIX</option>
                <option value="emprestimo_divida">📋 Empréstimo</option>
              </select>
            </div>

            {formData.formaPagamento === "pix" ? (
              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="numeroTransacao" className="text-sm font-medium text-gray-700">
                  Nº Transação PIX
                </Label>
                <Input
                  id="numeroTransacao"
                  type="text"
                  value={formData.numeroTransacao}
                  onChange={(e) => handleInputChange("numeroTransacao", e.target.value)}
                  className="text-base h-12 border-2 focus:border-red-500"
                  placeholder="E12345..."
                  aria-label="Número da transação PIX"
                />
              </div>
            ) : (
              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="observacoes" className="text-sm font-medium text-gray-700">
                  Observações
                </Label>
                <Input
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange("observacoes", e.target.value)}
                  className="text-base h-12 border-2 focus:border-red-500"
                  placeholder="Detalhes adicionais"
                  aria-label="Observações adicionais"
                />
              </div>
            )}
          </div>

          {/* Total Display */}
          <div className="mt-6 p-4 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Valor Total da Despesa:</span>
              <span className="text-2xl font-bold text-red-700">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(Number.parseFloat(formData.valor) || 0)}
              </span>
            </div>
          </div>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="submit"
            disabled={saving}
            className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 h-14 font-semibold shadow-lg hover:shadow-xl transition-all text-base"
          >
            <Save className="h-5 w-5 mr-2" />
            {saving ? "Registrando..." : "Registrar Despesa"}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="h-14 font-semibold sm:w-auto w-full border-2 bg-white hover:bg-gray-50 text-base"
            onClick={resetForm}
          >
            <RotateCcw className="h-5 w-5 mr-2" />
            Limpar Formulário
          </Button>
        </div>
      </form>
    </div>
  )
}

export default ExpenseForm
