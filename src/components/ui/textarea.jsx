import * as React from "react";

/**
 * Componente Textarea para o sistema
 * Adicione este arquivo em: sistema/src/components/ui/textarea.jsx
 */

const Textarea = React.forwardRef(
  ({ className = "", error = false, ...props }, ref) => {
    return (
      <textarea
        className={`flex min-h-[80px] w-full rounded-md border ${
          error ? "border-red-500" : "border-input"
        } bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 ${
          error ? "focus-visible:ring-red-500" : "focus-visible:ring-ring"
        } focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        ref={ref}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";

export { Textarea };
