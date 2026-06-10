import React from "react";
import { cn } from "@/lib/utils";

/**
 * Componente Textarea — consistente com o Input do sistema.
 */

const Textarea = React.forwardRef(
  ({ className, error = false, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-lg border bg-white px-3 py-2 text-sm",
          "placeholder:text-gray-400 text-gray-900 resize-y",
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

Textarea.displayName = "Textarea";

export { Textarea };
