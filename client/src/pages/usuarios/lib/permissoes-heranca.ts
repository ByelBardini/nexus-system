import type { CargoWithPermissions, PermissoesPorModulo } from "@/types/usuarios";

/** Rótulo por chave "ITEM" (segundo segmento do código legado) */
const ITEM_KEY_LABELS: Record<string, string> = {
  USUARIO: "Usuários",
  CARGO: "Cargos",
  APARELHO: "Aparelhos",
  EQUIPAMENTO: "Equipamentos",
  CLIENTE: "Clientes",
  TECNICO: "Técnicos",
  OS: "Ordens de Serviço",
  PEDIDO_RASTREADOR: "Pedidos de Rastreadores",
  TESTES: "Testes de Aparelhos",
};

const MODULO_PATH_LABELS: Record<string, string> = {
  "ADMINISTRATIVO.USUARIO": "Usuários",
  "ADMINISTRATIVO.CARGO": "Cargos",
  "CONFIGURACAO.APARELHO": "Aparelhos",
  "CONFIGURACAO.EQUIPAMENTO": "Equipamentos",
  "AGENDAMENTO.CLIENTE": "Clientes",
  "AGENDAMENTO.TECNICO": "Técnicos",
  "AGENDAMENTO.OS": "Ordens de Serviço",
  "AGENDAMENTO.PEDIDO_RASTREADOR": "Pedidos de Rastreadores",
  "AGENDAMENTO.TESTES": "Testes de Aparelhos",
};

export function getModuloLabel(modulo: string): string {
  if (MODULO_PATH_LABELS[modulo]) return MODULO_PATH_LABELS[modulo];
  const parts = modulo.split(".");
  const item = parts[1];
  if (item) return ITEM_KEY_LABELS[item] ?? modulo;
  return modulo;
}

export function getAcaoLabel(acao: string): string {
  const labels: Record<string, string> = {
    LISTAR: "Visualizar",
    CRIAR: "Criar",
    EDITAR: "Editar",
    EXCLUIR: "Excluir",
    EXECUTAR: "Executar",
  };
  return labels[acao] ?? acao;
}

export function calcularPermissoesHerdadas(
  selectedCargoIds: number[],
  cargos: CargoWithPermissions[],
): {
  setoresHabilitados: PermissoesPorModulo[];
  acoesAltoRisco: { modulo: string; permissao: string }[];
} {
  const cargosSelecionados = cargos.filter((c) =>
    selectedCargoIds.includes(c.id),
  );
  const permissoesMap = new Map<string, Set<string>>();
  const acoesAltoRisco: { modulo: string; permissao: string }[] = [];

  for (const cargo of cargosSelecionados) {
    for (const cp of cargo.cargoPermissoes) {
      const parts = cp.permissao.code.split(".");
      if (parts.length >= 3) {
        const [setor, modulo, acao] = parts;
        const moduloKey = `${setor}.${modulo}`;

        if (!permissoesMap.has(moduloKey)) {
          permissoesMap.set(moduloKey, new Set());
        }
        permissoesMap.get(moduloKey)!.add(acao);

        if (acao === "EXCLUIR") {
          const jaExiste = acoesAltoRisco.some(
            (a) => a.permissao === cp.permissao.code,
          );
          if (!jaExiste) {
            acoesAltoRisco.push({
              modulo: moduloKey,
              permissao: cp.permissao.code,
            });
          }
        }
      }
    }
  }

  const setoresHabilitados: PermissoesPorModulo[] = [];
  for (const [modulo, acoes] of permissoesMap) {
    setoresHabilitados.push({ modulo, acoes: Array.from(acoes) });
  }

  return { setoresHabilitados, acoesAltoRisco };
}
