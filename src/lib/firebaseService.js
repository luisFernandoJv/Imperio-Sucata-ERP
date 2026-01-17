import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  setDoc,
  getDoc,
  where,
  limit,
  Timestamp,
} from "firebase/firestore"
import { db } from "./firebase"

// Coleções do Firestore
const TRANSACTIONS_COLLECTION = "transactions"
const INVENTORY_COLLECTION = "inventory"
const DAILY_REPORTS_COLLECTION = "daily_reports"
const LIVE_SUMMARY_COLLECTION = "reports"

// Funções para Transações
export const addTransaction = async (transaction) => {
  try {
    const transactionData = {
      ...transaction,
      createdAt: new Date(),
      data: transaction.data instanceof Date ? transaction.data : new Date(transaction.data),
    }

    console.log("[v0] Salvando transação com data:", transactionData.data)

    const docRef = await addDoc(collection(db, TRANSACTIONS_COLLECTION), transactionData)
    console.log("[v0] Transação salva com ID:", docRef.id)
    return docRef.id
  } catch (error) {
    console.error("[v0] Erro ao adicionar transação:", error)
    throw error
  }
}

export const getTransactions = async () => {
  try {
    const q = query(collection(db, TRANSACTIONS_COLLECTION), orderBy("data", "desc"), limit(100))
    const querySnapshot = await getDocs(q)
    console.log(`[v0] getTransactions: Retornando ${querySnapshot.docs.length} transações (LIMITADO a 100)`)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      data: doc.data().data?.toDate ? doc.data().data.toDate() : new Date(doc.data().data),
    }))
  } catch (error) {
    console.error("Erro ao buscar transações:", error)
    throw error
  }
}

export const updateTransaction = async (id, transaction) => {
  try {
    const docRef = doc(db, TRANSACTIONS_COLLECTION, id)
    const updateData = {
      ...transaction,
      data: transaction.data instanceof Date ? transaction.data : new Date(transaction.data),
      updatedAt: new Date(),
    }

    console.log("[v0] Atualizando transação com data:", updateData.data)

    await updateDoc(docRef, updateData)
    console.log("[v0] Transação atualizada com sucesso")
  } catch (error) {
    console.error("[v0] Erro ao atualizar transação:", error)
    throw error
  }
}

export const deleteTransaction = async (id) => {
  try {
    console.log("[v0] Deletando transação:", id)
    const docRef = doc(db, TRANSACTIONS_COLLECTION, id)
    await deleteDoc(docRef)
    console.log("[v0] Transação deletada com sucesso")
  } catch (error) {
    console.error("[v0] Erro ao deletar transação:", error)
    throw error
  }
}

// Funções para Inventário
export const getInventory = async () => {
  try {
    const docRef = doc(db, INVENTORY_COLLECTION, "current")
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return docSnap.data()
    } else {
      const initialInventory = {
        ferro: { quantidade: 0, precoCompra: 2.5, precoVenda: 3.2 },
        aluminio: { quantidade: 0, precoCompra: 8.5, precoVenda: 10.8 },
        cobre: { quantidade: 0, precoCompra: 25.0, precoVenda: 32.0 },
        latinha: { quantidade: 0, precoCompra: 4.2, precoVenda: 5.5 },
        panela: { quantidade: 0, precoCompra: 3.0, precoVenda: 4.0 },
        bloco2: { quantidade: 0, precoCompra: 1.8, precoVenda: 2.5 },
        chapa: { quantidade: 0, precoCompra: 2.2, precoVenda: 3.0 },
        perfil: { quantidade: 0, precoCompra: 2.8, precoVenda: 3.8 },
        bloco: { quantidade: 0, precoCompra: 1.5, precoVenda: 2.2 },
        metal: { quantidade: 0, precoCompra: 2.0, precoVenda: 2.8 },
        inox: { quantidade: 0, precoCompra: 12.0, precoVenda: 15.0 },
        bateria: { quantidade: 0, precoCompra: 8.0, precoVenda: 12.0 },
        motor_gel: { quantidade: 0, precoCompra: 15.0, precoVenda: 20.0 },
        roda: { quantidade: 0, precoCompra: 5.0, precoVenda: 7.0 },
        papelao: { quantidade: 0, precoCompra: 0.8, precoVenda: 1.2 },
        papel_branco: { quantidade: 0, precoCompra: 1.0, precoVenda: 1.5 },
        rad_metal: { quantidade: 0, precoCompra: 3.5, precoVenda: 4.5 },
        rad_cobre: { quantidade: 0, precoCompra: 28.0, precoVenda: 35.0 },
        rad_chapa: { quantidade: 0, precoCompra: 2.8, precoVenda: 3.6 },
        tela: { quantidade: 0, precoCompra: 1.5, precoVenda: 2.0 },
        antimonio: { quantidade: 0, precoCompra: 45.0, precoVenda: 55.0 },
        cabo_ai: { quantidade: 0, precoCompra: 12.0, precoVenda: 16.0 },
        tubo_limpo: { quantidade: 0, precoCompra: 4.0, precoVenda: 5.5 },
      }
      await setDoc(docRef, initialInventory)
      return initialInventory
    }
  } catch (error) {
    console.error("Erro ao buscar inventário:", error)
    throw error
  }
}

