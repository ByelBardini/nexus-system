/** Técnico retornado por GET /tecnicos (gestão e mapa). */
export interface Tecnico {
  id: number;
  nome: string;
  cpfCnpj: string | null;
  telefone: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidadeEndereco: string | null;
  estadoEndereco: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  geocodingPrecision: "EXATO" | "CIDADE" | null;
  ativo: boolean;
  precos?: {
    instalacaoComBloqueio: number | string;
    instalacaoSemBloqueio: number | string;
    revisao: number | string;
    retirada: number | string;
    deslocamento: number | string;
  };
}
