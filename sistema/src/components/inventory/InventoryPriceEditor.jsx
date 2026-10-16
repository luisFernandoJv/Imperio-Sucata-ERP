import { useRef, useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button } from "../ui/button";
import { formatWeight } from "../../utils/formatters";

export function InventoryPriceEditor({
  material,
  draft,
  setDraft,
  onSave,
  onClose,
  busy,
  openerRef,
}) {
  const [error, setError] = useState("");
  const [discard, setDiscard] = useState(false);
  const continueRef = useRef(null);
  useEffect(() => {
    if (discard) continueRef.current?.focus();
  }, [discard]);
  const initial = useRef({
    compra: String(draft.precoCompra ?? 0),
    venda: String(draft.precoVenda ?? 0),
  });
  const firstInput = useRef(null);
  const dirty =
    String(draft.precoCompra ?? 0) !== initial.current.compra ||
    String(draft.precoVenda ?? 0) !== initial.current.venda;
  const requestClose = () => {
    if (busy) return;
    if (dirty) setDiscard(true);
    else onClose();
  };
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) requestClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="inventory-editor-overlay" />
        <Dialog.Content
          className="inventory-price-editor"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            firstInput.current?.focus();
          }}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            const target = openerRef.current;
            if (target?.isConnected) target.focus();
            else document.getElementById("inventory-search")?.focus();
          }}
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            if (busy) return;
            if (discard) {
              setDiscard(false);
              requestAnimationFrame(() => firstInput.current?.focus());
            } else requestClose();
          }}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-xl font-bold text-slate-900">
                {discard
                  ? "Descartar alterações?"
                  : `Editar preços de ${material.name}`}
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-slate-600">
                {discard
                  ? "Os preços digitados ainda não foram salvos."
                  : "Confira os preços por kg antes de salvar."}
              </Dialog.Description>
            </div>
            <button
              type="button"
              aria-label="Fechar edição de preços"
              onClick={requestClose}
              disabled={busy}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            >
              <X size={20} />
            </button>
          </div>
          {discard ? (
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                ref={continueRef}
                onClick={() => {
                  setDiscard(false);
                  requestAnimationFrame(() => firstInput.current?.focus());
                }}
              >
                Continuar editando
              </Button>
              <Button type="button" variant="destructive" onClick={onClose}>
                Descartar alterações
              </Button>
            </div>
          ) : (
            <form
              className="mt-5 space-y-5"
              onSubmit={async (e) => {
                e.preventDefault();
                if (busy) return;
                const values = [draft.precoCompra, draft.precoVenda];
                if (
                  values.some(
                    (v) =>
                      String(v ?? "").trim() === "" ||
                      !Number.isFinite(Number(v)),
                  )
                ) {
                  setError(
                    "Preencha os dois preços com valores numéricos válidos.",
                  );
                  firstInput.current?.focus();
                  return;
                }
                setError("");
                if (!(await onSave()))
                  setError(
                    "Não foi possível confirmar a atualização. Os valores digitados foram mantidos.",
                  );
              }}
            >
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                <span aria-hidden="true" className="mr-2">
                  {material.icon}
                </span>
                <strong>{material.name}</strong>
                <p className="mt-1 text-slate-600">
                  Quantidade registrada: {formatWeight(draft.quantidade)}. Esta
                  edição atualiza somente os preços.
                </p>
              </div>
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
                className="grid min-w-0 grid-cols-1 sm:grid-cols-2 gap-4 border-0 p-0"
              >
                {[
                  ["precoCompra", "Preço de compra (R$/kg)"],
                  ["precoVenda", "Preço de venda (R$/kg)"],
                ].map(([field, label], index) => (
                  <div key={field} className="space-y-2">
                    <label
                      htmlFor={`inventory-${field}`}
                      className="block text-sm font-semibold text-slate-700"
                    >
                      {label}
                    </label>
                    <input
                      ref={index === 0 ? firstInput : undefined}
                      id={`inventory-${field}`}
                      type="number"
                      step="any"
                      required
                      value={draft[field] ?? 0}
                      onChange={(e) => {
                        setDraft((previous) => ({
                          ...previous,
                          [field]: e.target.value,
                        }));
                        setError("");
                      }}
                      className="h-11 w-full rounded-lg border border-slate-300 px-3 text-base tabular-nums"
                    />
                  </div>
                ))}
              </fieldset>
              <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={requestClose}
                  disabled={busy}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={busy}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {busy ? "Salvando…" : "Salvar preços"}
                </Button>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
