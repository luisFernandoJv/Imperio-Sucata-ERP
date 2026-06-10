"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";
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
  Users,
  BarChart2,
  Receipt,
} from "lucide-react";
import { useData } from "../../contexts/DataContext";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    v || 0,
  );

const formatDateShort = (date) =>
  new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });

// Lista canônica de materiais — sincronizada com o restante do sistema
const MATERIALS = {
  ferro: { label: "Ferro", color: "bg-gray-600" },
  aluminio: { label: "Alumínio", color: "bg-blue-600" },
  cobre: { label: "Cobre", color: "bg-orange-600" },
  cobre_mel: { label: "Cobre Mel", color: "bg-amber-600" },
  bronze: { label: "Bronze", color: "bg-amber-700" },
  magnesio: { label: "Magnésio", color: "bg-slate-600" },
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
  chumbo: { label: "Chumbo", color: "bg-slate-700" },
};

const TIPO_CONFIG = {
  compra: {
    label: "Compra",
    badge: "bg-blue-100 text-blue-700",
    value: "text-blue-600",
  },
  venda: {
    label: "Venda",
    badge: "bg-green-100 text-green-700",
    value: "text-green-600",
  },
  despesa: {
    label: "Despesa",
    badge: "bg-red-100 text-red-700",
    value: "text-red-600",
  },
};

const SECTIONS = [
  { id: "all", label: "Todos" },
  { id: "transactions", label: "Transações" },
  { id: "materials", label: "Materiais" },
  { id: "actions", label: "Ações" },
];

// ─── Componente ───────────────────────────────────────────────────────────────

