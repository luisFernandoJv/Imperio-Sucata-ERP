"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { DataProvider } from "./contexts/DataContext";
import { QueryProvider } from "./contexts/QueryProvider";
import {
  BarChart3,
  Package,
  FileText,
  Menu,
  X,
  TrendingUp,
  DollarSign,
  LogOut,
  Users,
} from "lucide-react";
import Logo from "./components/Logo";
import Calculator from "./components/Calculator";
import { CommandPalette } from "./components/ui/command-palette";
import { Breadcrumbs } from "./components/navigation/Breadcrumbs";
import { QuickActions } from "./components/navigation/QuickActions";
import { OfflineIndicator } from "./components/ui/offline-indicator";
import { InstallPrompt } from "./components/ui/install-prompt";
import ErrorBoundary from "./components/ui/error-boundary"; // Importar ErrorBoundary
import Login from "./components/Login";
const ClientsPage = lazy(() => import("./components/ClientsPage"));

// Lazy loads mantidos...
const Dashboard = lazy(
  () => import("./components/dashboard/ExecutiveDashboard"),
);
const TransactionForm = lazy(() => import("./components/TransactionForm"));
const Reports = lazy(() => import("./components/reports/OptimizedReports"));
const Inventory = lazy(
  () => import("./components/inventory/OptimizedInventory"),
);
const ExpenseForm = lazy(() => import("./components/ExpenseForm"));

