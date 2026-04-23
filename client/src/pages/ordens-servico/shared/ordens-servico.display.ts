import { formatarCEP } from "@/lib/format";
import type {
  OrdemServicoDetalhe,
  SubclienteParaExibicao,
} from "./ordens-servico.types";

/** Usa snapshot do subcliente quando disponível (preserva dados no momento da criação). */
export function getSubclienteParaExibicao(
  os: OrdemServicoDetalhe,
): SubclienteParaExibicao | null {
  if (os.subclienteSnapshotNome != null && os.subclienteSnapshotNome !== "") {
    return {
      nome: os.subclienteSnapshotNome,
      logradouro: os.subclienteSnapshotLogradouro ?? undefined,
      numero: os.subclienteSnapshotNumero ?? undefined,
      complemento: os.subclienteSnapshotComplemento ?? undefined,
      bairro: os.subclienteSnapshotBairro ?? undefined,
      cidade: os.subclienteSnapshotCidade ?? undefined,
      estado: os.subclienteSnapshotEstado ?? undefined,
      cep: os.subclienteSnapshotCep ?? undefined,
      cpf: os.subclienteSnapshotCpf ?? undefined,
      email: os.subclienteSnapshotEmail ?? undefined,
      telefone: os.subclienteSnapshotTelefone ?? undefined,
    };
  }
  return os.subcliente ?? null;
}

export function formatEnderecoSubcliente(
  sub: SubclienteParaExibicao | null | undefined,
): string {
  if (!sub) return "-";
  const partes: string[] = [];
  if (sub.logradouro) {
    let rua = sub.logradouro;
    if (sub.numero) rua += `, ${sub.numero}`;
    if (sub.complemento) rua += ` - ${sub.complemento}`;
    partes.push(rua);
  }
  if (sub.bairro) partes.push(sub.bairro);
  if (sub.cidade || sub.estado)
    partes.push([sub.cidade, sub.estado].filter(Boolean).join(" - "));
  if (sub.cep) partes.push(`CEP ${formatarCEP(sub.cep)}`);
  return partes.length > 0 ? partes.join(", ") : sub.nome || "-";
}

export function formatDadosVeiculo(
  v: OrdemServicoDetalhe["veiculo"] | null | undefined,
): string {
  if (!v) return "-";
  const partes: string[] = [v.placa];
  if (v.marca || v.modelo)
    partes.push([v.marca, v.modelo].filter(Boolean).join(" "));
  if (v.ano) partes.push(String(v.ano));
  if (v.cor) partes.push(v.cor);
  return partes.length > 0 ? partes.join(" · ") : "-";
}

export function getDadosTeste(os: OrdemServicoDetalhe, now: Date = new Date()) {
  const hist = os.historico ?? [];
  const entradaEmTestes =
    hist.find((h) => h.statusNovo === "EM_TESTES")?.criadoEm ?? null;
  const saidaEmTestes =
    hist.find((h) => h.statusAnterior === "EM_TESTES")?.criadoEm ?? null;
  let tempoMin = 0;
  if (entradaEmTestes) {
    const fim = saidaEmTestes ? new Date(saidaEmTestes) : now;
    tempoMin = Math.floor(
      (fim.getTime() - new Date(entradaEmTestes).getTime()) / 60000,
    );
  }
  return { entradaEmTestes, saidaEmTestes, tempoMin };
}

export function getDadosRetirada(os: OrdemServicoDetalhe): {
  dataRetirada: string | null;
  aparelhoEncontrado: boolean | null;
} {
  const hist = os.historico ?? [];
  const entry = hist.find((h) => h.statusNovo === "AGUARDANDO_CADASTRO");
  const obs = entry?.observacao ?? "";
  let dataRetirada: string | null = null;
  let aparelhoEncontrado: boolean | null = null;
  const dataMatch = obs.match(/Data retirada:\s*([^|]+)/i);
  if (dataMatch) dataRetirada = dataMatch[1].trim();
  const encontradoMatch = obs.match(/Aparelho encontrado:\s*(Sim|Não)/i);
  if (encontradoMatch)
    aparelhoEncontrado = encontradoMatch[1].toLowerCase() === "sim";
  return { dataRetirada, aparelhoEncontrado };
}
