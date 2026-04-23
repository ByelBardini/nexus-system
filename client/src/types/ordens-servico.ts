export interface OrdensServicoResumo {
  agendado: number;
  emTestes: number;
  testesRealizados: number;
  aguardandoCadastro: number;
  finalizado: number;
}

export interface OrdemServicoListItem {
  id: number;
  numero: number;
  tipo: string;
  status: string;
  cliente: { id: number; nome: string };
  subcliente?: { id: number; nome: string } | null;
  subclienteSnapshotNome?: string | null;
  veiculo?: { id: number; placa: string } | null;
  tecnico?: { id: number; nome: string } | null;
  criadoEm: string;
}

export interface OrdensServicoPaginatedResult {
  data: OrdemServicoListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type SubclienteParaExibicao = {
  id?: number;
  nome: string;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cep?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cpf?: string | null;
  email?: string | null;
  telefone?: string | null;
};

export interface OrdemServicoDetalhe {
  id: number;
  numero: number;
  tipo: string;
  status: string;
  observacoes: string | null;
  criadoEm: string;
  idAparelho?: string | null;
  localInstalacao?: string | null;
  posChave?: string | null;
  idEntrada?: string | null;
  localInstalacaoEntrada?: string | null;
  posChaveEntrada?: string | null;
  cliente: { id: number; nome: string };
  subcliente?: SubclienteParaExibicao | null;
  subclienteSnapshotNome?: string | null;
  subclienteSnapshotLogradouro?: string | null;
  subclienteSnapshotNumero?: string | null;
  subclienteSnapshotComplemento?: string | null;
  subclienteSnapshotBairro?: string | null;
  subclienteSnapshotCidade?: string | null;
  subclienteSnapshotEstado?: string | null;
  subclienteSnapshotCep?: string | null;
  subclienteSnapshotCpf?: string | null;
  subclienteSnapshotEmail?: string | null;
  subclienteSnapshotTelefone?: string | null;
  tecnico?: {
    id: number;
    nome: string;
    cep?: string | null;
    logradouro?: string | null;
    numero?: string | null;
    complemento?: string | null;
    bairro?: string | null;
    cidadeEndereco?: string | null;
    estadoEndereco?: string | null;
  } | null;
  veiculo?: {
    id: number;
    placa: string;
    marca?: string;
    modelo?: string;
    ano?: number;
    cor?: string;
  } | null;
  criadoPor?: { id: number; nome: string } | null;
  atualizadoEm?: string;
  historico?: {
    statusAnterior: string;
    statusNovo: string;
    criadoEm: string;
    observacao?: string | null;
  }[];
  plataforma?: string | null;
  statusCadastro?: string | null;
  concluidoEm?: string | null;
  concluidoPor?: { id: number; nome: string } | null;
}
