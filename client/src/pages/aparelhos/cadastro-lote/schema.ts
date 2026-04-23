import { z } from "zod";

export const loteFormSchema = z
  .object({
    referencia: z.preprocess(
      (val) => val ?? "",
      z.string().refine((s) => s.length >= 1, "Referência obrigatória"),
    ),
    notaFiscal: z.preprocess((val) => val ?? "", z.string().optional()),
    dataChegada: z.preprocess(
      (val) => val ?? "",
      z.string().refine((s) => s.length >= 1, "Data obrigatória"),
    ),
    proprietarioTipo: z.enum(["INFINITY", "CLIENTE"]),
    clienteId: z.number().nullable(),
    tipo: z.enum(["RASTREADOR", "SIM"]),
    marca: z.preprocess((val) => val ?? "", z.string()),
    modelo: z.preprocess((val) => val ?? "", z.string()),
    operadora: z.preprocess((val) => val ?? "", z.string()),
    marcaSimcard: z.string().optional(),
    planoSimcard: z.string().optional(),
    quantidade: z.number().min(0),
    definirIds: z.boolean(),
    idsTexto: z.string().optional(),
    valorUnitario: z.number().min(1, "Valor unitário deve ser maior que zero"),
    abaterDivida: z.boolean(),
    abaterDebitoId: z.number().nullable(),
    abaterQuantidade: z.number().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.proprietarioTipo === "CLIENTE" && !data.clienteId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecione o cliente",
        path: ["clienteId"],
      });
    }
    if (data.abaterDivida) {
      if (!data.abaterDebitoId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Selecione o débito",
          path: ["abaterDebitoId"],
        });
      }
      if (!data.abaterQuantidade || data.abaterQuantidade <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Informe a quantidade a abater",
          path: ["abaterQuantidade"],
        });
      }
    }
    if (data.tipo === "RASTREADOR") {
      if (!data.marca) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Marca obrigatória",
          path: ["marca"],
        });
      }
      if (!data.modelo) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Modelo obrigatório",
          path: ["modelo"],
        });
      }
    }
    if (data.tipo === "SIM" && !data.operadora) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Operadora obrigatória",
        path: ["operadora"],
      });
    }
    if (!data.definirIds && data.quantidade <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Quantidade obrigatória",
        path: ["quantidade"],
      });
    }
  });

export type LoteFormValues = z.infer<typeof loteFormSchema>;

export const loteFormDefaultValues: LoteFormValues = {
  referencia: "",
  notaFiscal: "",
  dataChegada: new Date().toISOString().split("T")[0],
  proprietarioTipo: "INFINITY",
  clienteId: null,
  tipo: "RASTREADOR",
  marca: "",
  modelo: "",
  operadora: "",
  marcaSimcard: "",
  planoSimcard: "",
  quantidade: 0,
  definirIds: true,
  idsTexto: "",
  valorUnitario: 0,
  abaterDivida: false,
  abaterDebitoId: null,
  abaterQuantidade: null,
};
