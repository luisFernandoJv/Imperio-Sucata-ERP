import { z } from "zod"

export const transactionSchema = z.object({
  tipo: z.enum(["compra", "venda", "despesa"], {
    required_error: "Tipo de transação é obrigatório",
  }),
  material: z.string().min(1, "Material é obrigatório"),
  quantidade: z
    .number({
      required_error: "Quantidade é obrigatória",
      invalid_type_error: "Quantidade deve ser um número",
    })
    .positive("Quantidade deve ser positiva"),
  precoUnitario: z
    .number({
      required_error: "Preço unitário é obrigatório",
      invalid_type_error: "Preço deve ser um número",
    })
    .positive("Preço deve ser positivo"),
  valorTotal: z.number().positive("Valor total deve ser positivo"),
  vendedor: z.string().optional(),
  observacoes: z.string().optional(),
  formaPagamento: z.enum(["dinheiro", "pix", "cartao_credito", "cartao_debito", "transferencia"], {
    required_error: "Forma de pagamento é obrigatória",
  }),
  numeroTransacao: z.string().optional(),
  data: z.date({
    required_error: "Data é obrigatória",
  }),
})

export const inventorySchema = z.object({
  quantidade: z.number().min(0, "Quantidade não pode ser negativa"),
  precoCompra: z.number().positive("Preço de compra deve ser positivo"),
  precoVenda: z.number().positive("Preço de venda deve ser positivo"),
  minLevel: z.number().min(0, "Nível mínimo não pode ser negativo").optional(),
})

export const expenseSchema = z.object({
  tipo: z.literal("despesa"),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  valorTotal: z.number().positive("Valor deve ser positivo"),
  data: z.date({
    required_error: "Data é obrigatória",
  }),
  formaPagamento: z.enum(["dinheiro", "pix", "cartao_credito", "cartao_debito", "transferencia"]),
  observacoes: z.string().optional(),
})
