import { z } from "zod";

const schema = z
  .object({
    identificador: z.preprocess(
      (v) => v ?? "",
      z.string().refine((s) => s.length >= 1, "Identificador obrigatório"),
    ),
    tipo: z.enum(["RASTREADOR", "SIM"]),
    marca: z.preprocess((v) => v ?? "", z.string()),
    modelo: z.preprocess((v) => v ?? "", z.string()),
    operadora: z.preprocess((v) => v ?? "", z.string()),
    marcaSimcardId: z.preprocess((v) => v ?? "", z.string().optional()),
    planoSimcardId: z.preprocess((v) => v ?? "", z.string().optional()),
    origem: z.enum(["RETIRADA_CLIENTE", "DEVOLUCAO_TECNICO", "COMPRA_AVULSA"]),
    responsavelEntrega: z.preprocess((v) => v ?? "", z.string().optional()),
    proprietario: z.enum(["INFINITY", "CLIENTE"]),
    clienteId: z.number().nullable(),
    notaFiscal: z.preprocess((v) => v ?? "", z.string().optional()),
    observacoes: z.preprocess((v) => v ?? "", z.string().optional()),
    status: z.enum(["NOVO_OK", "EM_MANUTENCAO", "CANCELADO_DEFEITO"]),
    categoriaFalha: z.enum([
      "FALHA_COMUNICACAO",
      "PROBLEMA_ALIMENTACAO",
      "DANO_FISICO",
      "CURTO_CIRCUITO",
      "OUTRO",
    ]),
    destinoDefeito: z.enum(["SUCATA", "GARANTIA", "LABORATORIO"]),
    abaterDivida: z.boolean(),
    abaterDebitoId: z.number().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.tipo === "RASTREADOR") {
      if (!data.marca)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Marca obrigatória",
          path: ["marca"],
        });
      if (!data.modelo)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Modelo obrigatório",
          path: ["modelo"],
        });
    }
    if (data.tipo === "SIM" && !data.operadora) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Operadora obrigatória",
        path: ["operadora"],
      });
    }
    if (data.proprietario === "CLIENTE" && !data.clienteId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecione o cliente",
        path: ["clienteId"],
      });
    }
  });

export type FormDataCadastroIndividual = z.infer<typeof schema>;

export const cadastroIndividualSchema = schema;

export const cadastroIndividualDefaultValues: FormDataCadastroIndividual = {
  identificador: "",
  tipo: "RASTREADOR",
  marca: "",
  modelo: "",
  operadora: "",
  marcaSimcardId: "",
  planoSimcardId: "",
  origem: "DEVOLUCAO_TECNICO",
  responsavelEntrega: "",
  proprietario: "INFINITY",
  clienteId: null,
  notaFiscal: "",
  observacoes: "",
  status: "EM_MANUTENCAO",
  categoriaFalha: "FALHA_COMUNICACAO",
  destinoDefeito: "LABORATORIO",
  abaterDivida: false,
  abaterDebitoId: null,
};
