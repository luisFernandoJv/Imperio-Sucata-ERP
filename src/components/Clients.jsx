"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  Search,
  Phone,
  MapPin,
  DollarSign,
  Plus,
  Edit3,
  Trash2,
  X,
  Eye,
  CreditCard,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Package,
  Banknote,
  FileText,
  ChevronDown,
  ChevronUp,
  Calendar,
  Receipt,
  Mail,
  Building,
  User,
} from "lucide-react";
import {
  addClient,
  getClients,
  updateClient,
  deleteClient,
  subscribeToClients,
  addLoan,
  getLoans,
  updateLoan,
  registrarPagamentoEmprestimo,
  subscribeToLoans,
  deleteLoan,
} from "../lib/firebaseService";

const Card = ({ children, className = "" }) => (
  <div
    className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}
  >
    {children}
  </div>
);

const Button = ({
  children,
  variant = "default",
  size = "default",
  className = "",
  disabled = false,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

  const variants = {
    default:
      "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-md",
    outline:
      "border-2 border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 focus:ring-gray-500",
    ghost: "text-gray-700 hover:bg-gray-100 focus:ring-gray-500",
    success:
      "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 shadow-md",
    danger:
      "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-md",
  };

  const sizes = {
    default: "h-10 px-4 py-2 text-sm",
    sm: "h-8 px-3 text-xs",
    lg: "h-12 px-6 text-base",
    icon: "h-10 w-10",
  };

  return (
    <button
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = ({ className = "", error = false, ...props }) => (
  <input
    className={`flex w-full rounded-lg border-2 ${error ? "border-red-500" : "border-gray-200"} bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus:outline-none ${error ? "focus:border-red-500 focus:ring-red-100" : "focus:border-blue-500 focus:ring-blue-100"} focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all ${className}`}
    {...props}
  />
);

const Textarea = ({ className = "", error = false, ...props }) => (
  <textarea
    className={`flex w-full rounded-lg border-2 ${error ? "border-red-500" : "border-gray-200"} bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus:outline-none ${error ? "focus:border-red-500 focus:ring-red-100" : "focus:border-blue-500 focus:ring-blue-100"} focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all min-h-[80px] ${className}`}
    {...props}
  />
);

const Badge = ({ children, variant = "default", className = "" }) => {
  const variants = {
    default: "bg-gray-100 text-gray-800 border-gray-200",
    success: "bg-emerald-100 text-emerald-800 border-emerald-200",
    warning: "bg-amber-100 text-amber-800 border-amber-200",
    danger: "bg-red-100 text-red-800 border-red-200",
    info: "bg-blue-100 text-blue-800 border-blue-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
};

const formatDate = (date) => {
  if (!date) return "-";
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString("pt-BR");
};

const formatPhone = (phone) => {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

// Toast aprimorado com melhor acessibilidade
const showToast = (title, description, type = "success") => {
  const toastEl = document.createElement("div");
  const bgColor =
    type === "error"
      ? "bg-red-100 border-red-500 text-red-800"
      : type === "warning"
        ? "bg-amber-100 border-amber-500 text-amber-800"
        : "bg-emerald-100 border-emerald-500 text-emerald-800";

  const icon = type === "error" ? "❌" : type === "warning" ? "⚠️" : "✅";

  toastEl.innerHTML = `
    <div role="alert" aria-live="polite" class="fixed top-4 right-4 z-[9999] p-4 rounded-lg border-l-4 ${bgColor} shadow-lg max-w-sm animate-in slide-in-from-right">
      <div class="flex items-start gap-3">
        <span class="text-xl">${icon}</span>
        <div class="flex-1">
          <div class="font-semibold">${title}</div>
          <div class="text-sm mt-1">${description}</div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(toastEl);
  setTimeout(() => toastEl.remove(), 4000);
};

// Modal de Cliente MELHORADO com validação e melhor UX
const ClientModal = ({ client, onClose, onSave, isLoading }) => {
  const [formData, setFormData] = useState({
    nome: client?.nome || "",
    telefone: client?.telefone || "",
    email: client?.email || "",
    cpfCnpj: client?.cpfCnpj || "",
    endereco: client?.endereco || "",
    observacoes: client?.observacoes || "",
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nome.trim()) {
      newErrors.nome = "Nome é obrigatório";
    }

    if (formData.telefone && formData.telefone.replace(/\D/g, "").length < 10) {
      newErrors.telefone = "Telefone inválido";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }

    if (formData.cpfCnpj) {
      const cleaned = formData.cpfCnpj.replace(/\D/g, "");
      if (cleaned.length !== 11 && cleaned.length !== 14) {
        newErrors.cpfCnpj = "CPF/CNPJ inválido";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast("Erro de Validação", "Corrija os campos destacados", "error");
      return;
    }
    onSave(formData);
  };

  const handlePhoneChange = (value) => {
    const cleaned = value.replace(/\D/g, "");
    setFormData((prev) => ({ ...prev, telefone: cleaned }));
  };

  const handleCpfCnpjChange = (value) => {
    const cleaned = value.replace(/\D/g, "");
    setFormData((prev) => ({ ...prev, cpfCnpj: cleaned }));
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 text-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2.5 rounded-xl">
                {client ? (
                  <Edit3 className="h-5 w-5" />
                ) : (
                  <UserPlus className="h-5 w-5" />
                )}
              </div>
              <h3 className="text-xl font-bold">
                {client ? "Editar Cliente" : "Novo Cliente"}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Nome - Campo obrigatório */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nome do Cliente <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                placeholder="Digite o nome completo"
                className="pl-10"
                error={!!errors.nome}
                autoFocus
              />
            </div>
            {errors.nome && (
              <p className="text-red-500 text-xs mt-1">{errors.nome}</p>
            )}
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Telefone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                value={formatPhone(formData.telefone)}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="(00) 00000-0000"
                className="pl-10"
                error={!!errors.telefone}
              />
            </div>
            {errors.telefone && (
              <p className="text-red-500 text-xs mt-1">{errors.telefone}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="email@exemplo.com"
                className="pl-10"
                error={!!errors.email}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* CPF/CNPJ */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              CPF/CNPJ
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                value={formData.cpfCnpj}
                onChange={(e) => handleCpfCnpjChange(e.target.value)}
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                className="pl-10"
                error={!!errors.cpfCnpj}
              />
            </div>
            {errors.cpfCnpj && (
              <p className="text-red-500 text-xs mt-1">{errors.cpfCnpj}</p>
            )}
          </div>

          {/* Endereço */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Endereço
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                value={formData.endereco}
                onChange={(e) =>
                  setFormData({ ...formData, endereco: e.target.value })
                }
                placeholder="Rua, número, bairro, cidade"
                className="pl-10"
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Observações
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Textarea
                value={formData.observacoes}
                onChange={(e) =>
                  setFormData({ ...formData, observacoes: e.target.value })
                }
                placeholder="Informações adicionais sobre o cliente..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {client ? "Atualizar" : "Cadastrar"}
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Componente principal de Clientes MELHORADO
export default function ClientsImproved() {
  const [clients, setClients] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all"); // all, active, inactive

  useEffect(() => {
    const unsubscribeClients = subscribeToClients((data) => {
      setClients(data);
      setLoading(false);
    });

    const unsubscribeLoans = subscribeToLoans((data) => {
      setLoans(data);
    });

    return () => {
      unsubscribeClients();
      unsubscribeLoans();
    };
  }, []);

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch =
        client.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.telefone?.includes(searchTerm) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.cpfCnpj?.includes(searchTerm);

      const matchesFilter =
        filterStatus === "all" ||
        (filterStatus === "active" && (client.saldo || 0) !== 0) ||
        (filterStatus === "inactive" && (client.saldo || 0) === 0);

      return matchesSearch && matchesFilter;
    });
  }, [clients, searchTerm, filterStatus]);

  const handleSaveClient = async (formData) => {
    setSaving(true);
    try {
      if (editingClient) {
        await updateClient(editingClient.id, formData);
        showToast(
          "Cliente Atualizado",
          `${formData.nome} foi atualizado com sucesso`,
          "success",
        );
      } else {
        await addClient(formData);
        showToast(
          "Cliente Cadastrado",
          `${formData.nome} foi cadastrado com sucesso`,
          "success",
        );
      }
      setShowModal(false);
      setEditingClient(null);
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      showToast(
        "Erro ao Salvar",
        "Não foi possível salvar o cliente. Tente novamente.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClient = async (clientId, clientName) => {
    if (!confirm(`Tem certeza que deseja excluir o cliente "${clientName}"?`)) {
      return;
    }

    try {
      await deleteClient(clientId);
      showToast(
        "Cliente Excluído",
        `${clientName} foi excluído com sucesso`,
        "success",
      );
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
      showToast(
        "Erro ao Excluir",
        "Não foi possível excluir o cliente. Tente novamente.",
        "error",
      );
    }
  };

  const getClientStats = (client) => {
    const clientLoans = loans.filter((loan) => loan.clienteId === client.id);
    const totalLoans = clientLoans.reduce(
      (sum, loan) => sum + (loan.valor || 0),
      0,
    );
    const totalPaid = clientLoans.reduce(
      (sum, loan) => sum + (loan.valorPago || 0),
      0,
    );
    const pending = totalLoans - totalPaid;

    return { totalLoans, totalPaid, pending, loansCount: clientLoans.length };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-600" />
            Gestão de Clientes
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie seus clientes e acompanhe transações
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingClient(null);
            setShowModal(true);
          }}
          size="lg"
        >
          <UserPlus className="h-5 w-5 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Clientes</p>
              <p className="text-2xl font-bold text-gray-900">
                {clients.length}
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Clientes Ativos</p>
              <p className="text-2xl font-bold text-emerald-600">
                {clients.filter((c) => (c.saldo || 0) !== 0).length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Saldo Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(
                  clients.reduce((sum, c) => sum + (c.saldo || 0), 0),
                )}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-amber-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Empréstimos</p>
              <p className="text-2xl font-bold text-gray-900">{loans.length}</p>
            </div>
            <CreditCard className="h-8 w-8 text-purple-600" />
          </div>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, telefone, email ou CPF/CNPJ..."
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterStatus === "all" ? "default" : "outline"}
              onClick={() => setFilterStatus("all")}
            >
              Todos
            </Button>
            <Button
              variant={filterStatus === "active" ? "default" : "outline"}
              onClick={() => setFilterStatus("active")}
            >
              Ativos
            </Button>
            <Button
              variant={filterStatus === "inactive" ? "default" : "outline"}
              onClick={() => setFilterStatus("inactive")}
            >
              Inativos
            </Button>
          </div>
        </div>
      </Card>

      {/* Clients List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredClients.map((client) => {
            const stats = getClientStats(client);
            return (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="p-5 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {client.nome}
                      </h3>
                      {client.cpfCnpj && (
                        <p className="text-sm text-gray-600">
                          {client.cpfCnpj.length === 11
                            ? `CPF: ${client.cpfCnpj.replace(
                                /(\d{3})(\d{3})(\d{3})(\d{2})/,
                                "$1.$2.$3-$4",
                              )}`
                            : `CNPJ: ${client.cpfCnpj.replace(
                                /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
                                "$1.$2.$3/$4-$5",
                              )}`}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={
                        (client.saldo || 0) > 0
                          ? "success"
                          : (client.saldo || 0) < 0
                            ? "danger"
                            : "default"
                      }
                    >
                      {formatCurrency(client.saldo || 0)}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    {client.telefone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{formatPhone(client.telefone)}</span>
                      </div>
                    )}
                    {client.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span>{client.email}</span>
                      </div>
                    )}
                    {client.endereco && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span className="line-clamp-1">{client.endereco}</span>
                      </div>
                    )}
                    {client.observacoes && (
                      <div className="flex items-start gap-2 text-sm text-gray-600">
                        <FileText className="h-4 w-4 mt-0.5" />
                        <span className="line-clamp-2">
                          {client.observacoes}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Client Stats */}
                  {stats.loansCount > 0 && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Empréstimos:</span>
                        <span className="font-semibold">
                          {stats.loansCount}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total:</span>
                        <span className="font-semibold">
                          {formatCurrency(stats.totalLoans)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Pago:</span>
                        <span className="font-semibold text-emerald-600">
                          {formatCurrency(stats.totalPaid)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Pendente:</span>
                        <span className="font-semibold text-red-600">
                          {formatCurrency(stats.pending)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setEditingClient(client);
                        setShowModal(true);
                      }}
                    >
                      <Edit3 className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteClient(client.id, client.nome)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredClients.length === 0 && (
        <Card className="p-12">
          <div className="text-center text-gray-500">
            <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-semibold">Nenhum cliente encontrado</p>
            <p className="text-sm mt-2">
              {searchTerm
                ? "Tente ajustar os filtros de busca"
                : "Comece cadastrando um novo cliente"}
            </p>
          </div>
        </Card>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <ClientModal
            client={editingClient}
            onClose={() => {
              setShowModal(false);
              setEditingClient(null);
            }}
            onSave={handleSaveClient}
            isLoading={saving}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
