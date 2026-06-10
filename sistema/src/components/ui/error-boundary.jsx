"use client";

import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "./button";

/**
 * ErrorBoundary — captura erros em subárvores React e exibe fallback amigável.
 *
 * Uso:
 *   <ErrorBoundary>
 *     <ComponenteQuePodefAlhar />
 *   </ErrorBoundary>
 *
 * Props:
 *   onReset     () => void   — callback ao clicar em "Tentar Novamente"
 *   fallback    ReactNode    — UI customizada de fallback (opcional)
 *   children    ReactNode
 */

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary] Erro capturado:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      // Fallback customizado via prop
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[320px] p-8 text-center bg-red-50 rounded-xl border border-red-100 m-4">
          {/* Ícone */}
          <div className="bg-red-100 p-4 rounded-full mb-5">
            <AlertTriangle className="h-9 w-9 text-red-600" />
          </div>

          {/* Título */}
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Algo deu errado
          </h2>
          <p className="text-sm text-gray-600 mb-6 max-w-sm leading-relaxed">
            Ocorreu um erro ao carregar esta seção. Você pode tentar novamente
            ou voltar ao painel principal.
          </p>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              leftIcon={<Home className="h-4 w-4" />}
            >
              Recarregar Página
            </Button>
            <Button
              variant="destructive"
              onClick={this.handleReset}
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              Tentar Novamente
            </Button>
          </div>

          {/* Stack trace em dev */}
          {process.env.NODE_ENV === "development" && this.state.error && (
            <details className="mt-6 w-full text-left">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 mb-2">
                Detalhes do erro (desenvolvimento)
              </summary>
              <pre className="p-4 bg-gray-900 text-red-300 text-xs rounded-lg overflow-auto max-h-48 leading-relaxed">
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
