import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button } from "../ui/button";

function returnFocus(event, openerRef) {
  event.preventDefault();
  if (openerRef.current?.isConnected) openerRef.current.focus();
  else document.getElementById("customer-search")?.focus();
}

export function CustomerFormDialog({
  editing,
  data,
  setData,
  onSave,
  onClose,
  busy,
  error,
  openerRef,
}) {
  const initial = useRef(JSON.stringify(data));
  const firstRef = useRef(null);
  const continueRef = useRef(null);
  const [discard, setDiscard] = useState(false);
  useEffect(() => {
    if (discard) continueRef.current?.focus();
  }, [discard]);
  const close = () => {
    if (busy) return;
    if (JSON.stringify(data) !== initial.current) setDiscard(true);
    else onClose();
  };
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="customer-dialog-overlay" />
        <Dialog.Content
          className="customer-dialog"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            firstRef.current?.focus();
          }}
          onCloseAutoFocus={(e) => returnFocus(e, openerRef)}
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            if (busy) return;
            if (discard) {
              setDiscard(false);
              requestAnimationFrame(() => firstRef.current?.focus());
            } else close();
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-xl font-bold text-slate-900">
                {discard
                  ? "Descartar preenchimento?"
                  : editing
                    ? "Editar Cliente"
                    : "Novo Cliente"}
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-slate-600">
                {discard
                  ? "As alterações ainda não foram salvas."
                  : "Informe o nome. Telefone, CPF e observações são opcionais."}
              </Dialog.Description>
            </div>
            <button
              type="button"
              aria-label="Fechar cadastro"
              onClick={close}
              disabled={busy}
              className="rounded-lg p-2 text-slate-600"
            >
              <X size={20} />
            </button>
          </div>
          {discard ? (
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                ref={continueRef}
                type="button"
                variant="outline"
                onClick={() => {
                  setDiscard(false);
                  requestAnimationFrame(() => firstRef.current?.focus());
                }}
              >
                Continuar preenchendo
              </Button>
              <Button type="button" variant="destructive" onClick={onClose}>
                Descartar alterações
              </Button>
            </div>
          ) : (
            <form onSubmit={onSave} className="mt-5 space-y-5">
              {error && (
                <p
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
                >
                  {error}
                </p>
              )}
              <fieldset
                disabled={busy}
                aria-busy={busy}
                className="min-w-0 space-y-4 border-0 p-0"
              >
                <div className="space-y-2">
                  <label
                    htmlFor="customer-name"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Nome completo <span aria-hidden="true">*</span>
                  </label>
                  <input
                    ref={firstRef}
                    id="customer-name"
                    name="nome"
                    required
                    autoComplete="name"
                    value={data.nome}
                    onChange={(e) =>
                      setData((p) => ({ ...p, nome: e.target.value }))
                    }
                    className="customer-input"
                    placeholder="Ex: João da Silva"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="customer-phone"
                      className="block text-sm font-semibold text-slate-700"
                    >
                      Telefone
                    </label>
                    <input
                      id="customer-phone"
                      name="telefone"
                      type="tel"
                      autoComplete="tel"
                      value={data.telefone}
                      onChange={(e) =>
                        setData((p) => ({ ...p, telefone: e.target.value }))
                      }
                      className="customer-input"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="customer-cpf"
                      className="block text-sm font-semibold text-slate-700"
                    >
                      CPF
                    </label>
                    <input
                      id="customer-cpf"
                      name="cpf"
                      inputMode="numeric"
                      value={data.cpf}
                      onChange={(e) =>
                        setData((p) => ({ ...p, cpf: e.target.value }))
                      }
                      className="customer-input"
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="customer-notes"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Observações
                  </label>
                  <textarea
                    id="customer-notes"
                    name="observacoes"
                    value={data.observacoes}
                    onChange={(e) =>
                      setData((p) => ({ ...p, observacoes: e.target.value }))
                    }
                    className="customer-input min-h-24 py-3"
                    placeholder="Informações sobre o cadastro…"
                  />
                </div>
              </fieldset>
              <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={close}
                  disabled={busy}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={busy}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {busy
                    ? "Salvando…"
                    : editing
                      ? "Salvar Alterações"
                      : "Cadastrar"}
                </Button>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function CustomerDeleteDialog({
  customer,
  onClose,
  onConfirm,
  busy,
  error,
  openerRef,
}) {
  const cancelRef = useRef(null);
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="customer-dialog-overlay" />
        <Dialog.Content
          className="customer-dialog"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            cancelRef.current?.focus();
          }}
          onCloseAutoFocus={(e) => returnFocus(e, openerRef)}
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => {
            if (busy) e.preventDefault();
          }}
        >
          <Dialog.Title className="text-xl font-bold text-slate-900">
            Excluir cadastro?
          </Dialog.Title>
          <Dialog.Description className="mt-3 text-sm text-slate-600">
            Confirme a exclusão de {customer.nome}. Essa ação não pode ser
            desfeita pela interface.
          </Dialog.Description>
          {error && (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
            >
              {error}
            </p>
          )}
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Button
              ref={cancelRef}
              type="button"
              variant="outline"
              disabled={busy}
              onClick={onClose}
            >
              Manter cadastro
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={busy}
              onClick={onConfirm}
            >
              {busy ? "Excluindo…" : "Excluir cadastro"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
