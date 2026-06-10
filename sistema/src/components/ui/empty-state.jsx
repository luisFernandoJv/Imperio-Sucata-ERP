"use client";

import { Inbox } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

/**
 * EmptyState — estado vazio padronizado para tabelas, listas e seções.
 *
 * Props:
 *   icon        LucideIcon  — ícone central (padrão: Inbox)
 *   title       string
 *   description string
 *   action      () => void  — callback do botão de ação
 *   actionLabel string      — label do botão
 *   actionIcon  LucideIcon  — ícone do botão
 *   variant     "default"|"compact"|"page"
 *   className   string
 */

export const EmptyState = ({
  icon: Icon = Inbox,
  title = "Nenhum dado encontrado",
  description = "Ainda não há informações para exibir.",
  action,
  actionLabel,
  actionIcon: ActionIcon,
  variant = "default",
  className = "",
}) => {
  const sizeMap =
    {
      compact: {
        wrap: "py-8 px-4",
        iconWrap: "p-4 mb-3",
        iconSize: "h-8 w-8",
        titleSize: "text-base",
      },
      default: {
        wrap: "py-12 px-6",
        iconWrap: "p-5 mb-4",
        iconSize: "h-10 w-10",
        titleSize: "text-lg",
      },
      page: {
        wrap: "py-20 px-8",
        iconWrap: "p-6 mb-6",
        iconSize: "h-14 w-14",
        titleSize: "text-xl",
      },
    }[variant] ?? {};

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        sizeMap.wrap,
        className,
      )}
    >
      <div
        className={cn(
          "rounded-2xl bg-gray-100 text-gray-400",
          sizeMap.iconWrap,
        )}
      >
        <Icon className={sizeMap.iconSize} />
      </div>

      <h3 className={cn("font-bold text-gray-800 mb-1.5", sizeMap.titleSize)}>
        {title}
      </h3>

      <p className="text-sm text-gray-500 max-w-xs leading-relaxed mb-5">
        {description}
      </p>

      {action && actionLabel && (
        <Button
          onClick={action}
          size="sm"
          leftIcon={ActionIcon && <ActionIcon className="h-4 w-4" />}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
