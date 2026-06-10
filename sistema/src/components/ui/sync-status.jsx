"use client";

import { CloudOff, RefreshCw, CheckCircle2, Wifi, WifiOff } from "lucide-react";
import { useData } from "../../contexts/DataContext";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

/**
 * SyncStatus — indicador compacto de conexão e sincronização.
 * Exibe: sincronizando | offline | desconectado | conectado + tempo.
 * Clique dispara refresh manual.
 */

export const SyncStatus = () => {
  const { firebaseConnected, lastSyncTime, syncing, refreshData } = useData();

  // Detectar online via navigator (mais confiável que hook customizado aqui)
  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  const getState = () => {
    if (syncing) return "syncing";
    if (!isOnline) return "offline";
    if (!firebaseConnected) return "disconnected";
    return "connected";
  };

  const state = getState();

  const CONFIG = {
    syncing: {
      icon: RefreshCw,
      iconClass: "animate-spin text-blue-600",
      label: "Sincronizando...",
      badge: "bg-blue-50 text-blue-700 border-blue-200",
      dot: "bg-blue-500",
    },
    offline: {
      icon: WifiOff,
      iconClass: "text-amber-600",
      label: "Offline",
      badge: "bg-amber-50 text-amber-700 border-amber-200",
      dot: "bg-amber-500",
    },
    disconnected: {
      icon: CloudOff,
      iconClass: "text-red-500",
      label: "Desconectado",
      badge: "bg-red-50 text-red-700 border-red-200",
      dot: "bg-red-500",
    },
    connected: {
      icon: CheckCircle2,
      iconClass: "text-emerald-600",
      label: lastSyncTime
        ? `Sync ${formatDistanceToNow(lastSyncTime, { addSuffix: true, locale: ptBR })}`
        : "Conectado",
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
      dot: "bg-emerald-500",
    },
  };

  const cfg = CONFIG[state];
  const IconComp = cfg.icon;
  const canRefresh = state !== "syncing" && isOnline;

  return (
    <button
      onClick={canRefresh ? refreshData : undefined}
      disabled={!canRefresh}
      title={canRefresh ? "Clique para sincronizar" : cfg.label}
      aria-label="Status de sincronização"
      className={cn(
        "flex items-center gap-2 px-2.5 py-1.5 rounded-full text-xs font-semibold",
        "border transition-all duration-200",
        "disabled:cursor-default",
        canRefresh ? "hover:opacity-80 cursor-pointer" : "cursor-default",
        cfg.badge,
      )}
    >
      {/* Ponto de status */}
      <span className="relative flex h-2 w-2 flex-shrink-0">
        {state === "connected" && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
        )}
        <span
          className={cn("relative inline-flex rounded-full h-2 w-2", cfg.dot)}
        />
      </span>

      <IconComp className={cn("h-3.5 w-3.5 flex-shrink-0", cfg.iconClass)} />

      <span className="hidden sm:inline truncate max-w-[140px]">
        {cfg.label}
      </span>
    </button>
  );
};
