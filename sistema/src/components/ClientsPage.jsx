"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Users,
  Plus,
  Search,
  Phone,
  Edit,
  Trash2,
  History,
  Info,
  DollarSign,
  UserCheck,
  FileDown,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import {
  subscribeToCustomers,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerTransactions,
} from "../lib/firebaseService";
import CustomerDetailsPage from "./CustomerDetailsPage";
import * as reportGenerators from "../utils/reportGenerators";

import {
  CustomerFormDialog,
  CustomerDeleteDialog,
} from "./customers/CustomerDialogs";
import { FormFeedback } from "./ui/form-feedback";
import { useFormFeedback } from "../hooks/useFormFeedback";
import "../styles/customer-workspace.css";
const MotionDiv = motion.div;
const emptyForm = () => ({ nome: "", telefone: "", cpf: "", observacoes: "" });

const ClientsPage = () => {
  const reduceMotion = useReducedMotion();
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedCustomerForDetails, setSelectedCustomerForDetails] =
    useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [exportingId, setExportingId] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [slowLoad, setSlowLoad] = useState(false);
  const [loadVersion, setLoadVersion] = useState(0);
  const savingRef = useRef(false);
  const deletingRef = useRef(false);
  const exportingRef = useRef(false);
  const openerRef = useRef(null);
  const detailsOriginRef = useRef(null);
  const { toast, feedback, dismiss } = useFormFeedback();
  const [sortBy, setSortBy] = useState("nome"); // nome, saldo, data

  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    cpf: "",
    observacoes: "",
  });

  useEffect(() => {
    let cancelled = false;
    let received = false;
    setLoading(true);
    setLoadError(false);
    setSlowLoad(false);
    const timer = setTimeout(() => {
      if (!cancelled && !received) setSlowLoad(true);
    }, 12000);
    let unsubscribe;
    try {
      unsubscribe = subscribeToCustomers(
        (data) => {
          if (cancelled) return;
          received = true;
          clearTimeout(timer);
          setCustomers(data);
          setLoading(false);
          setLoadError(false);
          setSlowLoad(false);
        },
        () => {
          if (!cancelled) {
            clearTimeout(timer);
            setLoadError(true);
            setLoading(false);
            setSlowLoad(false);
          }
        },
      );
    } catch {
      setLoadError(true);
      setLoading(false);
      clearTimeout(timer);
    }
    return () => {
      cancelled = true;
      clearTimeout(timer);
      unsubscribe?.();
    };
  }, [loadVersion]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0);
  };

  const filteredCustomers = useMemo(() => {
    return customers
      .filter((customer) => {
        const normalize = (value) =>
          String(value || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();
        const digits = (value) => String(value || "").replace(/\D/g, "");
        const queryDigits = digits(searchTerm);
        return (
          normalize(customer.nome).includes(normalize(searchTerm)) ||
          (queryDigits.length > 0 &&
            (digits(customer.cpf).includes(queryDigits) ||
              digits(customer.telefone).includes(queryDigits)))
        );
      })
      .sort((a, b) => {
        if (sortBy === "nome")
          return String(a.nome || "").localeCompare(String(b.nome || ""));
        if (sortBy === "saldo") return (b.saldo || 0) - (a.saldo || 0);
        if (sortBy === "data")
          return new Date(b.createdAt) - new Date(a.createdAt);
        return 0;
      });
  }, [customers, searchTerm, sortBy]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (savingRef.current) return;
    if (!formData.nome.trim()) {
      setFormError("Informe o nome do cliente.");
      document.getElementById("customer-name")?.focus();
      return;
    }
    savingRef.current = true;
    setSaving(true);
    setFormError("");
    try {
      if (editingCustomer) await updateCustomer(editingCustomer.id, formData);
      else await addCustomer({ ...formData, saldo: 0 });
      setShowModal(false);
      setEditingCustomer(null);
      setFormData(emptyForm());
      toast({
        title: editingCustomer ? "Cadastro atualizado" : "Cadastro criado",
        description: "As informações foram salvas.",
      });
    } catch {
      setFormError(
        "Não foi possível confirmar o cadastro. Os campos foram mantidos. Confira a lista antes de repetir o envio.",
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const openNew = () => {
    openerRef.current = document.activeElement;
    setEditingCustomer(null);
    setFormData(emptyForm());
    setFormError("");
    setShowModal(true);
  };
  const handleEdit = (customer, e) => {
    e.stopPropagation();
    openerRef.current = document.activeElement;
    setEditingCustomer(customer);
    setFormData({
      nome: customer.nome || "",
      telefone: customer.telefone || "",
      cpf: customer.cpf || "",
      observacoes: customer.observacoes || "",
    });
    setFormError("");
    setShowModal(true);
  };
  const handleDelete = (customer, e) => {
    e.stopPropagation();
    openerRef.current = document.activeElement;
    setDeleteError("");
    setDeleteTarget(customer);
  };
  const confirmDelete = async () => {
    if (!deleteTarget || deletingRef.current) return;
    deletingRef.current = true;
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteCustomer(deleteTarget.id);
      setDeleteTarget(null);
      toast({
        title: "Cadastro excluído",
        description: "A exclusão foi concluída.",
      });
    } catch {
      setDeleteError(
        "Não foi possível confirmar a exclusão. Confira a lista antes de tentar novamente.",
      );
    } finally {
      deletingRef.current = false;
      setDeleting(false);
    }
  };
  const handleExportQuickPDF = async (customer, e) => {
    e.stopPropagation();
    if (exportingRef.current) return;
    exportingRef.current = true;
    setExportingId(customer.id);
    try {
      const transactions = await getCustomerTransactions(
        customer.id,
        customer.nome,
      );
      reportGenerators.generateCustomerStatementPDF(customer, transactions);
      toast({
        title: "Extrato gerado",
        description: "O PDF foi enviado para download.",
      });
    } catch {
      toast({
        title: "Não foi possível gerar o extrato",
        description: "Confira a conexão e tente novamente.",
        variant: "destructive",
      });
    } finally {
      exportingRef.current = false;
      setExportingId(null);
    }
  };
  const openDetails = (customer) => {
    detailsOriginRef.current = {
      id: document.activeElement?.id || `customer-history-${customer.id}`,
      y: window.scrollY,
    };
    setSelectedCustomerForDetails(customer);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const backToCustomers = () => {
    setSelectedCustomerForDetails(null);
    requestAnimationFrame(() => {
      const origin = detailsOriginRef.current;
      window.scrollTo({ top: origin?.y || 0, behavior: "instant" });
      (
        document.getElementById(origin?.id) ||
        document.getElementById("customer-search")
      )?.focus({ preventScroll: true });
    });
  };

  if (selectedCustomerForDetails) {
    return (
      <CustomerDetailsPage
        customer={selectedCustomerForDetails}
        onBack={backToCustomers}
      />
    );
  }

  return (
    <div className="customer-workspace space-y-6">
      <FormFeedback feedback={feedback} onDismiss={dismiss} />
      {loadError && (
        <div role="alert" className="customer-load-alert">
          Não foi possível atualizar os cadastros. Os dados já recebidos foram
          mantidos.{" "}
          <button type="button" onClick={() => setLoadVersion((v) => v + 1)}>
            Tentar novamente
          </button>
        </div>
      )}
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
                Cadastros
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
                Saldo acumulado
              </p>
              <p className="text-sm font-bold text-slate-900">
                {formatCurrency(
                  customers.reduce((acc, c) => acc + (c.saldo || 0), 0),
                )}
              </p>
            </div>
          </div>
          <Button
            onClick={openNew}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-12 px-6 shadow-lg shadow-blue-200 font-bold gap-2"
          >
            <Plus className="h-5 w-5" /> Novo Cadastro
          </Button>
        </div>
      </div>

      <section
        aria-label="Consultar clientes"
        className="customer-search-panel"
      >
        <div className="customer-search-controls">
          <div className="min-w-0 flex-1">
            <label
              htmlFor="customer-search"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Buscar cadastro
            </label>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
              />
              <Input
                id="customer-search"
                type="search"
                placeholder="Nome, CPF ou telefone…"
                className="pl-10 h-11"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="customer-sort"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Ordenar cadastros
            </label>
            <select
              id="customer-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="customer-sort"
            >
              <option value="nome">Nome: A–Z</option>
              <option value="saldo">Saldo: maior primeiro</option>
              <option value="data">Mais recentes</option>
            </select>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p role="status" className="text-sm text-slate-600">
            {filteredCustomers.length} de {customers.length} cadastros
          </p>
          {searchTerm && (
            <button
              type="button"
              className="text-sm font-semibold text-blue-700"
              onClick={() => {
                setSearchTerm("");
                document.getElementById("customer-search")?.focus();
              }}
            >
              Limpar busca
            </button>
          )}
        </div>
      </section>

      {/* Lista de Clientes - Grid Moderno */}
      {loading ? (
        <div
          role="status"
          className="flex flex-col items-center justify-center py-20 gap-4"
        >
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold animate-pulse">
            {slowLoad
              ? "A sincronização está demorando. Confira a conexão."
              : "Sincronizando base de dados…"}
          </p>
          {slowLoad && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setLoadVersion((v) => v + 1)}
            >
              Tentar novamente
            </Button>
          )}
        </div>
      ) : filteredCustomers.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200 rounded-[2rem] bg-slate-50/50">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="bg-white p-6 rounded-full shadow-sm mb-4">
              <Users className="h-12 w-12 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              {loadError
                ? "Cadastros indisponíveis"
                : searchTerm
                  ? "Nenhum cliente encontrado"
                  : "Nenhum cadastro ainda"}
            </h3>
            <p className="text-slate-500">
              {loadError
                ? "Não foi possível confirmar os cadastros. Use Tentar novamente acima."
                : searchTerm
                  ? "Tente outro nome ou remova a busca."
                  : "Use Novo Cadastro para registrar clientes e fornecedores."}
            </p>
            {searchTerm && (
              <Button
                type="button"
                variant="outline"
                className="mt-4"
                onClick={() => setSearchTerm("")}
              >
                Limpar busca
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="customer-card-grid grid gap-5">
          <AnimatePresence>
            {filteredCustomers.map((customer) => (
              <MotionDiv
                key={customer.id}
                layout
                initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, scale: 0.95 }}
                whileHover={reduceMotion ? undefined : { y: -5 }}
                transition={{ duration: reduceMotion ? 0 : 0.15 }}
                className="group cursor-pointer"
                onClick={() => openDetails(customer)}
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
                            <button
                              id={`customer-name-${customer.id}`}
                              type="button"
                              className="text-left"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDetails(customer);
                              }}
                            >
                              {customer.nome}
                            </button>
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
                          aria-label={`Editar cadastro de ${customer.nome}`}
                          onClick={(e) => handleEdit(customer, e)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50"
                          aria-label={`Excluir cadastro de ${customer.nome}`}
                          onClick={(e) => handleDelete(customer, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                          aria-label={`Exportar extrato de ${customer.nome}`}
                          disabled={exportingId !== null}
                          aria-busy={exportingId === customer.id}
                          onClick={(e) => handleExportQuickPDF(customer, e)}
                          title="Exportar Extrato PDF"
                        >
                          <FileDown className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        className="text-blue-600 font-black text-xs uppercase tracking-tighter hover:bg-blue-100/50 rounded-xl gap-2"
                        id={`customer-history-${customer.id}`}
                        aria-label={`Ver histórico de ${customer.nome}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetails(customer);
                        }}
                      >
                        <History className="h-4 w-4" /> Histórico
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </MotionDiv>
            ))}
          </AnimatePresence>
        </div>
      )}

      {showModal && (
        <CustomerFormDialog
          editing={editingCustomer}
          data={formData}
          setData={setFormData}
          onSave={handleSubmit}
          onClose={() => {
            if (!savingRef.current) setShowModal(false);
          }}
          busy={saving}
          error={formError}
          openerRef={openerRef}
        />
      )}
      {deleteTarget && (
        <CustomerDeleteDialog
          customer={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          busy={deleting}
          error={deleteError}
          openerRef={openerRef}
        />
      )}
    </div>
  );
};

export default ClientsPage;
