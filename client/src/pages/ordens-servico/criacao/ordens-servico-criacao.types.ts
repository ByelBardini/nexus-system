export interface SubclienteFull {
  id: number;
  nome: string;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cpf?: string | null;
  email?: string | null;
  telefone?: string | null;
  cobrancaTipo?: string | null;
}

export interface Cliente {
  id: number;
  nome: string;
  subclientes?: SubclienteFull[];
}

export interface PrecoTecnico {
  instalacaoComBloqueio?: number | string;
  instalacaoSemBloqueio?: number | string;
  revisao?: number | string;
  retirada?: number | string;
  deslocamento?: number | string;
}

export interface Tecnico {
  id: number;
  nome: string;
  cidade?: string | null;
  estado?: string | null;
  precos?: PrecoTecnico | null;
}

export interface AparelhoRastreadorList {
  id: number;
  identificador?: string | null;
  tipo: string;
  status: string;
}

export interface SubclienteEnderecoInput {
  nome: string;
  cep: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade: string;
  estado: string;
  cpf?: string;
  email?: string;
  telefone: string;
  cobrancaTipo?: string;
}

export interface CriarOrdemServicoPayload {
  tipo: string;
  clienteId: number;
  subclienteId?: number;
  subclienteCreate?: SubclienteEnderecoInput;
  subclienteUpdate?: SubclienteEnderecoInput;
  tecnicoId?: number;
  veiculoId?: number;
  observacoes?: string;
  idAparelho?: string;
  localInstalacao?: string;
  posChave?: string;
}
