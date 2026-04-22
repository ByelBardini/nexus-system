import type { Permission } from "@/types/cargo";

export const NOMES_SETOR: Record<string, string> = {
  ADMINISTRATIVO: "Administrativo",
  CONFIGURACAO: "Configuração",
  AGENDAMENTO: "Agendamento & Ordens",
};

export const NOMES_ITEM: Record<string, string> = {
  CARGO: "Cargos",
  USUARIO: "Usuários",
  APARELHO: "Aparelhos",
  EQUIPAMENTO: "Equipamentos",
  CLIENTE: "Clientes",
  OS: "Ordens de Serviço",
  PEDIDO_RASTREADOR: "Pedidos de Rastreadores",
  TECNICO: "Técnicos",
  TESTES: "Testes de Aparelhos",
};

export const NOMES_ACAO: Record<string, string> = {
  LISTAR: "Visualizar",
  CRIAR: "Criar",
  EDITAR: "Editar",
  EXCLUIR: "Deletar",
  EXECUTAR: "Executar",
};

export const ORDEM_SETORES = [
  "ADMINISTRATIVO",
  "CONFIGURACAO",
  "AGENDAMENTO",
] as const;

export const ORDEM_ITENS: Record<string, string[]> = {
  ADMINISTRATIVO: ["CARGO", "USUARIO"],
  CONFIGURACAO: ["APARELHO", "EQUIPAMENTO"],
  AGENDAMENTO: [
    "CLIENTE",
    "OS",
    "TESTES",
    "PEDIDO_RASTREADOR",
    "TECNICO",
  ],
};

export const ORDEM_ACOES = [
  "LISTAR",
  "CRIAR",
  "EDITAR",
  "EXCLUIR",
  "EXECUTAR",
];

export type EstruturaPermissoes = Record<
  string,
  Record<string, { acao: string; permissao: Permission }[]>
>;

export function agruparPermissoes(permissoes: Permission[]): EstruturaPermissoes {
  const estrutura: EstruturaPermissoes = {};
  for (const p of permissoes) {
    const [setor, item, acao] = p.code.split(".");
    if (!setor || !item || !acao) continue;
    if (!estrutura[setor]) estrutura[setor] = {};
    if (!estrutura[setor][item]) estrutura[setor][item] = [];
    estrutura[setor][item].push({ acao, permissao: p });
  }
  for (const setor of Object.keys(estrutura)) {
    for (const item of Object.keys(estrutura[setor])) {
      estrutura[setor][item].sort(
        (a, b) => ORDEM_ACOES.indexOf(a.acao) - ORDEM_ACOES.indexOf(b.acao),
      );
    }
  }
  return estrutura;
}

export function rotulosPermissoesAtivas(
  permissoes: Permission[],
  selectedPermIds: number[],
): string[] {
  return permissoes
    .filter((p) => selectedPermIds.includes(p.id))
    .map((p) => {
      const [, item, acao] = p.code.split(".");
      return `${NOMES_ACAO[acao] || acao} ${NOMES_ITEM[item] || item}`;
    });
}
