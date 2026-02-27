/**
 * Formata centavos para exibição em reais (100 = "1,00")
 */
export function centavosParaReais(centavos: number): string {
  const reais = centavos / 100
  return reais.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Converte string formatada ou número para centavos
 * "1,50" ou "1.50" ou 1.5 -> 150
 */
export function reaisParaCentavos(val: string | number): number {
  if (typeof val === 'number') return Math.round(val * 100)
  const limpo = String(val).replace(/\D/g, '')
  return parseInt(limpo || '0', 10)
}

/**
 * Formata telefone: celular (xx) xxxxx-xxxx ou fixo (xx) xxxx-xxxx
 * Até 10 dígitos: fixo. 11 dígitos: celular.
 */
export function formatarTelefone(val: string): string {
  const d = val.replace(/\D/g, '')
  if (d.length <= 2) return d ? `(${d}` : ''
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}${d.length > 6 ? '-' + d.slice(6, 10) : ''}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`
}

/**
 * Remove formatação do telefone
 */
export function telefoneApenasDigitos(val: string): string {
  return val.replace(/\D/g, '')
}

/**
 * Formata CEP: 12345-678
 */
export function formatarCEP(val: string): string {
  const d = val.replace(/\D/g, '')
  if (d.length <= 5) return d
  return `${d.slice(0, 5)}-${d.slice(5, 8)}`
}

/**
 * Remove formatação do CEP
 */
export function cepApenasDigitos(val: string): string {
  return val.replace(/\D/g, '')
}
