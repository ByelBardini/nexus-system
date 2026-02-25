import { useQuery } from '@tanstack/react-query'

const BRASIL_API = 'https://brasilapi.com.br/api'

export interface UF {
  id: number
  sigla: string
  nome: string
  regiao: { id: number; sigla: string; nome: string }
}

export interface Municipio {
  nome: string
  codigo_ibge: string
}

export function useUFs() {
  return useQuery<UF[]>({
    queryKey: ['brasil-api', 'ufs'],
    queryFn: async () => {
      const res = await fetch(`${BRASIL_API}/ibge/uf/v1`)
      if (!res.ok) throw new Error('Erro ao carregar UFs')
      return res.json()
    },
  })
}

export function useMunicipios(siglaUF: string | null) {
  return useQuery<Municipio[]>({
    queryKey: ['brasil-api', 'municipios', siglaUF],
    queryFn: async () => {
      if (!siglaUF) return []
      const res = await fetch(`${BRASIL_API}/ibge/municipios/v1/${siglaUF}`)
      if (!res.ok) throw new Error('Erro ao carregar municípios')
      return res.json()
    },
    enabled: !!siglaUF,
  })
}