export const updateInventory = async (inventory) => {
  try {
    const docRef = doc(db, INVENTORY_COLLECTION, "current")
    await setDoc(docRef, {
      ...inventory,
      updatedAt: new Date(),
    })
  } catch (error) {
    console.error("Erro ao atualizar inventário:", error)
    throw error
  }
}

export const updateInventoryQuantity = async (material, quantidade, tipo) => {
  try {
    const docRef = doc(db, INVENTORY_COLLECTION, "current")
    const docSnap = await getDoc(docRef)

    let currentInventory = {}
    if (docSnap.exists()) {
      currentInventory = docSnap.data()
    }

    if (!currentInventory[material]) {
      currentInventory[material] = { quantidade: 0, precoCompra: 0, precoVenda: 0 }
    }

    if (tipo === "compra") {
      currentInventory[material].quantidade += quantidade
    } else if (tipo === "venda") {
      currentInventory[material].quantidade = Math.max(0, currentInventory[material].quantidade - quantidade)
    }

    currentInventory[material].updatedAt = new Date()

    await setDoc(docRef, currentInventory)
    return currentInventory[material].quantidade
  } catch (error) {
    console.error("Erro ao atualizar quantidade do inventário:", error)
    throw error
  }
}

export const subscribeToTransactions = (callback) => {
  const q = query(collection(db, TRANSACTIONS_COLLECTION), orderBy("data", "desc"), limit(50))
  console.log("[v0] subscribeToTransactions: Listener configurado com LIMIT(50)")
  return onSnapshot(q, (querySnapshot) => {
    const transactions = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      data: doc.data().data?.toDate ? doc.data().data.toDate() : new Date(doc.data().data),
    }))
    console.log(`[v0] subscribeToTransactions: ${transactions.length} transações recebidas`)
    callback(transactions)
  })
}

export const subscribeToInventory = (callback) => {
  const docRef = doc(db, INVENTORY_COLLECTION, "current")
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data())
    }
  })
}

export const getLiveSummary = async () => {
  try {
    console.log("[v0] getLiveSummary: Buscando resumo em tempo real (1 leitura)")
    const docRef = doc(db, LIVE_SUMMARY_COLLECTION, "live_summary")
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      console.log("[v0] getLiveSummary: Resumo encontrado")
      return docSnap.data()
    } else {
      console.log("[v0] getLiveSummary: Documento não existe, retornando valores padrão")
      return {
        totalVendas: 0,
        totalCompras: 0,
        totalDespesas: 0,
        totalLucro: 0,
        totalTransacoes: 0,
        vendasHoje: 0,
        comprasHoje: 0,
        transacoesHoje: 0,
        totalVendasMes: 0,
        totalComprasMes: 0,
        totalDespesasMes: 0,
      }
    }
  } catch (error) {
    console.error("[v0] Erro ao buscar live_summary:", error)
    throw error
  }
}

