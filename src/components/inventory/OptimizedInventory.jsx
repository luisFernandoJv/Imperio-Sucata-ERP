"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Package } from "lucide-react"
import { useInventory, useUpdateInventory } from "../../hooks/useFirebaseQuery"
import { useDebounce } from "../../hooks/useDebounce"
import { materialTypes } from "../../config/designTokens"
import { InventoryCard } from "./InventoryCard"
import { InventoryTableView } from "./InventoryTableView"
import { InventoryFilters } from "./InventoryFilters"
import { InventoryStats } from "./InventoryStats"
import { LoadingOverlay } from "../ui/loading"
import { EmptyState } from "../ui/empty-state"
import { printInventory, exportInventoryToCSV } from "../../lib/utils"

export default function OptimizedInventory() {
  const [editingItem, setEditingItem] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("todos")
  const [viewMode, setViewMode] = useState("grid") // Padrão grid como na imagem
  const [showLowStock, setShowLowStock] = useState(false)

  const debouncedSearch = useDebounce(searchTerm, 300)
  const { data: inventory = {}, isLoading, error } = useInventory()
  const updateInventoryMutation = useUpdateInventory()

  const filteredMaterials = useMemo(() => {
    return materialTypes.filter((material) => {
      const matchesSearch = material.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      const matchesCategory = selectedCategory === "todos" || material.category === selectedCategory
      
      const item = inventory[material.key] || {}
      const qtd = Number(item.quantidade) || 0
      const isNegative = qtd < 0
      
      const matchesLowStock = !showLowStock || (qtd <= (material.minStock || 0) && !isNegative)
      return matchesSearch && matchesCategory && matchesLowStock
    })
  }, [debouncedSearch, selectedCategory, showLowStock, inventory])

  const handleEdit = (materialKey) => {
    setEditingItem(materialKey)
    setEditForm(inventory[materialKey] || { quantidade: 0, precoCompra: 0, precoVenda: 0 })
  }

  const handleSave = async () => {
    if (!editingItem) return
    try {
      await updateInventoryMutation.mutateAsync({ material: editingItem, data: editForm })
      setEditingItem(null)
      setEditForm({})
    } catch (error) {
      console.error("Error updating inventory:", error)
      alert("Erro ao salvar alterações")
    }
  }

  const handleCancel = () => {
    setEditingItem(null)
    setEditForm({})
  }

  if (isLoading) return <LoadingOverlay message="Carregando estoque..." />
  if (error) return <EmptyState title="Erro de Conexão" description="Não foi possível carregar os dados." />

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Container Largo para ocupar a tela como na imagem */}
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8 pl-1">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20 text-white">
               <Package className="h-7 w-7" />
            </div>
            Gestão de Estoque
          </h1>
          <p className="text-slate-500 mt-2 text-lg ml-14">Controle inteligente de materiais e precificação.</p>
        </div>

        {/* Widgets KPIs */}
        <InventoryStats inventory={inventory} materials={materialTypes} />

        {/* Barra de Filtros */}
        <InventoryFilters
          searchTerm={searchTerm} setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
          viewMode={viewMode} setViewMode={setViewMode}
          showLowStock={showLowStock} setShowLowStock={setShowLowStock}
          onPrint={() => printInventory(inventory, materialTypes)}
          onExport={() => exportInventoryToCSV(inventory, materialTypes)}
        />

        {/* Grid de Conteúdo */}
        <div className="min-h-[400px]">
           <AnimatePresence mode="wait">
             {filteredMaterials.length === 0 ? (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                 <EmptyState title="Nenhum material encontrado" description="Tente ajustar seus filtros." icon={Package} />
               </motion.div>
             ) : viewMode === "list" ? (
               <motion.div
                 key="list"
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -20 }}
                 transition={{ duration: 0.3 }}
               >
                 <InventoryTableView 
                   materials={filteredMaterials} 
                   inventory={inventory} 
                   onEdit={handleEdit} 
                 />
               </motion.div>
             ) : (
               <motion.div
                 key="grid"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6"
               >
                 {filteredMaterials.map((material) => {
                   const item = inventory[material.key] || { quantidade: 0, precoCompra: 0, precoVenda: 0 }
                   return (
                     <InventoryCard
                       key={material.key}
                       material={material}
                       item={item}
                       isEditing={editingItem === material.key}
                       onEdit={handleEdit}
                       onSave={handleSave}
                       onCancel={handleCancel}
                       editForm={editForm}
                       setEditForm={setEditForm}
                       isLowStock={item.quantidade <= material.minStock}
                     />
                   )
                 })}
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  )
}