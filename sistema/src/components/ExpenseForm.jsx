import { useEffect, useRef, useState } from "react";
import {
  Save,
  RotateCcw,
  Tag,
  User,
  FileText,
  Calendar,
  PieChart,
  DownloadCloud,
  Receipt,
  Banknote,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { getTransactionsByPeriod } from "@/lib/firebaseService";
import { useFormFeedback } from "@/hooks/useFormFeedback";
import { FormFeedback } from "@/components/ui/form-feedback";
import {
  ExpenseCustomerPicker,
  ExpenseResetDialog,
} from "./expenses/ExpenseDialogs";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import "@/styles/expense-workspace.css";

const formatCurrency = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0,
  );
const formatDateForInput = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const parseDateInputPreservingTime = (value, previousDate) => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  const base = previousDate instanceof Date ? previousDate : new Date();
  return new Date(
    year,
    month - 1,
    day,
    base.getHours(),
    base.getMinutes(),
    base.getSeconds(),
    base.getMilliseconds(),
  );
};
const emptyForm = () => ({
  nome: "",
  valor: "",
  categoria: "operacional",
  observacoes: "",
  data: new Date(),
  formaPagamento: "dinheiro",
  numeroTransacao: "",
  clienteId: "",
});
const CATEGORIAS = [
  { value: "operacional", label: "Operacional", icon: "⚙️" },
  { value: "emprestimo", label: "Empréstimo (Cliente)", icon: "💰" },
  { value: "manutencao", label: "Manutenção", icon: "🔧" },
  { value: "combustivel", label: "Combustível", icon: "⛽" },
  { value: "energia", label: "Energia Elétrica", icon: "⚡" },
  { value: "agua", label: "Água", icon: "💧" },
  { value: "telefone", label: "Telefone/Internet", icon: "📞" },
  { value: "aluguel", label: "Aluguel", icon: "🏠" },
  { value: "funcionarios", label: "Funcionários", icon: "👥" },
  { value: "impostos", label: "Impostos/Taxas", icon: "📋" },
  { value: "equipamentos", label: "Equipamentos", icon: "🛠️" },
  { value: "p_casa", label: "P/Casa", icon: "🏡" },
  { value: "devolucao", label: "Devolução", icon: "↩️" },
  { value: "refeicao", label: "Refeição", icon: "🍽️" },
  { value: "outros", label: "Outros", icon: "📦" },
];

const PAGAMENTOS = [
  { value: "dinheiro", label: "Dinheiro", icon: "💵" },
  { value: "pix", label: "PIX", icon: "📱" },
  { value: "transferencia", label: "Transferência", icon: "🏦" },
  { value: "cartao", label: "Cartão", icon: "💳" },
  { value: "cheque", label: "Cheque", icon: "✍️" },
];

