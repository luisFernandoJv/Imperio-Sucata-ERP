"use client"

import { useState, useEffect, useCallback } from "react"
import { useOnlineStatus } from "./useOnlineStatus"

export function useOfflineQueue() {
  const [queue, setQueue] = useState([])
  const { isOnline } = useOnlineStatus()

  // Load queue from localStorage on mount
  useEffect(() => {
    try {
      const savedQueue = localStorage.getItem("offlineTransactions")
      if (savedQueue) {
        setQueue(JSON.parse(savedQueue))
      }
    } catch (error) {
      console.error("[v0] Error loading offline queue:", error)
    }
  }, [])

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    try {
      if (queue.length > 0) {
        localStorage.setItem("offlineTransactions", JSON.stringify(queue))
      } else {
        localStorage.removeItem("offlineTransactions")
      }
    } catch (error) {
      console.error("[v0] Error saving offline queue:", error)
    }
  }, [queue])

  const addToQueue = useCallback((transaction) => {
    const queueItem = {
      ...transaction,
      _offlineId: Date.now() + Math.random(),
      _timestamp: new Date().toISOString(),
    }
    setQueue((prev) => [...prev, queueItem])
    return queueItem
  }, [])

  const removeFromQueue = useCallback((offlineId) => {
    setQueue((prev) => prev.filter((item) => item._offlineId !== offlineId))
  }, [])

  const clearQueue = useCallback(() => {
    setQueue([])
    localStorage.removeItem("offlineTransactions")
  }, [])

  return {
    queue,
    addToQueue,
    removeFromQueue,
    clearQueue,
    hasQueuedItems: queue.length > 0,
  }
}
