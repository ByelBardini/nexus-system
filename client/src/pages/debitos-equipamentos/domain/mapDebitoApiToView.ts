import type {
  DebitoEquipamento,
  DebitoEquipamentoHistoricoItem,
  DebitoHistoricoMovimentacaoApi,
  DebitoRastreadorListaApi,
  StatusDebito,
} from "./types";

export function buildHistoricoMovimentacaoDescricao(
  h: DebitoHistoricoMovimentacaoApi,
): string {
  let descricao = "Registro manual";
  if (h.pedido) descricao = `Pedido ${h.pedido.codigo}`;
  else if (h.lote) descricao = `Lote ${h.lote.referencia}`;
  else if (h.aparelho)
    descricao = `Individual — ${h.aparelho.identificador ?? `ID ${h.aparelho.id}`}`;
  if (h.ordemServico)
    descricao = `${descricao} · OS nº ${h.ordemServico.numero}`;
  return descricao;
}

function groupHistoricoMovimentacoes(
  historicos: DebitoHistoricoMovimentacaoApi[],
): DebitoEquipamentoHistoricoItem[] {
  const map = new Map<string, DebitoEquipamentoHistoricoItem>();

  for (const h of historicos) {
    const descricao = buildHistoricoMovimentacaoDescricao(h);
    const tipo = h.delta > 0 ? ("entrada" as const) : ("saida" as const);
    const key = `${tipo}::${descricao}`;
    const existing = map.get(key);

    if (existing) {
      existing.quantidade += Math.abs(h.delta);
      if (h.criadoEm > existing.data) existing.data = h.criadoEm;
    } else {
      map.set(key, {
        descricao,
        data: h.criadoEm,
        tipo,
        quantidade: Math.abs(h.delta),
      });
    }
  }

  return Array.from(map.values());
}

export function mapDebitoApiToView(
  d: DebitoRastreadorListaApi,
): DebitoEquipamento {
  const status: StatusDebito = d.quantidade <= 0 ? "quitado" : "aberto";
  return {
    id: d.id,
    devedor: {
      nome:
        d.devedorTipo === "INFINITY"
          ? "Infinity"
          : (d.devedorCliente?.nome ?? "Cliente"),
      tipo: d.devedorTipo === "INFINITY" ? "infinity" : "cliente",
    },
    credor: {
      nome:
        d.credorTipo === "INFINITY"
          ? "Infinity"
          : (d.credorCliente?.nome ?? "Cliente"),
      tipo: d.credorTipo === "INFINITY" ? "infinity" : "cliente",
    },
    status,
    ultimaMovimentacao: d.atualizadoEm,
    modelos: [
      { nome: `${d.marca.nome} ${d.modelo.nome}`, quantidade: d.quantidade },
    ],
    historico: groupHistoricoMovimentacoes(d.historicos ?? []),
  };
}
