/**
 * Tipos para Pedidos de Rastreadores (API)
 */

export type TipoDestinoPedido = "TECNICO" | "CLIENTE" | "MISTO";

export type StatusPedidoRastreador =
  | "SOLICITADO"
  | "EM_CONFIGURACAO"
  | "CONFIGURADO"
  | "DESPACHADO"
  | "ENTREGUE";

export type UrgenciaPedido = "BAIXA" | "MEDIA" | "ALTA" | "URGENTE";

export interface TecnicoResumo {
  id: number;
  nome: string;
  cidade?: string | null;
  estado?: string | null;
  telefone?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidadeEndereco?: string | null;
  estadoEndereco?: string | null;
  cep?: string | null;
  cpfCnpj?: string | null;
}

export interface ClienteResumo {
  id: number;
  nome: string;
}

export interface SubclienteResumo {
  id: number;
  nome: string;
  cidade?: string | null;
  estado?: string | null;
  telefone?: string | null;
  email?: string | null;
  cpf?: string | null;
  cliente?: ClienteResumo;
}

export interface ClienteApi {
  id: number;
  nome: string;
  cnpj?: string | null;
}

export interface MarcaEquipamentoResumo {
  id: number;
  nome: string;
}

export interface ModeloEquipamentoResumo {
  id: number;
  nome: string;
  marcaId: number;
  marca?: MarcaEquipamentoResumo;
}

export interface PedidoRastreadorItemApi {
  id: number;
  proprietario: "INFINITY" | "CLIENTE";
  clienteId: number | null;
  quantidade: number;
  marcaEquipamentoId?: number | null;
  modeloEquipamentoId?: number | null;
  operadoraId?: number | null;
  cliente?: { id: number; nome: string } | null;
  marcaEquipamento?: MarcaEquipamentoResumo | null;
  modeloEquipamento?: ModeloEquipamentoResumo | null;
  operadora?: { id: number; nome: string } | null;
}

export interface PedidoRastreadorApi {
  id: number;
  codigo: string;
  tipoDestino: TipoDestinoPedido;
  tecnicoId: number | null;
  clienteId: number | null;
  subclienteId: number | null;
  quantidade: number;
  status: StatusPedidoRastreador;
  urgencia: UrgenciaPedido;
  dataSolicitacao?: string;
  marcaEquipamentoId?: number | null;
  modeloEquipamentoId?: number | null;
  operadoraId?: number | null;
  deClienteId?: number | null;
  criadoPorId: number | null;
  observacao: string | null;
  criadoEm: string;
  atualizadoEm: string;
  entregueEm: string | null;
  tecnico?: TecnicoResumo | null;
  cliente?: ClienteApi | null;
  subcliente?: SubclienteResumo | null;
  marcaEquipamento?: MarcaEquipamentoResumo | null;
  modeloEquipamento?: ModeloEquipamentoResumo | null;
  operadora?: { id: number; nome: string } | null;
  deCliente?: ClienteResumo | null;
  criadoPor?: { id: number; nome: string } | null;
  kitIds?: number[] | null;
  itens?: PedidoRastreadorItemApi[];
  historico?: Array<{
    statusAnterior: StatusPedidoRastreador;
    statusNovo: StatusPedidoRastreador;
    observacao: string | null;
    criadoEm: string;
  }>;
}

