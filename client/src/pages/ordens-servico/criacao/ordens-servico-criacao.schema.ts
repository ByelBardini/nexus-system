import { z } from "zod";
import {
  isCpfCnpjValidationEnabled,
  validarCPFouCNPJ,
} from "@/lib/cpf-cnpj-validation";

const baseCriacaoOsFormSchema = z
  .object({
    ordemInstalacao: z.enum(["INFINITY", "CLIENTE"]),
    clienteOrdemId: z.number().optional(),
    isNovoSubcliente: z.boolean(),
    subclienteId: z.number().optional(),
    subclienteNome: z.string().optional(),
    subclienteCep: z.string().optional(),
    subclienteLogradouro: z.string().optional(),
    subclienteNumero: z.string().optional(),
    subclienteComplemento: z.string().optional(),
    subclienteBairro: z.string().optional(),
    subclienteCidade: z.string().optional(),
    subclienteEstado: z.string().optional(),
    subclienteCpf: z
      .string()
      .optional()
      .refine(
        (val) => !val || !isCpfCnpjValidationEnabled() || validarCPFouCNPJ(val),
        { message: "CPF ou CNPJ inválido" },
      ),
    subclienteEmail: z
      .string()
      .email("E-mail inválido")
      .optional()
      .or(z.literal("")),
    subclienteTelefone: z.string().optional(),
    subclienteCobranca: z.string().optional(),
    tecnicoId: z.number().optional(),
    veiculoPlaca: z.string().optional(),
    veiculoMarca: z.string().optional(),
    veiculoModelo: z.string().optional(),
    veiculoAno: z.string().optional(),
    veiculoCor: z.string().optional(),
    veiculoTipo: z.string().optional(),
    tipo: z.string().min(1, "Tipo de serviço obrigatório"),
    idAparelho: z.string().optional(),
    localInstalacao: z.string().optional(),
    posChave: z.string().optional(),
    observacoes: z.string().optional(),
  })
  .refine(
    (data) => {
      const placa = (data.veiculoPlaca ?? "").trim();
      if (!placa) return true;
      return !!(
        (data.veiculoMarca ?? "").trim() &&
        (data.veiculoModelo ?? "").trim() &&
        (data.veiculoAno ?? "").trim() &&
        (data.veiculoCor ?? "").trim()
      );
    },
    {
      message:
        "Marca, modelo, ano e cor são obrigatórios quando o veículo é informado",
      path: ["veiculoMarca"],
    },
  );

export const criacaoOsFormSchema = baseCriacaoOsFormSchema;
export type CriacaoOsFormData = z.infer<typeof baseCriacaoOsFormSchema>;

export const criacaoOsDefaultValues: CriacaoOsFormData = {
  ordemInstalacao: "INFINITY",
  clienteOrdemId: undefined,
  isNovoSubcliente: true,
  subclienteId: undefined,
  subclienteNome: "",
  subclienteCep: "",
  subclienteLogradouro: "",
  subclienteNumero: "",
  subclienteComplemento: "",
  subclienteBairro: "",
  subclienteCidade: "",
  subclienteEstado: "",
  subclienteCpf: "",
  subclienteEmail: "",
  subclienteTelefone: "",
  subclienteCobranca: "INFINITY",
  tecnicoId: undefined,
  veiculoPlaca: "",
  veiculoMarca: "",
  veiculoModelo: "",
  veiculoAno: "",
  veiculoCor: "",
  veiculoTipo: "",
  tipo: "",
  idAparelho: "",
  localInstalacao: "",
  posChave: "",
  observacoes: "",
};
