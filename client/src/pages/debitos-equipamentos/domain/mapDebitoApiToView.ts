import type {
  DebitoEquipamento,
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
    historico: (d.historicos ?? []).map((h) => ({
      descricao: buildHistoricoMovimentacaoDescricao(h),
      data: h.criadoEm,
      tipo: h.delta > 0 ? ("entrada" as const) : ("saida" as const),
      quantidade: Math.abs(h.delta),
    })),
  };
}