export interface PedidosListResponse {
  data: PedidoRastreadorApi[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AparelhoDestinatarioAssignment {
  aparelhoId: number;
  destinatarioProprietario: "INFINITY" | "CLIENTE";
  destinatarioClienteId: number | null;
}

export interface QuotaUsageItem {
  proprietario: "INFINITY" | "CLIENTE";
  clienteId: number | null;
  clienteNome: string | null;
  atribuido: number;
  total: number;
}

export interface AparelhosDestinatariosResponse {
  assignments: AparelhoDestinatarioAssignment[];
  quotaUsage: QuotaUsageItem[];
}

/** Status em minúsculo para o kanban */
export type StatusPedidoKey =
  | "solicitado"
  | "em_configuracao"
  | "configurado"
  | "despachado"
  | "entregue";

export const URGENCIA_LABELS: Record<string, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
  URGENTE: "Urgente",
};

export const STATUS_CONFIG: Record<
  StatusPedidoKey,
  { label: string; color: string; dotColor: string }
> = {
  solicitado: {
    label: "Solicitado",
    color: "amber",
    dotColor: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]",
  },
  em_configuracao: {
    label: "Em Configuração",
    color: "blue",
    dotColor: "bg-blue-500",
  },
  configurado: {
    label: "Configurado",
    color: "purple",
    dotColor: "bg-purple-500",
  },
  despachado: {
    label: "Despachado",
    color: "orange",
    dotColor: "bg-orange-500",
  },
  entregue: {
    label: "Entregue",
    color: "emerald",
    dotColor: "bg-emerald-500",
  },
};

export const STATUS_ORDER: StatusPedidoKey[] = [
  "solicitado",
  "em_configuracao",
  "configurado",
  "despachado",
  "entregue",
];

export const STATUS_TO_API: Record<StatusPedidoKey, StatusPedidoRastreador> = {
  solicitado: "SOLICITADO",
  em_configuracao: "EM_CONFIGURACAO",
  configurado: "CONFIGURADO",
  despachado: "DESPACHADO",
  entregue: "ENTREGUE",
};

export const URGENCIA_STYLE: Record<string, { bar: string; badge: string }> = {
  Baixa: {
    bar: "border-l-slate-300",
    badge: "bg-slate-50 text-slate-500 border-slate-200",
  },
  Média: {
    bar: "border-l-blue-400",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
  },
  Alta: {
    bar: "border-l-amber-500",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
  },
  Urgente: {
    bar: "border-l-red-500",
    badge: "bg-red-100 text-red-700 border-red-200",
  },
};

const STATUS_TO_KEY: Record<StatusPedidoRastreador, StatusPedidoKey> = {
  SOLICITADO: "solicitado",
  EM_CONFIGURACAO: "em_configuracao",
  CONFIGURADO: "configurado",
  DESPACHADO: "despachado",
  ENTREGUE: "entregue",
};

/** View model para o kanban e drawer */
export interface PedidoRastreadorView {
  id: number;
  codigo: string;
  destinatario: string;
  tipo: "tecnico" | "cliente" | "misto";
  quantidade: number;
  itensMisto?: Array<{ label: string; quantidade: number }>;
  status: StatusPedidoKey;
  dataSolicitacao?: string;
  marcaModelo?: string;
  operadora?: string;
  deCliente?: string;
  solicitadoEm?: string;
  entregueEm?: string | null;
  urgencia?: string;
  cidadeEstado?: string;
  endereco?: string;
  cpfCnpj?: string;
  contato?: { nome: string; telefone?: string; email?: string };
  historico?: Array<{ titulo: string; descricao: string; concluido: boolean }>;
}

