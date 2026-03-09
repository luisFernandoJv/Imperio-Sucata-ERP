"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalculatorIcon,
  X,
  Delete,
  History,
  Copy,
  Check,
  RotateCcw,
} from "lucide-react";

const Button = ({ children, onClick, className = "", variant = "default" }) => {
  const baseClasses =
    "h-12 rounded-lg font-medium transition-all duration-200 flex items-center justify-center text-lg shadow-sm hover:shadow-md active:scale-95";
  const variants = {
    default:
      "bg-gray-100 hover:bg-gray-200 text-gray-800 active:bg-gray-300 border border-gray-200",
    operator:
      "bg-blue-500 hover:bg-blue-600 text-white active:bg-blue-700 shadow-blue-200",
    equals:
      "bg-green-500 hover:bg-green-600 text-white active:bg-green-700 shadow-green-200",
    clear:
      "bg-red-500 hover:bg-red-600 text-white active:bg-red-700 shadow-red-200",
    memory:
      "bg-purple-500 hover:bg-purple-600 text-white active:bg-purple-700 shadow-purple-200",
    function:
      "bg-gray-200 hover:bg-gray-300 text-gray-700 active:bg-gray-400 border border-gray-300",
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
};

const Calculator = ({ isOpen, onClose }) => {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState(null);
  const [operation, setOperation] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [memory, setMemory] = useState(0);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sincronizar com teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (/[0-9]/.test(e.key)) inputNumber(parseInt(e.key));
      else if (e.key === ".") inputDecimal();
      else if (e.key === "+") performOperation("+");
      else if (e.key === "-") performOperation("-");
      else if (e.key === "*") performOperation("×");
      else if (e.key === "/") performOperation("÷");
      else if (e.key === "Enter" || e.key === "=") handleEquals();
      else if (e.key === "Escape") onClose();
      else if (e.key === "Backspace") backspace();
      else if (e.key === "c" || e.key === "C") clear();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, display, previousValue, operation, waitingForOperand]);

  const inputNumber = (num) => {
    if (waitingForOperand) {
      setDisplay(String(num));
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? String(num) : display + num);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
    } else if (display.indexOf(".") === -1) {
      setDisplay(display + ".");
    }
  };

  const backspace = () => {
    if (waitingForOperand) return;
    setDisplay(display.length > 1 ? display.slice(0, -1) : "0");
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

  const performOperation = (nextOperation) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation && !waitingForOperand) {
      const result = calculate(previousValue, inputValue, operation);
      if (result === "Erro") {
        setDisplay("Erro");
        setPreviousValue(null);
        setOperation(null);
      } else {
        setDisplay(String(Number(result.toFixed(8))));
        setPreviousValue(result);
        addToHistory(`${previousValue} ${operation} ${inputValue} = ${result}`);
      }
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const handleEquals = () => {
    if (previousValue === null || !operation || waitingForOperand) return;

    const inputValue = parseFloat(display);
    const result = calculate(previousValue, inputValue, operation);

    if (result === "Erro") {
      setDisplay("Erro");
    } else {
      const formattedResult = String(Number(result.toFixed(8)));
      setDisplay(formattedResult);
      addToHistory(
        `${previousValue} ${operation} ${inputValue} = ${formattedResult}`,
      );
    }

    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(true);
  };

  const addToHistory = (calculation) => {
    setHistory((prev) => [calculation, ...prev.slice(0, 19)]);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(display);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Erro ao copiar:", err);
    }
  };

  const formatDisplay = (value) => {
    if (value === "Erro") return "Erro";
    if (value.length > 12) {
      return parseFloat(value).toExponential(6);
    }
    return value;
  };

  const formatCurrency = (value) => {
    if (value === "Erro") return "";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(parseFloat(value) || 0);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100"
      >
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-200">
              <CalculatorIcon className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">Calculadora</h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`p-2 rounded-full transition-colors ${showHistory ? "bg-blue-100 text-blue-600" : "hover:bg-gray-200 text-gray-500"}`}
              title="Histórico"
            >
              <History className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-100 hover:text-red-600 rounded-full transition-colors text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Display Area */}
          <div className="bg-slate-900 rounded-2xl p-6 mb-6 shadow-inner relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-50"></div>
            <div className="text-right min-h-[100px] flex flex-col justify-end">
              <div className="text-blue-400/70 text-sm font-mono h-6 mb-1 overflow-hidden whitespace-nowrap">
                {memory !== 0 && (
                  <span className="mr-2 bg-blue-500/20 px-1.5 rounded text-[10px] text-blue-300">
                    M
                  </span>
                )}
                {previousValue !== null && operation
                  ? `${previousValue} ${operation}`
                  : ""}
              </div>
              <div className="flex items-center justify-end gap-3">
                <div className="text-white text-4xl font-mono font-bold tracking-tighter truncate">
                  {formatDisplay(display)}
                </div>
                <button
                  onClick={copyToClipboard}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Copiar"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4 text-slate-400" />
                  )}
                </button>
              </div>
              <div className="text-slate-500 text-xs mt-2 font-medium">
                {formatCurrency(display)}
              </div>
            </div>
          </div>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100 max-h-40 overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Histórico Recente
                  </h4>
                  <button
                    onClick={() => setHistory([])}
                    className="text-[10px] text-red-500 hover:underline"
                  >
                    Limpar
                  </button>
                </div>
                {history.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-2">
                    Nenhum cálculo ainda
                  </p>
                ) : (
                  <div className="space-y-2">
                    {history.map((calc, index) => (
                      <div
                        key={index}
                        className="text-xs text-gray-600 font-mono bg-white p-2 rounded border border-gray-100 shadow-sm"
                      >
                        {calc}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Keypad */}
          <div className="grid grid-cols-4 gap-3">
            {/* Row 1 */}
            <Button
              variant="clear"
              onClick={clearAll}
              className="text-sm font-bold"
            >
              AC
            </Button>
            <Button variant="function" onClick={backspace}>
              <Delete className="h-5 w-5" />
            </Button>
            <Button variant="function" onClick={() => performOperation("%")}>
              %
            </Button>
            <Button variant="operator" onClick={() => performOperation("÷")}>
              ÷
            </Button>

            {/* Row 2 */}
            <Button onClick={() => inputNumber(7)}>7</Button>
            <Button onClick={() => inputNumber(8)}>8</Button>
            <Button onClick={() => inputNumber(9)}>9</Button>
            <Button variant="operator" onClick={() => performOperation("×")}>
              ×
            </Button>

            {/* Row 3 */}
            <Button onClick={() => inputNumber(4)}>4</Button>
            <Button onClick={() => inputNumber(5)}>5</Button>
            <Button onClick={() => inputNumber(6)}>6</Button>
            <Button variant="operator" onClick={() => performOperation("-")}>
              -
            </Button>

            {/* Row 4 */}
            <Button onClick={() => inputNumber(1)}>1</Button>
            <Button onClick={() => inputNumber(2)}>2</Button>
            <Button onClick={() => inputNumber(3)}>3</Button>
            <Button variant="operator" onClick={() => performOperation("+")}>
              +
            </Button>

            {/* Row 5 */}
            <Button onClick={() => setDisplay(String(-parseFloat(display)))}>
              ±
            </Button>
            <Button onClick={() => inputNumber(0)}>0</Button>
            <Button onClick={inputDecimal}>.</Button>
            <Button variant="equals" onClick={handleEquals}>
              =
            </Button>
          </div>

          {/* Memory Actions */}
          <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => setMemory(0)}
              className="text-[10px] font-bold text-gray-400 hover:text-purple-600 transition-colors"
            >
              MC
            </button>
            <button
              onClick={() => {
                setDisplay(String(memory));
                setWaitingForOperand(true);
              }}
              className="text-[10px] font-bold text-gray-400 hover:text-purple-600 transition-colors"
            >
              MR
            </button>
            <button
              onClick={() => setMemory(parseFloat(display))}
              className="text-[10px] font-bold text-gray-400 hover:text-purple-600 transition-colors"
            >
              MS
            </button>
            <button
              onClick={() => setMemory(memory + parseFloat(display))}
              className="text-[10px] font-bold text-gray-400 hover:text-purple-600 transition-colors"
            >
              M+
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Calculator;
