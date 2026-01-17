"use client"

import { useState, useEffect, useRef } from "react"
import { Save, TrendingUp, TrendingDown, RotateCcw, Edit3, Trash2, User, X, Search, Package } from "lucide-react"
import { DatePicker } from "./ui/date-picker"
import { useData } from "../contexts/DataContext"

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>{children}</div>
)

const Button = ({
  children,
  variant = "default",
  className = "",
  disabled = false,
  type = "button",
  onClick,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-300 bg-white hover:bg-gray-50",
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]} px-4 py-2 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

const Input = ({ className = "", ...props }) => (
  <input
    className={`flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  />
)

const Label = ({ children, htmlFor, className = "" }) => (
  <label
    htmlFor={htmlFor}
    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
  >
    {children}
  </label>
)

const formatCurrency = (value) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0) // Garantir que value não seja undefined
}

const useToast = () => {
  const toast = ({ title, description, variant = "default", className = "" }) => {
    const toastEl = document.createElement("div")
    const bgColor =
      variant === "destructive"
        ? "bg-red-100 border-red-500 text-red-800"
        : className || "bg-blue-100 border-blue-500 text-blue-800"

    toastEl.innerHTML = `
      <div class="fixed top-4 right-4 z-50 p-4 rounded-lg border ${bgColor} shadow-lg max-w-sm">
        <div class="font-semibold">${title}</div>
        <div class="text-sm mt-1">${description}</div>
      </div>
    `

    document.body.appendChild(toastEl)
    setTimeout(() => {
      document.body.removeChild(toastEl)
    }, 4000)
  }

  return { toast }
}

// Hook personalizado para gerenciar nomes salvos
const useSavedNames = () => {
  const [savedNames, setSavedNames] = useState([])

  // Carregar nomes salvos do localStorage
  useEffect(() => {
    const loadSavedNames = () => {
      try {
        const saved = localStorage.getItem("recycling_saved_names")
        if (saved) {
          const names = JSON.parse(saved)
          setSavedNames(names)
        }
      } catch (error) {
        console.error("Erro ao carregar nomes salvos:", error)
      }
    }

    loadSavedNames()
  }, [])

  // Salvar novo nome
  const saveName = (name) => {
    if (!name || name.trim() === "") return

    const trimmedName = name.trim()
    setSavedNames((prev) => {
      // Evitar duplicatas (case insensitive)
      const normalizedNames = prev.map((n) => n.toLowerCase())
      if (normalizedNames.includes(trimmedName.toLowerCase())) {
        return prev
      }

      const newNames = [trimmedName, ...prev].slice(0, 20) // Limitar a 20 nomes
      try {
        localStorage.setItem("recycling_saved_names", JSON.stringify(newNames))
      } catch (error) {
        console.error("Erro ao salvar nomes:", error)
      }
      return newNames
    })
  }

  // Remover nome
  const removeName = (nameToRemove) => {
    setSavedNames((prev) => {
      const newNames = prev.filter((name) => name !== nameToRemove)
      try {
        localStorage.setItem("recycling_saved_names", JSON.stringify(newNames))
      } catch (error) {
        console.error("Erro ao remover nome:", error)
      }
      return newNames
    })
  }

  return {
    savedNames,
    saveName,
    removeName,
  }
}

const TransactionForm = ({ onSuccess, initialType = "compra", editingTransaction = null, onCancelEdit = null }) => {
  const { addTransaction, editTransaction, deleteTransaction } = useData()
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
  })

  const [inventory, setInventory] = useState({})
  const [valorTotal, setValorTotal] = useState(0)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showNameSuggestions, setShowNameSuggestions] = useState(false)

  const [materialSearch, setMaterialSearch] = useState("")
  const [showMaterialSuggestions, setShowMaterialSuggestions] = useState(false)
  const [recentMaterials, setRecentMaterials] = useState([])
  const materialInputRef = useRef(null)

  const { toast } = useToast()
  const { savedNames, saveName, removeName } = useSavedNames()

  useEffect(() => {
    try {
      const recent = localStorage.getItem("recycling_recent_materials")
      if (recent) {
        setRecentMaterials(JSON.parse(recent))
      }
    } catch (error) {
      console.error("Erro ao carregar materiais recentes:", error)
    }
  }, [])

  const saveRecentMaterial = (material) => {
    setRecentMaterials((prev) => {
      const filtered = prev.filter((m) => m !== material)
      const newRecent = [material, ...filtered].slice(0, 5)
      try {
        localStorage.setItem("recycling_recent_materials", JSON.stringify(newRecent))
      } catch (error) {
        console.error("Erro ao salvar material recente:", error)
      }
      return newRecent
    })
  }

  useEffect(() => {
    if (editingTransaction) {
      setIsEditing(true)
      setFormData({
        tipo: editingTransaction.tipo || editingTransaction.type || "compra",
        material: editingTransaction.material || "ferro",
        quantidade: (editingTransaction.quantidade || editingTransaction.weight || "").toString(),
        precoUnitario: (editingTransaction.precoUnitario || editingTransaction.pricePerKg || "").toString(),
        vendedor: editingTransaction.vendedor || "",
        observacoes: editingTransaction.observacoes || "",
        data: editingTransaction.data ? new Date(editingTransaction.data) : new Date(),
        formaPagamento: editingTransaction.formaPagamento || "dinheiro",
        numeroTransacao: editingTransaction.numeroTransacao || "",
      })
    }
  }, [editingTransaction])

  const loadInventory = async () => {
    try {
      const { getInventory } = await import("../lib/firebaseService")
      const inventoryData = await getInventory()
      setInventory(inventoryData)
      return inventoryData
    } catch (error) {
      console.error("Erro ao carregar inventário do Firebase:", error)
      const inventoryData = JSON.parse(localStorage.getItem("recycling_inventory") || "{}")
      setInventory(inventoryData)
      return inventoryData
    }
  }

  const updatePrice = (type, material, inv) => {
    if (inv && inv[material]) {
      const price = type === "compra" ? inv[material].precoCompra || 0 : inv[material].precoVenda || 0
      setFormData((prev) => ({
        ...prev,
        precoUnitario: price.toString(),
      }))
    } else {
      // Se não encontrar o material no inventário, definir preço como 0
      setFormData((prev) => ({
        ...prev,
        precoUnitario: "0",
      }))
    }
  }

  useEffect(() => {
    loadInventory().then((inv) => {
      updatePrice(formData.tipo, formData.material, inv)
    })
  }, [formData.tipo, formData.material])

  useEffect(() => {
    const quantidade = Number.parseFloat(formData.quantidade) || 0
    const preco = Number.parseFloat(formData.precoUnitario) || 0
    setValorTotal(quantidade * preco)
  }, [formData.quantidade, formData.precoUnitario])

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    if (field === "vendedor") {
      if (value.length > 0) {
        setShowNameSuggestions(true)
      } else {
        setShowNameSuggestions(false)
      }
    }

    if ((field === "material" || field === "tipo") && value) {
      loadInventory().then((inv) => {
        updatePrice(field === "tipo" ? value : formData.tipo, field === "material" ? value : formData.material, inv)
      })

      if (field === "material") {
        saveRecentMaterial(value)
        setMaterialSearch("")
        setShowMaterialSuggestions(false)
      }
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    if (onCancelEdit) {
      onCancelEdit()
    }
    resetForm()
  }

  const handleDeleteTransaction = async () => {
    if (!editingTransaction?.id) return

    try {
      setSaving(true)
      await deleteTransaction(editingTransaction.id)

      toast({
        title: "✅ Transação Excluída!",
        description: "A transação foi removida com sucesso.",
        className: "bg-green-100 border-green-500 text-green-800",
      })

      setShowDeleteConfirm(false)
      if (onCancelEdit) {
        onCancelEdit()
      }
      resetForm()
    } catch (error) {
      console.error("[v0] Erro ao excluir transação:", error)
      toast({
        title: "❌ Erro ao Excluir",
        description: "Não foi possível excluir a transação. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

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
    })
    setIsEditing(false)
    setShowNameSuggestions(false)
    loadInventory().then((inv) => {
      updatePrice("compra", "ferro", inv)
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    console.log("[v0] Form submit triggered", { formData, isEditing })

    if (!formData.quantidade || !formData.precoUnitario) {
      toast({
        title: "Erro de Validação",
        description: "Por favor, preencha os campos de quantidade e preço por kg.",
        variant: "destructive",
      })
      return
    }

    if (!formData.data) {
      toast({
        title: "Erro de Validação",
        description: "Por favor, selecione uma data para a transação.",
        variant: "destructive",
      })
      return
    }

    const quantidade = Number.parseFloat(formData.quantidade)
    const precoUnitario = Number.parseFloat(formData.precoUnitario)

    if (quantidade <= 0 || precoUnitario <= 0) {
      toast({
        title: "Erro de Validação",
        description: "Quantidade e preço devem ser maiores que zero.",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)

      const transactionDate = formData.data instanceof Date ? formData.data : new Date(formData.data)
      transactionDate.setHours(12, 0, 0, 0)

      const transaction = {
        ...formData,
        quantidade,
        precoUnitario,
        valorTotal,
        data: transactionDate,
      }

      if (formData.vendedor && formData.vendedor.trim() !== "") {
        saveName(formData.vendedor.trim())
      }

      saveRecentMaterial(formData.material)

      if (isEditing && editingTransaction?.id) {
        await editTransaction(editingTransaction.id, transaction)

        toast({
          title: "✅ Transação Atualizada!",
          description:
            "As alterações foram salvas. O estoque e relatórios serão sincronizados automaticamente pelas Cloud Functions.",
          className: "bg-green-100 border-green-500 text-green-800",
        })

        if (onCancelEdit) {
          onCancelEdit()
        }
      } else {
        await addTransaction(transaction)

        toast({
          title: "✅ Sucesso!",
          description: `${formData.tipo === "compra" ? "Compra" : formData.tipo === "venda" ? "Venda" : "Despesa"} registrada! O estoque e relatórios serão atualizados automaticamente.`,
          className: "bg-green-100 border-green-500 text-green-800",
        })
      }

      await loadInventory()

      if (!isEditing) {
        setFormData((prev) => ({
          ...prev,
          quantidade: "",
          precoUnitario: "",
          vendedor: "",
          observacoes: "",
          data: new Date(),
          formaPagamento: "dinheiro",
          numeroTransacao: "",
        }))

        const inventoryData = await loadInventory()
        updatePrice(formData.tipo, formData.material, inventoryData)
      } else {
        resetForm()
      }
    } catch (error) {
      console.error("[v0] Erro ao salvar:", error)
      toast({
        title: "❌ Erro ao Salvar",
        description: "Verifique sua conexão e tente novamente.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
      setShowNameSuggestions(false)
    }
  }

  const handleSaveAndContinue = async (e) => {
    e.preventDefault()
    await handleSubmit(e)

    setFormData((prev) => ({
      ...prev,
      quantidade: "",
      precoUnitario: "",
      observacoes: "",
      vendedor: "",
      numeroTransacao: "",
    }))

    setTimeout(() => {
      document.getElementById("quantidade")?.focus()
    }, 100)
  }

  const handleSelectName = (name) => {
    setFormData((prev) => ({ ...prev, vendedor: name }))
    setShowNameSuggestions(false)
  }

  const filteredSuggestions = savedNames
    .filter((name) => name.toLowerCase().includes(formData.vendedor.toLowerCase()))
    .slice(0, 5)

  // CORREÇÃO: Função segura para calcular margem de lucro
  const calculateProfitMargin = () => {
    if (!inventory[formData.material] || !inventory[formData.material].precoCompra) {
      return 0
    }

    const currentPrice = Number.parseFloat(formData.precoUnitario) || 0
    const purchasePrice = inventory[formData.material].precoCompra || 0

    if (purchasePrice === 0) return 0

    return currentPrice - purchasePrice
  }

  const materials = [
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
    { value: "perfil pintado", label: "Perfil pintado", color: "bg-indigo-600", icon: "🎨" },
    { value: "perfil natural", label: "Perfil natural", color: "bg-indigo-500", icon: "🔩" },
    { value: "bloco", label: "Bloco", color: "bg-pink-600", icon: "🧱" },
    { value: "metal", label: "Metal", color: "bg-gray-700", icon: "🔨" },
    { value: "inox", label: "Inox", color: "bg-blue-700", icon: "✨" },
    { value: "bateria", label: "Bateria", color: "bg-green-700", icon: "🔋" },
    { value: "motor_gel", label: "Motor Gel", color: "bg-purple-700", icon: "⚙️" },
    { value: "roda", label: "Roda", color: "bg-black", icon: "⚫" },
    { value: "papelao", label: "Papelão", color: "bg-yellow-700", icon: "📦" },
    { value: "rad_metal", label: "Rad. Metal", color: "bg-rose-600", icon: "🌡️" },
    { value: "rad_cobre", label: "Rad. Cobre", color: "bg-orange-700", icon: "🔶" },
    { value: "rad_chapa", label: "Rad. Chapa", color: "bg-violet-600", icon: "📐" },
    { value: "tela", label: "Tela", color: "bg-lime-600", icon: "🕸️" },
    { value: "antimonio", label: "Antimônio", color: "bg-fuchsia-600", icon: "💎" },
    { value: "cabo_ai", label: "Cabo AI", color: "bg-sky-600", icon: "🔌" },
    { value: "tubo_limpo", label: "Tubo Limpo", color: "bg-green-700", icon: "🚰" },
    { value: "papel_branco", label: "Papel Branco", color: "bg-green-700", icon: "📄" },
  ]

  const filteredMaterials = materials.filter((material) =>
    material.label.toLowerCase().includes(materialSearch.toLowerCase()),
  )

  const recentMaterialsObjects = recentMaterials
    .map((value) => materials.find((m) => m.value === value))
    .filter(Boolean)

  const selectedMaterial = materials.find((m) => m.value === formData.material)

  return (
    <div className="max-w-6xl mx-auto space-y-4 p-4 sm:p-6">
      <div className="text-center bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm">
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {isEditing ? "✏️ Editar Transação" : "➕ Nova Transação"}
        </h1>
        <p className="text-sm text-gray-600 mt-1">Registre compras e vendas de forma rápida e inteligente</p>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              Confirmar Exclusão
            </h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={handleDeleteTransaction}
                disabled={saving}
                className="flex-1 bg-red-600 hover:bg-red-700 h-12"
              >
                {saving ? "Excluindo..." : "Sim, Excluir"}
              </Button>
              <Button onClick={() => setShowDeleteConfirm(false)} variant="outline" className="flex-1 h-12 border-2">
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="p-4 sm:p-6 shadow-md hover:shadow-lg transition-shadow">
          {/* Transaction Type Selection */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => handleInputChange("tipo", "compra")}
              aria-label="Selecionar tipo de transação: Compra"
              aria-pressed={formData.tipo === "compra"}
              className={`h-16 rounded-xl border-2 transition-all ${
                formData.tipo === "compra"
                  ? "border-red-500 bg-gradient-to-br from-red-50 to-red-100 shadow-md scale-105"
                  : "border-gray-200 bg-white hover:border-red-300 hover:bg-red-50"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <TrendingDown className={`h-5 w-5 ${formData.tipo === "compra" ? "text-red-600" : "text-gray-400"}`} />
                <span className={`font-semibold ${formData.tipo === "compra" ? "text-red-700" : "text-gray-600"}`}>
                  Compra
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleInputChange("tipo", "venda")}
              aria-label="Selecionar tipo de transação: Venda"
              aria-pressed={formData.tipo === "venda"}
              className={`h-16 rounded-xl border-2 transition-all ${
                formData.tipo === "venda"
                  ? "border-green-500 bg-gradient-to-br from-green-50 to-green-100 shadow-md scale-105"
                  : "border-gray-200 bg-white hover:border-green-300 hover:bg-green-50"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <TrendingUp className={`h-5 w-5 ${formData.tipo === "venda" ? "text-green-600" : "text-gray-400"}`} />
                <span className={`font-semibold ${formData.tipo === "venda" ? "text-green-700" : "text-gray-600"}`}>
                  Venda
                </span>
              </div>
            </button>
          </div>

          <div className="space-y-3 mb-6">
            <Label htmlFor="material-search" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-600" />
              Material *
            </Label>

            {/* Selected Material Display */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowMaterialSuggestions(!showMaterialSuggestions)
                  setTimeout(() => materialInputRef.current?.focus(), 100)
                }}
                className="w-full h-12 px-4 rounded-xl border-2 border-gray-300 bg-white hover:border-blue-400 transition-all flex items-center justify-between group"
                aria-label="Selecionar material"
                aria-expanded={showMaterialSuggestions}
                aria-haspopup="listbox"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg ${selectedMaterial?.color} flex items-center justify-center text-white font-bold shadow-sm`}
                  >
                    {selectedMaterial?.icon}
                  </div>
                  <span className="font-semibold text-gray-800">{selectedMaterial?.label}</span>
                </div>
                <Search className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </button>

              {/* Material Search Dropdown */}
              {showMaterialSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-blue-200 rounded-xl shadow-2xl z-50 max-h-96 overflow-hidden">
                  {/* Search Input */}
                  <div className="p-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        ref={materialInputRef}
                        type="text"
                        value={materialSearch}
                        onChange={(e) => setMaterialSearch(e.target.value)}
                        placeholder="Buscar material..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none text-sm"
                        aria-label="Buscar material"
                      />
                    </div>
                  </div>

                  {/* Recent Materials */}
                  {recentMaterialsObjects.length > 0 && materialSearch === "" && (
                    <div className="p-3 border-b border-gray-200 bg-blue-50">
                      <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Recentes</p>
                      <div className="flex flex-wrap gap-2">
                        {recentMaterialsObjects.map((material) => (
                          <button
                            key={material.value}
                            type="button"
                            onClick={() => {
                              handleInputChange("material", material.value)
                              setShowMaterialSuggestions(false)
                            }}
                            className="px-3 py-1.5 rounded-lg bg-white border border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all flex items-center gap-2 text-sm font-medium"
                          >
                            <span>{material.icon}</span>
                            <span>{material.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Material List */}
                  <div className="max-h-64 overflow-y-auto p-2" role="listbox">
                    {filteredMaterials.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {filteredMaterials.map((material) => (
                          <button
                            key={material.value}
                            type="button"
                            onClick={() => {
                              handleInputChange("material", material.value)
                              setShowMaterialSuggestions(false)
                            }}
                            role="option"
                            aria-selected={formData.material === material.value}
                            className={`p-3 rounded-lg border-2 transition-all text-left hover:shadow-md ${
                              formData.material === material.value
                                ? "border-blue-500 bg-blue-50 shadow-sm"
                                : "border-gray-200 bg-white hover:border-blue-300"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-8 h-8 rounded-lg ${material.color} flex items-center justify-center text-white font-bold shadow-sm flex-shrink-0`}
                              >
                                {material.icon}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-sm text-gray-800 truncate">{material.label}</p>
                                {inventory[material.value] && (
                                  <p className="text-xs text-blue-600 font-medium">
                                    {inventory[material.value].quantidade.toFixed(2)}kg
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">Nenhum material encontrado</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Stock Info */}
            {inventory[formData.material] && (
              <div className="flex items-center gap-2 text-sm">
                <div className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200">
                  <span className="text-gray-600">Estoque atual: </span>
                  <span className="font-bold text-blue-600">
                    {inventory[formData.material].quantidade.toFixed(2)}kg
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Main Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantidade" className="text-sm font-medium text-gray-700">
                Quantidade (kg) *
              </Label>
              <Input
                id="quantidade"
                type="number"
                step="0.01"
                min="0"
                value={formData.quantidade}
                onChange={(e) => handleInputChange("quantidade", e.target.value)}
                className="text-base h-12 font-semibold border-2 focus:border-blue-500"
                placeholder="0.00"
                aria-required="true"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="precoUnitario" className="text-sm font-medium text-gray-700">
                Preço/kg (R$) *
              </Label>
              <Input
                id="precoUnitario"
                type="number"
                step="0.01"
                min="0"
                value={formData.precoUnitario}
                onChange={(e) => handleInputChange("precoUnitario", e.target.value)}
                className="text-base h-12 font-semibold border-2 focus:border-blue-500"
                placeholder="0.00"
                aria-required="true"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Valor Total</Label>
              <div
                className={`h-12 rounded-xl border-2 px-4 flex items-center justify-center font-bold text-lg shadow-sm ${
                  formData.tipo === "venda"
                    ? "bg-gradient-to-br from-green-50 to-green-100 border-green-300 text-green-700"
                    : "bg-gradient-to-br from-red-50 to-red-100 border-red-300 text-red-700"
                }`}
                aria-live="polite"
              >
                {formatCurrency(valorTotal)}
              </div>
            </div>
          </div>

          {/* Secondary Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Data *</Label>
              <DatePicker
                selected={formData.data}
                onSelect={(date) => handleInputChange("data", date)}
                placeholder="Data"
                className="w-full h-12 text-sm border-2"
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
                className="flex w-full rounded-xl border-2 border-gray-300 bg-white px-3 py-2.5 text-sm h-12 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                aria-label="Forma de pagamento"
              >
                <option value="dinheiro">💵 Dinheiro</option>
                <option value="pix">📱 PIX</option>
                <option value="pagamento_divida">📋 Pagamento de Dívida</option>
              </select>
            </div>

            <div className="space-y-2 relative">
              <Label htmlFor="vendedor" className="text-sm font-medium text-gray-700">
                {formData.tipo === "compra" ? "Vendedor" : "Cliente"}
              </Label>
              <div className="relative">
                <Input
                  id="vendedor"
                  type="text"
                  value={formData.vendedor}
                  onChange={(e) => handleInputChange("vendedor", e.target.value)}
                  onFocus={() => formData.vendedor && setShowNameSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowNameSuggestions(false), 200)}
                  className="h-12 pr-10 border-2 focus:border-blue-500"
                  placeholder="Nome"
                  aria-label={formData.tipo === "compra" ? "Nome do vendedor" : "Nome do cliente"}
                />
                <User className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>

              {/* Name Suggestions */}
              {showNameSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border-2 border-blue-200 rounded-xl shadow-xl z-10 mt-1 max-h-48 overflow-y-auto">
                  {filteredSuggestions.map((name, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                      onMouseDown={() => handleSelectName(name)}
                    >
                      <span className="text-sm font-medium text-gray-700">{name}</span>
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.stopPropagation()
                          removeName(name)
                        }}
                        className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
                        aria-label={`Remover ${name} dos salvos`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {formData.formaPagamento === "pix" ? (
              <div className="space-y-2">
                <Label htmlFor="numeroTransacao" className="text-sm font-medium text-gray-700">
                  Nº Transação PIX
                </Label>
                <Input
                  id="numeroTransacao"
                  type="text"
                  value={formData.numeroTransacao}
                  onChange={(e) => handleInputChange("numeroTransacao", e.target.value)}
                  className="h-12 border-2 focus:border-blue-500"
                  placeholder="E12345..."
                  aria-label="Número da transação PIX"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="observacoes" className="text-sm font-medium text-gray-700">
                  Observações
                </Label>
                <Input
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange("observacoes", e.target.value)}
                  className="h-12 border-2 focus:border-blue-500"
                  placeholder="Detalhes"
                  aria-label="Observações adicionais"
                />
              </div>
            )}
          </div>

          {/* Profit Margin Info */}
          {formData.tipo === "venda" && inventory[formData.material] && calculateProfitMargin() > 0 && (
            <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
              <p className="text-sm text-gray-700 flex items-center gap-2">
                <span className="text-green-600 font-bold text-lg">💰</span>
                Margem de lucro:{" "}
                <span className="font-bold text-green-600 text-lg">{formatCurrency(calculateProfitMargin())}/kg</span>
              </p>
            </div>
          )}
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {isEditing ? (
            <>
              <Button
                type="submit"
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 h-14 font-semibold shadow-lg hover:shadow-xl transition-all text-base"
              >
                <Edit3 className="h-5 w-5 mr-2" />
                {saving ? "Salvando..." : "Salvar Alterações"}
              </Button>

              <Button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 h-14 font-semibold shadow-lg hover:shadow-xl transition-all sm:w-auto w-full text-base"
              >
                <Trash2 className="h-5 w-5 mr-2" />
                Excluir
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleCancelEdit}
                className="h-14 font-semibold sm:w-auto w-full border-2 bg-white hover:bg-gray-50 text-base"
              >
                Cancelar
              </Button>
            </>
          ) : (
            <>
              <Button
                type="submit"
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 h-14 font-semibold shadow-lg hover:shadow-xl transition-all text-base"
              >
                <Save className="h-5 w-5 mr-2" />
                {saving ? "Salvando..." : "Salvar Transação"}
              </Button>

              <Button
                type="button"
                onClick={handleSaveAndContinue}
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 h-14 font-semibold shadow-lg hover:shadow-xl transition-all text-base"
              >
                <Save className="h-5 w-5 mr-2" />
                Salvar e Continuar
              </Button>

              <Button
                type="button"
                variant="outline"
                className="h-14 font-semibold sm:w-auto w-full border-2 bg-white hover:bg-gray-50 text-base"
                onClick={resetForm}
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Limpar
              </Button>
            </>
          )}
        </div>
      </form>
    </div>
  )
}

export default TransactionForm
