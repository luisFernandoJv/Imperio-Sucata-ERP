import React from "react";
import { cn } from "@/lib/utils";

/**
 * Componente Card — fonte única de verdade para todos os cards do sistema.
 * Outros componentes NÃO devem redefinir Card localmente — devem importar daqui.
 *
 * Uso básico:
 *   <Card>conteúdo</Card>
 *
 * Com subcomponentes estruturados:
 *   <Card>
 *     <CardHeader>
 *       <CardTitle>Título</CardTitle>
 *       <CardDescription>Descrição</CardDescription>
 *     </CardHeader>
 *     <CardContent>conteúdo</CardContent>
 *     <CardFooter>rodapé</CardFooter>
 *   </Card>
 *
 * Variante compacta (sem padding interno padrão):
 *   <Card padding="none">...</Card>
 */

const Card = React.forwardRef(
  ({ className, padding = "default", ...props }, ref) => {
    const paddingClass =
      {
        default: "",
        none: "",
        sm: "",
        lg: "",
      }[padding] ?? "";

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl border border-gray-200 bg-white text-gray-900 shadow-sm",
          "transition-shadow duration-200",
          className,
        )}
        {...props}
      />
    );
  },
);
Card.displayName = "Card";

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-1.5 p-5 pb-0", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef(
  ({ className, as: Tag = "h3", ...props }, ref) => (
    <Tag
      ref={ref}
      className={cn(
        "text-base font-bold leading-tight tracking-tight text-gray-900",
        className,
      )}
      {...props}
    />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-500 leading-relaxed", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-5", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center gap-3 p-5 pt-0 border-t border-gray-100 mt-4",
      className,
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

// Variante de card com borda colorida à esquerda (útil para KPIs e alertas)
const CardAccent = React.forwardRef(
  ({ className, accent = "emerald", ...props }, ref) => {
    const accentColors = {
      emerald: "border-l-emerald-500",
      blue: "border-l-blue-500",
      red: "border-l-red-500",
      amber: "border-l-amber-500",
      purple: "border-l-purple-500",
      gray: "border-l-gray-400",
    };

    return (
      <Card
        ref={ref}
        className={cn(
          "border-l-4",
          accentColors[accent] ?? accentColors.gray,
          className,
        )}
        {...props}
      />
    );
  },
);
CardAccent.displayName = "CardAccent";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  CardAccent,
};
