export type ComunicacaoResult = "COMUNICANDO" | "AGUARDANDO" | "NAO_COMUNICOU";

/** OS em testes (resposta da API ordens-servico/testando) */
export interface OsTeste {
  id: number;
  numero: number;
  tipo: string;
  status: string;
  clienteId: number;
  subclienteId: number | null;
  veiculoId: number | null;
  tecnicoId: number | null;
  idAparelho: string | null;
  cliente: { id: number; nome: string };
  subcliente: { id: number; nome: string } | null;
  veiculo: { id: number; placa: string; marca: string; modelo: string } | null;
  tecnico: { id: number; nome: string } | null;
  subclienteSnapshotNome?: string | null;
  tempoEmTestesMin: number;
}

/** Rastreador para seleção (resposta da API aparelhos/para-testes) */
export interface RastreadorParaTeste {
  id: number;
  identificador: string | null;
  marca: string | null;
  modelo: string | null;
  status: string;
  operadora: string | null;
  criadoEm: string;
  cliente: { id: number; nome: string } | null;
  tecnico: { id: number; nome: string } | null;
  marcaSimcard: {
    id: number;
    nome: string;
    operadora?: { id: number; nome: string };
  } | null;
  planoSimcard?: { id: number; planoMb: number } | null;
  simVinculado?: {
    id: number;
    identificador: string | null;
    operadora?: string | null;
    marcaSimcard?: { nome: string; operadora?: { nome: string } } | null;
    planoSimcard?: { planoMb: number } | null;
  } | null;
}
