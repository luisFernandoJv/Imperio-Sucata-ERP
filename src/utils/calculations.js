/**
 * Utilitário interno para garantir que qualquer input seja convertido para número.
 * Resolve problemas de NaN, undefined, null e strings numéricas.
 */
const toNum = (value) => {
  if (value === null || value === undefined) return 0
  const num = Number(value)
  return Number.isNaN(num) ? 0 : num
}

export const calculateMargin = (precoCompra, precoVenda) => {
  const cost = toNum(precoCompra)
  const price = toNum(precoVenda)
  
  // Evita divisão por zero e margem infinita
  if (cost === 0) return 0 
  
  return ((price - cost) / cost) * 100
}

// Em finanças, Markup geralmente é sobre o custo, Margin é sobre a venda.
// Mantive a lógica original (ROI), mas agora segura.
export const calculateMarkup = (precoCompra, precoVenda) => {
  const cost = toNum(precoCompra)
  const price = toNum(precoVenda)
  
  if (cost === 0) return 0
  
  return ((price - cost) / cost) * 100
}

export const calculateProfit = (quantidade, precoCompra, precoVenda) => {
  const qty = toNum(quantidade)
  const cost = toNum(precoCompra)
  const price = toNum(precoVenda)

  return qty * (price - cost)
}

export const calculateTotalValue = (quantidade, preco) => {
  return toNum(quantidade) * toNum(preco)
}

export const calculateGrowthRate = (current, previous) => {
  const curr = toNum(current)
  const prev = toNum(previous)

  if (prev === 0) return curr > 0 ? 100 : 0
  
  return ((curr - prev) / prev) * 100
}

export const calculateAverage = (values) => {
  if (!Array.isArray(values) || values.length === 0) return 0
  
  // Garante que somamos números, mesmo que o array tenha strings
  const sum = values.reduce((acc, val) => acc + toNum(val), 0)
  return sum / values.length
}

export const calculateMedian = (values) => {
  if (!Array.isArray(values) || values.length === 0) return 0
  
  // Map para garantir números antes de ordenar
  const sorted = values.map(toNum).sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  
  return sorted.length % 2 === 0 
    ? (sorted[mid - 1] + sorted[mid]) / 2 
    : sorted[mid]
}

export const calculateSum = (values) => {
  if (!Array.isArray(values) || values.length === 0) return 0
  return values.reduce((acc, val) => acc + toNum(val), 0)
}

export const calculatePercentage = (part, total) => {
  const p = toNum(part)
  const t = toNum(total)
  
  if (t === 0) return 0
  return (p / t) * 100
}

export const roundToDecimals = (value, decimals = 2) => {
  const val = toNum(value)
  const factor = Math.pow(10, decimals)
  return Math.round(val * factor) / factor
}

export const calculateChange = (current, previous) => {
  const curr = toNum(current)
  const prev = toNum(previous)
  
  if (prev === 0) return 0 // Evita Infinity ou NaN na divisão por zero
  return ((curr - prev) / prev) * 100
}