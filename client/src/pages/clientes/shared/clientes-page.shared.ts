import { z } from "zod";
import { formatarCEP } from "@/lib/format";
import type {
  Cliente,
  ClienteEnderecoExibicao,
  ClientesFooterStats,
  StatusCliente,
  TipoContrato,
} from "@/types/clientes";

export type {
  Cliente,
  ClienteContato,
  ClienteEnderecoExibicao,
  ClientesFooterStats,
  StatusCliente,
  TipoContrato,
} from "@/types/clientes";

/** Tamanho da página na listagem de clientes. */
export const CLIENTES_PAGE_SIZE = 10;

export const TIPO_CONTRATO_VALUES = ["COMODATO", "AQUISICAO"] as const satisfies readonly TipoContrato[];

export const STATUS_CLIENTE_VALUES = [
  "ATIVO",
  "PENDENTE",
  "INATIVO",
] as const satisfies readonly StatusCliente[];

export const TIPO_CONTRATO_LABEL: Record<TipoContrato, string> = {
  COMODATO: "Comodato",
  AQUISICAO: "Aquisição",
};

export const STATUS_CLIENTE_LABEL: Record<StatusCliente, string> = {
  ATIVO: "Ativo",
  PENDENTE: "Pendente",
  INATIVO: "Inativo",
};

/** Cor do indicador (bolinha) na listagem por status. */
export const STATUS_INDICATOR_DOT_CLASS: Record<StatusCliente, string> = {
  ATIVO: "bg-emerald-500",
  PENDENTE: "bg-amber-400",
  INATIVO: "bg-slate-300",
};

/** Classes Tailwind para badge de tipo de contrato (borda incluída no uso). */
export const TIPO_CONTRATO_BADGE_CLASS: Record<TipoContrato, string> = {
  COMODATO: "bg-amber-100 text-amber-700 border-amber-200",
  AQUISICAO: "bg-indigo-100 text-indigo-700 border-indigo-200",
};

/** Quadrado da legenda do rodapé (cores alinhadas ao badge). */
export const TIPO_CONTRATO_LEGEND_SWATCH_CLASS: Record<TipoContrato, string> =
  {
    COMODATO: "bg-amber-100 border-amber-300",
    AQUISICAO: "bg-indigo-100 border-indigo-300",
  };

export const FILTRO_TIPO_CONTRATO_OPTIONS: { value: string; label: string }[] =
  [
    { value: "todos", label: "Todos" },
    ...TIPO_CONTRATO_VALUES.map((v) => ({
      value: v,
      label: TIPO_CONTRATO_LABEL[v],
    })),
  ];

export const FILTRO_ESTOQUE_OPTIONS = [
  { value: "todos", label: "Todos" },
  { value: "proprio", label: "Próprio" },
  { value: "terceiro", label: "Terceiro" },
] as const;

export const STATUS_FORM_OPTIONS: { value: StatusCliente; label: string }[] =
  STATUS_CLIENTE_VALUES.map((v) => ({
    value: v,
    label: STATUS_CLIENTE_LABEL[v],
  }));

export const TIPO_CONTRATO_SELECT_OPTIONS: { value: TipoContrato; label: string }[] =
  TIPO_CONTRATO_VALUES.map((v) => ({
    value: v,
    label: TIPO_CONTRATO_LABEL[v],
  }));

export const contatoSchema = z.object({
  id: z.number().optional(),
  nome: z.string().min(1, "Nome obrigatório"),
  celular: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
});

export const clienteFormSchema = z.object({
  nome: z.string().min(1, "Razão social obrigatória"),
  nomeFantasia: z.string().optional(),
  cnpj: z.string().optional(),
  tipoContrato: z.enum(TIPO_CONTRATO_VALUES),
  estoqueProprio: z.boolean(),
  status: z.enum(STATUS_CLIENTE_VALUES),
  cor: z.string().optional(),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  contatos: z.array(contatoSchema),
});

export type ClienteFormData = z.infer<typeof clienteFormSchema>;

export function getClientesFooterStats(
  todos: Cliente[],
  filtrados: Cliente[],
): ClientesFooterStats {
  return {
    exibindo: filtrados.length,
    totalCadastro: todos.length,
    ativosNaSelecao: filtrados.filter((c) => c.status === "ATIVO").length,
  };
}

export function getDefaultClienteFormValues(): ClienteFormData {
  return {
    nome: "",
    nomeFantasia: "",
    cnpj: "",
    tipoContrato: "COMODATO",
    estoqueProprio: false,
    status: "ATIVO",
    cor: undefined,
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    contatos: [],
  };
}

