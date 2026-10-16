import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

export function InstallPrompt() {
  const [prompt, setPrompt] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    const handler = (event) => {
      event.preventDefault();
      let dismissed = false;
      try {
        dismissed = localStorage.getItem("pwa-prompt-dismissed") === "true";
      } catch {
        /* Preferência opcional. */
      }
      if (!dismissed) setPrompt(event);
    };
    const installed = () => setPrompt(null);
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);
  const dismiss = () => {
    setPrompt(null);
    try {
      localStorage.setItem("pwa-prompt-dismissed", "true");
    } catch {
      /* Preferência opcional. */
    }
  };
  const install = async () => {
    if (!prompt || busy) return;
    setBusy(true);
    setError(false);
    try {
      await prompt.prompt();
      await prompt.userChoice;
      dismiss();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };
  if (!prompt) return null;
  return (
    <aside
      className="global-notice install-notice"
      aria-label="Instalar aplicativo"
    >
      <Download size={21} aria-hidden="true" />
      <div>
        <strong>Instalar Império Sucata</strong>
        <p>Abra o sistema como aplicativo no computador.</p>
        {error && (
          <p role="alert">
            Não foi possível abrir a instalação. Tente novamente ou use o menu
            do navegador.
          </p>
        )}
      </div>
      <button
        type="button"
        className="utility-secondary"
        disabled={busy}
        onClick={install}
      >
        {busy ? "Aguardando…" : "Instalar"}
      </button>
      <button
        type="button"
        className="utility-icon-button"
        disabled={busy}
        onClick={dismiss}
        aria-label="Dispensar instalação"
      >
        <X size={19} />
      </button>
    </aside>
  );
}
