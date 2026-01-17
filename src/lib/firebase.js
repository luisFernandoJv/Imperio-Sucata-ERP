import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"

// As chaves agora são lidas com segurança do ambiente, protegendo seu sistema no GitHub
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

let app
let db

try {
  app = initializeApp(firebaseConfig)
  db = getFirestore(app)
  
  if (import.meta.env.DEV) {
    console.log("[v0] Firebase e Firestore operando com variáveis de ambiente")
  }
} catch (error) {
  console.error("[v0] Erro na inicialização protegida:", error)
  throw error
}

export { db }
export default app