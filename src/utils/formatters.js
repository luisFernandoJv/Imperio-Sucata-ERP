/**
 * Função auxiliar para garantir números válidos.
 * Resolve o problema de "NaN" (Not a Number) e converte strings numéricas com segurança.
 */
const toNum = (value) => {
  if (value === null || value === undefined) return 0
  
  // Se for string, substitui vírgula por ponto para garantir conversão correta
  if (typeof value === 'string') {
    value = value.replace(',', '.')
  }

  const num = Number(value)
  
  // Verifica se é um número finito válido. Se for NaN ou Infinity, retorna 0.
  return Number.isFinite(num) ? num : 0
}

export const formatCurrency = (value) => {
  const num = toNum(value)
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

export const formatNumber = (value, decimals = 2) => {
  const num = toNum(value)
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)
}

export const formatWeight = (value) => {
  const num = toNum(value)
  // Formata sempre com 2 casas para consistência visual (ex: 50,00kg)
  return `${formatNumber(num, 2)}kg`
}

export const formatPercent = (value, decimals = 1) => {
  const num = toNum(value)
  return `${formatNumber(num, decimals)}%`
}

// --- Formatadores de Data ---

export const formatDate = (dateString) => {
  if (!dateString) return ""
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "" // Proteção contra datas inválidas
    
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date)
  } catch (e) {
    return ""
  }
}

export const formatDateTime = (dateString) => {
  if (!dateString) return ""
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ""

    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  } catch (e) {
    return ""
  }
}

export const formatRelativeTime = (dateString) => {
  if (!dateString) return ""
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ""

    const now = new Date()
    const diff = now - date

    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (seconds < 60) return "agora mesmo"
    if (minutes < 60) return `há ${minutes} minuto${minutes !== 1 ? "s" : ""}`
    if (hours < 24) return `há ${hours} hora${hours !== 1 ? "s" : ""}`
    if (days < 7) return `há ${days} dia${days !== 1 ? "s" : ""}`

    return formatDate(dateString)
  } catch (e) {
    return ""
  }
}

export const formatPhoneNumber = (phone) => {
  if (!phone) return ""
  const cleaned = phone.replace(/\D/g, "")
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
  }
  return phone
}

export const formatCPF = (cpf) => {
  if (!cpf) return ""
  const cleaned = cpf.replace(/\D/g, "")
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`
  }
  return cpf
}

export const formatCNPJ = (cnpj) => {
  if (!cnpj) return ""
  const cleaned = cnpj.replace(/\D/g, "")
  if (cleaned.length === 14) {
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12)}`
  }
  return cnpj
}