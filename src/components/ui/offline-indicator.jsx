import { WifiOff, RefreshCw } from "lucide-react"
import { useOnlineStatus } from "../../hooks/useOnlineStatus"
import { useOfflineQueue } from "../../hooks/useOfflineQueue"

export const OfflineIndicator = () => {
  const { isOnline, wasOffline } = useOnlineStatus()
  const { queue, hasQueuedItems } = useOfflineQueue()

  if (isOnline && !hasQueuedItems) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 animate-in slide-in-from-bottom-2">
      {!isOnline ? (
        <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950 border-2 border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3 shadow-lg">
          <WifiOff className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-amber-900 dark:text-amber-100">Modo Offline</span>
            <span className="text-xs text-amber-700 dark:text-amber-300">
              {hasQueuedItems
                ? `${queue.length} ${queue.length === 1 ? "transação aguardando" : "transações aguardando"} sincronização`
                : "Suas alterações serão sincronizadas quando voltar online"}
            </span>
          </div>
        </div>
      ) : hasQueuedItems ? (
        <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-950 border-2 border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3 shadow-lg">
          <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">Sincronizando...</span>
            <span className="text-xs text-blue-700 dark:text-blue-300">
              {queue.length} {queue.length === 1 ? "item" : "itens"} pendente
              {queue.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  )
}
