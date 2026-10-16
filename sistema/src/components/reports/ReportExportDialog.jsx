import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  FileText,
  DollarSign,
  Wallet,
  Users,
  Package,
  CalendarDays,
  Receipt,
  CreditCard,
  FileSpreadsheet,
  Download,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
export default function ReportExportDialog({
  onExport,
  isExporting,
  disabled,
}) {
  const [open, setOpen] = useState(false);
  const exportOptions = [
    {
      id: "pdf-completo",
      label: "Relatório Completo",
      icon: FileText,
      description: "Resumo e transações filtradas",
    },
    {
      id: "pdf-financeiro",
      label: "Relatório Financeiro",
      icon: DollarSign,
      description: "Análise de receitas e despesas",
    },
    {
      id: "pdf-despesas",
      label: "Relatório de Despesas",
      icon: Wallet,
      description: "Apenas transações de despesas",
    },
    {
      id: "pdf-clientes-geral",
      label: "Relatório Geral de Clientes",
      icon: Users,
      description: "Lista recente carregada; não usa os filtros desta tela",
    },
    {
      id: "pdf-materiais",
      label: "Relatório por Material",
      icon: Package,
      description: "Análise detalhada por material",
    },
    {
      id: "pdf-diario",
      label: "Relatório Diário",
      icon: CalendarDays,
      description: "Movimentação dia a dia",
    },
    {
      id: "pdf-transacoes",
      label: "Lista de Transações",
      icon: Receipt,
      description: "Tabela completa de transações",
    },
    {
      id: "pdf-pagamentos",
      label: "Relatório Pagamentos",
      icon: CreditCard,
      description: "Análise por forma de pagamento",
    },
  ];
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button
          size="sm"
          disabled={disabled || isExporting}
          className="bg-red-600 hover:bg-red-700"
        >
          <Download size={17} className="mr-2" aria-hidden="true" />
          {isExporting ? "Exportando…" : "Exportar"}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="report-dialog-overlay" />
        <Dialog.Content className="report-export-dialog">
          <div className="report-dialog-heading">
            <div>
              <Dialog.Title>Exportar relatórios</Dialog.Title>
              <Dialog.Description>
                PDF e Excel usam todas as transações filtradas, incluindo as
                outras páginas. O relatório geral de clientes usa a lista
                recente carregada, conforme indicado abaixo.
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Fechar exportação"
              className="report-icon-button"
            >
              <X size={20} />
            </Dialog.Close>
          </div>
          <div className="report-export-options">
            {exportOptions.map((option) => (
              <button
                type="button"
                key={option.id}
                onClick={() => {
                  setOpen(false);
                  onExport(option.id);
                }}
              >
                <option.icon size={21} aria-hidden="true" />
                <span>
                  <strong>{option.label}</strong>
                  <small>{option.description}</small>
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onExport("excel");
              }}
            >
              <FileSpreadsheet size={21} aria-hidden="true" />
              <span>
                <strong>Exportar Excel</strong>
                <small>3 abas: Resumo, Transações e Materiais</small>
              </span>
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
