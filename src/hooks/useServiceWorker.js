"use client"

import { useState, useEffect } from "react"

export function useServiceWorker() {
  const [registration, setRegistration] = useState(null)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [waitingWorker, setWaitingWorker] = useState(null)

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg)
        console.log("[v0] Service Worker ready:", reg)

        // Check for updates
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing
          console.log("[v0] Update found:", newWorker)

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              console.log("[v0] New update available")
              setUpdateAvailable(true)
              setWaitingWorker(newWorker)
            }
          })
        })
      })

      // Listen for controller change (new SW activated)
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        console.log("[v0] Controller changed - reloading page")
        window.location.reload()
      })
    }
  }, [])

  const updateServiceWorker = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" })
    }
  }

  return {
    registration,
    updateAvailable,
    updateServiceWorker,
  }
}
