"use client"
import { Inbox } from "lucide-react"
import { Button } from "./button"

export const EmptyState = ({
  icon: Icon = Inbox,
  title = "Nenhum dado encontrado",
  description = "Ainda não há informações para exibir.",
  action,
  actionLabel,
  className = "",
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="bg-gray-100 rounded-full p-6 mb-4">
        <Icon className="h-12 w-12 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-sm">{description}</p>
      {action && actionLabel && <Button onClick={action}>{actionLabel}</Button>}
    </div>
  )
}
