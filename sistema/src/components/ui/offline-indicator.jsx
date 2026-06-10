"use client";

import { useState, useEffect } from "react";
import { WifiOff, RefreshCw, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * OfflineIndicator — banner fixo exibido quando offline ou com itens pendentes.
 * Aparece na parte inferior esquerda. Desaparece automaticamente ao voltar online
 * sem itens pendentes (após 3s de "Reconectado").
 */

export const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setJustReconnected(true);
      // Ocultar a mensagem de "Reconectado" após 3 segundos
      const timer = setTimeout(() => setJustReconnected(false), 3000);
      return () => clearTimeout(timer);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setJustReconnected(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Nada a exibir quando online e sem mensagem de reconexão
  if (isOnline && !justReconnected) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 z-50",
        "animate-in slide-in-from-bottom-2 duration-300",
      )}
      role="status"
      aria-live="polite"
    >
      {justReconnected ? (
        /* Conexão restaurada */
        <div className="flex items-center gap-3 bg-emerald-50 border-2 border-emerald-200 rounded-xl px-4 py-3 shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-emerald-900">
              Conexão restaurada
            </p>
            <p className="text-xs text-emerald-700">
              Dados sincronizados com sucesso
            </p>
          </div>
        </div>
      ) : (
        /* Offline */
        <div className="flex items-center gap-3 bg-amber-50 border-2 border-amber-200 rounded-xl px-4 py-3 shadow-lg">
          <WifiOff className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-900">Modo Offline</p>
            <p className="text-xs text-amber-700">
              Alterações serão sincronizadas ao reconectar
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
