"use client"

import { useState } from "react"

const Logo = ({ size = "default", className = "", showText = true, variant = "bold" }) => {
  const [imgError, setImgError] = useState(false)

  // Configurações de tamanho
  const sizes = {
    small: {
      icon: "w-7 h-7",
      title: "text-base",
      subtitle: "text-[7px]",
      gap: "gap-2",
      lineWidth: "w-4"
    },
    default: {
      icon: "w-10 h-10",
      title: "text-xl",
      subtitle: "text-[9px]",
      gap: "gap-3",
      lineWidth: "w-6"
    },
    large: {
      icon: "w-14 h-14",
      title: "text-2xl",
      subtitle: "text-[10px]",
      gap: "gap-4",
      lineWidth: "w-8"
    }
  }

  const currentSize = sizes[size] || sizes.default

  // Fallback para PNG se SVG falhar
  const handleImageError = () => {
    setImgError(true)
  }

  const getImageSrc = () => {
    if (imgError) {
      // Fallback para PNG baseado no tamanho
      if (size === "large") return "/favicon_io/android-chrome-192x192.png"
      return "/favicon_io/favicon-32x32.png"
    }
    return "/favicon_io/ico.svg"
  }

  // Componente de imagem com fallback
  const LogoImage = () => (
    <img 
      src={getImageSrc()}
      alt="Império Sucata"
      className={`${currentSize.icon} drop-shadow-lg`}
      onError={handleImageError}
      loading="eager"
    />
  )

  // Variant Bold (Horizontal Bold - com linha decorativa)
  if (variant === "bold") {
    return (
      <div className={`flex items-center ${currentSize.gap} ${className}`}>
        <LogoImage />
        
        {showText && (
          <div className="flex flex-col">
            <h1 className={`font-black leading-none tracking-tight ${currentSize.title}`}>
              <span className="text-orange-600">IMPÉRIO</span>
              {' '}
              <span className="text-orange-600">SUCATA</span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <div className={`h-px ${currentSize.lineWidth} bg-gradient-to-r from-orange-500 to-transparent`}></div>
              <span className={`font-bold text-slate-500 uppercase tracking-wider ${currentSize.subtitle}`}>
                Gestão
              </span>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Variant Premium (Minimalista Premium - com borda vertical)
  if (variant === "premium") {
    return (
      <div className={`flex items-center ${currentSize.gap} ${className}`}>
        <LogoImage />
        
        {showText && (
          <div className="border-l-2 border-orange-500 pl-3">
            <h1 className={`font-extrabold text-slate-800 leading-none tracking-tight ${currentSize.title}`}>
              IMPÉRIO SUCATA
            </h1>
            <p className={`font-semibold text-orange-600 uppercase tracking-[0.2em] mt-0.5 ${currentSize.subtitle}`}>
              Gestão Inteligente
            </p>
          </div>
        )}
      </div>
    )
  }

  // Variant Compact (Horizontal Compacto - para espaços reduzidos)
  if (variant === "compact") {
    return (
      <div className={`flex items-center ${currentSize.gap} ${className}`}>
        <LogoImage />
        
        {showText && (
          <div>
            <h1 className={`font-extrabold leading-none ${currentSize.title}`}>
              <span className="text-slate-800">Império</span>
              {' '}
              <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                Sucata
              </span>
            </h1>
            <p className={`font-semibold text-slate-400 uppercase tracking-widest mt-0.5 ${currentSize.subtitle}`}>
              Gestão Inteligente
            </p>
          </div>
        )}
      </div>
    )
  }

  // Default: retorna bold
  return (
    <div className={`flex items-center ${currentSize.gap} ${className}`}>
      <LogoImage />
      
      {showText && (
        <div className="flex flex-col">
          <h1 className={`font-black leading-none tracking-tight ${currentSize.title}`}>
            <span className="text-slate-800">IMPÉRIO</span>
            {' '}
            <span className="text-orange-600">SUCATA</span>
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <div className={`h-px ${currentSize.lineWidth} bg-gradient-to-r from-orange-500 to-transparent`}></div>
            <span className={`font-bold text-slate-500 uppercase tracking-wider ${currentSize.subtitle}`}>
              Gestão Inteligente
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default Logo