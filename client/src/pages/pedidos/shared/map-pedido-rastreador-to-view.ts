import type {
  PedidoRastreadorApi,
  PedidoRastreadorView,
} from "@/types/pedidos-rastreador";
import { URGENCIA_LABELS, STATUS_TO_KEY } from "./pedidos-rastreador-kanban";

export function mapPedidoToView(p: PedidoRastreadorApi): PedidoRastreadorView {
  const destinatario =
    p.tipoDestino === "TECNICO" || p.tipoDestino === "MISTO"
      ? (p.tecnico?.nome ?? "Técnico")
      : (p.subcliente?.nome ??
        p.cliente?.nome ??
        p.subcliente?.cliente?.nome ??
        "Cliente");
  const tipo =
    p.tipoDestino === "TECNICO"
      ? "tecnico"
      : p.tipoDestino === "MISTO"
        ? "misto"
        : "cliente";
  const itensMisto =
    p.tipoDestino === "MISTO" && p.itens
      ? p.itens.map((item) => ({
          label:
            item.proprietario === "INFINITY"
              ? "Infinity"
              : (item.cliente?.nome ?? `Cliente #${item.clienteId}`),
          quantidade: item.quantidade,
        }))
      : undefined;
  const urgenciaLabel = URGENCIA_LABELS[p.urgencia] ?? "Média";

  const dataSolicitacao = p.dataSolicitacao ?? p.criadoEm;
  const marcaModelo =
    p.modeloEquipamento && p.marcaEquipamento
      ? `${p.marcaEquipamento.nome} - ${p.modeloEquipamento.nome}`
      : p.modeloEquipamento?.marca
        ? `${p.modeloEquipamento.marca.nome} - ${p.modeloEquipamento.nome}`
        : p.marcaEquipamento?.nome
          ? p.marcaEquipamento.nome
          : undefined;

  const operadora = p.operadora?.nome;
  const deCliente = p.deCliente?.nome;

  const cidadeEstado =
    p.tipoDestino === "TECNICO" || p.tipoDestino === "MISTO"
      ? (() => {
          const t = p.tecnico;
          if (!t) return undefined;
          const cidade = t.cidadeEndereco ?? t.cidade;
          const estado = t.estadoEndereco ?? t.estado;
          if (cidade && estado) return `${cidade} - ${estado}`;
          if (cidade) return cidade;
          if (estado) return estado;
          return undefined;
        })()
      : (() => {
          if (p.subcliente?.cidade && p.subcliente?.estado)
            return `${p.subcliente.cidade} - ${p.subcliente.estado}`;
          if (p.subcliente?.cidade) return p.subcliente.cidade;
          if (p.subcliente?.estado) return p.subcliente.estado;
          return undefined;
        })();

  const endereco =
    p.tipoDestino === "TECNICO" || p.tipoDestino === "MISTO"
      ? (() => {
          const t = p.tecnico;
          if (!t) return undefined;
          const partes: string[] = [];
          if (t.logradouro) {
            const rua = [t.logradouro, t.numero].filter(Boolean).join(", ");
            if (rua) partes.push(rua);
          }
          if (t.complemento) partes.push(t.complemento);
          if (t.bairro) partes.push(t.bairro);
          const cidade = t.cidadeEndereco ?? t.cidade;
          const estado = t.estadoEndereco ?? t.estado;
          if (cidade && estado) partes.push(`${cidade} - ${estado}`);
          else if (cidade) partes.push(cidade);
          if (t.cep) partes.push(`CEP: ${t.cep}`);
          return partes.length > 0 ? partes.join(", ") : undefined;
        })()
      : p.subcliente?.cidade && p.subcliente?.estado
        ? `${p.subcliente.cidade}, ${p.subcliente.estado}`
        : (p.subcliente?.cidade ?? undefined);

  const cpfCnpj =
    p.tipoDestino === "TECNICO" || p.tipoDestino === "MISTO"
      ? (p.tecnico?.cpfCnpj ?? undefined)
      : (p.subcliente?.cpf ?? p.cliente?.cnpj ?? undefined);

  const contato =
    p.tipoDestino === "TECNICO" || p.tipoDestino === "MISTO"
      ? p.tecnico
        ? {
            nome: p.tecnico.nome,
            telefone: p.tecnico.telefone ?? undefined,
            email: undefined as string | undefined,
          }
        : undefined
      : p.subcliente
        ? {
            nome: p.subcliente.nome,
            telefone: p.subcliente.telefone ?? undefined,
            email: p.subcliente.email ?? undefined,
          }
        : p.cliente
          ? { nome: p.cliente.nome, telefone: undefined, email: undefined }
          : undefined;

  const historico = p.historico?.map((h) => ({
    titulo: h.statusNovo.replace(/_/g, " "),
    descricao: h.observacao ?? `${h.statusAnterior} → ${h.statusNovo}`,
    concluido: true,
  }));

  const despacho =
    p.tipoDespacho != null
      ? {
          tipoDespacho: p.tipoDespacho,
          transportadora: p.transportadora ?? null,
          numeroNf: p.numeroNf ?? null,
        }
      : null;

  return {
    id: p.id,
    codigo: p.codigo,
    destinatario,
    tipo,
    itensMisto,
    quantidade: p.quantidade,
    status: STATUS_TO_KEY[p.status],
    dataSolicitacao,
    marcaModelo,
    operadora,
    deCliente,
    solicitadoEm: p.criadoEm,
    entregueEm: p.entregueEm,
    urgencia: urgenciaLabel,
    cidadeEstado: cidadeEstado ?? undefined,
    endereco,
    cpfCnpj: cpfCnpj ?? undefined,
    contato,
    historico,
    despacho,
  };
}
