import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import React from "react";
import { Loader2 } from "lucide-react";

/**
 * Componente Button — fonte única de verdade para todos os botões do sistema.
 * Outros componentes NÃO devem redefinir Button localmente — devem importar daqui.
 *
 * Variantes disponíveis: default | destructive | outline | secondary | ghost | link | success | warning
 * Tamanhos: default | sm | lg | icon | icon-sm | icon-lg
 */

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold",
    "ring-offset-background transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:scale-[0.97]",
  ].join(" "),
  {
    variants: {
      variant: {
        // Principal — verde escuro (identidade do sistema)
        default:
          "bg-emerald-700 text-white shadow-md hover:bg-emerald-800 hover:shadow-lg",
        // Ação destrutiva
        destructive:
          "bg-red-600 text-white shadow-md hover:bg-red-700 hover:shadow-lg",
        // Borda leve
        outline:
          "border-2 border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 shadow-sm",
        // Secundário neutro
        secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200 shadow-sm",
        // Fantasma — sem borda nem fundo
        ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
        // Link
        link: "text-emerald-700 underline-offset-4 hover:underline p-0 h-auto",
        // Sucesso explícito
        success:
          "bg-green-600 text-white shadow-md hover:bg-green-700 hover:shadow-lg",
        // Alerta
        warning:
          "bg-amber-500 text-white shadow-md hover:bg-amber-600 hover:shadow-lg",
        // Compra (azul)
        purchase:
          "bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:shadow-lg",
        // Venda (verde)
        sale: "bg-emerald-600 text-white shadow-md hover:bg-emerald-700 hover:shadow-lg",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 py-1.5 text-xs rounded-md",
        lg: "h-12 px-6 py-3 text-base rounded-xl",
        icon: "h-10 w-10 p-0",
        "icon-sm": "h-8 w-8 p-0 rounded-md",
        "icon-lg": "h-12 w-12 p-0 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const Button = React.forwardRef(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      loadingText,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {loadingText ?? children}
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </Comp>
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
