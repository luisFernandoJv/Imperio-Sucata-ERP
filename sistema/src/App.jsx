"use client";

import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { DataProvider } from "./contexts/DataContext";
import { QueryProvider } from "./contexts/QueryProvider";
import AppShell from "./components/layouts/AppShell";
import { navigationItems } from "./components/navigation/navigationItems";
import Calculator from "./components/Calculator";
import { CommandPalette } from "./components/ui/command-palette";
import { Breadcrumbs } from "./components/navigation/Breadcrumbs";
import PageFocus from "./components/navigation/PageFocus";
import * as Dialog from "@radix-ui/react-dialog";
import { FormFeedback } from "./components/ui/form-feedback";
import "./styles/utility-workspace.css";
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
const CaixaDiario = lazy(() => import("./components/CaixaDiario"));

const MotionDiv = motion.div;
const hasPendingOperation = () =>
  Boolean(
    document.querySelector(
      '#main-content form[aria-busy="true"], #main-content form [aria-busy="true"]',
    ),
  );

const Toaster = () => (
  <div
    id="toast-container"
    className="fixed top-4 right-4 z-[100] flex flex-col gap-2"
  ></div>
);

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [transactionType, setTransactionType] = useState("compra");
  const reduceMotion = useReducedMotion();
  const [utility, setUtility] = useState(null);
  const [transactionSession, setTransactionSession] = useState(0);
  const [newTransactionType, setNewTransactionType] = useState(null);
  const [navigationMessage, setNavigationMessage] = useState(null);
  const utilityOpener = useRef(null);
  const continueRef = useRef(null);
  const returnUtilityFocus = () => {
    const target = utilityOpener.current;
    if (target?.isConnected) target.focus({ preventScroll: true });
    else document.getElementById("shell-command-trigger")?.focus();
  };
  const openUtility = (name) => {
    utilityOpener.current = document.activeElement;
    setUtility(name);
  };
  const focusCurrentPage = () =>
    requestAnimationFrame(() =>
      document
        .querySelector("#main-content h1")
        ?.focus({ preventScroll: true }),
    );
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!navigationMessage) return;
    const main = document.getElementById("main-content");
    const check = () => {
      if (!hasPendingOperation()) setNavigationMessage(null);
    };
    const observer = new MutationObserver(check);
    if (main)
      observer.observe(main, {
        attributes: true,
        subtree: true,
        attributeFilter: ["aria-busy"],
      });
    check();
    return () => observer.disconnect();
  }, [navigationMessage]);

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
    setUtility(null);
  };

  // Ações globais continuam apontando para os módulos e tipos existentes.
  const handleNavigation = (tab, type) => {
    if (tab === "calculator") {
      openUtility("calculator");
      return;
    }
    if (!navigationItems.some((item) => item.id === tab)) return;
    if (hasPendingOperation()) {
      setNavigationMessage({
        title: "Aguarde a conclusão",
        description:
          "Há uma operação em andamento. Aguarde a confirmação antes de trocar de tela.",
      });
      return;
    }
    setNavigationMessage(null);
    if (tab === "transaction" && type) {
      if (activeTab === "transaction") {
        setNewTransactionType(type);
        return;
      }
      setTransactionType(type);
      setTransactionSession((v) => v + 1);
    }
    if (tab === activeTab) focusCurrentPage();
    setActiveTab(tab);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    const handleKey = (event) => {
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.isComposing ||
        event.getModifierState?.("AltGraph")
      )
        return;
      const key = event.key.toLowerCase();
      const commandKey =
        (event.ctrlKey || event.metaKey) &&
        !event.altKey &&
        !event.shiftKey &&
        key === "k";
      const calculatorKey =
        event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.shiftKey &&
        (key === "c" || key === "k");
      if (!commandKey && !calculatorKey) return;
      if (utility) {
        if (
          (utility === "commands" && commandKey) ||
          (utility === "calculator" && calculatorKey)
        ) {
          event.preventDefault();
          setUtility(null);
        }
        return;
      }
      if (document.querySelector('[role="dialog"], [role="alertdialog"]'))
        return;
      if (
        event.target instanceof Element &&
        event.target.closest(
          'input,textarea,select,[contenteditable="true"],[role="textbox"]',
        )
      )
        return;
      event.preventDefault();
      utilityOpener.current = document.activeElement;
      setUtility(commandKey ? "commands" : "calculator");
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isAuthenticated, utility]);

  const getBreadcrumbItems = () => {
    const item = navigationItems.find((m) => m.id === activeTab);
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
              key={transactionSession}
              onSuccess={() => handleNavigation("dashboard")}
              initialType={transactionType}
            />
          );
        case "inventory":
          return <Inventory />;
        case "caixa":
          return <CaixaDiario />;
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
          <title>
            {navigationItems.find((item) => item.id === activeTab)?.label} |
            Império Sucata
          </title>
          <meta name="theme-color" content="#c2410c" />
        </Helmet>

        <CommandPalette
          open={utility === "commands"}
          onOpenChange={(open) => setUtility(open ? "commands" : null)}
          onNavigate={handleNavigation}
          onReturnFocus={returnUtilityFocus}
        />
        <Calculator
          isOpen={utility === "calculator"}
          onClose={() => setUtility(null)}
          onReturnFocus={returnUtilityFocus}
        />

        <AppShell
          activeTab={activeTab}
          onNavigate={handleNavigation}
          onLogout={handleLogout}
          onOpenCommands={() => openUtility("commands")}
        >
          <OfflineIndicator />
          <InstallPrompt />
          <FormFeedback
            feedback={navigationMessage}
            onDismiss={() => setNavigationMessage(null)}
          />
          <Breadcrumbs
            items={getBreadcrumbItems()}
            onNavigate={handleNavigation}
          />

          <Suspense
            fallback={
              <div
                role="status"
                className="w-full h-64 flex items-center justify-center"
              >
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
              <MotionDiv
                key={activeTab}
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
                transition={{ duration: reduceMotion ? 0 : 0.2 }}
                className="w-full"
              >
                <PageFocus pageKey={`${activeTab}-${transactionSession}`}>
                  {renderContent()}
                </PageFocus>
              </MotionDiv>
            </AnimatePresence>
          </Suspense>
        </AppShell>
        <Dialog.Root
          open={Boolean(newTransactionType)}
          onOpenChange={(open) => {
            if (!open) setNewTransactionType(null);
          }}
        >
          <Dialog.Portal>
            <Dialog.Overlay className="utility-overlay" />
            <Dialog.Content
              className="utility-dialog"
              onOpenAutoFocus={(event) => {
                event.preventDefault();
                continueRef.current?.focus();
              }}
              onCloseAutoFocus={(event) => {
                event.preventDefault();
                focusCurrentPage();
              }}
            >
              <Dialog.Title>Abrir um novo lançamento?</Dialog.Title>
              <Dialog.Description>
                O formulário de transação será reiniciado como{" "}
                {newTransactionType === "venda" ? "venda" : "compra"}. O
                preenchimento atual que ainda não foi salvo será descartado.
              </Dialog.Description>
              <div className="utility-dialog-actions">
                <button
                  ref={continueRef}
                  type="button"
                  className="utility-secondary"
                  onClick={() => setNewTransactionType(null)}
                >
                  Continuar preenchendo
                </button>
                <button
                  type="button"
                  className="utility-primary"
                  onClick={() => {
                    setTransactionType(newTransactionType);
                    setTransactionSession((v) => v + 1);
                    setNewTransactionType(null);
                  }}
                >
                  Abrir novo lançamento
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
        <Toaster />
      </DataProvider>
    </QueryProvider>
  );
}

export default App;
