const DB_NAME = "imperioSucataDB"
const DB_VERSION = 1
const STORE_NAME = "offlineTransactions"

// Initialize IndexedDB
function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("IndexedDB not supported"))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true })
        objectStore.createIndex("timestamp", "timestamp", { unique: false })
        objectStore.createIndex("synced", "synced", { unique: false })
        console.log("[v0] IndexedDB object store created")
      }
    }
  })
}

// Save transaction offline
export async function saveOfflineTransaction(transaction) {
  try {
    const db = await openDatabase()
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)

    const offlineData = {
      ...transaction,
      timestamp: Date.now(),
      synced: false,
    }

    return new Promise((resolve, reject) => {
      const request = store.add(offlineData)
      request.onsuccess = () => {
        console.log("[v0] Transaction saved offline:", request.result)
        resolve(request.result)
      }
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error("[v0] Error saving to IndexedDB, falling back to localStorage:", error)
    // Fallback to localStorage
    const queue = JSON.parse(localStorage.getItem("offlineTransactions") || "[]")
    const offlineData = {
      ...transaction,
      _offlineId: Date.now(),
      timestamp: Date.now(),
      synced: false,
    }
    queue.push(offlineData)
    localStorage.setItem("offlineTransactions", JSON.stringify(queue))
    return offlineData._offlineId
  }
}

// Get all offline transactions
export async function getOfflineTransactions() {
  try {
    const db = await openDatabase()
    const tx = db.transaction(STORE_NAME, "readonly")
    const store = tx.objectStore(STORE_NAME)
    const index = store.index("synced")

    return new Promise((resolve, reject) => {
      const request = index.getAll(false) // Get only unsynced items
      request.onsuccess = () => {
        console.log("[v0] Retrieved offline transactions:", request.result.length)
        resolve(request.result)
      }
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error("[v0] Error reading from IndexedDB, falling back to localStorage:", error)
    const queue = JSON.parse(localStorage.getItem("offlineTransactions") || "[]")
    return queue.filter((item) => !item.synced)
  }
}

// Mark transaction as synced
export async function markTransactionSynced(id) {
  try {
    const db = await openDatabase()
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)

    return new Promise((resolve, reject) => {
      const getRequest = store.get(id)
      getRequest.onsuccess = () => {
        const data = getRequest.result
        if (data) {
          data.synced = true
          const updateRequest = store.put(data)
          updateRequest.onsuccess = () => {
            console.log("[v0] Transaction marked as synced:", id)
            resolve()
          }
          updateRequest.onerror = () => reject(updateRequest.error)
        } else {
          resolve()
        }
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  } catch (error) {
    console.error("[v0] Error updating IndexedDB, falling back to localStorage:", error)
    const queue = JSON.parse(localStorage.getItem("offlineTransactions") || "[]")
    const updated = queue.map((item) => (item._offlineId === id ? { ...item, synced: true } : item))
    localStorage.setItem("offlineTransactions", JSON.stringify(updated))
  }
}

// Clear all synced transactions
export async function clearSyncedTransactions() {
  try {
    const db = await openDatabase()
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    const index = store.index("synced")

    return new Promise((resolve, reject) => {
      const request = index.openCursor(true) // Get only synced items
      request.onsuccess = (event) => {
        const cursor = event.target.result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        } else {
          console.log("[v0] Cleared all synced transactions")
          resolve()
        }
      }
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error("[v0] Error clearing IndexedDB, falling back to localStorage:", error)
    const queue = JSON.parse(localStorage.getItem("offlineTransactions") || "[]")
    const remaining = queue.filter((item) => !item.synced)
    localStorage.setItem("offlineTransactions", JSON.stringify(remaining))
  }
}
