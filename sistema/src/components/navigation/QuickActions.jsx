import { useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Receipt,
  Calculator,
  Plus,
  X,
} from "lucide-react";

export function QuickActions({ onAction }) {
  const [open, setOpen] = useState(false);
  const pending = useRef(null);
  const triggerRef = useRef(null);
  const actions = [
    {
      id: "sale",
      label: "Nova Venda",
      detail: "Abrir um lançamento de venda",
      icon: TrendingUp,
      tab: "transaction",
      type: "venda",
    },
    {
      id: "purchase",
      label: "Nova Compra",
      detail: "Abrir um lançamento de compra",
      icon: TrendingDown,
      tab: "transaction",
      type: "compra",
    },
    {
      id: "clients",
      label: "Clientes",
      detail: "Consultar clientes ou criar um cadastro",
      icon: Users,
      tab: "clients",
    },
    {
      id: "expense",
      label: "Nova Despesa",
      detail: "Abrir o registro de despesas",
      icon: Receipt,
      tab: "expenses",
    },
    {
      id: "calculator",
      label: "Calculadora",
      detail: "Calcular sem sair da tela atual",
      icon: Calculator,
      tab: "calculator",
    },
  ];
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          ref={triggerRef}
          type="button"
          className="shell-tool-button"
          aria-label="Abrir ações rápidas"
        >
          <Plus size={18} aria-hidden="true" />
          <span>Ações rápidas</span>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="utility-overlay" />
        <Dialog.Content
          className="utility-dialog quick-actions-dialog"
          onCloseAutoFocus={(event) => {
            if (!pending.current) return;
            event.preventDefault();
            const action = pending.current;
            pending.current = null;
            triggerRef.current?.focus();
            requestAnimationFrame(() => onAction(action.tab, action.type));
          }}
        >
          <div className="utility-heading">
            <div>
              <Dialog.Title>Ações rápidas</Dialog.Title>
              <Dialog.Description>
                Escolha uma tarefa. Escape fecha esta janela.
              </Dialog.Description>
            </div>
            <Dialog.Close
              className="utility-icon-button"
              aria-label="Fechar ações rápidas"
            >
              <X size={20} />
            </Dialog.Close>
          </div>
          <div className="utility-action-list">
            {actions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => {
                  pending.current = action;
                  setOpen(false);
                }}
              >
                <action.icon size={21} aria-hidden="true" />
                <span>
                  <strong>{action.label}</strong>
                  <small>{action.detail}</small>
                </span>
              </button>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
