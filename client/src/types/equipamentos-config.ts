/** Tipos de domínio da tela de configuração (marcas, modelos, operadoras, simcard). */

export interface MarcaRastreador {
  id: number;
  nome: string;
  ativo: boolean;
  _count: { modelos: number };
}

export interface ModeloRastreador {
  id: number;
  nome: string;
  ativo: boolean;
  minCaracteresImei?: number | null;
  marca: { id: number; nome: string; ativo: boolean };
}

export interface Operadora {
  id: number;
  nome: string;
  ativo: boolean;
}

export interface PlanoSimcard {
  id: number;
  marcaSimcardId: number;
  planoMb: number;
  ativo: boolean;
}

export interface MarcaSimcard {
  id: number;
  nome: string;
  operadoraId: number;
  temPlanos: boolean;
  ativo: boolean;
  minCaracteresIccid?: number | null;
  operadora: { id: number; nome: string };
  planos?: PlanoSimcard[];
}
