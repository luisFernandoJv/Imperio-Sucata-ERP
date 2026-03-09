"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./button";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Erro capturado pelo Boundary:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-red-50 rounded-lg border border-red-100 m-4">
          <div className="bg-red-100 p-4 rounded-full mb-4">
            <AlertTriangle className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Algo deu errado
          </h2>
          <p className="text-gray-600 mb-6 max-w-md">
            Ocorreu um erro ao carregar esta seção. Tente recarregar ou volte
            para o painel principal.
          </p>
          <div className="flex gap-4">
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="bg-white border-gray-300 hover:bg-gray-50"
            >
              Recarregar Página
            </Button>
            <Button
              onClick={this.handleReset}
              className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar Novamente
            </Button>
          </div>
          {process.env.NODE_ENV === "development" && (
            <pre className="mt-8 p-4 bg-gray-800 text-red-200 text-xs rounded text-left overflow-auto max-w-full">
              {this.state.error && this.state.error.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
