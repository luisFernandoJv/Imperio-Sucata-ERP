"use client"

import { memo } from "react"
import { ChevronRight, Home } from "lucide-react"
import { motion } from "framer-motion"

export const Breadcrumbs = memo(({ items, onNavigate }) => {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => onNavigate("dashboard")}
        className="flex items-center gap-1 hover:text-blue-600 transition-colors"
      >
        <Home className="h-4 w-4" />
        <span className="hidden sm:inline">Início</span>
      </motion.button>

      {items.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="flex items-center space-x-2"
        >
          <ChevronRight className="h-4 w-4 text-gray-400" />
          {item.action ? (
            <button onClick={item.action} className="hover:text-blue-600 transition-colors">
              {item.label}
            </button>
          ) : (
            <span className="font-medium text-gray-900">{item.label}</span>
          )}
        </motion.div>
      ))}
    </nav>
  )
})

Breadcrumbs.displayName = "Breadcrumbs"
