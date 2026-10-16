import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Search,
  X,
  Package,
  Check,
  Plus,
  User,
  ArrowLeft,
  Save,
} from "lucide-react";
import { Button } from "../ui/button";
import { addCustomer } from "../../lib/firebaseService";
import { MATERIALS } from "./transactionOptions";

function DialogFrame({
  title,
  description,
  children,
  className = "",
  busy = false,
  initialFocusId,
}) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="transaction-dialog-overlay no-print" />
      <Dialog.Content
        className={`transaction-dialog no-print ${className}`}
        onOpenAutoFocus={(event) => {
          const target = document.getElementById(initialFocusId);
          if (target) {
            event.preventDefault();
            target.focus();
          }
        }}
        onEscapeKeyDown={(event) => {
          if (busy) event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (busy) event.preventDefault();
        }}
      >
        <header className="transaction-dialog-header">
          <div>
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Description>{description}</Dialog.Description>
          </div>
          <Dialog.Close asChild>
            <button
              type="button"
              className="transaction-icon-button"
              disabled={busy}
              aria-label="Fechar janela"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </Dialog.Close>
        </header>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  );
}

export function MaterialPicker({
  value,
  onChange,
  inventory,
  recentMaterials,
  disabled,
  error,
  errorId,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = MATERIALS.find((material) => material.value === value);
  const filtered = MATERIALS.filter((material) =>
    material.label
      .toLocaleLowerCase("pt-BR")
      .includes(search.toLocaleLowerCase("pt-BR")),
  );
  const select = (material) => {
    onChange(material);
    setOpen(false);
    setSearch("");
  };
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setSearch("");
      }}
    >
      <Dialog.Trigger asChild>
        <button
          type="button"
          id="material"
          className="transaction-selector"
          disabled={disabled}
          aria-labelledby="material-label material-value"
          aria-describedby={["material-hint", errorId]
            .filter(Boolean)
            .join(" ")}
          aria-invalid={Boolean(error)}
        >
          <Package size={19} aria-hidden="true" />
          <span id="material-value">
            {selected?.label || "Selecionar material"}
          </span>
          <Search size={17} aria-hidden="true" />
        </button>
      </Dialog.Trigger>
      <DialogFrame
        initialFocusId="material-search"
        title="Selecionar material"
        description="Busque pelo nome ou escolha um material da lista."
        className="transaction-material-dialog"
      >
        <div className="transaction-dialog-body">
          <label htmlFor="material-search" className="transaction-field-label">
            Buscar material
          </label>
          <input
            id="material-search"
            className="transaction-input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Ex.: ferro, alumínio, cobre"
            autoComplete="off"
          />
          {!search && recentMaterials.length > 0 && (
            <div className="transaction-recent">
              <p>Usados recentemente</p>
              <div>
                {recentMaterials
                  .map((key) =>
                    MATERIALS.find((material) => material.value === key),
                  )
                  .filter(Boolean)
                  .map((material) => (
                    <button
                      type="button"
                      key={material.value}
                      onClick={() => select(material.value)}
                    >
                      {material.label}
                    </button>
                  ))}
              </div>
            </div>
          )}
          <p className="transaction-search-count" role="status">
            {filtered.length}{" "}
            {filtered.length === 1
              ? "material encontrado"
              : "materiais encontrados"}
          </p>
          {!filtered.length ? (
            <p className="transaction-dialog-empty">
              Nenhum material encontrado. Tente outro nome.
            </p>
          ) : (
            <ul className="transaction-material-list">
              {filtered.map((material) => (
                <li key={material.value}>
                  <button
                    type="button"
                    onClick={() => select(material.value)}
                    aria-pressed={value === material.value}
                  >
                    <span>
                      <strong>{material.label}</strong>
                      <small>
                        {inventory[material.value]
                          ? `${Number(inventory[material.value].quantidade || 0).toLocaleString("pt-BR", { maximumFractionDigits: 3 })} kg em estoque`
                          : "Sem referência de estoque"}
                      </small>
                    </span>
                    {value === material.value && (
                      <Check size={17} aria-hidden="true" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogFrame>
    </Dialog.Root>
  );
}

export function CustomerPicker({
  customers = [],
  savedNames,
  selectedId,
  name,
  onSelect,
  disabled,
  kindLabel,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);
  const nameRef = useRef(null);
  const searchRef = useRef(null);
  const filtered = customers.filter((customer) =>
    customer.nome
      ?.toLocaleLowerCase("pt-BR")
      .includes(search.toLocaleLowerCase("pt-BR")),
  );
  const recent = savedNames
    .filter(
      (item) =>
        item
          .toLocaleLowerCase("pt-BR")
          .includes(search.toLocaleLowerCase("pt-BR")) &&
        !customers.some(
          (customer) =>
            customer.nome?.toLocaleLowerCase("pt-BR") ===
            item.toLocaleLowerCase("pt-BR"),
        ),
    )
    .slice(0, 4);
  useEffect(() => {
    if (open) (creating ? nameRef : searchRef).current?.focus();
  }, [creating, open]);
  const close = (next) => {
    if (submitting.current) return;
    setOpen(next);
    if (!next) {
      setSearch("");
      setCreating(false);
      setError("");
    }
  };
  const select = (customer) => {
    onSelect(customer);
    close(false);
  };
  const create = async (event) => {
    event.preventDefault();
    if (submitting.current) return;
    const form = new FormData(event.currentTarget);
    const nome = String(form.get("customerName") || "").trim();
    if (!nome) {
      setError("Informe o nome do cliente.");
      nameRef.current?.focus();
      return;
    }
    submitting.current = true;
    setSaving(true);
    setError("");
    try {
      const data = {
        nome,
        telefone: String(form.get("customerPhone") || ""),
        tipo: "pessoa_fisica",
        saldo: 0,
      };
      const id = await addCustomer(data);
      onSelect({ id, ...data });
      setOpen(false);
      setCreating(false);
      setSearch("");
    } catch {
      setError(
        "Não foi possível confirmar o cadastro. Confira os clientes antes de tentar novamente; os campos foram mantidos.",
      );
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  };
  return (
    <Dialog.Root open={open} onOpenChange={close}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          id="vendedor"
          className="transaction-selector"
          disabled={disabled}
          aria-labelledby="vendedor-label customer-value"
          aria-describedby="vendedor-hint"
        >
          <User size={19} aria-hidden="true" />
          <span id="customer-value">
            {name || "Selecionar cadastro ou informar nome"}
          </span>
          <Search size={17} aria-hidden="true" />
        </button>
      </Dialog.Trigger>
      <DialogFrame
        initialFocusId={creating ? "customerName" : "customer-search"}
        title={
          creating
            ? "Cadastrar cliente"
            : `Selecionar ${kindLabel.toLocaleLowerCase("pt-BR")}`
        }
        description={
          creating
            ? "O cadastro será vinculado a esta transação."
            : "Escolha um cadastro ou use apenas um nome, sem criar um novo cliente."
        }
        busy={saving}
      >
        {creating ? (
          <form
            onSubmit={create}
            className="transaction-dialog-body transaction-customer-form"
          >
            {error && (
              <p role="alert" className="transaction-field-error">
                {error}
              </p>
            )}
            <label htmlFor="customerName" className="transaction-field-label">
              Nome completo <span aria-hidden="true">*</span>
            </label>
            <input
              ref={nameRef}
              id="customerName"
              name="customerName"
              className="transaction-input"
              required
              defaultValue={search}
              disabled={saving}
              autoComplete="name"
            />
            <label htmlFor="customerPhone" className="transaction-field-label">
              Telefone (opcional)
            </label>
            <input
              id="customerPhone"
              name="customerPhone"
              type="tel"
              className="transaction-input"
              disabled={saving}
              autoComplete="tel"
              placeholder="(00) 00000-0000"
            />
            <div className="transaction-dialog-actions">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => {
                  setCreating(false);
                  setError("");
                }}
              >
                <ArrowLeft size={16} aria-hidden="true" />
                Voltar à seleção
              </Button>
              <Button
                type="submit"
                disabled={saving}
                aria-busy={saving}
                className="transaction-primary"
              >
                <Save size={16} aria-hidden="true" />
                {saving ? "Cadastrando..." : "Cadastrar cliente"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="transaction-dialog-body">
            <label
              htmlFor="customer-search"
              className="transaction-field-label"
            >
              Buscar cadastro ou informar nome
            </label>
            <input
              ref={searchRef}
              id="customer-search"
              className="transaction-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Digite o nome"
              autoComplete="off"
            />
            <p className="transaction-search-count" role="status">
              {filtered.length}{" "}
              {filtered.length === 1
                ? "cadastro encontrado"
                : "cadastros encontrados"}
              {filtered.length > 8
                ? "; refine a busca para encontrar o nome desejado."
                : "."}
            </p>
            <ul className="transaction-customer-list">
              {filtered.slice(0, 8).map((customer) => (
                <li key={customer.id}>
                  <button
                    type="button"
                    onClick={() => select(customer)}
                    aria-pressed={selectedId === customer.id}
                  >
                    <span>
                      <strong>{customer.nome}</strong>
                      {customer.telefone && <small>{customer.telefone}</small>}
                    </span>
                    {selectedId === customer.id && (
                      <Check size={17} aria-hidden="true" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
            {recent.length > 0 && (
              <div className="transaction-recent">
                <p>Nomes recentes sem cadastro</p>
                <div>
                  {recent.map((item) => (
                    <button
                      type="button"
                      key={item}
                      onClick={() => select({ id: "", nome: item })}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {!filtered.length && !recent.length && (
              <p className="transaction-dialog-empty">
                Nenhum cadastro correspondente. Você pode usar um nome sem
                cadastro ou cadastrar um novo cliente.
              </p>
            )}
            <div className="transaction-dialog-actions">
              {search.trim() && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => select({ id: "", nome: search.trim() })}
                >
                  Usar nome sem cadastro
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreating(true);
                  setError("");
                }}
              >
                <Plus size={16} aria-hidden="true" />
                Cadastrar cliente
              </Button>
              {(name || selectedId) && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => select({ id: "", nome: "" })}
                >
                  Remover identificação
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogFrame>
    </Dialog.Root>
  );
}

export function ConfirmTransactionAction({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  busy = false,
  destructive = false,
  returnFocusRef,
}) {
  const cancelRef = useRef(null);
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!busy) onOpenChange(next);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="transaction-dialog-overlay no-print" />
        <Dialog.Content
          className="transaction-dialog transaction-confirm-dialog no-print"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (returnFocusRef?.current?.isConnected)
              returnFocusRef.current.focus();
          }}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            cancelRef.current?.focus();
          }}
          onEscapeKeyDown={(event) => {
            if (busy) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            if (busy) event.preventDefault();
          }}
        >
          <div className="transaction-dialog-body">
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Description>{description}</Dialog.Description>
            <div className="transaction-dialog-actions">
              <Button
                ref={cancelRef}
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => onOpenChange(false)}
              >
                Continuar preenchendo
              </Button>
              <Button
                type="button"
                disabled={busy}
                aria-busy={busy}
                onClick={onConfirm}
                className={
                  destructive ? "transaction-danger" : "transaction-primary"
                }
              >
                {busy ? "Aguarde..." : confirmLabel}
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
