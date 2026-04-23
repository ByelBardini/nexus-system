import {
  labelTipoServico,
  mapTipoOsParaRegistro,
} from "@/lib/cadastro-rastreamento-tipo-mappers";
import type {
  AparelhoCadastroRastreamentoResposta,
  OSResponse,
  OrdemCadastro,
} from "@/types/cadastro-rastreamento";
import { formatarDataHoraCurta } from "@/lib/format";
import { getCadastroMapDeviceFields } from "@/lib/os-revisao-display";

export function formatModeloAparelhoCadastro(
  a: AparelhoCadastroRastreamentoResposta | null,
): string | null {
  if (!a) return null;
  const base = [a.marca, a.modelo].filter(Boolean).join(" ");
  if (!base) return null;
  if (!a.sim) return base;
  const { operadora, marcaNome, planoMb } = a.sim;
  const simPartes = [
    operadora,
    marcaNome && planoMb ? `${marcaNome}/${planoMb} MB` : marcaNome,
  ].filter(Boolean);
  return simPartes.length > 0 ? `${base} (${simPartes.join(" ")})` : base;
}

export function mapCadastroRastreamentoOS(os: OSResponse): OrdemCadastro {
  const tipoRegistro = mapTipoOsParaRegistro(os.tipo);

  const instalacaoComBloqueio =
    os.tipo === "INSTALACAO_COM_BLOQUEIO"
      ? true
      : os.tipo === "INSTALACAO_SEM_BLOQUEIO"
        ? false
        : null;

  const tipoServico = labelTipoServico(os.tipo);

  const dev = getCadastroMapDeviceFields(os.tipo, {
    idAparelho: os.idAparelho,
    idEntrada: os.idEntrada,
    iccidAparelho: os.iccidAparelho,
    iccidEntrada: os.iccidEntrada,
    localInstalacao: os.localInstalacao,
    localInstalacaoEntrada: os.localInstalacaoEntrada,
    posChave: os.posChave,
    posChaveEntrada: os.posChaveEntrada,
  });

  return {
    id: os.id,
    status: os.statusCadastro,
    tipoRegistro,
    instalacaoComBloqueio,
    cliente: os.cliente.nome,
    subcliente: os.subcliente?.nome ?? null,
    tipoServico,
    tecnico: os.tecnico?.nome ?? "—",
    veiculo: os.veiculo ? `${os.veiculo.marca} ${os.veiculo.modelo}` : "—",
    placa: os.veiculo?.placa ?? "—",
    cor: os.veiculo?.cor ?? "—",
    modelo: os.veiculo
      ? `${os.veiculo.marca} ${os.veiculo.modelo} (${os.veiculo.ano})`
      : "—",
    modeloAparelhoEntrada: formatModeloAparelhoCadastro(os.aparelhoEntrada),
    imei: dev.imeiEntrada,
    iccid: dev.iccidEntradaOs ?? os.aparelhoEntrada?.iccid ?? null,
    local: dev.local,
    posChave: dev.posChave,
    imeiSaida: dev.imeiSaida,
    iccidSaida: dev.iccidSaidaOs ?? os.aparelhoSaida?.iccid ?? null,
    modeloSaida: formatModeloAparelhoCadastro(os.aparelhoSaida),
    data: formatarDataHoraCurta(os.criadoEm),
    plataforma: os.plataforma,
    concluidoEm: os.concluidoEm ? formatarDataHoraCurta(os.concluidoEm) : null,
    concluidoPor: os.concluidoPor?.nome ?? null,
  };
}