export function mapPedidoToView(p: PedidoRastreadorApi): PedidoRastreadorView {
  const destinatario =
    p.tipoDestino === "TECNICO" || p.tipoDestino === "MISTO"
      ? (p.tecnico?.nome ?? "Técnico")
      : (p.subcliente?.nome ??
        p.cliente?.nome ??
        p.subcliente?.cliente?.nome ??
        "Cliente");
  const tipo =
    p.tipoDestino === "TECNICO"
      ? "tecnico"
      : p.tipoDestino === "MISTO"
        ? "misto"
        : "cliente";
  const itensMisto =
    p.tipoDestino === "MISTO" && p.itens
      ? p.itens.map((item) => ({
          label:
            item.proprietario === "INFINITY"
              ? "Infinity"
              : (item.cliente?.nome ?? `Cliente #${item.clienteId}`),
          quantidade: item.quantidade,
        }))
      : undefined;
  const urgenciaLabel = URGENCIA_LABELS[p.urgencia] ?? "Média";

  const dataSolicitacao = p.dataSolicitacao ?? p.criadoEm;
  const marcaModelo =
    p.modeloEquipamento && p.marcaEquipamento
      ? `${p.marcaEquipamento.nome} - ${p.modeloEquipamento.nome}`
      : p.modeloEquipamento?.marca
        ? `${p.modeloEquipamento.marca.nome} - ${p.modeloEquipamento.nome}`
        : p.marcaEquipamento?.nome
          ? p.marcaEquipamento.nome
          : undefined;

  const operadora = p.operadora?.nome;
  const deCliente = p.deCliente?.nome;

  const cidadeEstado =
    p.tipoDestino === "TECNICO" || p.tipoDestino === "MISTO"
      ? (() => {
          const t = p.tecnico;
          if (!t) return undefined;
          const cidade = t.cidadeEndereco ?? t.cidade;
          const estado = t.estadoEndereco ?? t.estado;
          if (cidade && estado) return `${cidade} - ${estado}`;
          if (cidade) return cidade;
          if (estado) return estado;
          return undefined;
        })()
      : (() => {
          if (p.subcliente?.cidade && p.subcliente?.estado)
            return `${p.subcliente.cidade} - ${p.subcliente.estado}`;
          if (p.subcliente?.cidade) return p.subcliente.cidade;
          if (p.subcliente?.estado) return p.subcliente.estado;
          return undefined;
        })();

  const endereco =
    p.tipoDestino === "TECNICO" || p.tipoDestino === "MISTO"
      ? (() => {
          const t = p.tecnico;
          if (!t) return undefined;
          const partes: string[] = [];
          if (t.logradouro) {
            const rua = [t.logradouro, t.numero].filter(Boolean).join(", ");
            if (rua) partes.push(rua);
          }
          if (t.complemento) partes.push(t.complemento);
          if (t.bairro) partes.push(t.bairro);
          const cidade = t.cidadeEndereco ?? t.cidade;
          const estado = t.estadoEndereco ?? t.estado;
          if (cidade && estado) partes.push(`${cidade} - ${estado}`);
          else if (cidade) partes.push(cidade);
          if (t.cep) partes.push(`CEP: ${t.cep}`);
          return partes.length > 0 ? partes.join(", ") : undefined;
        })()
      : p.subcliente?.cidade && p.subcliente?.estado
        ? `${p.subcliente.cidade}, ${p.subcliente.estado}`
        : (p.subcliente?.cidade ?? undefined);

  const cpfCnpj =
    p.tipoDestino === "TECNICO" || p.tipoDestino === "MISTO"
      ? (p.tecnico?.cpfCnpj ?? undefined)
      : (p.subcliente?.cpf ?? p.cliente?.cnpj ?? undefined);

  const contato =
    p.tipoDestino === "TECNICO" || p.tipoDestino === "MISTO"
      ? p.tecnico
        ? {
            nome: p.tecnico.nome,
            telefone: p.tecnico.telefone ?? undefined,
            email: undefined as string | undefined,
          }
        : undefined
      : p.subcliente
        ? {
            nome: p.subcliente.nome,
            telefone: p.subcliente.telefone ?? undefined,
            email: p.subcliente.email ?? undefined,
          }
        : p.cliente
          ? { nome: p.cliente.nome, telefone: undefined, email: undefined }
          : undefined;

  const historico = p.historico?.map((h) => ({
    titulo: h.statusNovo.replace(/_/g, " "),
    descricao: h.observacao ?? `${h.statusAnterior} → ${h.statusNovo}`,
    concluido: true,
  }));

  return {
    id: p.id,
    codigo: p.codigo,
    destinatario,
    tipo,
    itensMisto,
    quantidade: p.quantidade,
    status: STATUS_TO_KEY[p.status],
    dataSolicitacao,
    marcaModelo,
    operadora,
    deCliente,
    solicitadoEm: p.criadoEm,
    entregueEm: p.entregueEm,
    urgencia: urgenciaLabel,
    cidadeEstado: cidadeEstado ?? undefined,
    endereco,
    cpfCnpj: cpfCnpj ?? undefined,
    contato,
    historico,
  };
}