export const subscribeToLiveSummary = (callback) => {
  console.log("[v0] subscribeToLiveSummary: Configurando listener para live_summary")
  const docRef = doc(db, LIVE_SUMMARY_COLLECTION, "live_summary")
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      console.log("[v0] live_summary atualizado")
      callback(docSnap.data())
    } else {
      console.log("[v0] live_summary não existe")
      callback(null)
    }
  })
}

export const getTransactionsByPeriod = async (startDate, endDate) => {
  try {
    // Normaliza as datas de entrada
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)

    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    // Converte para Timestamp do Firestore para garantir compatibilidade
    const startTimestamp = Timestamp.fromDate(start)
    const endTimestamp = Timestamp.fromDate(end)

    console.log(`[v0] getTransactionsByPeriod: Buscando de ${start.toISOString()} até ${end.toISOString()}`)
    console.log(`[v0] Usando Timestamps: start=${startTimestamp.toDate()}, end=${endTimestamp.toDate()}`)

    // Query principal usando Timestamp
    const q = query(
      collection(db, TRANSACTIONS_COLLECTION),
      where("data", ">=", startTimestamp),
      where("data", "<=", endTimestamp),
      orderBy("data", "desc"),
    )

    const querySnapshot = await getDocs(q)
    console.log(`[v0] Query retornou ${querySnapshot.docs.length} documentos`)

    const transactions = querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      let transactionDate

      // Trata diferentes formatos de data
      if (data.data && typeof data.data.toDate === "function") {
        transactionDate = data.data.toDate()
      } else if (data.data instanceof Date) {
        transactionDate = data.data
      } else if (data.data) {
        transactionDate = new Date(data.data)
      } else {
        transactionDate = new Date()
      }

      return {
        id: docSnap.id,
        ...data,
        data: transactionDate,
      }
    })

    console.log(`[v0] getTransactionsByPeriod: Processadas ${transactions.length} transações`)

    // Log de debug para verificar os tipos de transações
    const vendas = transactions.filter((t) => t.tipo === "venda").length
    const compras = transactions.filter((t) => t.tipo === "compra").length
    const despesas = transactions.filter((t) => t.tipo === "despesa").length
    console.log(`[v0] Tipos: ${vendas} vendas, ${compras} compras, ${despesas} despesas`)

    return transactions
  } catch (error) {
    console.error("[v0] Erro ao buscar transações por período:", error)

    // Fallback: buscar todas as transações e filtrar manualmente
    console.log("[v0] Tentando fallback: buscar todas as transações e filtrar...")
    try {
      const allQuery = query(collection(db, TRANSACTIONS_COLLECTION), orderBy("data", "desc"))

      const allSnapshot = await getDocs(allQuery)
      console.log(`[v0] Fallback: ${allSnapshot.docs.length} transações totais`)

      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)

      const filteredTransactions = allSnapshot.docs
        .map((docSnap) => {
          const data = docSnap.data()
          let transactionDate

          if (data.data && typeof data.data.toDate === "function") {
            transactionDate = data.data.toDate()
          } else if (data.data instanceof Date) {
            transactionDate = data.data
          } else if (data.data) {
            transactionDate = new Date(data.data)
          } else {
            return null
          }

          return {
            id: docSnap.id,
            ...data,
            data: transactionDate,
          }
        })
        .filter((t) => {
          if (!t || !t.data) return false
          const txDate = new Date(t.data)
          return txDate >= start && txDate <= end
        })

      console.log(`[v0] Fallback filtrado: ${filteredTransactions.length} transações no período`)
      return filteredTransactions
    } catch (fallbackError) {
      console.error("[v0] Erro no fallback:", fallbackError)
      return []
    }
  }
}

