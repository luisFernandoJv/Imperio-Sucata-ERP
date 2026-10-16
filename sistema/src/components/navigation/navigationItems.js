import { LayoutDashboard, Users, ArrowRightLeft, Wallet, Package, Receipt, BarChart3 } from "lucide-react";

// IDs preservados: os módulos e seus callbacks continuam os mesmos.
export const navigationItems = [
  { id: "dashboard", label: "Painel", icon: LayoutDashboard, group: "Visão geral" },
  { id: "clients", label: "Clientes", icon: Users, group: "Operação" },
  { id: "transaction", label: "Transações", icon: ArrowRightLeft, group: "Operação" },
  { id: "caixa", label: "Caixa Diário", icon: Wallet, group: "Operação" },
  { id: "inventory", label: "Estoque", icon: Package, group: "Operação" },
  { id: "expenses", label: "Despesas", icon: Receipt, group: "Gestão" },
  { id: "reports", label: "Relatórios", icon: BarChart3, group: "Gestão" },
];
