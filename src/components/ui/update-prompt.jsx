"use client"

import { useState } from "react"
import { Download, X } from "lucide-react"
import { useServiceWorker } from "../../hooks/useServiceWorker"

export const UpdatePrompt = () => {
  const { updateAvailable, updateServiceWorker } = useServiceWorker()
  const [dismissed, setDismissed] = useState(false)

  if (!updateAvailable || dismissed) return null

  const handleUpdate = () => {
    updateServiceWorker()
  }

  const handleDismiss = () => {
    setDismissed(true)
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2">
      <div className="flex items-center gap-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg px-4 py-3 shadow-lg max-w-sm">
        <Download className="w-5 h-5 flex-shrink-0" />
        <div className="flex-1 flex flex-col gap-1">
          <span className="text-sm font-semibold">Nova versão disponível</span>
          <span className="text-xs opacity-90">Atualize para obter novos recursos</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleUpdate}
            className="px-3 py-1.5 bg-white text-green-600 rounded-md text-xs font-medium hover:bg-green-50 transition-colors"
          >
            Atualizar
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