export const getDailyReports = async (startDate, endDate) => {
  try {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)

    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    console.log(`[v0] getDailyReports: Buscando relatórios de ${start.toISOString()} até ${end.toISOString()}`)

    // Busca transações do período e agrega
    const transactions = await getTransactionsByPeriod(start, end)

    if (transactions.length === 0) {
      console.log("[v0] getDailyReports: Nenhuma transação encontrada no período")
      return []
    }

    console.log(`[v0] getDailyReports: Agregando ${transactions.length} transações em relatórios diários`)
    const reports = aggregateTransactionsToReports(transactions)

    console.log(`[v0] getDailyReports: Criados ${reports.length} relatórios diários`)
    return reports
  } catch (error) {
    console.error("[v0] Erro ao buscar relatórios:", error)
    return []
  }
}

function aggregateTransactionsToReports(transactions) {
  const dailyMap = {}

  transactions.forEach((t) => {
    if (!t.data) return

    const txDate = new Date(t.data)
    const dateKey = txDate.toISOString().split("T")[0]

    if (!dailyMap[dateKey]) {
      dailyMap[dateKey] = {
        id: dateKey,
        date: new Date(dateKey + "T12:00:00"),
        dateString: dateKey,
        totalSales: 0,
        totalPurchases: 0,
        totalExpenses: 0,
        totalProfit: 0,
        salesCount: 0,
        purchasesCount: 0,
        expensesCount: 0,
        totalTransactions: 0,
        totalQuantity: 0,
        materialStats: {},
        paymentStats: {},
      }
    }

    const report = dailyMap[dateKey]
    const valor = Number(t.valorTotal) || 0
    const quantidade = Number(t.quantidade) || 0

    report.totalTransactions++

    if (t.tipo === "venda") {
      report.totalSales += valor
      report.salesCount++
      report.totalQuantity += quantidade
    } else if (t.tipo === "compra") {
      report.totalPurchases += valor
      report.purchasesCount++
    } else if (t.tipo === "despesa") {
      report.totalExpenses += valor
      report.expensesCount++
    }

    // Stats por material
    if (t.material) {
      if (!report.materialStats[t.material]) {
        report.materialStats[t.material] = {
          vendas: 0,
          compras: 0,
          quantidade: 0,
          transacoes: 0,
        }
      }
      if (t.tipo === "venda") {
        report.materialStats[t.material].vendas += valor
        report.materialStats[t.material].quantidade += quantidade
      } else if (t.tipo === "compra") {
        report.materialStats[t.material].compras += valor
      }
      report.materialStats[t.material].transacoes++
    }

    // Stats por forma de pagamento
    const pagamento = t.formaPagamento || "dinheiro"
    if (!report.paymentStats[pagamento]) {
      report.paymentStats[pagamento] = { total: 0, count: 0 }
    }
    report.paymentStats[pagamento].total += valor
    report.paymentStats[pagamento].count++
  })

  // Calcular lucro para cada dia
  Object.values(dailyMap).forEach((report) => {
    report.totalProfit = report.totalSales - report.totalPurchases - report.totalExpenses
  })

  return Object.values(dailyMap).sort((a, b) => new Date(b.date) - new Date(a.date))
}

export const getMonthlyReport = async (year, month) => {
  try {
    console.log("[v0] Generating monthly report:", { year, month })

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    const dailyReports = await getDailyReports(startDate, endDate)

    const monthlyStats = {
      year,
      month,
      totalSales: 0,
      totalPurchases: 0,
      totalExpenses: 0,
      totalProfit: 0,
      totalTransactions: 0,
      materialStats: {},
      dailyBreakdown: dailyReports,
    }

    dailyReports.forEach((report) => {
      monthlyStats.totalSales += report.totalSales || 0
      monthlyStats.totalPurchases += report.totalPurchases || 0
      monthlyStats.totalExpenses += report.totalExpenses || 0
      monthlyStats.totalProfit += report.totalProfit || 0
      monthlyStats.totalTransactions += report.totalTransactions || 0

      Object.entries(report.materialStats || {}).forEach(([material, stats]) => {
        if (!monthlyStats.materialStats[material]) {
          monthlyStats.materialStats[material] = {
            vendas: 0,
            compras: 0,
            quantidade: 0,
            lucro: 0,
          }
        }
        monthlyStats.materialStats[material].vendas += stats.vendas || 0
        monthlyStats.materialStats[material].compras += stats.compras || 0
        monthlyStats.materialStats[material].quantidade += stats.quantidade || 0
        monthlyStats.materialStats[material].lucro += stats.lucro || 0
      })
    })

    console.log(`[v0] Monthly report generated from ${dailyReports.length} daily reports`)
    return monthlyStats
  } catch (error) {
    console.error("[v0] Erro ao gerar relatório mensal:", error)
    throw error
  }
}

