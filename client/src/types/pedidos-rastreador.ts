/**
 * Tipos para Pedidos de Rastreadores (API)
 */
export type StatusPedidoRastreador =
  | "SOLICITADO"
  | "EM_CONFIGURACAO"
  | "CONFIGURADO"
  | "DESPACHADO"
  | "ENTREGUE";

/** Status em minúsculo para o kanban */
export type StatusPedidoKey =
  | "solicitado"
  | "em_configuracao"
  | "configurado"
  | "despachado"
  | "entregue";

export type TipoDestinoPedido = "TECNICO" | "CLIENTE" | "MISTO";

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
  tipoDespacho?: string | null;
  transportadora?: string | null;
  numeroNf?: string | null;
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

export type PedidosRastreadoresListScope = "lista" | "config";

export type PedidosRastreadoresListResponse = { data: PedidoRastreadorApi[] };

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