// Button Component reutilizável (mantido mas otimizado)
const Button = ({
  children,
  variant = "default",
  size = "default",
  className = "",
  onClick,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none touch-manipulation"; // touch-manipulation melhora resposta mobile

  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800",
    ghost: "hover:bg-gray-100 text-gray-700",
    outline: "border border-gray-300 bg-transparent hover:bg-gray-50",
  };

  const sizes = {
    default: "h-10 py-2 px-4",
    icon: "h-10 w-10",
  };

  const variantClass = variants[variant] || variants.default;

  return (
    <button
      className={`${baseClasses} ${variantClass} ${sizes[size]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

const Toaster = () => (
  <div
    id="toast-container"
    className="fixed top-4 right-4 z-[100] flex flex-col gap-2"
  ></div>
);

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [transactionType, setTransactionType] = useState("compra");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Auth Effect
  useEffect(() => {
    const checkAuth = () => {
      try {
        const authToken = localStorage.getItem("imperio_sucata_auth");
        if (authToken) setIsAuthenticated(true);
      } catch (e) {
        console.error("Erro ao acessar localStorage", e);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  // SW Registration
  useEffect(() => {
    if ("serviceWorker" in navigator && !window.swRegistered) {
      window.swRegistered = true; // Evita registro duplo
      navigator.serviceWorker.register("/sw.js").catch(console.error);
    }
  }, []);

  const handleLogin = (credentials) => {
    // Captura as credenciais do seu arquivo .env.local
    const adminUser = import.meta.env.VITE_ADMIN_USER;
    const adminPass = import.meta.env.VITE_ADMIN_PASS;

    if (
      credentials.username === adminUser &&
      credentials.password === adminPass
    ) {
      // Registra a sessão localmente e atualiza o estado correto
      localStorage.setItem("imperio_sucata_auth", "authenticated");
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    localStorage.removeItem("imperio_sucata_auth");
    setIsAuthenticated(false);
    setActiveTab("dashboard");
  };

  // Função centralizada de navegação para garantir consistência
  const handleNavigation = (tab, type = "compra") => {
    if (tab === "calculator") {
      setIsCalculatorOpen(true);
      setIsMobileMenuOpen(false);
      return;
    }

    // Scroll para o topo suavemente ao trocar de aba
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (tab === "transaction") {
      setTransactionType(type);
    }
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  // Atalhos de teclado globais
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Atalho: Alt + C ou Alt + K para Calculadora
      if (
        e.altKey &&
        (e.key.toLowerCase() === "c" || e.key.toLowerCase() === "k")
      ) {
        e.preventDefault();
        setIsCalculatorOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const menuItems = [
    {
      id: "dashboard",
      label: "Painel",
      icon: (props) => (
        <img
          src="/image/painel2.png" // Coloque o arquivo na pasta 'public'
          alt="Painel principal"
          // 2. Repasse as props (className) para manter o tamanho correto que o sistema define
          // Adicione 'object-contain' para a imagem não distorcer
          className={`object-contain ${props.className || "w-6 h-6"}`}
        />
      ),
      color: "text-blue-600",
      gradient: "from-blue-500 to-blue-600",
    },
    {
      id: "clients",
      label: "Clientes",
      icon: (props) => (
        <img
          src="/image/cliente2.png" // Coloque o arquivo na pasta 'public'
          alt="Clientes"
          // 2. Repasse as props (className) para manter o tamanho correto que o sistema define
          // Adicione 'object-contain' para a imagem não distorcer
          className={`object-contain ${props.className || "w-6 h-6"}`}
        />
      ),
      color: "text-indigo-600",
      gradient: "from-red-500 to-blue-600",
    },
    {
      id: "transaction",
      label: "Transações",
      icon: (props) => (
        <img
          src="/image/transacao3.png" // Coloque o arquivo na pasta 'public'
          alt="Transações"
          // 2. Repasse as props (className) para manter o tamanho correto que o sistema define
          // Adicione 'object-contain' para a imagem não distorcer
          className={`object-contain ${props.className || "w-7 h-7"}`}
        />
      ),
      color: "text-green-600",
      gradient: "from-green-500 to-green-600",
    },
    {
      id: "inventory",
      label: "Estoque",
      icon: (props) => (
        <img
          src="/image/estoque2.png" // Coloque o arquivo na pasta 'public'
          alt="Transações"
          // 2. Repasse as props (className) para manter o tamanho correto que o sistema define
          // Adicione 'object-contain' para a imagem não distorcer
          className={`object-contain ${props.className || "w-6 h-6"}`}
        />
      ),
      color: "text-purple-600",
      gradient: "from-yellow-500 to-yellow-600",
    },
    {
      id: "expenses",
      label: "Despesas",
      icon: (props) => (
        <img
          src="/image/despesa.png" // Coloque o arquivo na pasta 'public'
          alt="Transações"
          // 2. Repasse as props (className) para manter o tamanho correto que o sistema define
          // Adicione 'object-contain' para a imagem não distorcer
          className={`object-contain ${props.className || "w-6 h-6"}`}
        />
      ),
      color: "text-red-600",
      gradient: "from-red-500 to-red-600",
    },
    {
      id: "reports",
      label: "Relatórios",
      icon: (props) => (
        <img
          src="/image/relatorio6.png" // Coloque o arquivo na pasta 'public'
          alt="Transações"
          // 2. Repasse as props (className) para manter o tamanho correto que o sistema define
          // Adicione 'object-contain' para a imagem não distorcer
          className={`object-contain ${props.className || "w-6 h-6"}`}
        />
      ),
      color: "text-orange-600",
      gradient: "from-orange-500 to-orange-600",
    },
  ];

  const getBreadcrumbItems = () => {
    const item = menuItems.find((m) => m.id === activeTab);
    return item ? [{ label: item.label }] : [];
  };

  const renderContent = () => {
    // Wrapper component para garantir que as props sejam passadas corretamente
    const content = () => {
      switch (activeTab) {
        case "dashboard":
          return <Dashboard onQuickAction={handleNavigation} />;
        case "clients":
          return <ClientsPage />;
        case "transaction":
          return (
            <TransactionForm
              onSuccess={() => handleNavigation("dashboard")}
              initialType={transactionType}
            />
          );
        case "inventory":
          return <Inventory />;
        case "expenses":
          return (
            <ExpenseForm onSuccess={() => handleNavigation("dashboard")} />
          );
        case "reports":
          return <Reports />;
        default:
          return <Dashboard onQuickAction={handleNavigation} />;
      }
    };

    return (
      <ErrorBoundary onReset={() => setActiveTab("dashboard")}>
        {content()}
      </ErrorBoundary>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <QueryProvider>
      <DataProvider>
        <Helmet>
          <title>Império Sucata - Gestão</title>
          <meta name="theme-color" content="#3b82f6" />
        </Helmet>

        <CommandPalette onNavigate={handleNavigation} />
        <Calculator
          isOpen={isCalculatorOpen}
          onClose={() => setIsCalculatorOpen(false)}
        />
        <OfflineIndicator />
        <InstallPrompt />

        <div className="min-h-screen bg-slate-50 flex flex-col">
          {/* Header Fixo */}
          <header className="bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-40 no-print">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => handleNavigation("dashboard")}
                >
                  <Logo />
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <Button
                        key={item.id}
                        variant={isActive ? "default" : "ghost"}
                        onClick={() => handleNavigation(item.id)}
                        className={`gap-2 h-10 px-4 transition-all duration-200 ${
                          isActive
                            ? `bg-gradient-to-r ${item.gradient} shadow-md`
                            : "hover:bg-slate-100 text-slate-600"
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 ${isActive ? "text-white" : item.color}`}
                        />
                        <span>{item.label}</span>
                      </Button>
                    );
                  })}

                  <div className="w-px h-6 bg-gray-200 mx-2"></div>

                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </Button>
                </nav>

                {/* Mobile Menu Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label="Abrir menu"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </Button>
              </div>
            </div>

            {/* Mobile Navigation Dropdown */}
            <AnimatePresence>
              {isMobileMenuOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="md:hidden border-t border-gray-100 bg-white overflow-hidden"
                >
                  <div className="px-4 py-2 space-y-1 shadow-inner bg-slate-50/50">
                    {menuItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <Button
                          key={item.id}
                          variant={isActive ? "default" : "ghost"}
                          onClick={() => handleNavigation(item.id)}
                          className={`w-full justify-start h-12 text-base ${
                            isActive ? `bg-gradient-to-r ${item.gradient}` : ""
                          }`}
                        >
                          <Icon
                            className={`h-5 w-5 mr-3 ${isActive ? "text-white" : item.color}`}
                          />
                          {item.label}
                        </Button>
                      );
                    })}
                    <div className="border-t border-gray-200 my-2 pt-2">
                      <Button
                        onClick={handleLogout}
                        variant="ghost"
                        className="w-full justify-start text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-5 w-5 mr-3" />
                        Sair do Sistema
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Breadcrumbs
              items={getBreadcrumbItems()}
              onNavigate={handleNavigation}
            />

            <Suspense
              fallback={
                <div className="w-full h-64 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="loading-spinner h-8 w-8"></div>
                    <span className="text-sm text-gray-500">
                      Carregando módulo...
                    </span>
                  </div>
                </div>
              }
            >
              {/* Adicionado 'mode="wait"' para evitar que dois componentes existam ao mesmo tempo */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="w-full"
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </Suspense>
          </main>

          <QuickActions onAction={handleNavigation} />
          <Toaster />
        </div>
      </DataProvider>
    </QueryProvider>
  );
}

export default App;
