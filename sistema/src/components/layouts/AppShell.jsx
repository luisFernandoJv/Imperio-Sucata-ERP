import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, Calculator, Search, LogOut, Menu, X } from "lucide-react";
import Logo from "../Logo";
import { QuickActions } from "../navigation/QuickActions";
import { navigationItems } from "../navigation/navigationItems";
import "../../styles/app-shell.css";

function Brand({ onNavigate }) {
  return (
    <button
      type="button"
      className="shell-brand"
      onClick={() => onNavigate("dashboard")}
      aria-label="Império Sucata — ir para o painel"
    >
      <Logo showText={false} size="small" />
      <span>
        <strong>Império Sucata</strong>
        <small>Sistema de gestão</small>
      </span>
    </button>
  );
}

function Navigation({ activeTab, onNavigate, onLogout, mobile = false }) {
  return (
    <>
      <nav
        className="shell-nav"
        aria-label={
          mobile ? "Navegação principal móvel" : "Navegação principal"
        }
      >
        {["Visão geral", "Operação", "Gestão"].map((group) => (
          <div className="shell-nav-group" key={group}>
            <p className="shell-nav-label">{group}</p>
            <ul>
              {navigationItems
                .filter((item) => item.group === group)
                .map((item) => {
                  const { id, label, icon: Icon } = item;
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        className="shell-nav-item"
                        aria-current={activeTab === id ? "page" : undefined}
                        onClick={() => onNavigate(id)}
                      >
                        <Icon size={20} aria-hidden="true" />
                        <span>{label}</span>
                        {activeTab === id && (
                          <ArrowRight
                            size={16}
                            className="shell-active-arrow"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="shell-sidebar-footer">
        <button
          type="button"
          className="shell-nav-item"
          onClick={() => onNavigate("calculator")}
        >
          <Calculator size={20} aria-hidden="true" />
          <span>Calculadora</span>
        </button>
        <button
          type="button"
          className="shell-nav-item shell-logout"
          onClick={onLogout}
        >
          <LogOut size={20} aria-hidden="true" />
          <span>Sair do sistema</span>
        </button>
      </div>
    </>
  );
}

export default function AppShell({
  activeTab,
  onNavigate,
  onLogout,
  onOpenCommands,
  children,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const mainRef = useRef(null);
  const previousTab = useRef(activeTab);
  const focusAfterClose = useRef(false);
  const pendingUtility = useRef(false);
  const currentItem = navigationItems.find((item) => item.id === activeTab);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1280px)");
    const onChange = () => {
      if (desktop.matches) setMenuOpen(false);
    };
    desktop.addEventListener("change", onChange);
    return () => desktop.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (previousTab.current !== activeTab && !menuOpen)
      mainRef.current?.focus({ preventScroll: true });
    previousTab.current = activeTab;
  }, [activeTab, menuOpen]);

  const navigateFromMenu = (id) => {
    focusAfterClose.current = id !== "calculator";
    setMenuOpen(false);
    if (id === "calculator") {
      pendingUtility.current = true;
      return;
    }
    onNavigate(id);
  };

  return (
    <div className="app-shell">
      <a
        className="shell-skip-link"
        href="#main-content"
        onClick={() => mainRef.current?.focus()}
      >
        Pular para o conteúdo
      </a>
      <aside className="shell-sidebar no-print">
        <Brand onNavigate={onNavigate} />
        <Navigation
          activeTab={activeTab}
          onNavigate={onNavigate}
          onLogout={onLogout}
        />
      </aside>
      <div className="shell-workspace">
        <header className="shell-topbar no-print">
          <div className="shell-topbar-context">
            <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
              <Dialog.Trigger asChild>
                <button
                  type="button"
                  className="shell-icon-button shell-menu-trigger"
                  aria-label="Abrir menu de navegação"
                >
                  <Menu size={22} aria-hidden="true" />
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="shell-drawer-overlay no-print" />
                <Dialog.Content
                  className="shell-drawer no-print"
                  onCloseAutoFocus={(event) => {
                    if (pendingUtility.current) {
                      event.preventDefault();
                      pendingUtility.current = false;
                      document.querySelector(".shell-menu-trigger")?.focus();
                      requestAnimationFrame(() => onNavigate("calculator"));
                      return;
                    }
                    if (focusAfterClose.current) {
                      event.preventDefault();
                      mainRef.current?.focus({ preventScroll: true });
                      focusAfterClose.current = false;
                    }
                  }}
                >
                  <div className="shell-drawer-heading">
                    <Brand onNavigate={navigateFromMenu} />
                    <Dialog.Close asChild>
                      <button
                        type="button"
                        className="shell-icon-button"
                        aria-label="Fechar menu de navegação"
                      >
                        <X size={22} aria-hidden="true" />
                      </button>
                    </Dialog.Close>
                  </div>
                  <Dialog.Title className="sr-only">
                    Menu de navegação
                  </Dialog.Title>
                  <Dialog.Description className="sr-only">
                    Escolha um módulo do Império Sucata. Pressione Escape para
                    fechar.
                  </Dialog.Description>
                  <Navigation
                    activeTab={activeTab}
                    onNavigate={navigateFromMenu}
                    onLogout={onLogout}
                    mobile
                  />
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
            <div className="shell-context-copy">
              <span>
                Império Sucata <span aria-hidden="true">/</span> Gestão
              </span>
              <p>{currentItem?.label || "Painel"}</p>
            </div>
          </div>
          <div className="shell-tools">
            <button
              id="shell-command-trigger"
              type="button"
              className="shell-tool-button"
              onClick={onOpenCommands}
              aria-label="Buscar módulo ou ação"
              aria-keyshortcuts="Control+k Meta+k"
            >
              <Search size={18} aria-hidden="true" />
              <span>Buscar</span>
              <kbd>Ctrl K</kbd>
            </button>
            <QuickActions onAction={onNavigate} />
            <button
              type="button"
              className="shell-calculator-button"
              onClick={() => onNavigate("calculator")}
              aria-label="Abrir calculadora"
            >
              <Calculator size={18} aria-hidden="true" />
              <span>Calculadora</span>
            </button>
          </div>
        </header>
        <main
          ref={mainRef}
          id="main-content"
          tabIndex={-1}
          className="shell-main"
        >
          <div className="shell-content">{children}</div>
        </main>
      </div>
    </div>
  );
}
