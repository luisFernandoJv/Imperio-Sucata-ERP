import { useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import { Search, TrendingUp, TrendingDown, Calculator, X } from "lucide-react";
import { navigationItems } from "../navigation/navigationItems";

export function CommandPalette({
  open,
  onOpenChange,
  onNavigate,
  onReturnFocus,
}) {
  const [search, setSearch] = useState("");
  const pending = useRef(null);
  const inputRef = useRef(null);
  const select = (id, type) => {
    pending.current = { id, type };
    onOpenChange(false);
  };
  const normalize = (value) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="utility-overlay" />
        <Dialog.Content
          className="utility-dialog command-dialog"
          data-utility="commands"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            setSearch("");
            inputRef.current?.focus();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (pending.current) {
              const action = pending.current;
              pending.current = null;
              onReturnFocus();
              requestAnimationFrame(() => onNavigate(action.id, action.type));
            } else onReturnFocus();
          }}
        >
          <div className="utility-heading">
            <div>
              <Dialog.Title>Buscar módulo ou ação</Dialog.Title>
              <Dialog.Description>
                Use as setas para navegar, Enter para escolher e Escape para
                fechar.
              </Dialog.Description>
            </div>
            <Dialog.Close
              className="utility-icon-button"
              aria-label="Fechar busca de comandos"
            >
              <X size={20} />
            </Dialog.Close>
          </div>
          <Command
            vimBindings={false}
            label="Módulos e ações"
            filter={(value, query, keywords = []) =>
              normalize([value, ...keywords].join(" ")).includes(
                normalize(query.trim()),
              )
                ? 1
                : 0
            }
          >
            <div className="command-search">
              <Search size={19} aria-hidden="true" />
              <Command.Input
                ref={inputRef}
                aria-label="Buscar módulo ou ação"
                value={search}
                onValueChange={setSearch}
                placeholder="Ex.: clientes, caixa, venda…"
              />
            </div>
            <Command.List className="command-results">
              <Command.Empty>
                Nenhum comando encontrado. Tente outro termo.
              </Command.Empty>
              <Command.Group heading="Módulos">
                {navigationItems.map((item) => (
                  <Command.Item
                    key={item.id}
                    value={item.label}
                    keywords={[item.id, item.group]}
                    onSelect={() => select(item.id)}
                  >
                    <item.icon size={20} aria-hidden="true" />
                    <span>{item.label}</span>
                  </Command.Item>
                ))}
              </Command.Group>
              <Command.Group heading="Ações">
                <Command.Item
                  value="Nova Compra"
                  keywords={["comprar", "entrada"]}
                  onSelect={() => select("transaction", "compra")}
                >
                  <TrendingDown size={20} aria-hidden="true" />
                  <span>Nova Compra</span>
                </Command.Item>
                <Command.Item
                  value="Nova Venda"
                  keywords={["vender", "saida"]}
                  onSelect={() => select("transaction", "venda")}
                >
                  <TrendingUp size={20} aria-hidden="true" />
                  <span>Nova Venda</span>
                </Command.Item>
                <Command.Item
                  value="Calculadora"
                  keywords={["calcular", "conta"]}
                  onSelect={() => select("calculator")}
                >
                  <Calculator size={20} aria-hidden="true" />
                  <span>Calculadora</span>
                </Command.Item>
              </Command.Group>
            </Command.List>
          </Command>
          <p className="utility-shortcut-help">
            <kbd>Ctrl/⌘ K</kbd> abre ou fecha a busca. <kbd>Alt C</kbd> ou{" "}
            <kbd>Alt K</kbd> abre a calculadora fora dos campos de edição.
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
