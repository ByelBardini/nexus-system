import { z } from "zod";

export const tecnicoFormSchema = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  cpfCnpj: z.string().optional(),
  telefone: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidadeEndereco: z.string().optional(),
  estadoEndereco: z.string().optional(),
  ativo: z.boolean(),
  instalacaoComBloqueio: z.coerce.number().min(0),
  instalacaoSemBloqueio: z.coerce.number().min(0),
  revisao: z.coerce.number().min(0),
  retirada: z.coerce.number().min(0),
  deslocamento: z.coerce.number().min(0),
});

export type TecnicoFormData = z.infer<typeof tecnicoFormSchema>;

export function emptyTecnicoFormValues(): TecnicoFormData {
  return {
    nome: "",
    cpfCnpj: "",
    telefone: "",
    cidade: "",
    estado: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidadeEndereco: "",
    estadoEndereco: "",
    ativo: true,
    instalacaoComBloqueio: 0,
    instalacaoSemBloqueio: 0,
    revisao: 0,
    retirada: 0,
    deslocamento: 0,
  };
}

/** Corpo JSON para POST/PATCH /tecnicos (preços em unidade monetária, não centavos). */
export function buildTecnicoApiBody(data: TecnicoFormData) {
  return {
    nome: data.nome,
    cpfCnpj: data.cpfCnpj || undefined,
    telefone: data.telefone || undefined,
    cidade: data.cidade || undefined,
    estado: data.estado || undefined,
    cep: data.cep || undefined,
    logradouro: data.logradouro || undefined,
    numero: data.numero || undefined,
    complemento: data.complemento || undefined,
    bairro: data.bairro || undefined,
    cidadeEndereco: data.cidadeEndereco || undefined,
    estadoEndereco: data.estadoEndereco || undefined,
    ativo: data.ativo,
    precos: {
      instalacaoComBloqueio: data.instalacaoComBloqueio / 100,
      instalacaoSemBloqueio: data.instalacaoSemBloqueio / 100,
      revisao: data.revisao / 100,
      retirada: data.retirada / 100,
      deslocamento: data.deslocamento / 100,
    },
  };
}
