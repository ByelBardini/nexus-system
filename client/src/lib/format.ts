/**
 * Formata valor em reais como moeda: "R$ 1,00"
 */
export function formatarMoeda(reais: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(reais);
}

/**
 * Formata centavos para exibição em reais (100 = "R$ 1,00")
 */
export function formatarMoedaDeCentavos(centavos: number): string {
  return formatarMoeda(centavos / 100);
}

/**
 * Formata centavos para exibição em reais (100 = "1,00") - sem símbolo
 */
export function centavosParaReais(centavos: number): string {
  const reais = centavos / 100;
  return reais.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Converte string formatada ou número para centavos
 * "1,50" ou "1.50" ou 1.5 -> 150
 */
export function reaisParaCentavos(val: string | number): number {
  if (typeof val === "number") return Math.round(val * 100);
  const limpo = String(val).replace(/\D/g, "");
  return parseInt(limpo || "0", 10);
}

/**
 * Formata telefone: celular (xx) xxxxx-xxxx ou fixo (xx) xxxx-xxxx
 * Até 10 dígitos: fixo. 11 dígitos: celular.
 */
export function formatarTelefone(val: string): string {
  const d = val.replace(/\D/g, "");
  if (d.length <= 2) return d ? `(${d}` : "";
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}${d.length > 6 ? "-" + d.slice(6, 10) : ""}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
}

/**
 * Remove formatação do telefone
 */
export function telefoneApenasDigitos(val: string): string {
  return val.replace(/\D/g, "");
}

/**
 * Formata CEP: 12345-678
 */
export function formatarCEP(val: string): string {
  const d = val.replace(/\D/g, "");
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5, 8)}`;
}

/**
 * Remove formatação do CEP
 */
export function cepApenasDigitos(val: string): string {
  return val.replace(/\D/g, "");
}

/**
 * Formata placa: Mercosul XXX-9X99 ou antiga XXX-1234
 * Aceita letras e números, formata automaticamente
 */
export function formatarPlaca(val: string): string {
  const s = val
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 7);
  if (s.length <= 3) return s;
  return `${s.slice(0, 3)}-${s.slice(3)}`;
}

/**
 * Remove formatação da placa (apenas letras e números)
 */
export function placaApenasAlfanumericos(val: string): string {
  return val.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

/**
 * Formata CNPJ: 00.000.000/0001-00
 */
export function formatarCNPJ(val: string): string {
  const d = val.replace(/\D/g, "");
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12)
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
}

/**
 * Remove formatação do CNPJ
 */
export function cnpjApenasDigitos(val: string): string {
  return val.replace(/\D/g, "");
}

/**
 * Formata CPF: 000.000.000-00
 */
export function formatarCPF(val: string): string {
  const d = val.replace(/\D/g, "");
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
}

/**
 * Formata CPF ou CNPJ automaticamente baseado no número de dígitos
 * Até 11 dígitos: CPF (000.000.000-00)
 * Mais de 11 dígitos: CNPJ (00.000.000/0001-00)
 */
export function formatarCPFCNPJ(val: string): string {
  const d = val.replace(/\D/g, "");
  if (d.length <= 11) return formatarCPF(d);
  return formatarCNPJ(d);
}

/**
 * Remove formatação de CPF/CNPJ
 */
export function cpfCnpjApenasDigitos(val: string): string {
  return val.replace(/\D/g, "");
}

/**
 * Converte string de data para Date no fuso local.
 * Strings só com data (YYYY-MM-DD) são interpretadas como UTC midnight pelo JS,
 * causando dia errado em fusos como Brasil. Esta função garante parse correto.
 */
export function parseDataLocal(str: string): Date {
  if (!str) return new Date(0);
  if (str.includes("T")) {
    return new Date(str);
  }
  // YYYY-MM-DD: usar meio-dia local para evitar deslocamento de dia
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0);
}

/**
 * Formata data com mês curto e ano: "12 abr. 2026"
 */
export function formatarDataCompleta(iso: string): string {
  const d = parseDataLocal(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Formata data/hora curta sem ano: "12/04 14:30"
 */
export function formatarDataHoraCurta(iso: string): string {
  const d = parseDataLocal(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formata data/hora completa: "12/04/2026 14:30"
 */
export function formatarDataHora(iso: string): string {
  if (!iso) return "-";
  const d = parseDataLocal(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formata moeda ou retorna "-" se null/undefined
 */
export function formatarMoedaOpcional(value?: number | null): string {
  if (value === null || value === undefined) return "-";
  return formatarMoeda(value);
}

/**
 * Labels de tipo de ordem de serviço
 */
export const TIPO_OS_LABELS: Record<string, string> = {
  INSTALACAO_COM_BLOQUEIO: "Instalação c/ bloqueio",
  INSTALACAO_SEM_BLOQUEIO: "Instalação s/ bloqueio",
  REVISAO: "Revisão",
  RETIRADA: "Retirada",
  DESLOCAMENTO: "Deslocamento",
};

/**
 * Formata data curta para exibição: "12 Out"
 */
export function formatarDataCurta(data: string): string {
  const d = parseDataLocal(data);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

/**
 * Formata data/hora relativa: "2h atrás", "3 dias atrás", etc.
 */
export function formatarFromNow(dataOuIso: string): string {
  const d = parseDataLocal(dataOuIso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffH = Math.floor(diffMs / 3_600_000);
  const diffD = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `${diffMin} min atrás`;
  if (diffH < 24) return `${diffH}h atrás`;
  if (diffD < 7) return `${diffD} dias atrás`;
  if (diffD < 30) return `${Math.floor(diffD / 7)} sem atrás`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

/**
 * Formata minutos em texto legível: "42 min", "1h 30min", etc.
 */
export function formatarTempoMinutos(minutos: number): string {
  if (minutos < 60) return `${minutos} min`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

/**
 * Calcula duração entre duas datas: "4 dias", "1 dia e 2h", etc.
 */
export function formatarDuracao(dataInicio: string, dataFim: string): string {
  const ini = parseDataLocal(dataInicio);
  const fim = parseDataLocal(dataFim);
  const diffMs = fim.getTime() - ini.getTime();
  const diffD = Math.floor(diffMs / 86_400_000);
  const diffH = Math.floor((diffMs % 86_400_000) / 3_600_000);

  if (diffD === 0 && diffH === 0) return "menos de 1h";
  if (diffD === 0) return `${diffH}h`;
  if (diffH === 0) return `${diffD} ${diffD === 1 ? "dia" : "dias"}`;
  return `${diffD} ${diffD === 1 ? "dia" : "dias"} e ${diffH}h`;
}

export function formatId(id: number): string {
  return String(id).padStart(9, "0");
}
