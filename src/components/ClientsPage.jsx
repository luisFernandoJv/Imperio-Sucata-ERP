"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Users,
  Plus,
  Search,
  Phone,
  User as UserIcon,
  CreditCard,
  Edit,
  Trash2,
  History,
  Info,
  DollarSign,
  TrendingUp,
  UserCheck,
  Filter,
  ArrowUpDown,
  FileDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import {
  subscribeToCustomers,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerTransactions,
} from "../lib/firebaseService";
import CustomerDetailsPage from "./CustomerDetailsPage";
import * as reportGenerators from "../utils/reportGenerators";

const ClientsPage = () => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedCustomerForDetails, setSelectedCustomerForDetails] =
    useState(null);
  const [sortBy, setSortBy] = useState("nome"); // nome, saldo, data

  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    cpf: "",
    observacoes: "",
  });

  useEffect(() => {
    const unsubscribe = subscribeToCustomers((data) => {
      setCustomers(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0);
  };

  const filteredCustomers = useMemo(() => {
    return customers
      .filter(
        (customer) =>
          customer.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.cpf?.includes(searchTerm) ||
          customer.telefone?.includes(searchTerm),
      )
      .sort((a, b) => {
        if (sortBy === "nome") return a.nome.localeCompare(b.nome);
        if (sortBy === "saldo") return (b.saldo || 0) - (a.saldo || 0);
        if (sortBy === "data")
          return new Date(b.createdAt) - new Date(a.createdAt);
        return 0;
      });
  }, [customers, searchTerm, sortBy]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, formData);
      } else {
        await addCustomer({ ...formData, saldo: 0 });
      }
      setShowModal(false);
      setEditingCustomer(null);
      setFormData({ nome: "", telefone: "", cpf: "", observacoes: "" });
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
    }
  };

  const handleEdit = (customer, e) => {
    e.stopPropagation();
    setEditingCustomer(customer);
    setFormData({
      nome: customer.nome || "",
      telefone: customer.telefone || "",
      cpf: customer.cpf || "",
      observacoes: customer.observacoes || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm("Tem certeza que deseja excluir este cliente?")) {
      try {
        await deleteCustomer(id);
      } catch (error) {
        console.error("Erro ao excluir cliente:", error);
      }
    }
  };

  const handleExportQuickPDF = async (customer, e) => {
    e.stopPropagation();
    try {
      const transactions = await getCustomerTransactions(
        customer.id,
        customer.nome,
      );
      reportGenerators.generateCustomerStatementPDF(customer, transactions);
    } catch (error) {
      console.error("Erro ao exportar PDF rápido:", error);
    }
  };

  if (selectedCustomerForDetails) {
    return (
      <CustomerDetailsPage
        customer={selectedCustomerForDetails}
        onBack={() => setSelectedCustomerForDetails(null)}
      />
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
      {/* Header com Estatísticas Rápidas */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-200">
              <Users className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Gestão de Clientes & Fornecedores
            </h1>
          </div>
          <p className="text-slate-500 font-medium">
            Gerenciamento inteligente de fornecedores e parceiros
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <UserCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase">
                Total Ativos
              </p>
              <p className="text-sm font-bold text-slate-900">
                {customers.length}
              </p>
            </div>
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <DollarSign className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase">
                Em Aberto
              </p>
              <p className="text-sm font-bold text-slate-900">
                {formatCurrency(
                  customers.reduce((acc, c) => acc + (c.saldo || 0), 0),
                )}
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              setEditingCustomer(null);
              setFormData({ nome: "", telefone: "", cpf: "", observacoes: "" });
              setShowModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-12 px-6 shadow-lg shadow-blue-200 font-bold gap-2"
          >
            <Plus className="h-5 w-5" /> Novo Cadastro
          </Button>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Pesquisar por nome, CPF ou contato..."
            className="pl-12 h-14 rounded-2xl border-slate-200 bg-white shadow-sm focus:ring-blue-500 text-base font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            onClick={() => setSortBy(sortBy === "nome" ? "saldo" : "nome")}
            className="h-14 px-6 rounded-2xl border-slate-200 bg-white font-bold text-slate-600 gap-2 flex-1 md:flex-none"
          >
            <ArrowUpDown className="h-4 w-4" />
            {sortBy === "nome"
              ? "Ordem: A-Z"
              : sortBy === "saldo"
                ? "Ordem: Saldo"
                : "Ordem: Recentes"}
          </Button>
          <Button
            variant="outline"
            onClick={() => setSortBy("data")}
            className={`h-14 px-6 rounded-2xl border-slate-200 bg-white font-bold text-slate-600 gap-2 flex-1 md:flex-none ${sortBy === "data" ? "border-blue-500 text-blue-600" : ""}`}
          >
            Recentes
          </Button>
        </div>
      </div>

      {/* Lista de Clientes - Grid Moderno */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold animate-pulse">
            Sincronizando base de dados...
          </p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200 rounded-[2rem] bg-slate-50/50">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="bg-white p-6 rounded-full shadow-sm mb-4">
              <Users className="h-12 w-12 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Nenhum cliente encontrado
            </h3>
            <p className="text-slate-500">
              Tente ajustar sua busca ou adicione um novo cadastro.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredCustomers.map((customer) => (
              <motion.div
                key={customer.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ y: -5 }}
                className="group cursor-pointer"
                onClick={() => setSelectedCustomerForDetails(customer)}
              >
                <Card className="h-full rounded-[2rem] border-slate-200 overflow-hidden hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-300 relative">
                  {customer.saldo > 0 && (
                    <div className="absolute top-4 right-4 z-10">
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200 font-black px-3 py-1 rounded-full text-[10px]">
                        DÉBITO ATIVO
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-0">
                    <div className="p-6 space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-blue-200">
                          {customer.nome?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-black text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                            {customer.nome}
                          </h3>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
                            {customer.cpf || "CPF NÃO INFORMADO"}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                            Contato
                          </p>
                          <div className="flex items-center gap-2 text-slate-700 font-bold text-xs">
                            <Phone className="h-3 w-3 text-blue-500" />
                            {customer.telefone || "N/A"}
                          </div>
                        </div>
                        <div
                          className={`p-3 rounded-2xl border ${customer.saldo > 0 ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100"}`}
                        >
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                            Saldo Atual
                          </p>
                          <div
                            className={`flex items-center gap-2 font-black text-xs ${customer.saldo > 0 ? "text-red-600" : "text-emerald-600"}`}
                          >
                            <DollarSign className="h-3 w-3" />
                            {formatCurrency(customer.saldo)}
                          </div>
                        </div>
                      </div>

                      {customer.observacoes && (
                        <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                          <div className="flex items-start gap-2">
                            <Info className="h-3 w-3 text-blue-400 mt-0.5" />
                            <p className="text-[11px] text-slate-500 italic line-clamp-2 leading-relaxed">
                              {customer.observacoes}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                          onClick={(e) => handleEdit(customer, e)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50"
                          onClick={(e) => handleDelete(customer.id, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                          onClick={(e) => handleExportQuickPDF(customer, e)}
                          title="Exportar Extrato PDF"
                        >
                          <FileDown className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        className="text-blue-600 font-black text-xs uppercase tracking-tighter hover:bg-blue-100/50 rounded-xl gap-2"
                        onClick={() => setSelectedCustomerForDetails(customer)}
                      >
                        <History className="h-4 w-4" /> Histórico
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop com Blur Suave */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />

            {/* Card do Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
            >
              {/* Cabeçalho */}
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-start bg-white">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                    {editingCustomer ? "Editar Cliente" : "Novo Cliente"}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Preencha as informações abaixo para prosseguir.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors -mr-2"
                  onClick={() => setShowModal(false)}
                >
                  <Plus className="h-5 w-5 rotate-45" />
                </Button>
              </div>

              {/* Formulário Scrollável */}
              <div className="overflow-y-auto p-6">
                <form
                  id="customerForm"
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >
                  {/* Campo Nome */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide ml-1">
                      Nome Completo
                    </label>
                    <div className="relative group">
                      <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        required
                        placeholder="Ex: João da Silva"
                        className="pl-10 h-11 rounded-lg border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-800 placeholder:text-slate-400"
                        value={formData.nome}
                        onChange={(e) =>
                          setFormData({ ...formData, nome: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  {/* Grid Telefone e CPF */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide ml-1">
                        Telefone
                      </label>
                      <div className="relative group">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <Input
                          placeholder="(00) 00000-0000"
                          className="pl-10 h-11 rounded-lg border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-800 placeholder:text-slate-400"
                          value={formData.telefone}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              telefone: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide ml-1">
                        CPF
                      </label>
                      <div className="relative group">
                        <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <Input
                          placeholder="000.000.000-00"
                          className="pl-10 h-11 rounded-lg border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-800 placeholder:text-slate-400"
                          value={formData.cpf}
                          onChange={(e) =>
                            setFormData({ ...formData, cpf: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Observações */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide ml-1">
                      Observações
                    </label>
                    <textarea
                      placeholder="Insira notas importantes sobre este cliente..."
                      className="w-full min-h-[100px] p-3.5 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm font-medium text-slate-700 resize-none transition-all placeholder:text-slate-400"
                      value={formData.observacoes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          observacoes: e.target.value,
                        })
                      }
                    />
                  </div>
                </form>
              </div>

              {/* Rodapé com Ações */}
              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-11 rounded-lg border-slate-200 font-semibold text-slate-600 hover:bg-white hover:text-slate-800 transition-all"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  form="customerForm" // Conecta o botão ao form
                  className="flex-1 h-11 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-200 transition-all"
                >
                  {editingCustomer ? "Salvar Alterações" : "Cadastrar"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClientsPage;
