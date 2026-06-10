"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  Calendar,
  FileDown,
  FileText,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Download,
  FileSpreadsheet,
  User,
  Users,
  Search,
  X,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";
import { useData } from "@/contexts/DataContext";
import {
  generateFinancialPDF,
  generateMaterialPDF,
  generateDailyPDF,
  generateCompleteTransactionsPDF,
  exportToExcel,
} from "@/utils/reportGenerators_IMPROVED";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { subscribeToCustomers, getTransactions } from "@/lib/firebaseService";

export default function ProfessionalReportsImproved() {
  const { fetchDailyReports, fetchMonthlyReport, fetchYearlyReport } =
    useData();
  const { toast } = useToast();

  const [reportType, setReportType] = useState("financial");
  const [period, setPeriod] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  // Client selection
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");

  // Observations
  const [observations, setObservations] = useState("");
  const [includeObservations, setIncludeObservations] = useState(false);

  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    setStartDate(format(firstDay, "yyyy-MM-dd"));
    setEndDate(format(lastDay, "yyyy-MM-dd"));
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToCustomers((data) => {
      setCustomers(data);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (period !== "custom") {
      loadReportData();
    }
  }, [period]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      let rawData;
      let transformedData;

      if (period === "custom" && startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (end < start) {
          toast({
            title: "⚠️ Data inválida",
            description: "A data final deve ser posterior à data inicial",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        rawData = await fetchDailyReports(startDate, endDate);
        transformedData = transformDailyReportsToSummary(rawData);

        toast({
          title: "✅ Dados carregados",
          description: `${rawData.length} relatórios diários carregados`,
          className: "bg-green-100 border-green-500 text-green-800",
        });
      } else if (period === "month") {
        const date = new Date();
        rawData = await fetchMonthlyReport(
          date.getFullYear(),
          date.getMonth() + 1,
        );
        transformedData = transformMonthlyReportToSummary(rawData);

        toast({
          title: "✅ Relatório mensal carregado",
          description: `Dados agregados de ${rawData.dailyBreakdown?.length || 0} dias`,
          className: "bg-green-100 border-green-500 text-green-800",
        });
      } else if (period === "year") {
        const date = new Date();
        rawData = await fetchYearlyReport(date.getFullYear());
        transformedData = transformYearlyReportToSummary(rawData);

        toast({
          title: "✅ Relatório anual carregado",
          description: `Dados agregados de ${Object.keys(rawData.monthlyBreakdown || {}).length} meses`,
          className: "bg-green-100 border-green-500 text-green-800",
        });
      }

      setReportData(transformedData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "❌ Erro ao carregar dados",
        description:
          error.message || "Não foi possível carregar os dados agregados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const transformDailyReportsToSummary = (dailyReports) => {
    const summary = {
      totalSales: 0,
      totalPurchases: 0,
      totalExpenses: 0,
      profit: 0,
      dailyData: [],
      materialStats: {},
      paymentStats: {},
    };

    dailyReports.forEach((report) => {
      summary.totalSales += report.totalSales || 0;
      summary.totalPurchases += report.totalPurchases || 0;
      summary.totalExpenses += report.totalExpenses || 0;
      summary.profit += report.totalProfit || 0;

      summary.dailyData.push({
        date: report.date,
        sales: report.totalSales || 0,
        purchases: report.totalPurchases || 0,
        expenses: report.totalExpenses || 0,
        profit: report.totalProfit || 0,
        transactionCount: report.totalTransactions || 0,
      });

      if (report.materialStats) {
        Object.entries(report.materialStats).forEach(([material, stats]) => {
          if (!summary.materialStats[material]) {
            summary.materialStats[material] = {
              quantity: 0,
              sales: 0,
              purchases: 0,
              profit: 0,
              margin: 0,
            };
          }
          summary.materialStats[material].quantity += stats.quantidade || 0;
          summary.materialStats[material].sales += stats.vendas || 0;
          summary.materialStats[material].purchases += stats.compras || 0;
          summary.materialStats[material].profit += stats.lucro || 0;
        });
      }

      if (report.paymentStats) {
        Object.entries(report.paymentStats).forEach(([method, stats]) => {
          if (!summary.paymentStats[method]) {
            summary.paymentStats[method] = { count: 0, total: 0 };
          }
          summary.paymentStats[method].count += stats.count || 0;
          summary.paymentStats[method].total += stats.total || 0;
        });
      }
    });

    Object.keys(summary.materialStats).forEach((material) => {
      const stats = summary.materialStats[material];
      if (stats.sales > 0) {
        stats.margin = ((stats.profit / stats.sales) * 100).toFixed(2);
      }
    });

    return summary;
  };

  const transformMonthlyReportToSummary = (monthlyReport) => {
    const summary = {
      totalSales: monthlyReport.totalSales || 0,
      totalPurchases: monthlyReport.totalPurchases || 0,
      totalExpenses: monthlyReport.totalExpenses || 0,
      profit: monthlyReport.totalProfit || 0,
      dailyData: [],
      materialStats: {},
      paymentStats: {},
    };

    if (monthlyReport.dailyBreakdown) {
      monthlyReport.dailyBreakdown.forEach((report) => {
        summary.dailyData.push({
          date: report.date,
          sales: report.totalSales || 0,
          purchases: report.totalPurchases || 0,
          expenses: report.totalExpenses || 0,
          profit: report.totalProfit || 0,
          transactionCount: report.totalTransactions || 0,
        });
      });
    }

    if (monthlyReport.materialStats) {
      Object.entries(monthlyReport.materialStats).forEach(
        ([material, stats]) => {
          summary.materialStats[material] = {
            quantity: stats.quantidade || 0,
            sales: stats.vendas || 0,
            purchases: stats.compras || 0,
            profit: stats.lucro || 0,
            margin:
              stats.vendas > 0
                ? (((stats.lucro || 0) / stats.vendas) * 100).toFixed(2)
                : 0,
          };
        },
      );
    }

    return summary;
  };

  const transformYearlyReportToSummary = (yearlyReport) => {
    const summary = {
      totalSales: yearlyReport.totalSales || 0,
      totalPurchases: yearlyReport.totalPurchases || 0,
      totalExpenses: yearlyReport.totalExpenses || 0,
      profit: yearlyReport.totalProfit || 0,
      dailyData: [],
      materialStats: {},
      paymentStats: {},
    };

    if (yearlyReport.monthlyBreakdown) {
      Object.entries(yearlyReport.monthlyBreakdown).forEach(([month, data]) => {
        summary.dailyData.push({
          date: new Date(yearlyReport.year, Number.parseInt(month) - 1, 1),
          sales: data.totalSales || 0,
          purchases: data.totalPurchases || 0,
          expenses: data.totalExpenses || 0,
          profit: data.totalProfit || 0,
          transactionCount: data.totalTransactions || 0,
        });
      });
    }

    if (yearlyReport.materialStats) {
      Object.entries(yearlyReport.materialStats).forEach(
        ([material, stats]) => {
          summary.materialStats[material] = {
            quantity: stats.quantidade || 0,
            sales: stats.vendas || 0,
            purchases: stats.compras || 0,
            profit: stats.lucro || 0,
            margin:
              stats.vendas > 0
                ? (((stats.lucro || 0) / stats.vendas) * 100).toFixed(2)
                : 0,
          };
        },
      );
    }

    return summary;
  };

  const handleGeneratePDF = async () => {
    if (!reportData) {
      toast({
        title: "⚠️ Sem dados",
        description: "Carregue os dados primeiro",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const options = {
        startDate,
        endDate,
        clientData: selectedCustomer,
        observations: includeObservations ? observations : null,
      };

      if (reportType === "financial") {
        await generateFinancialPDF(reportData, options);
      } else if (reportType === "material") {
        await generateMaterialPDF(reportData, options);
      } else if (reportType === "daily") {
        await generateDailyPDF(reportData, options);
      } else if (reportType === "complete") {
        // Load all transactions for complete report
        const transactions = await getTransactions(startDate, endDate);
        await generateCompleteTransactionsPDF(transactions, {
          ...options,
          title: "RELATÓRIO COMPLETO DE TRANSAÇÕES",
        });
      }

      toast({
        title: "✅ PDF gerado com sucesso",
        description: "Relatório exportado e salvo",
        className: "bg-green-100 border-green-500 text-green-800",
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "❌ Erro ao gerar PDF",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    if (!reportData) {
      toast({
        title: "⚠️ Sem dados",
        description: "Carregue os dados primeiro",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await exportToExcel(reportData, {
        startDate,
        endDate,
        reportType,
        clientData: selectedCustomer,
        observations: includeObservations ? observations : null,
      });

      toast({
        title: "✅ Excel exportado",
        description: "Planilha gerada com sucesso",
        className: "bg-green-100 border-green-500 text-green-800",
      });
    } catch (error) {
      console.error("Erro ao exportar Excel:", error);
      toast({
        title: "❌ Erro ao exportar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.nome?.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.telefone?.includes(customerSearch) ||
      c.email?.toLowerCase().includes(customerSearch.toLowerCase()),
  );

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            Relatórios
          </h1>
          <p className="text-gray-600 mt-1">
            Gere relatórios detalhados em PDF e Excel com informações completas
          </p>
        </div>
      </div>

      {/* Configuration Card */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          Configuração do Relatório
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Report Type */}
          <div>
            <Label htmlFor="reportType" className="mb-2 block font-semibold">
              Tipo de Relatório
            </Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger id="reportType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="financial">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Financeiro
                  </div>
                </SelectItem>
                <SelectItem value="material">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Por Material
                  </div>
                </SelectItem>
                <SelectItem value="daily">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Diário
                  </div>
                </SelectItem>
                <SelectItem value="complete">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Completo (Todas Transações)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Period */}
          <div>
            <Label htmlFor="period" className="mb-2 block font-semibold">
              Período
            </Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger id="period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Mês Atual</SelectItem>
                <SelectItem value="year">Ano Atual</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Date Range */}
          {period === "custom" && (
            <>
              <div>
                <Label htmlFor="startDate" className="mb-2 block font-semibold">
                  Data Inicial
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate" className="mb-2 block font-semibold">
                  Data Final
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        {/* Client Selection */}
        <div className="mt-6">
          <Label className="mb-2 block font-semibold flex items-center gap-2">
            <User className="h-4 w-4" />
            Cliente (Opcional)
          </Label>
          {selectedCustomer ? (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <User className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  {selectedCustomer.nome}
                </p>
                {selectedCustomer.telefone && (
                  <p className="text-sm text-gray-600">
                    {selectedCustomer.telefone}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCustomer(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="relative">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowCustomerSelect(!showCustomerSelect)}
              >
                <Users className="h-4 w-4 mr-2" />
                Selecionar Cliente
              </Button>
              {showCustomerSelect && (
                <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-auto">
                  <div className="p-2 border-b sticky top-0 bg-white">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Buscar cliente..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="p-2">
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map((customer) => (
                        <button
                          key={customer.id}
                          className="w-full text-left p-2 hover:bg-gray-100 rounded-md transition-colors"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setShowCustomerSelect(false);
                            setCustomerSearch("");
                          }}
                        >
                          <p className="font-semibold">{customer.nome}</p>
                          {customer.telefone && (
                            <p className="text-sm text-gray-600">
                              {customer.telefone}
                            </p>
                          )}
                        </button>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-4">
                        Nenhum cliente encontrado
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Observations */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id="includeObservations"
              checked={includeObservations}
              onChange={(e) => setIncludeObservations(e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label
              htmlFor="includeObservations"
              className="font-semibold cursor-pointer"
            >
              Incluir Observações no Relatório
            </Label>
          </div>
          {includeObservations && (
            <Textarea
              placeholder="Digite observações adicionais para incluir no relatório..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="min-h-[100px]"
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t">
          <Button
            onClick={loadReportData}
            disabled={
              loading || (period === "custom" && (!startDate || !endDate))
            }
            variant="outline"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Carregando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Carregar Dados
              </>
            )}
          </Button>

          <Button
            onClick={handleGeneratePDF}
            disabled={loading || !reportData}
            className="bg-red-600 hover:bg-red-700"
          >
            <FileDown className="h-4 w-4 mr-2" />
            Gerar PDF
          </Button>

          <Button
            onClick={handleExportExcel}
            disabled={loading || !reportData}
            className="bg-green-600 hover:bg-green-700"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </Card>

      {/* Preview Card */}
      {reportData && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            Prévia dos Dados
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700 font-semibold">
                Total Vendas
              </p>
              <p className="text-2xl font-bold text-green-800">
                {formatCurrency(reportData.totalSales)}
              </p>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700 font-semibold">
                Total Compras
              </p>
              <p className="text-2xl font-bold text-blue-800">
                {formatCurrency(reportData.totalPurchases)}
              </p>
            </div>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-semibold">
                Total Despesas
              </p>
              <p className="text-2xl font-bold text-red-800">
                {formatCurrency(reportData.totalExpenses)}
              </p>
            </div>
            <div
              className={`p-4 border rounded-lg ${
                reportData.profit >= 0
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <p
                className={`text-sm font-semibold ${
                  reportData.profit >= 0 ? "text-emerald-700" : "text-red-700"
                }`}
              >
                Lucro Líquido
              </p>
              <p
                className={`text-2xl font-bold ${
                  reportData.profit >= 0 ? "text-emerald-800" : "text-red-800"
                }`}
              >
                {formatCurrency(reportData.profit)}
              </p>
            </div>
          </div>

          {selectedCustomer && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700 font-semibold mb-2">
                Cliente Selecionado
              </p>
              <p className="font-bold text-blue-900">{selectedCustomer.nome}</p>
              {selectedCustomer.telefone && (
                <p className="text-sm text-blue-800">
                  {selectedCustomer.telefone}
                </p>
              )}
              {selectedCustomer.email && (
                <p className="text-sm text-blue-800">
                  {selectedCustomer.email}
                </p>
              )}
            </div>
          )}

          {includeObservations && observations && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700 font-semibold mb-2">
                Observações a serem incluídas
              </p>
              <p className="text-sm text-amber-900 whitespace-pre-wrap">
                {observations}
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Help Card */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-start gap-4">
          <AlertCircle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">
              Dicas para Relatórios Profissionais
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>
                • <strong>Cliente:</strong> Selecione um cliente para incluir
                suas informações no relatório
              </li>
              <li>
                • <strong>Observações:</strong> Adicione notas importantes que
                serão exibidas no PDF
              </li>
              <li>
                • <strong>Relatório Completo:</strong> Inclui todas as
                transações individuais com detalhes
              </li>
              <li>
                • <strong>Excel:</strong> Exporta dados em múltiplas abas para
                análise detalhada
              </li>
              <li>
                • <strong>Acessibilidade:</strong> PDFs otimizados para
                impressão e leitura
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
