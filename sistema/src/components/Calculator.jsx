import { useState, useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { CalculatorIcon, X, Delete, History, Copy, Check } from "lucide-react";

function Button({ children, variant = "default", className = "", ...props }) {
  return (
    <button
      type="button"
      className={`calculator-key calculator-key-${variant} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
export default function Calculator({ isOpen, onClose, onReturnFocus }) {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState(null);
  const [operation, setOperation] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [memory, setMemory] = useState(0);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
  const copyTimer = useRef(null);
  const resultRef = useRef(null);
  useEffect(() => () => clearTimeout(copyTimer.current), []);
  const invalid = !Number.isFinite(Number(display));
  const fail = () => {
    setDisplay("Erro");
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(true);
  };
  const inputNumber = (num) => {
    const next =
      waitingForOperand || invalid || display === "0"
        ? String(num)
        : display + num;
    if (!Number.isFinite(Number(next))) {
      fail();
      return;
    }
    setDisplay(next);
    setWaitingForOperand(false);
  };
  const inputDecimal = () => {
    if (waitingForOperand || invalid) {
      setDisplay("0.");
      setWaitingForOperand(false);
    } else if (!display.includes(".")) setDisplay(display + ".");
  };
  const backspace = () => {
    if (invalid) {
      clear();
      return;
    }
    if (waitingForOperand) return;
    const next = display.length > 1 ? display.slice(0, -1) : "0";
    setDisplay(next === "-" ? "0" : next);
  };
  const clear = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };
  const clearAll = () => {
    clear();
    setMemory(0);
    setHistory([]);
  };
  const calculate = (firstValue, secondValue, op) => {
    const f = parseFloat(firstValue);
    const s = parseFloat(secondValue);
    switch (op) {
      case "+":
        return f + s;
      case "-":
        return f - s;
      case "×":
        return f * s;
      case "÷":
        return s !== 0 ? f / s : "Erro";
      case "%":
        return (f * s) / 100;
      default:
        return s;
    }
  };
  const addToHistory = (calculation) =>
    setHistory((prev) => [calculation, ...prev.slice(0, 19)]);
  const performOperation = (nextOperation) => {
    if (invalid) return;
    const inputValue = parseFloat(display);
    if (previousValue === null) setPreviousValue(inputValue);
    else if (operation && !waitingForOperand) {
      const result = calculate(previousValue, inputValue, operation);
      if (result === "Erro" || !Number.isFinite(result)) {
        fail();
        return;
      }
      setDisplay(String(Number(result.toFixed(8))));
      setPreviousValue(result);
      addToHistory(`${previousValue} ${operation} ${inputValue} = ${result}`);
    }
    setWaitingForOperand(true);
    setOperation(nextOperation);
  };
  const handleEquals = () => {
    if (previousValue === null || !operation || waitingForOperand || invalid)
      return;
    const inputValue = parseFloat(display);
    const result = calculate(previousValue, inputValue, operation);
    if (result === "Erro" || !Number.isFinite(result)) {
      fail();
      return;
    }
    const formattedResult = String(Number(result.toFixed(8)));
    setDisplay(formattedResult);
    addToHistory(
      `${previousValue} ${operation} ${inputValue} = ${formattedResult}`,
    );
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(true);
  };
  const copyToClipboard = async () => {
    clearTimeout(copyTimer.current);
    try {
      await navigator.clipboard.writeText(display);
      setCopied(true);
      setCopyMessage("Resultado copiado.");
      copyTimer.current = setTimeout(() => {
        setCopied(false);
        setCopyMessage("");
      }, 2000);
    } catch {
      setCopied(false);
      setCopyMessage(
        "Não foi possível copiar. Selecione o resultado e copie manualmente.",
      );
    }
  };
  const onKeyDown = (event) => {
    if (
      event.defaultPrevented ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      event.isComposing
    )
      return;
    const key = event.key;
    let action;
    if (/^[0-9]$/.test(key)) action = () => inputNumber(Number(key));
    else if (key === "." || key === ",") action = inputDecimal;
    else if (["+", "-", "%"].includes(key))
      action = () => performOperation(key);
    else if (key === "*") action = () => performOperation("×");
    else if (key === "/") action = () => performOperation("÷");
    else if (
      key === "=" ||
      (key === "Enter" &&
        !(event.target instanceof Element && event.target.closest("button")))
    )
      action = handleEquals;
    else if (key === "Backspace") action = backspace;
    else if (key.toLowerCase() === "c") action = clear;
    if (action) {
      event.preventDefault();
      action();
    }
  };
  const formatDisplay = (value) => {
    if (!Number.isFinite(Number(value))) return "Erro";
    return value.length > 12 ? parseFloat(value).toExponential(6) : value;
  };
  const currency = invalid
    ? ""
    : new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(Number(display) || 0);
  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="utility-overlay" />
        <Dialog.Content
          className="utility-dialog calculator-dialog"
          data-utility="calculator"
          onKeyDown={onKeyDown}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            clearTimeout(copyTimer.current);
            setCopied(false);
            setCopyMessage("");
            resultRef.current?.focus();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            onReturnFocus?.();
          }}
        >
          <div className="utility-heading calculator-heading">
            <div className="calculator-title">
              <CalculatorIcon size={21} aria-hidden="true" />
              <Dialog.Title>Calculadora</Dialog.Title>
            </div>
            <div className="calculator-heading-actions">
              <button
                type="button"
                className="utility-icon-button"
                aria-label="Mostrar histórico de cálculos"
                aria-expanded={showHistory}
                aria-controls="calculator-history"
                onClick={() => setShowHistory((v) => !v)}
              >
                <History size={20} />
              </button>
              <Dialog.Close
                className="utility-icon-button"
                aria-label="Fechar calculadora"
              >
                <X size={20} />
              </Dialog.Close>
            </div>
          </div>
          <Dialog.Description className="utility-shortcut-help">
            Use o teclado ou os botões. Vírgula e ponto inserem decimais; C
            limpa o cálculo e Escape fecha.
          </Dialog.Description>
          <div className="calculator-display">
            <p className="calculator-operation">
              {memory !== 0 && (
                <span aria-label="Memória armazenada">M · </span>
              )}
              {previousValue !== null && operation
                ? `${previousValue} ${operation}`
                : ""}
            </p>
            <div className="calculator-result-row">
              <output
                ref={resultRef}
                tabIndex={0}
                aria-label="Resultado"
                aria-live="polite"
                title={display}
                className="calculator-output"
              >
                {formatDisplay(display)}
              </output>
              <button
                type="button"
                className="utility-icon-button calculator-copy"
                disabled={invalid}
                onClick={copyToClipboard}
                aria-label="Copiar resultado"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
            <p className="calculator-currency">{currency}</p>
          </div>
          {copyMessage && (
            <p role="status" className="utility-shortcut-help">
              {copyMessage}
            </p>
          )}
          {invalid && (
            <p role="alert" className="calculator-error">
              Não foi possível concluir o cálculo. Digite um número para começar
              novamente.
            </p>
          )}
          {showHistory && (
            <section
              className="calculator-history"
              id="calculator-history"
              aria-label="Histórico de cálculos"
              tabIndex={0}
            >
              <div>
                <h3>Histórico recente</h3>
                <button type="button" onClick={() => setHistory([])}>
                  Limpar histórico
                </button>
              </div>
              {history.length ? (
                <ol>
                  {history.map((calc, index) => (
                    <li key={index}>{calc}</li>
                  ))}
                </ol>
              ) : (
                <p>Nenhum cálculo ainda.</p>
              )}
            </section>
          )}
          <div className="calculator-keypad">
            <Button
              variant="clear"
              onClick={clearAll}
              aria-label="Limpar tudo (AC)"
              title="Limpar cálculo, memória e histórico"
            >
              AC
            </Button>
            <Button onClick={backspace} aria-label="Apagar último dígito">
              <Delete size={20} />
            </Button>
            <Button
              variant="operator"
              onClick={() => performOperation("%")}
              aria-label="Porcentagem"
              aria-pressed={operation === "%"}
            >
              %
            </Button>
            <Button
              variant="operator"
              onClick={() => performOperation("÷")}
              aria-label="Dividir"
              aria-pressed={operation === "÷"}
            >
              ÷
            </Button>
            {[
              [7, 8, 9, "×"],
              [4, 5, 6, "-"],
              [1, 2, 3, "+"],
            ].map((row) =>
              row.map((key) =>
                typeof key === "number" ? (
                  <Button key={key} onClick={() => inputNumber(key)}>
                    {key}
                  </Button>
                ) : (
                  <Button
                    key={key}
                    variant="operator"
                    onClick={() => performOperation(key)}
                    aria-label={
                      { "×": "Multiplicar", "-": "Subtrair", "+": "Somar" }[key]
                    }
                    aria-pressed={operation === key}
                  >
                    {key}
                  </Button>
                ),
              ),
            )}
            <Button
              disabled={invalid}
              aria-label="Inverter sinal"
              onClick={() => setDisplay(String(-parseFloat(display)))}
            >
              ±
            </Button>
            <Button onClick={() => inputNumber(0)}>0</Button>
            <Button onClick={inputDecimal} aria-label="Separador decimal">
              .
            </Button>
            <Button variant="equals" onClick={handleEquals} aria-label="Igual">
              =
            </Button>
          </div>
          <div className="calculator-memory">
            <button
              type="button"
              aria-label="Limpar memória (MC)"
              onClick={() => setMemory(0)}
            >
              MC
            </button>
            <button
              type="button"
              aria-label="Recuperar memória (MR)"
              onClick={() => {
                setDisplay(String(memory));
                setWaitingForOperand(true);
              }}
            >
              MR
            </button>
            <button
              type="button"
              aria-label="Armazenar na memória (MS)"
              disabled={invalid}
              onClick={() => setMemory(parseFloat(display))}
            >
              MS
            </button>
            <button
              type="button"
              aria-label="Somar à memória (M+)"
              disabled={invalid || !Number.isFinite(memory + Number(display))}
              onClick={() => setMemory(memory + parseFloat(display))}
            >
              M+
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
