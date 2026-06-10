import React from "react"
import ReactDOM from "react-dom/client"
import App from "@/App"
import "@/index.css"
import { HelmetProvider } from "react-helmet-async"
import { QueryProvider } from "@/contexts/QueryProvider"

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("[v0] Service Worker registered:", registration)
      })
      .catch((error) => {
        console.log("[v0] Service Worker registration failed:", error)
      })
  })
}


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
      <QueryProvider>
        <App />
      </QueryProvider>
    </HelmetProvider>
  </React.StrictMode>,
)
