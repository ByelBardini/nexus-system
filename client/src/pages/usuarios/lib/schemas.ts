import { z } from "zod";

export const schemaCreate = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  email: z.string().email("Email inválido"),
  ativo: z.boolean(),
  setor: z.string().nullable().optional(),
  cargoIds: z.array(z.number()),
});

export const schemaEdit = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  email: z.string().email("Email inválido"),
  ativo: z.boolean(),
  setor: z.string().nullable().optional(),
});

export type FormCreate = z.infer<typeof schemaCreate>;
export type FormEdit = z.infer<typeof schemaEdit>;
