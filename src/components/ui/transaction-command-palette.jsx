"use client"

import { useEffect, useState, useMemo } from "react"
import { Command } from "cmdk"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  TrendingUp,
  TrendingDown,
  Package,
  FileText,
  Calculator,
  X,
  Calendar,
  User,
  ArrowRight,
  Clock,
  Minus,
} from "lucide-react"
import { useData } from "../../contexts/DataContext"

const formatCurrency = (value) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0)
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  })
}

const materials = {
  ferro: { label: "Ferro", color: "bg-gray-600" },
  aluminio: { label: "Alumínio", color: "bg-blue-600" },
  cobre: { label: "Cobre", color: "bg-orange-600" },
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
  roda: { label: "Roda", color: "bg-gray-800" },
  papelao: { label: "Papelão", color: "bg-yellow-700" },
}

export function TransactionCommandPalette({ isOpen, onClose, onNavigate, onSelectTransaction, onNewTransaction }) {
  const { transactions } = useData()
  const [search, setSearch] = useState("")
  const [activeSection, setActiveSection] = useState("all") // all, transactions, actions, materials

  useEffect(() => {
    if (!isOpen) {
      setSearch("")
      setActiveSection("all")
    }
  }, [isOpen])

  // Filter transactions based on search
  const filteredTransactions = useMemo(() => {
    if (!search) return transactions.slice(0, 5)

    const query = search.toLowerCase()
    return transactions
      .filter(
        (t) =>
          t.material?.toLowerCase().includes(query) ||
          t.vendedor?.toLowerCase().includes(query) ||
          t.tipo?.toLowerCase().includes(query) ||
          formatCurrency(t.valorTotal).includes(query) ||
          t.observacoes?.toLowerCase().includes(query),
      )
      .slice(0, 10)
  }, [transactions, search])

  // Filter materials based on search
  const filteredMaterials = useMemo(() => {
    if (!search) return Object.entries(materials).slice(0, 6)

    const query = search.toLowerCase()
    return Object.entries(materials).filter(
      ([key, value]) => value.label.toLowerCase().includes(query) || key.includes(query),
    )
  }, [search])

  const commands = useMemo(
    () => [
      {
        group: "Acoes Rapidas",
        items: [
          {
            icon: TrendingDown,
            iconBg: "bg-blue-100",
            iconColor: "text-blue-600",
            label: "Nova Compra",
            description: "Registrar compra de material",
            keywords: ["compra", "comprar", "entrada", "nova"],
            action: () => {
              onNewTransaction?.("compra")
              onClose()
            },
          },
          {
            icon: TrendingUp,
            iconBg: "bg-green-100",
            iconColor: "text-green-600",
            label: "Nova Venda",
            description: "Registrar venda de material",
            keywords: ["venda", "vender", "saída", "nova"],
            action: () => {
              onNewTransaction?.("venda")
              onClose()
            },
          },
          {
            icon: Minus,
            iconBg: "bg-red-100",
            iconColor: "text-red-600",
            label: "Nova Despesa",
            description: "Registrar despesa operacional",
            keywords: ["despesa", "gasto", "custo", "nova"],
            action: () => {
              onNewTransaction?.("despesa")
              onClose()
            },
          },
        ],
      },
      {
        group: "Navegacao",
        items: [
          {
            icon: TrendingUp,
            iconBg: "bg-purple-100",
            iconColor: "text-purple-600",
            label: "Dashboard",
            description: "Visao geral do sistema",
            keywords: ["painel", "visão", "dashboard", "inicio"],
            action: () => {
              onNavigate?.("dashboard")
              onClose()
            },
          },
          {
            icon: Package,
            iconBg: "bg-orange-100",
            iconColor: "text-orange-600",
            label: "Estoque",
            description: "Gerenciar inventario de materiais",
            keywords: ["estoque", "inventário", "materiais"],
            action: () => {
              onNavigate?.("inventory")
              onClose()
            },
          },
          {
            icon: FileText,
            iconBg: "bg-cyan-100",
            iconColor: "text-cyan-600",
            label: "Relatorios",
            description: "Analise e relatorios detalhados",
            keywords: ["relatórios", "reports", "análise"],
            action: () => {
              onNavigate?.("reports")
              onClose()
            },
          },
          {
            icon: Calculator,
            iconBg: "bg-pink-100",
            iconColor: "text-pink-600",
            label: "Calculadora",
            description: "Calcular valores rapidamente",
            keywords: ["calculadora", "calcular", "conta"],
            action: () => {
              onNavigate?.("calculator")
              onClose()
            },
          },
        ],
      },
    ],
    [onNavigate, onNewTransaction, onClose],
  )

  // Keyboard handling
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return

      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100]">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Command Palette */}
          <div className="fixed top-[15vh] left-1/2 -translate-x-1/2 w-full max-w-2xl px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <Command className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                {/* Search Header */}
                <div className="flex items-center border-b border-gray-200 px-4">
                  <Search className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                  <Command.Input
                    value={search}
                    onValueChange={setSearch}
                    placeholder="Buscar transacoes, materiais ou comandos..."
                    className="flex-1 py-4 text-base bg-transparent border-0 focus:outline-none placeholder:text-gray-400"
                    autoFocus
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="h-4 w-4 text-gray-400" />
                    </button>
                  )}
                </div>

                {/* Section Tabs */}
                <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-100 bg-gray-50">
                  {[
                    { id: "all", label: "Todos" },
                    { id: "transactions", label: "Transacoes" },
                    { id: "materials", label: "Materiais" },
                    { id: "actions", label: "Acoes" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveSection(tab.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                        activeSection === tab.id ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <Command.List className="max-h-[400px] overflow-y-auto p-2">
                  <Command.Empty className="py-8 text-center text-gray-500 text-sm">
                    Nenhum resultado encontrado para "{search}"
                  </Command.Empty>

                  {/* Recent Transactions */}
                  {(activeSection === "all" || activeSection === "transactions") && filteredTransactions.length > 0 && (
                    <Command.Group>
                      <div className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {search ? "Transacoes Encontradas" : "Transacoes Recentes"}
                      </div>
                      {filteredTransactions.map((transaction) => {
                        const material = materials[transaction.material] || {
                          label: transaction.material,
                          color: "bg-gray-500",
                        }
                        return (
                          <Command.Item
                            key={transaction.id}
                            onSelect={() => {
                              onSelectTransaction?.(transaction)
                              onClose()
                            }}
                            className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer hover:bg-blue-50 data-[selected=true]:bg-blue-50 transition-colors group"
                          >
                            <div className={`w-8 h-8 rounded-lg ${material.color} flex items-center justify-center`}>
                              <Package className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                                    transaction.tipo === "compra"
                                      ? "bg-blue-100 text-blue-700"
                                      : transaction.tipo === "venda"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {transaction.tipo === "compra"
                                    ? "Compra"
                                    : transaction.tipo === "venda"
                                      ? "Venda"
                                      : "Despesa"}
                                </span>
                                <span className="text-sm font-medium text-gray-900">{material.label}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                <Calendar className="h-3 w-3" />
                                {formatDate(transaction.data)}
                                {transaction.vendedor && (
                                  <>
                                    <span>•</span>
                                    <User className="h-3 w-3" />
                                    {transaction.vendedor}
                                  </>
                                )}
                              </div>
                            </div>
                            <span
                              className={`text-sm font-bold ${
                                transaction.tipo === "compra"
                                  ? "text-blue-600"
                                  : transaction.tipo === "venda"
                                    ? "text-green-600"
                                    : "text-red-600"
                              }`}
                            >
                              {formatCurrency(transaction.valorTotal)}
                            </span>
                            <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                          </Command.Item>
                        )
                      })}
                    </Command.Group>
                  )}

                  {/* Materials Quick Filter */}
                  {(activeSection === "all" || activeSection === "materials") && filteredMaterials.length > 0 && (
                    <Command.Group>
                      <div className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <Package className="h-3 w-3" />
                        Filtrar por Material
                      </div>
                      <div className="flex flex-wrap gap-2 px-2 pb-2">
                        {filteredMaterials.map(([key, value]) => (
                          <Command.Item
                            key={key}
                            onSelect={() => {
                              onNavigate?.("transactions", { material: key })
                              onClose()
                            }}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition-all ${value.color} text-white text-xs font-medium hover:scale-105`}
                          >
                            {value.label}
                          </Command.Item>
                        ))}
                      </div>
                    </Command.Group>
                  )}

                  {/* Commands */}
                  {(activeSection === "all" || activeSection === "actions") &&
                    commands.map((group) => (
                      <Command.Group key={group.group}>
                        <div className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          {group.group}
                        </div>
                        {group.items.map((item) => (
                          <Command.Item
                            key={item.label}
                            keywords={item.keywords}
                            onSelect={item.action}
                            className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer hover:bg-blue-50 data-[selected=true]:bg-blue-50 transition-colors group"
                          >
                            <div className={`p-2 rounded-lg ${item.iconBg} group-hover:scale-105 transition-transform`}>
                              <item.icon className={`h-4 w-4 ${item.iconColor}`} />
                            </div>
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-900 group-hover:text-blue-900">
                                {item.label}
                              </span>
                              {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                            </div>
                            <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                          </Command.Item>
                        ))}
                      </Command.Group>
                    ))}
                </Command.List>

                {/* Footer */}
                <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex gap-4">
                    <span className="flex items-center gap-1.5">
                      <kbd className="px-2 py-1 bg-white rounded-md border border-gray-200 font-mono text-[10px]">
                        ↑↓
                      </kbd>
                      Navegar
                    </span>
                    <span className="flex items-center gap-1.5">
                      <kbd className="px-2 py-1 bg-white rounded-md border border-gray-200 font-mono text-[10px]">
                        ↵
                      </kbd>
                      Selecionar
                    </span>
                  </div>
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-2 py-1 bg-white rounded-md border border-gray-200 font-mono text-[10px]">
                      Esc
                    </kbd>
                    Fechar
                  </span>
                </div>
              </Command>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}