export const getYearlyReport = async (year) => {
  try {
    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year, 11, 31, 23, 59, 59)

    const dailyReports = await getDailyReports(startDate, endDate)

    const yearlyStats = {
      year,
      totalSales: 0,
      totalPurchases: 0,
      totalExpenses: 0,
      totalProfit: 0,
      totalTransactions: 0,
      materialStats: {},
      monthlyBreakdown: {},
    }

    dailyReports.forEach((report) => {
      const month = report.date.getMonth() + 1

      if (!yearlyStats.monthlyBreakdown[month]) {
        yearlyStats.monthlyBreakdown[month] = {
          totalSales: 0,
          totalPurchases: 0,
          totalExpenses: 0,
          totalProfit: 0,
          totalTransactions: 0,
        }
      }

      yearlyStats.totalSales += report.totalSales || 0
      yearlyStats.totalPurchases += report.totalPurchases || 0
      yearlyStats.totalExpenses += report.totalExpenses || 0
      yearlyStats.totalProfit += report.totalProfit || 0
      yearlyStats.totalTransactions += report.totalTransactions || 0

      yearlyStats.monthlyBreakdown[month].totalSales += report.totalSales || 0
      yearlyStats.monthlyBreakdown[month].totalPurchases += report.totalPurchases || 0
      yearlyStats.monthlyBreakdown[month].totalExpenses += report.totalExpenses || 0
      yearlyStats.monthlyBreakdown[month].totalProfit += report.totalProfit || 0
      yearlyStats.monthlyBreakdown[month].totalTransactions += report.totalTransactions || 0

      Object.entries(report.materialStats || {}).forEach(([material, stats]) => {
        if (!yearlyStats.materialStats[material]) {
          yearlyStats.materialStats[material] = {
            vendas: 0,
            compras: 0,
            quantidade: 0,
            lucro: 0,
          }
        }
        yearlyStats.materialStats[material].vendas += stats.vendas || 0
        yearlyStats.materialStats[material].compras += stats.compras || 0
        yearlyStats.materialStats[material].quantidade += stats.quantidade || 0
        yearlyStats.materialStats[material].lucro += stats.lucro || 0
      })
    })

    return yearlyStats
  } catch (error) {
    console.error("Erro ao gerar relatório anual:", error)
    throw error
  }
}

export const updateInventoryItem = async (material, data) => {
  try {
    const docRef = doc(db, INVENTORY_COLLECTION, "current")
    const docSnap = await getDoc(docRef)

    let currentInventory = {}
    if (docSnap.exists()) {
      currentInventory = docSnap.data()
    }

    currentInventory[material] = {
      ...currentInventory[material],
      ...data,
      updatedAt: new Date(),
    }

    await setDoc(docRef, currentInventory)
    return currentInventory
  } catch (error) {
    console.error("Erro ao atualizar item do inventário:", error)
    throw error
  }
}

// Função para garantir que getAllTransactions retorne todas as transações sem limite
export const getAllTransactions = async () => {
  try {
    const q = query(collection(db, TRANSACTIONS_COLLECTION), orderBy("data", "desc"))
    const querySnapshot = await getDocs(q)
    console.log(`[v0] getAllTransactions: Retornando ${querySnapshot.docs.length} transações (SEM LIMITE)`)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      data: doc.data().data?.toDate ? doc.data().data.toDate() : new Date(doc.data().data),
    }))
  } catch (error) {
    console.error("Erro ao buscar todas as transações:", error)
    throw error
  }
}
