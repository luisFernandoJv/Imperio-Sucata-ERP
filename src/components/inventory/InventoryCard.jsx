"use client"

import { memo } from "react"
import { motion } from "framer-motion"
import { Edit, Save, X, AlertTriangle, TrendingUp, TrendingDown, Package, AlertCircle } from "lucide-react"
import { formatCurrency, formatWeight, formatPercent } from "../../utils/formatters"
import { calculateMargin } from "../../utils/calculations"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Badge } from "../ui/badge"

export const InventoryCard = memo(({ material, item, isEditing, onEdit, onSave, onCancel, editForm, setEditForm, isLowStock }) => {
  const qtd = Number(item?.quantidade) || 0
  const compra = Number(item?.precoCompra) || 0
  const venda = Number(item?.precoVenda) || 0
  const minStock = Number(material?.minStock) || 0
  const totalValue = qtd * compra
  const margin = calculateMargin(compra, venda)
  const isNegative = qtd < 0

  // Cores de Status
  const statusConfig = isNegative 
    ? { border: "border-rose-200", bg: "bg-rose-50/30", bar: "bg-rose-500", text: "text-rose-700" }
    : isLowStock 
      ? { border: "border-amber-200", bg: "bg-amber-50/30", bar: "bg-amber-400", text: "text-amber-700" }
      : { border: "border-slate-200", bg: "bg-white", bar: "bg-emerald-500", text: "text-emerald-700" }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`group relative rounded-2xl border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${statusConfig.border} ${statusConfig.bg} bg-white`}
    >
      {/* Botão Editar Flutuante */}
      {!isEditing && (
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <Button variant="secondary" size="icon" onClick={() => onEdit(material.key)} className="h-8 w-8 rounded-full shadow-sm bg-white hover:bg-blue-50 hover:text-blue-600">
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="p-5 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-100 flex items-center justify-center text-2xl shadow-inner">
            {material.icon}
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg leading-tight">{material.name}</h3>
            <div className="flex gap-2 mt-1">
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal bg-slate-100 text-slate-500">{material.category}</Badge>
              {isNegative && <Badge variant="destructive" className="text-[10px] h-5 px-1.5">Erro</Badge>}
            </div>
          </div>
        </div>

        {isEditing ? (
          <div className="flex-1 flex flex-col justify-center space-y-3 animate-in fade-in">
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Compra (R$)</label>
                <Input 
                   type="number" step="0.01" 
                   value={editForm.precoCompra} 
                   onChange={(e) => setEditForm({ ...editForm, precoCompra: parseFloat(e.target.value) || 0 })}
                   className="font-mono text-sm"
                />
             </div>
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Venda (R$)</label>
                <Input 
                   type="number" step="0.01" 
                   value={editForm.precoVenda} 
                   onChange={(e) => setEditForm({ ...editForm, precoVenda: parseFloat(e.target.value) || 0 })}
                   className="font-mono text-sm"
                />
             </div>
             <div className="flex gap-2 pt-2">
                <Button size="sm" onClick={onSave} className="flex-1 bg-blue-600 hover:bg-blue-700">Salvar</Button>
                <Button size="sm" variant="outline" onClick={onCancel}>Cancelar</Button>
             </div>
          </div>
        ) : (
          <>
            {/* Display de Estoque */}
            <div className="mb-6">
               <div className="flex justify-between items-baseline mb-2">
                  <span className={`text-3xl font-extrabold tracking-tighter ${isNegative ? 'text-rose-600' : 'text-slate-800'}`}>
                     {formatWeight(qtd).replace('kg', '')}<span className="text-sm font-semibold text-slate-400 ml-1">kg</span>
                  </span>
                  {isLowStock && !isNegative && (
                     <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                        <AlertTriangle className="h-3 w-3" /> Baixo
                     </span>
                  )}
               </div>
               
               <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                  <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${Math.min(Math.max((qtd / (minStock * 4)) * 100, 5), 100)}%` }}
                     className={`h-full rounded-full ${statusConfig.bar}`}
                  />
               </div>
               <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-slate-400 font-medium">Estoque Atual</span>
                  <span className="text-[10px] text-slate-400 font-medium">Min: {formatWeight(minStock)}</span>
               </div>
            </div>

            {/* Footer Financeiro */}
            <div className="mt-auto grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
               <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Compra / Venda</p>
                  <p className="text-xs font-medium text-slate-600">
                     {formatCurrency(compra)} <span className="text-slate-300">/</span> <span className="text-emerald-600 font-bold">{formatCurrency(venda)}</span>
                  </p>
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Total</p>
                  <p className="font-bold text-slate-800 text-sm">
                     {isNegative ? '---' : formatCurrency(totalValue)}
                  </p>
               </div>
               <div className="col-span-2 mt-1">
                  <div className={`flex items-center justify-between px-2 py-1.5 rounded-lg ${margin > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-600'}`}>
                     <span className="text-[10px] font-bold uppercase">Margem de Lucro</span>
                     <span className="text-xs font-extrabold">{formatPercent(margin)}</span>
                  </div>
               </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
})

InventoryCard.displayName = "InventoryCard"