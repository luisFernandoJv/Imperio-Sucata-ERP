import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";
import "@/index.css";
import { HelmetProvider } from "react-helmet-async";
import { QueryProvider } from "@/contexts/QueryProvider";
import ErrorBoundary from "@/components/ui/error-boundary";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <QueryProvider>
          <App />
        </QueryProvider>
      </HelmetProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
