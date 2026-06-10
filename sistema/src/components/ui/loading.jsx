import { Loader2 } from "lucide-react"

export const LoadingSpinner = ({ size = "default", className = "" }) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  }

  return <Loader2 className={`animate-spin ${sizeClasses[size]} ${className}`} />
}

export const LoadingOverlay = ({ message = "Carregando..." }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-2xl flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" className="text-blue-600" />
        <p className="text-gray-700 font-medium">{message}</p>
      </div>
    </div>
  )
}

export const LoadingCard = ({ className = "" }) => {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-8 bg-gray-200 rounded w-full"></div>
      </div>
    </div>
  )
}

export const LoadingTable = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="space-y-2">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="animate-pulse flex gap-4">
          {[...Array(columns)].map((_, j) => (
            <div key={j} className="h-4 bg-gray-200 rounded flex-1"></div>
          ))}
        </div>
      ))}
    </div>
  )
}