function optionalEnderecoFields(data: ClienteFormData) {
  return {
    cor: data.cor || undefined,
    cep: data.cep || undefined,
    logradouro: data.logradouro || undefined,
    numero: data.numero || undefined,
    complemento: data.complemento || undefined,
    bairro: data.bairro || undefined,
    cidade: data.cidade || undefined,
    estado: data.estado || undefined,
  };
}

/** Remove chaves com `undefined` (igual ao `JSON.stringify` no fio). */
function omitUndefinedKeys<T extends Record<string, unknown>>(obj: T): T {
  const out = {} as T;
  for (const key of Object.keys(obj) as (keyof T)[]) {
    const v = obj[key];
    if (v !== undefined) out[key] = v as T[keyof T];
  }
  return out;
}

export type ClienteCreateApiBody = Omit<
  ClienteFormData,
  "contatos" | keyof ReturnType<typeof optionalEnderecoFields>
> &
  ReturnType<typeof optionalEnderecoFields> & {
    contatos: Array<{ nome: string; celular?: string; email?: string }>;
  };

export type ClienteUpdateApiBody = ClienteCreateApiBody & {
  contatos: Array<{
    id?: number;
    nome: string;
    celular?: string;
    email?: string;
  }>;
};

export function buildClienteApiBody(
  data: ClienteFormData,
  mode: "create",
): ClienteCreateApiBody;
export function buildClienteApiBody(
  data: ClienteFormData,
  mode: "update",
): ClienteUpdateApiBody;
export function buildClienteApiBody(
  data: ClienteFormData,
  mode: "create" | "update",
): ClienteCreateApiBody | ClienteUpdateApiBody {
  const base = omitUndefinedKeys({
    nome: data.nome,
    nomeFantasia: data.nomeFantasia || undefined,
    cnpj: data.cnpj || undefined,
    tipoContrato: data.tipoContrato,
    estoqueProprio: data.estoqueProprio,
    status: data.status,
    ...optionalEnderecoFields(data),
  } as Record<string, unknown>);

  if (mode === "create") {
    return omitUndefinedKeys({
      ...base,
      contatos: data.contatos.map((c) =>
        omitUndefinedKeys({
          nome: c.nome,
          celular: c.celular || undefined,
          email: c.email || undefined,
        } as Record<string, unknown>),
      ),
    }) as ClienteCreateApiBody;
  }

  return omitUndefinedKeys({
    ...base,
    contatos: data.contatos.map((c) =>
      omitUndefinedKeys({
        ...(c.id !== undefined ? { id: c.id } : {}),
        nome: c.nome,
        celular: c.celular || undefined,
        email: c.email || undefined,
      } as Record<string, unknown>),
    ),
  }) as ClienteUpdateApiBody;
}

/** Formata endereço como na linha expandida da tabela (inclui CEP). */
export function formatClienteEnderecoLinhaLista(
  c: Partial<ClienteEnderecoExibicao>,
): string {
  let s = [
    c.logradouro,
    c.numero != null && String(c.numero).trim() !== ""
      ? `nº ${c.numero}`
      : "",
    c.complemento,
  ]
    .filter(Boolean)
    .join(", ");
  if (c.bairro) s += ` - ${c.bairro}`;
  if (c.cidade || c.estado) {
    s += ` - ${[c.cidade, c.estado].filter(Boolean).join("/")}`;
  }
  if (c.cep) s += ` - CEP ${formatarCEP(c.cep)}`;
  return s.trim();
}

/** Resumo lateral do modal (sem CEP; número sem prefixo "nº"). */
export function formatClienteEnderecoResumo(c: {
  logradouro?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
}): string {
  const base = [c.logradouro, c.numero, c.bairro].filter(Boolean).join(", ");
  const loc = [c.cidade, c.estado].filter(Boolean).join("/");
  if (!base && !loc) return "";
  if (!loc) return base;
  if (!base) return `— ${loc}`;
  return `${base} — ${loc}`;
}

export function clienteToFormValues(cliente: Cliente): ClienteFormData {
  return {
    nome: cliente.nome,
    nomeFantasia: cliente.nomeFantasia ?? "",
    cnpj: cliente.cnpj ?? "",
    tipoContrato: cliente.tipoContrato,
    estoqueProprio: cliente.estoqueProprio,
    status: cliente.status,
    cor: cliente.cor ?? undefined,
    cep: cliente.cep ?? "",
    logradouro: cliente.logradouro ?? "",
    numero: cliente.numero ?? "",
    complemento: cliente.complemento ?? "",
    bairro: cliente.bairro ?? "",
    cidade: cliente.cidade ?? "",
    estado: cliente.estado ?? "",
    contatos: cliente.contatos.map((ct) => ({
      id: ct.id,
      nome: ct.nome,
      celular: ct.celular ?? "",
      email: ct.email ?? "",
    })),
  };
}
