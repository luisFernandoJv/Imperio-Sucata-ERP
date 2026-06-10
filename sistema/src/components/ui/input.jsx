import React from "react";
import { cn } from "@/lib/utils";

/**
 * Componente Input — fonte única de verdade para todos os inputs do sistema.
 * Suporta: estado de erro, ícone à esquerda, sufixo à direita, e input numérico.
 */

const Input = React.forwardRef(
  (
    {
      className,
      type = "text",
      error = false,
      leftIcon,
      rightElement,
      ...props
    },
    ref,
  ) => {
    if (leftIcon || rightElement) {
      return (
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 flex items-center pointer-events-none text-gray-400">
              {leftIcon}
            </span>
          )}
          <input
            type={type}
            className={cn(
              "flex h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm",
              "placeholder:text-gray-400 text-gray-900",
              "transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
              error
                ? "border-red-400 focus-visible:ring-red-400"
                : "border-gray-200 focus-visible:ring-emerald-500 focus-visible:border-emerald-500",
              leftIcon && "pl-9",
              rightElement && "pr-9",
              className,
            )}
            ref={ref}
            aria-invalid={error ? "true" : undefined}
            {...props}
          />
          {rightElement && (
            <span className="absolute right-3 flex items-center text-gray-400">
              {rightElement}
            </span>
          )}
        </div>
      );
    }

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm",
          "placeholder:text-gray-400 text-gray-900",
          "transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
          error
            ? "border-red-400 focus-visible:ring-red-400"
            : "border-gray-200 focus-visible:ring-emerald-500 focus-visible:border-emerald-500",
          className,
        )}
        ref={ref}
        aria-invalid={error ? "true" : undefined}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

export { Input };
