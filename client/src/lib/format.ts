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

/**
 * Formata CNPJ: 00.000.000/0001-00
 */
export function formatarCNPJ(val: string): string {
  const d = val.replace(/\D/g, '')
  if (d.length <= 2) return d
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`
}

/**
 * Remove formatação do CNPJ
 */
export function cnpjApenasDigitos(val: string): string {
  return val.replace(/\D/g, '')
}

/**
 * Formata CPF: 000.000.000-00
 */
export function formatarCPF(val: string): string {
  const d = val.replace(/\D/g, '')
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`
}

/**
 * Formata CPF ou CNPJ automaticamente baseado no número de dígitos
 * Até 11 dígitos: CPF (000.000.000-00)
 * Mais de 11 dígitos: CNPJ (00.000.000/0001-00)
 */
export function formatarCPFCNPJ(val: string): string {
  const d = val.replace(/\D/g, '')
  if (d.length <= 11) return formatarCPF(d)
  return formatarCNPJ(d)
}

/**
 * Remove formatação de CPF/CNPJ
 */
export function cpfCnpjApenasDigitos(val: string): string {
  return val.replace(/\D/g, '')
}
