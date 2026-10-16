import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Search, User, X } from "lucide-react";
import { subscribeToCustomers } from "@/lib/firebaseService";

const normalize = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export function ExpenseCustomerPicker({
  selected,
  onSelect,
  onClear,
  disabled,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState([]);
  const [status, setStatus] = useState("loading");
  const [retry, setRetry] = useState(0);
  const searchRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let unsubscribe;
    const timer = setTimeout(() => {
      if (!cancelled) setStatus((s) => (s === "loading" ? "slow" : s));
    }, 12000);
    const failed = () => {
      if (!cancelled) {
        clearTimeout(timer);
        setStatus("error");
      }
    };
    try {
      unsubscribe = subscribeToCustomers((data) => {
        if (cancelled) return;
        clearTimeout(timer);
        setCustomers(data);
        setStatus("ready");
      }, failed);
    } catch {
      failed();
    }
    return () => {
      cancelled = true;
      clearTimeout(timer);
      unsubscribe?.();
    };
  }, [open, retry]);
  const digits = query.replace(/\D/g, "");
  const results = customers.filter(
    (c) =>
      normalize(c.nome).includes(normalize(query)) ||
      (digits &&
        [c.cpf, c.telefone].some((v) =>
          String(v || "")
            .replace(/\D/g, "")
            .includes(digits),
        )),
  );
  const changeOpen = (next) => {
    setOpen(next);
    if (next) {
      setQuery("");
      setStatus("loading");
    }
  };
  return (
    <div className="expense-customer">
      <Dialog.Root open={open} onOpenChange={changeOpen}>
        <div className="expense-customer-controls">
          <Dialog.Trigger asChild>
            <button
              id="expense-customer"
              type="button"
              disabled={disabled}
              className="expense-select-customer"
            >
              <User size={17} aria-hidden="true" />
              <span>{selected ? selected.nome : "Selecionar cliente…"}</span>
            </button>
          </Dialog.Trigger>
          {selected && (
            <button
              type="button"
              disabled={disabled}
              onClick={onClear}
              aria-label="Remover vínculo com cliente"
              className="expense-icon-button"
            >
              <X size={18} />
            </button>
          )}
        </div>
        <Dialog.Portal>
          <Dialog.Overlay className="expense-dialog-overlay" />
          <Dialog.Content
            className="expense-dialog"
            onOpenAutoFocus={(e) => {
              e.preventDefault();
              searchRef.current?.focus();
            }}
          >
            <div className="expense-dialog-heading">
              <div>
                <Dialog.Title>Selecionar cliente</Dialog.Title>
                <Dialog.Description>
                  Busque pelo nome, CPF ou telefone para vincular o empréstimo.
                </Dialog.Description>
              </div>
              <Dialog.Close
                className="expense-icon-button"
                aria-label="Fechar seleção de cliente"
              >
                <X size={20} />
              </Dialog.Close>
            </div>
            <label htmlFor="expense-customer-search">Buscar cliente</label>
            <div className="expense-search">
              <Search size={17} aria-hidden="true" />
              <input
                ref={searchRef}
                id="expense-customer-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nome, CPF ou telefone"
              />
            </div>
            <div
              className="expense-customer-results"
              aria-busy={status === "loading" || status === "slow"}
            >
              {status === "loading" && (
                <p role="status">Carregando clientes…</p>
              )}
              {(status === "error" || status === "slow") && (
                <div role={status === "error" ? "alert" : "status"}>
                  <p>
                    {status === "error"
                      ? "Não foi possível consultar os clientes."
                      : "A consulta está demorando. Confira sua conexão."}
                  </p>
                  <button
                    type="button"
                    className="expense-secondary"
                    onClick={() => {
                      setStatus("loading");
                      setRetry((v) => v + 1);
                    }}
                  >
                    Tentar novamente
                  </button>
                </div>
              )}
              {status === "ready" && (
                <>
                  <p className="expense-result-count" role="status">
                    {results.length}{" "}
                    {results.length === 1
                      ? "cadastro encontrado"
                      : "cadastros encontrados"}
                  </p>
                  {results.length ? (
                    results.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="expense-customer-result"
                        onClick={() => {
                          onSelect(c);
                          changeOpen(false);
                        }}
                      >
                        <User size={18} aria-hidden="true" />
                        <span>
                          <strong>{c.nome}</strong>
                          <small>
                            {c.telefone || "Sem telefone informado"}
                          </small>
                        </span>
                      </button>
                    ))
                  ) : (
                    <p>
                      {customers.length
                        ? "Nenhum cliente encontrado. Tente outro nome ou número."
                        : "Nenhum cliente cadastrado. Cadastre o cliente na seção Clientes."}
                    </p>
                  )}
                </>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

export function ExpenseResetDialog({
  open,
  onOpenChange,
  onConfirm,
  recorded,
}) {
  const keepRef = useRef(null);
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="expense-dialog-overlay" />
        <Dialog.Content
          className="expense-dialog"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            keepRef.current?.focus();
          }}
        >
          <Dialog.Title>
            {recorded ? "Iniciar outra despesa?" : "Limpar preenchimento?"}
          </Dialog.Title>
          <Dialog.Description>
            {recorded
              ? "O lançamento já foi registrado. Confira o saldo do cliente em Clientes antes de repetir qualquer ajuste. Iniciar outra despesa não corrige o saldo pendente."
              : "Os dados preenchidos ainda não foram registrados e serão descartados."}
          </Dialog.Description>
          <div className="expense-dialog-actions">
            <button
              ref={keepRef}
              type="button"
              className="expense-secondary"
              onClick={() => onOpenChange(false)}
            >
              {recorded ? "Continuar conferindo" : "Continuar preenchendo"}
            </button>
            <button
              type="button"
              className="expense-primary"
              onClick={onConfirm}
            >
              {recorded ? "Iniciar outra despesa" : "Limpar campos"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
