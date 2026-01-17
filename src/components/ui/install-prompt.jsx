"use client"

import { useState, useEffect } from "react"
import { Download, X } from "lucide-react"

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)

      // Check if user hasn't dismissed the prompt before
      const hasPromptBeenDismissed = localStorage.getItem("pwa-prompt-dismissed")
      if (!hasPromptBeenDismissed) {
        setShowPrompt(true)
      }
    }

    window.addEventListener("beforeinstallprompt", handler)

    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    console.log("[v0] User response to install prompt:", outcome)

    setDeferredPrompt(null)
    setShowPrompt(false)
    localStorage.setItem("pwa-prompt-dismissed", "true")
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem("pwa-prompt-dismissed", "true")
  }

  if (!showPrompt) return null

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
      <div className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg px-4 py-3 shadow-lg max-w-sm">
        <Download className="w-5 h-5 flex-shrink-0" />
        <div className="flex-1 flex flex-col gap-1">
          <span className="text-sm font-semibold">Instalar Sistema Império Sucata</span>
          <span className="text-xs opacity-90">Acesse rapidamente e trabalhe offline</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleInstall}
            className="px-3 py-1.5 bg-white text-blue-600 rounded-md text-xs font-medium hover:bg-blue-50 transition-colors"
          >
            Instalar
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