const ExpenseForm = () => {
  const [formData, setFormData] = useState(emptyForm);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [saving, setSaving] = useState(false);
  const [slowSave, setSlowSave] = useState(false);
  const [recorded, setRecorded] = useState(() => {
    try {
      const id = sessionStorage.getItem("expense_pending_balance_id");
      return id ? { id } : null;
    } catch {
      return null;
    }
  });
  const [resetOpen, setResetOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [reportCategory, setReportCategory] = useState("all");
  const [reportStartInput, setReportStartInput] = useState(() =>
    formatDateForInput(startOfMonth(new Date())),
  );
  const [reportEndInput, setReportEndInput] = useState(() =>
    formatDateForInput(endOfMonth(new Date())),
  );
  const [fieldErrors, setFieldErrors] = useState({});
  const saveRef = useRef(false);
  const exportRef = useRef(false);
  const nameRef = useRef(null);
  const { toast, feedback, dismiss } = useFormFeedback();
  const reportFeedback = useFormFeedback();
  useEffect(() => {
    if (!saving) return;
    const timer = setTimeout(() => setSlowSave(true), 12000);
    return () => clearTimeout(timer);
  }, [saving]);
  const setField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };
  const resetForm = () => {
    try {
      sessionStorage.removeItem("expense_pending_balance_id");
    } catch {
      /* A proteção em memória continua disponível sem armazenamento. */
    }
    setFormData(emptyForm());
    setSelectedCustomer(null);
    setRecorded(null);
    setFieldErrors({});
    setResetOpen(false);
    requestAnimationFrame(() => nameRef.current?.focus());
  };
  const requestReset = () => {
    if (saveRef.current) return;
    const dirty =
      formData.nome ||
      formData.valor ||
      formData.observacoes ||
      formData.clienteId ||
      formData.numeroTransacao ||
      formData.categoria !== "operacional" ||
      formData.formaPagamento !== "dinheiro" ||
      formatDateForInput(formData.data) !== formatDateForInput(new Date());
    if (dirty || recorded) setResetOpen(true);
    else {
      resetForm();
      dismiss();
    }
  };
  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setFormData((prev) => ({
      ...prev,
      clienteId: customer.id,
      nome: customer.nome,
    }));
    setFieldErrors((prev) => ({ ...prev, nome: undefined }));
  };
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saveRef.current || recorded) return;
    const valor = Number.parseFloat(formData.valor);
    const errors = {};
    if (!formData.nome.trim())
      errors.nome = "Informe o favorecido ou a descrição da despesa.";
    if (!Number.isFinite(valor) || valor <= 0)
      errors.valor = "Informe um valor maior que zero.";
    if (
      Number.isFinite(valor) &&
      document.getElementById("expense-valor")?.validity.stepMismatch
    )
      errors.valor = "Use no máximo duas casas decimais no valor.";
    if (
      !(formData.data instanceof Date) ||
      !Number.isFinite(formData.data.getTime())
    )
      errors.data = "Informe uma data válida.";
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      document.getElementById(`expense-${Object.keys(errors)[0]}`)?.focus();
      toast({
        title: "Confira os campos",
        description: "Revise os campos indicados antes de registrar.",
        variant: "destructive",
      });
      return;
    }
    saveRef.current = true;
    setSaving(true);
    setSlowSave(false);
    dismiss();
    let transactionId;
    try {
      const transactionDate =
        formData.data instanceof Date ? formData.data : new Date(formData.data);
      const { addTransaction, updateCustomerBalance } = await import(
        "../lib/firebaseService"
      );
      transactionId = await addTransaction({
        tipo: "despesa",
        material: "despesa",
        quantidade: 1,
        precoUnitario: valor,
        valorTotal: valor,
        vendedor: formData.nome,
        observacoes: `${formData.categoria}: ${formData.observacoes}`,
        data: transactionDate,
        formaPagamento: formData.formaPagamento,
        numeroTransacao: formData.numeroTransacao,
        clienteId: formData.clienteId,
        categoria: formData.categoria,
      });
      // A cópia local só é gravada após a confirmação do banco. Ela não é uma fila de sincronização.
      let localCopyFailed = false;
      try {
        const transactions = JSON.parse(
          localStorage.getItem("recycling_transactions") || "[]",
        );
        if (!Array.isArray(transactions)) throw new Error("Invalid local copy");
        transactions.push({
          ...formData,
          valor,
          data: transactionDate.toISOString(),
          tipo: "despesa",
          id: transactionId,
        });
        localStorage.setItem(
          "recycling_transactions",
          JSON.stringify(transactions),
        );
      } catch {
        localCopyFailed = true;
      }
      if (
        formData.clienteId &&
        formData.categoria === "emprestimo" &&
        typeof updateCustomerBalance === "function"
      ) {
        try {
          sessionStorage.setItem("expense_pending_balance_id", transactionId);
        } catch {
          /* Não interromper uma gravação já confirmada. */
        }
        try {
          await updateCustomerBalance(formData.clienteId, valor, "emprestimo");
        } catch {
          // A transação já existe: reenviar o formulário duplicaria o lançamento.
          setRecorded({ id: transactionId });
          toast({
            title: "Despesa registrada; confira o saldo do cliente",
            description:
              "O lançamento foi salvo, mas a atualização do saldo não foi confirmada. Confira o cliente e a transação antes de qualquer ajuste. Não registre esta despesa novamente.",
            variant: "destructive",
          });
          return;
        }
      }
      toast({
        title: "Despesa registrada",
        description: `Despesa “${formData.nome}” de ${formatCurrency(valor)} registrada.${localCopyFailed ? " A cópia neste navegador não pôde ser atualizada; o lançamento já está no banco. Não repita o envio." : " Você pode registrar a próxima despesa."}`,
      });
      resetForm();
    } catch {
      toast({
        title: "Registro não confirmado",
        description:
          "Não foi possível confirmar o registro. Os campos foram mantidos. Confira a conexão e os lançamentos antes de tentar novamente.",
        variant: "destructive",
      });
    } finally {
      saveRef.current = false;
      setSaving(false);
      setSlowSave(false);
    }
  };
  const generateSmartReport = async (event) => {
    event.preventDefault();
    if (exportRef.current) return;
    const reportStartDate = new Date(`${reportStartInput}T00:00:00`);
    const reportEndDate = new Date(`${reportEndInput}T23:59:59`);
    if (
      !reportStartInput ||
      !reportEndInput ||
      !Number.isFinite(reportStartDate.getTime()) ||
      !Number.isFinite(reportEndDate.getTime()) ||
      reportStartDate > reportEndDate
    ) {
      reportFeedback.toast({
        title: "Confira o período",
        description:
          "Informe as duas datas. A data final deve ser igual ou posterior à inicial.",
        variant: "destructive",
      });
      document
        .getElementById(
          !reportStartInput ? "expense-report-start" : "expense-report-end",
        )
        ?.focus();
      return;
    }
    exportRef.current = true;
    setIsExporting(true);
    reportFeedback.dismiss();
    try {
      const transactions = await getTransactionsByPeriod(
        reportStartDate,
        reportEndDate,
      );
      let despesas = transactions.filter((t) => t.tipo === "despesa");
      if (reportCategory !== "all")
        despesas = despesas.filter((t) => t.categoria === reportCategory);
      if (!despesas.length) {
        reportFeedback.toast({
          title: "Nenhuma despesa no período",
          description: "Tente outro período ou categoria.",
        });
        return;
      }
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 45, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("IMPÉRIO SUCATA", 15, 25);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184);
      doc.text("FINANCEIRO", 15, 33);

      const catLabel =
        reportCategory === "all"
          ? "TODAS AS CATEGORIAS"
          : CATEGORIAS.find(
              (c) => c.value === reportCategory,
            )?.label.toUpperCase();
      doc.setFillColor(30, 41, 59);
      doc.roundedRect(pageWidth - 85, 15, 70, 20, 3, 3, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text("FILTRO ATIVO", pageWidth - 80, 22);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(catLabel, pageWidth - 80, 29);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(18);
      doc.text("RELATÓRIO DE DESPESAS", 15, 60);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Período: ${format(reportStartDate, "dd/MM/yyyy")} até ${format(reportEndDate, "dd/MM/yyyy")}`,
        15,
        67,
      );

      const total = despesas.reduce(
        (acc, t) => acc + (Number(t.valorTotal) || 0),
        0,
      );
      autoTable(doc, {
        startY: 75,
        head: [
          ["DATA", "DESCRIÇÃO / FAVORECIDO", "CATEGORIA", "PAGAMENTO", "VALOR"],
        ],
        body: despesas.map((t) => [
          format(new Date(t.data), "dd/MM/yyyy"),
          (t.vendedor || t.cliente || "NÃO INFORMADO").toUpperCase(),
          (
            CATEGORIAS.find((c) => c.value === t.categoria)?.label || "GERAL"
          ).toUpperCase(),
          (t.formaPagamento || "DINHEIRO").toUpperCase(),
          formatCurrency(t.valorTotal),
        ]),
        theme: "grid",
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 9,
        },
        styles: { fontSize: 8, cellPadding: 4 },
        columnStyles: { 4: { fontStyle: "bold", halign: "right" } },
        foot: [["", "", "", "TOTAL ACUMULADO", formatCurrency(total)]],
        footStyles: {
          fillColor: [241, 245, 249],
          textColor: [15, 23, 42],
          fontStyle: "bold",
          fontSize: 10,
          halign: "right",
        },
      });

      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Página ${i} de ${pageCount} | Gerado em ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" },
        );
      }

      doc.save(
        `Relatorio_Despesas_${reportCategory}_${format(reportStartDate, "dd_MM_yyyy")}_a_${format(reportEndDate, "dd_MM_yyyy")}.pdf`,
      );
      reportFeedback.toast({
        title: "Relatório gerado",
        description: "O PDF foi enviado para download.",
      });
    } catch {
      reportFeedback.toast({
        title: "Não foi possível gerar o relatório",
        description:
          "Os filtros foram mantidos. Confira a conexão e tente novamente.",
        variant: "destructive",
      });
    } finally {
      exportRef.current = false;
      setIsExporting(false);
    }
  };
  const isEmprestimo = formData.categoria === "emprestimo";
  const valorNum = Number.parseFloat(formData.valor) || 0;
  const locked = saving || Boolean(recorded);
  return (
    <div className="expense-workspace">
      <header className="expense-page-heading">
        <div className="expense-heading-title">
          <div className="expense-page-icon">
            <Receipt size={22} aria-hidden="true" />
          </div>
          <div>
            <h1>Registrar Despesa</h1>
            <p>Preencha os dados e confirme o lançamento.</p>
          </div>
        </div>
        {valorNum > 0 && (
          <div className="expense-total">
            <span>Total da despesa</span>
            <strong>{formatCurrency(valorNum)}</strong>
          </div>
        )}
      </header>
      <FormFeedback feedback={feedback} onDismiss={dismiss} />
      {recorded && (
        <div className="expense-pending" role="alert">
          <strong>Lançamento registrado: {recorded.id}</strong>
          <p>
            A atualização do saldo precisa ser conferida em Clientes. O
            formulário está bloqueado para evitar registrar a mesma despesa duas
            vezes.
          </p>
        </div>
      )}
      <div className="expense-layout">
        <form
          onSubmit={handleSubmit}
          noValidate
          aria-label="Registrar despesa"
          aria-busy={saving}
          className="expense-entry"
        >
          <div className="expense-card expense-entry-card">
            <div className="expense-section-heading">
              <h2>Dados da despesa</h2>
              <p>Favorecido, valor e categoria são obrigatórios.</p>
            </div>
            <fieldset disabled={locked}>
              <div className="expense-fields">
                <div className="expense-field">
                  <label htmlFor="expense-nome">
                    <User size={15} aria-hidden="true" />
                    Favorecido / Descrição <span aria-hidden="true">*</span>
                  </label>
                  <input
                    ref={nameRef}
                    id="expense-nome"
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setField("nome", e.target.value)}
                    placeholder="Ex.: Conta de energia"
                    required
                    aria-invalid={Boolean(fieldErrors.nome)}
                    aria-describedby={
                      fieldErrors.nome ? "expense-nome-error" : undefined
                    }
                  />
                  {fieldErrors.nome && (
                    <p className="expense-field-error" id="expense-nome-error">
                      {fieldErrors.nome}
                    </p>
                  )}
                </div>
                <div className="expense-field">
                  <label htmlFor="expense-valor">
                    <Banknote size={15} aria-hidden="true" />
                    Valor (R$) <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="expense-valor"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={formData.valor}
                    onChange={(e) => setField("valor", e.target.value)}
                    placeholder="0,00"
                    required
                    aria-invalid={Boolean(fieldErrors.valor)}
                    aria-describedby={
                      fieldErrors.valor ? "expense-valor-error" : undefined
                    }
                  />
                  {fieldErrors.valor && (
                    <p className="expense-field-error" id="expense-valor-error">
                      {fieldErrors.valor}
                    </p>
                  )}
                </div>
                <div className="expense-field">
                  <label htmlFor="expense-category">
                    <Tag size={15} aria-hidden="true" />
                    Categoria <span aria-hidden="true">*</span>
                  </label>
                  <select
                    id="expense-category"
                    value={formData.categoria}
                    onChange={(e) => setField("categoria", e.target.value)}
                  >
                    {CATEGORIAS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.icon} {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="expense-field">
                  <label htmlFor="expense-customer">
                    Cliente vinculado <small>(opcional)</small>
                  </label>
                  <ExpenseCustomerPicker
                    selected={selectedCustomer}
                    disabled={!isEmprestimo || locked}
                    onSelect={selectCustomer}
                    onClear={() => {
                      setSelectedCustomer(null);
                      setField("clienteId", "");
                    }}
                  />
                  <p className="expense-hint">
                    {isEmprestimo
                      ? "Selecione para atualizar o saldo do cliente."
                      : "Disponível na categoria Empréstimo (Cliente)."}
                  </p>
                  {!isEmprestimo && selectedCustomer && (
                    <p className="expense-hint">
                      Vínculo mantido: {selectedCustomer.nome}. O saldo não é
                      atualizado nesta categoria.
                    </p>
                  )}
                </div>
              </div>
              {isEmprestimo && (
                <div className="expense-loan-note">
                  <AlertCircle size={18} aria-hidden="true" />
                  <p>
                    {selectedCustomer
                      ? "Ao registrar, o valor será acrescentado ao saldo do cliente vinculado."
                      : "Sem cliente vinculado, a despesa será registrada sem atualizar um saldo de cliente."}
                  </p>
                </div>
              )}
              <div className="expense-divider" />
              <div className="expense-fields">
                <fieldset className="expense-payment">
                  <legend>Forma de pagamento</legend>
                  <div>
                    {PAGAMENTOS.map((p) => (
                      <label
                        key={p.value}
                        className={
                          formData.formaPagamento === p.value
                            ? "is-selected"
                            : ""
                        }
                      >
                        <input
                          type="radio"
                          name="expense-payment"
                          value={p.value}
                          checked={formData.formaPagamento === p.value}
                          onChange={() => setField("formaPagamento", p.value)}
                        />
                        <span aria-hidden="true">{p.icon}</span>
                        {p.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className="expense-field">
                  <label htmlFor="expense-data">
                    <Calendar size={15} aria-hidden="true" />
                    Data do registro <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="expense-data"
                    type="date"
                    required
                    value={
                      formData.data ? formatDateForInput(formData.data) : ""
                    }
                    onChange={(e) =>
                      setField(
                        "data",
                        parseDateInputPreservingTime(
                          e.target.value,
                          formData.data,
                        ),
                      )
                    }
                    aria-invalid={Boolean(fieldErrors.data)}
                    aria-describedby={
                      fieldErrors.data ? "expense-data-error" : undefined
                    }
                  />
                  {fieldErrors.data && (
                    <p className="expense-field-error" id="expense-data-error">
                      {fieldErrors.data}
                    </p>
                  )}
                </div>
              </div>
              <div className="expense-field expense-notes">
                <label htmlFor="expense-notes">
                  <FileText size={15} aria-hidden="true" />
                  Observações <small>(opcional)</small>
                </label>
                <textarea
                  id="expense-notes"
                  rows={3}
                  value={formData.observacoes}
                  onChange={(e) => setField("observacoes", e.target.value)}
                  placeholder="Detalhes adicionais sobre esta despesa…"
                />
              </div>
            </fieldset>
          </div>
          {saving && (
            <p className="expense-saving" role="status">
              {slowSave
                ? "A confirmação está demorando. Confira a conexão e aguarde antes de repetir o lançamento."
                : "Confirmando o registro…"}
            </p>
          )}
          <div className="expense-entry-actions">
            <button type="submit" className="expense-primary" disabled={locked}>
              {saving ? (
                <RotateCcw
                  size={17}
                  className="expense-spin"
                  aria-hidden="true"
                />
              ) : recorded ? (
                <CheckCircle2 size={17} aria-hidden="true" />
              ) : (
                <Save size={17} aria-hidden="true" />
              )}
              {saving
                ? "Registrando…"
                : recorded
                  ? "Lançamento já registrado"
                  : "Registrar Despesa"}
            </button>
            <button
              type="button"
              className="expense-secondary"
              onClick={requestReset}
              disabled={saving}
            >
              <RotateCcw size={16} aria-hidden="true" />
              {recorded ? "Nova despesa" : "Limpar"}
            </button>
          </div>
        </form>
        <aside className="expense-report" aria-label="Relatório de despesas">
          <form
            onSubmit={generateSmartReport}
            noValidate
            className="expense-card"
            aria-busy={isExporting}
          >
            <div className="expense-section-heading">
              <h2>
                <PieChart size={19} aria-hidden="true" />
                Relatório PDF
              </h2>
              <p>Selecione o período e a categoria.</p>
            </div>
            <FormFeedback
              feedback={reportFeedback.feedback}
              onDismiss={reportFeedback.dismiss}
            />
            <fieldset disabled={isExporting}>
              <div className="expense-field">
                <label htmlFor="expense-report-start">Data inicial</label>
                <input
                  id="expense-report-start"
                  type="date"
                  required
                  value={reportStartInput}
                  onChange={(e) => setReportStartInput(e.target.value)}
                />
              </div>
              <div className="expense-field">
                <label htmlFor="expense-report-end">Data final</label>
                <input
                  id="expense-report-end"
                  type="date"
                  required
                  value={reportEndInput}
                  onChange={(e) => setReportEndInput(e.target.value)}
                />
              </div>
              <div className="expense-field">
                <label htmlFor="expense-report-category">
                  Categoria do relatório
                </label>
                <select
                  id="expense-report-category"
                  value={reportCategory}
                  onChange={(e) => setReportCategory(e.target.value)}
                >
                  <option value="all">Todas as categorias</option>
                  {CATEGORIAS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.icon} {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </fieldset>
            <button
              type="submit"
              className="expense-primary"
              disabled={isExporting}
            >
              {isExporting ? (
                <RotateCcw
                  size={17}
                  className="expense-spin"
                  aria-hidden="true"
                />
              ) : (
                <DownloadCloud size={17} aria-hidden="true" />
              )}
              {isExporting ? "Gerando…" : "Gerar Relatório"}
            </button>
          </form>
          <div className="expense-report-help">
            <Receipt size={19} aria-hidden="true" />
            <p>
              O relatório usa as despesas registradas no período. Os filtros não
              alteram o lançamento em preenchimento.
            </p>
          </div>
        </aside>
      </div>
      <ExpenseResetDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        recorded={Boolean(recorded)}
        onConfirm={() => {
          resetForm();
          dismiss();
        }}
      />
    </div>
  );
};
export default ExpenseForm;
