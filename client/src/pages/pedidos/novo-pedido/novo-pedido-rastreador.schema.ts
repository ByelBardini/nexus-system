import { z } from "zod";

export const schemaItemMisto = z.object({
  proprietario: z.enum(["INFINITY", "CLIENTE"]),
  clienteId: z.number().optional(),
  quantidade: z.number().min(1, "Mínimo 1"),
  marcaModeloEspecifico: z.boolean().optional(),
  marcaEquipamentoId: z.number().optional(),
  modeloEquipamentoId: z.number().optional(),
  operadoraEspecifica: z.boolean().optional(),
  operadoraId: z.number().optional(),
});

export const schemaNovoPedido = z
  .object({
    tipoDestino: z.enum(["TECNICO", "CLIENTE", "MISTO"]),
    tecnicoId: z.number().optional(),
    destinoCliente: z.string().optional(),
    deCliente: z.boolean().optional(),
    deClienteId: z.number().optional(),
    dataSolicitacao: z.string().min(1, "Data obrigatória"),
    marcaModeloEspecifico: z.boolean().optional(),
    marcaEquipamentoId: z.number().optional(),
    modeloEquipamentoId: z.number().optional(),
    operadoraEspecifica: z.boolean().optional(),
    operadoraId: z.number().optional(),
    quantidade: z.number().min(1, "Mínimo 1 unidade").optional(),
    itensMisto: z.array(schemaItemMisto).optional(),
    urgencia: z.enum(["BAIXA", "MEDIA", "ALTA", "URGENTE"]).optional(),
    observacao: z.string().optional(),
  })
  .refine(
    (d) =>
      d.tipoDestino !== "TECNICO" || (d.tecnicoId != null && d.tecnicoId > 0),
    { message: "Selecione o técnico", path: ["tecnicoId"] },
  )
  .refine(
    (d) =>
      d.tipoDestino !== "MISTO" || (d.tecnicoId != null && d.tecnicoId > 0),
    { message: "Selecione o técnico", path: ["tecnicoId"] },
  )
  .refine(
    (d) =>
      d.tipoDestino !== "CLIENTE" ||
      (d.destinoCliente != null && d.destinoCliente.length > 0),
    { message: "Selecione o destinatário", path: ["destinoCliente"] },
  );

export type FormNovoPedido = z.infer<typeof schemaNovoPedido>;

export function getDefaultNovoPedidoRastreadorFormValues(
  dataSolicitacao: string = new Date().toISOString().slice(0, 10),
): FormNovoPedido {
  return {
    tipoDestino: "TECNICO",
    tecnicoId: undefined,
    destinoCliente: "",
    deCliente: false,
    deClienteId: undefined,
    dataSolicitacao,
    marcaModeloEspecifico: false,
    marcaEquipamentoId: undefined,
    modeloEquipamentoId: undefined,
    operadoraEspecifica: false,
    operadoraId: undefined,
    quantidade: 0,
    itensMisto: [{ proprietario: "INFINITY", quantidade: 0 }],
    urgencia: "MEDIA",
    observacao: "",
  };
}
