"use client"

import { useState, useEffect } from "react"

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      if (wasOffline) {
        console.log("[v0] Back online - triggering sync")
        // Trigger background sync if available
        if ("serviceWorker" in navigator && "sync" in window.registration) {
          navigator.serviceWorker.ready.then((registration) => {
            return registration.sync.register("background-sync")
          })
        }
        setWasOffline(false)
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      setWasOffline(true)
      console.log("[v0] Gone offline - enabling offline mode")
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [wasOffline])

  return { isOnline, wasOffline }
}
