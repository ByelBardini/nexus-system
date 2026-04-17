export interface KitResumo {
  id: number
  nome: string
}

export interface KitDetalhe {
  id: number
  nome: string
  criadoEm: string
  kitConcluido: boolean
  quantidade: number
  modelosOperadoras: string
  marcas: string[]
  modelos: string[]
  operadoras: string[]
}

export interface AparelhoNoKit {
  id: number
  identificador: string | null
  marca: string | null
  modelo: string | null
  operadora: string | null
  status: string
  proprietario?: string
  simVinculado?: { identificador: string | null; operadora: string | null } | null
  cliente?: { id: number; nome: string } | null
  tecnico?: { id: number; nome: string } | null
  kit?: { id: number; nome: string } | null
  kitId?: number | null
}

export interface KitComAparelhos {
  id: number
  nome: string
  criadoEm: string
  aparelhos: AparelhoNoKit[]
}

export interface KitVinculado {
  id: number
  nome: string
  quantidade: number
}

export type TipoDespacho = 'TRANSPORTADORA' | 'CORREIOS' | 'EM_MAOS'
