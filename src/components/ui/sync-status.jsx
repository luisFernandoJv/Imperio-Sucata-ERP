"use client"

import { CloudOff, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react"
import { useData } from "../../contexts/DataContext"
import { useOnlineStatus } from "../../hooks/useOnlineStatus"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

export const SyncStatus = () => {
  const { firebaseConnected, lastSyncTime, syncing, refreshData } = useData()
  const { isOnline } = useOnlineStatus()

  const getStatusIcon = () => {
    if (syncing) {
      return <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
    }
    if (!isOnline || !firebaseConnected) {
      return <CloudOff className="w-4 h-4 text-amber-600" />
    }
    if (firebaseConnected) {
      return <CheckCircle2 className="w-4 h-4 text-green-600" />
    }
    return <AlertCircle className="w-4 h-4 text-red-600" />
  }

  const getStatusText = () => {
    if (syncing) return "Sincronizando..."
    if (!isOnline) return "Offline"
    if (!firebaseConnected) return "Desconectado"
    if (lastSyncTime) {
      return `Sincronizado ${formatDistanceToNow(lastSyncTime, { addSuffix: true, locale: ptBR })}`
    }
    return "Conectado"
  }

  const getStatusColor = () => {
    if (syncing) return "text-blue-600 bg-blue-50"
    if (!isOnline || !firebaseConnected) return "text-amber-600 bg-amber-50"
    return "text-green-600 bg-green-50"
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={refreshData}
        disabled={syncing || !isOnline}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${getStatusColor()} hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed`}
        title="Clique para sincronizar manualmente"
      >
        {getStatusIcon()}
        <span className="hidden sm:inline">{getStatusText()}</span>
      </button>
    </div>
  )
}
