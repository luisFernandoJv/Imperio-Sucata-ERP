import { memo } from "react";
import { ChevronRight, Home } from "lucide-react";

export const Breadcrumbs = memo(({ items, onNavigate }) => (
  <nav aria-label="Caminho de navegação" className="shell-breadcrumbs no-print">
    <ol>
      <li>
        <button type="button" onClick={() => onNavigate("dashboard")} aria-label="Ir para o painel inicial"><Home size={16} aria-hidden="true" /><span>Início</span></button>
      </li>
      {items.map((item, index) => (
        <li key={`${item.label}-${index}`}>
          <ChevronRight size={14} aria-hidden="true" />
          {item.action ? <button type="button" onClick={item.action}>{item.label}</button> : <span aria-current={index === items.length - 1 ? "page" : undefined}>{item.label}</span>}
        </li>
      ))}
    </ol>
  </nav>
));
Breadcrumbs.displayName = "Breadcrumbs";
