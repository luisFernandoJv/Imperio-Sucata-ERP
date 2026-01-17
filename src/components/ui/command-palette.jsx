"use client"

import { useEffect, useState, useCallback } from "react"
import { Command } from "cmdk"
import { Search, TrendingUp, Package, FileText, DollarSign, Calculator, X } from "lucide-react"
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts"

export function CommandPalette({ onNavigate }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const toggle = useCallback(() => {
    setOpen((prev) => !prev)
  }, [])

  useKeyboardShortcuts([
    {
      key: "k",
      ctrl: true,
      action: toggle,
    },
    {
      key: "Escape",
      action: () => setOpen(false),
    },
  ])

  useEffect(() => {
    if (!open) {
      setSearch("")
    }
  }, [open])

  const commands = [
    {
      group: "Navegação",
      items: [
        {
          icon: TrendingUp,
          label: "Dashboard",
          keywords: ["painel", "visão geral", "dashboard"],
          action: () => {
            onNavigate("dashboard")
            setOpen(false)
          },
        },
        {
          icon: TrendingUp,
          label: "Nova Transação",
          keywords: ["compra", "venda", "transação", "nova"],
          action: () => {
            onNavigate("transaction")
            setOpen(false)
          },
        },
        {
          icon: Package,
          label: "Estoque",
          keywords: ["estoque", "inventário", "materiais"],
          action: () => {
            onNavigate("inventory")
            setOpen(false)
          },
        },
        {
          icon: DollarSign,
          label: "Despesas",
          keywords: ["despesas", "gastos", "custos"],
          action: () => {
            onNavigate("expenses")
            setOpen(false)
          },
        },
        {
          icon: FileText,
          label: "Relatórios",
          keywords: ["relatórios", "reports", "análise"],
          action: () => {
            onNavigate("reports")
            setOpen(false)
          },
        },
      ],
    },
    {
      group: "Ações Rápidas",
      items: [
        {
          icon: TrendingUp,
          label: "Registrar Compra",
          keywords: ["compra", "comprar", "entrada"],
          action: () => {
            onNavigate("transaction", "compra")
            setOpen(false)
          },
        },
        {
          icon: TrendingUp,
          label: "Registrar Venda",
          keywords: ["venda", "vender", "saída"],
          action: () => {
            onNavigate("transaction", "venda")
            setOpen(false)
          },
        },
        {
          icon: Calculator,
          label: "Abrir Calculadora",
          keywords: ["calculadora", "calcular", "conta"],
          action: () => {
            // This will be implemented in the next component
            console.log("Open calculator")
            setOpen(false)
          },
        },
      ],
    },
  ]

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="fixed top-[20vh] left-1/2 -translate-x-1/2 w-full max-w-2xl px-4">
        <Command className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center border-b border-gray-200 px-4">
            <Search className="h-5 w-5 text-gray-400 mr-3" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Digite um comando ou busque..."
              className="flex-1 py-4 text-base bg-transparent border-0 focus:outline-none placeholder:text-gray-400"
            />
            <button
              onClick={() => setOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Fechar"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-gray-500 text-sm">Nenhum comando encontrado.</Command.Empty>

            {commands.map((group) => (
              <Command.Group key={group.group} heading={group.group} className="mb-2">
                <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {group.group}
                </div>
                {group.items.map((item) => (
                  <Command.Item
                    key={item.label}
                    keywords={item.keywords}
                    onSelect={item.action}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer hover:bg-blue-50 data-[selected=true]:bg-blue-50 transition-colors group"
                  >
                    <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-blue-100 group-data-[selected=true]:bg-blue-100 transition-colors">
                      <item.icon className="h-4 w-4 text-gray-600 group-hover:text-blue-600 group-data-[selected=true]:text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-blue-900 group-data-[selected=true]:text-blue-900">
                      {item.label}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </Command.List>

          <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
            <div className="flex gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white rounded border border-gray-300 font-mono">↑↓</kbd>
                Navegar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white rounded border border-gray-300 font-mono">↵</kbd>
                Selecionar
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-white rounded border border-gray-300 font-mono">Esc</kbd>
              Fechar
            </span>
          </div>
        </Command>
      </div>
    </div>
  )
}