export function TransactionCommandPalette({
  isOpen,
  onClose,
  onNavigate,
  onSelectTransaction,
  onNewTransaction,
}) {
  const { transactions } = useData();
  const [search, setSearch] = useState("");
  const [section, setSection] = useState("all");

  // Reset ao fechar
  useEffect(() => {
    if (!isOpen) {
      setSearch("");
      setSection("all");
    }
  }, [isOpen]);

  // Fechar com Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const close = useCallback(() => onClose?.(), [onClose]);

  // Transações filtradas
  const filteredTransactions = useMemo(() => {
    const base = search
      ? transactions.filter((t) => {
          const q = search.toLowerCase();
          return (
            t.material?.toLowerCase().includes(q) ||
            t.vendedor?.toLowerCase().includes(q) ||
            t.tipo?.toLowerCase().includes(q) ||
            formatCurrency(t.valorTotal).includes(q) ||
            MATERIALS[t.material]?.label.toLowerCase().includes(q)
          );
        })
      : transactions.slice(0, 6);
    return base.slice(0, 10);
  }, [transactions, search]);

  // Materiais filtrados
  const filteredMaterials = useMemo(() => {
    const entries = Object.entries(MATERIALS);
    if (!search) return entries.slice(0, 8);
    const q = search.toLowerCase();
    return entries.filter(
      ([k, v]) => v.label.toLowerCase().includes(q) || k.includes(q),
    );
  }, [search]);

  // Comandos de ação e navegação
  const COMMANDS = useMemo(
    () => [
      {
        group: "Ações Rápidas",
        items: [
          {
            icon: TrendingDown,
            iconBg: "bg-blue-100",
            iconColor: "text-blue-600",
            label: "Nova Compra",
            description: "Registrar compra de material",
            keywords: ["compra", "comprar", "entrada", "nova"],
            action: () => {
              onNewTransaction?.("compra");
              close();
            },
          },
          {
            icon: TrendingUp,
            iconBg: "bg-emerald-100",
            iconColor: "text-emerald-600",
            label: "Nova Venda",
            description: "Registrar venda de material",
            keywords: ["venda", "vender", "saída", "nova"],
            action: () => {
              onNewTransaction?.("venda");
              close();
            },
          },
          {
            icon: Receipt,
            iconBg: "bg-red-100",
            iconColor: "text-red-600",
            label: "Nova Despesa",
            description: "Registrar despesa operacional",
            keywords: ["despesa", "gasto", "custo"],
            action: () => {
              onNewTransaction?.("despesa");
              close();
            },
          },
        ],
      },
      {
        group: "Navegação",
        items: [
          {
            icon: BarChart2,
            iconBg: "bg-purple-100",
            iconColor: "text-purple-600",
            label: "Dashboard",
            description: "Visão geral do sistema",
            keywords: ["painel", "dashboard", "inicio", "home"],
            action: () => {
              onNavigate?.("dashboard");
              close();
            },
          },
          {
            icon: Package,
            iconBg: "bg-orange-100",
            iconColor: "text-orange-600",
            label: "Estoque",
            description: "Inventário de materiais",
            keywords: ["estoque", "inventário", "materiais"],
            action: () => {
              onNavigate?.("inventory");
              close();
            },
          },
          {
            icon: FileText,
            iconBg: "bg-cyan-100",
            iconColor: "text-cyan-600",
            label: "Relatórios",
            description: "Análise e relatórios detalhados",
            keywords: ["relatórios", "análise", "reports"],
            action: () => {
              onNavigate?.("reports");
              close();
            },
          },
          {
            icon: Users,
            iconBg: "bg-pink-100",
            iconColor: "text-pink-600",
            label: "Clientes",
            description: "Gestão de clientes",
            keywords: ["clientes", "pessoas", "fornecedores"],
            action: () => {
              onNavigate?.("clients");
              close();
            },
          },
          {
            icon: Calculator,
            iconBg: "bg-teal-100",
            iconColor: "text-teal-600",
            label: "Calculadora",
            description: "Calcular valores rapidamente",
            keywords: ["calculadora", "calcular", "conta"],
            action: () => {
              onNavigate?.("calculator");
              close();
            },
          },
        ],
      },
    ],
    [onNavigate, onNewTransaction, close],
  );

  const showTransactions = section === "all" || section === "transactions";
  const showMaterials = section === "all" || section === "materials";
  const showActions = section === "all" || section === "actions";

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
            transition={{ duration: 0.15 }}
            onClick={close}
          />

          {/* Painel central */}
          <div className="fixed top-[12vh] left-1/2 -translate-x-1/2 w-full max-w-2xl px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -12 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
            >
              <Command
                className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
                shouldFilter={false}
              >
                {/* Campo de busca */}
                <div className="flex items-center border-b border-gray-200 px-4 bg-gray-50">
                  <Search className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                  <Command.Input
                    value={search}
                    onValueChange={setSearch}
                    placeholder="Buscar transações, materiais ou comandos..."
                    className="flex-1 py-3.5 text-sm bg-transparent border-0 focus:outline-none placeholder:text-gray-400 text-gray-900"
                    autoFocus
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                      aria-label="Limpar busca"
                    >
                      <X className="h-4 w-4 text-gray-400" />
                    </button>
                  )}
                </div>

                {/* Abas de seção */}
                <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100 bg-white">
                  {SECTIONS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSection(s.id)}
                      className={cn(
                        "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
                        section === s.id
                          ? "bg-emerald-100 text-emerald-700"
                          : "text-gray-500 hover:bg-gray-100 hover:text-gray-700",
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* Lista de resultados */}
                <Command.List className="max-h-[380px] overflow-y-auto p-2">
                  <Command.Empty className="py-10 text-center text-sm text-gray-500">
                    Nenhum resultado para{" "}
                    <span className="font-semibold">"{search}"</span>
                  </Command.Empty>

                  {/* Transações recentes / encontradas */}
                  {showTransactions && filteredTransactions.length > 0 && (
                    <Command.Group>
                      <SectionLabel
                        icon={Clock}
                        label={
                          search
                            ? "Transações Encontradas"
                            : "Transações Recentes"
                        }
                      />
                      {filteredTransactions.map((t) => {
                        const mat = MATERIALS[t.material] ?? {
                          label: t.material ?? "—",
                          color: "bg-gray-500",
                        };
                        const tipo = TIPO_CONFIG[t.tipo] ?? TIPO_CONFIG.compra;
                        return (
                          <Command.Item
                            key={t.id}
                            onSelect={() => {
                              onSelectTransaction?.(t);
                              close();
                            }}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-emerald-50 transition-colors group"
                          >
                            <div
                              className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                                mat.color,
                              )}
                            >
                              <Package className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={cn(
                                    "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                                    tipo.badge,
                                  )}
                                >
                                  {tipo.label}
                                </span>
                                <span className="text-sm font-semibold text-gray-900 truncate">
                                  {mat.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                                <Calendar className="h-3 w-3" />
                                {formatDateShort(t.data)}
                                {t.vendedor && (
                                  <>
                                    <span>·</span>
                                    <User className="h-3 w-3" />
                                    <span className="truncate max-w-[100px]">
                                      {t.vendedor}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            <span
                              className={cn(
                                "text-sm font-bold tabular-nums flex-shrink-0",
                                tipo.value,
                              )}
                            >
                              {formatCurrency(t.valorTotal)}
                            </span>
                            <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-emerald-500 transition-colors flex-shrink-0" />
                          </Command.Item>
                        );
                      })}
                    </Command.Group>
                  )}

                  {/* Filtro por material */}
                  {showMaterials && filteredMaterials.length > 0 && (
                    <Command.Group>
                      <SectionLabel
                        icon={Package}
                        label="Filtrar por Material"
                      />
                      <div className="flex flex-wrap gap-1.5 px-2 pb-2">
                        {filteredMaterials.map(([key, mat]) => (
                          <Command.Item
                            key={key}
                            onSelect={() => {
                              onNavigate?.("transactions", { material: key });
                              close();
                            }}
                            className={cn(
                              "inline-flex items-center px-2.5 py-1.5 rounded-lg cursor-pointer",
                              "text-white text-xs font-semibold transition-all hover:scale-105 hover:shadow-md",
                              mat.color,
                            )}
                          >
                            {mat.label}
                          </Command.Item>
                        ))}
                      </div>
                    </Command.Group>
                  )}

                  {/* Comandos e navegação */}
                  {showActions &&
                    COMMANDS.map((group) => (
                      <Command.Group key={group.group}>
                        <SectionLabel label={group.group} />
                        {group.items.map((item) => (
                          <Command.Item
                            key={item.label}
                            keywords={item.keywords}
                            onSelect={item.action}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-emerald-50 transition-colors group"
                          >
                            <div
                              className={cn(
                                "p-2 rounded-lg transition-transform group-hover:scale-105",
                                item.iconBg,
                              )}
                            >
                              <item.icon
                                className={cn("h-4 w-4", item.iconColor)}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900">
                                {item.label}
                              </p>
                              {item.description && (
                                <p className="text-xs text-gray-400">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-emerald-500 transition-colors flex-shrink-0" />
                          </Command.Item>
                        ))}
                      </Command.Group>
                    ))}
                </Command.List>

                {/* Rodapé com atalhos */}
                <div className="border-t border-gray-100 px-4 py-2.5 bg-gray-50 flex items-center justify-between text-[11px] text-gray-400">
                  <div className="flex gap-4">
                    <Kbd keys="↑↓" label="Navegar" />
                    <Kbd keys="↵" label="Selecionar" />
                  </div>
                  <Kbd keys="Esc" label="Fechar" />
                </div>
              </Command>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Sub-componentes internos ─────────────────────────────────────────────────

const SectionLabel = ({ icon: Icon, label }) => (
  <div className="flex items-center gap-1.5 px-2 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
    {Icon && <Icon className="h-3 w-3" />}
    {label}
  </div>
);

const Kbd = ({ keys, label }) => (
  <span className="flex items-center gap-1.5">
    <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200 font-mono text-[10px] text-gray-500 shadow-sm">
      {keys}
    </kbd>
    {label}
  </span>
);
