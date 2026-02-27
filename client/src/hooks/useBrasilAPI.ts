import { useQuery } from '@tanstack/react-query'

const BRASIL_API = 'https://brasilapi.com.br/api'
const VIA_CEP_API = 'https://viacep.com.br/ws'

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

export interface EnderecoCEP {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
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

export async function buscarCEP(cep: string): Promise<EnderecoCEP | null> {
  const cepLimpo = cep.replace(/\D/g, '')
  if (cepLimpo.length !== 8) return null

  try {
    const res = await fetch(`${VIA_CEP_API}/${cepLimpo}/json/`)
    if (!res.ok) return null
    const data: EnderecoCEP = await res.json()
    if (data.erro) return null
    return data
  } catch {
    return null
  }
}
