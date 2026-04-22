import { BadRequestException, Injectable } from '@nestjs/common';
import {
  Prisma,
  ProprietarioTipo,
  StatusAparelho,
  StatusOS,
  TipoOS,
} from '@prisma/client';
import { DebitosRastreadoresService } from '../debitos-rastreadores/debitos-rastreadores.service';

/**
 * Snapshot mínimo da OS para efeitos colaterais ao atingir TESTES_REALIZADOS.
 */
export type OrdemServicoContextoTestesRealizados = {
  tipo: TipoOS;
  numero: number;
  clienteId: number;
  idAparelho: string | null;
  idEntrada: string | null;
  veiculoId: number | null;
  veiculo: { placa: string } | null;
};

@Injectable()
export class OrdemServicoStatusSideEffectsService {
  constructor(
    private readonly debitosService: DebitosRastreadoresService,
  ) {}

  /**
   * Efeitos após gravar histórico + update da OS: desvinculação do aparelho de
   * saída (REVISÃO/RETIRADA) e instalação + débito do rastreador novo.
   */
  async aplicarSeTestesRealizados(
    tx: Prisma.TransactionClient,
    ordemServicoId: number,
    novoStatus: StatusOS,
    os: OrdemServicoContextoTestesRealizados,
  ): Promise<void> {
    if (novoStatus !== StatusOS.TESTES_REALIZADOS) return;

    await this.desvincularAparelhoSaidaSeAplicavel(tx, os);
    await this.instalarNovoAparelhoRegistrarDebitoSeAplicavel(
      tx,
      ordemServicoId,
      os,
    );
  }

  private async desvincularAparelhoSaidaSeAplicavel(
    tx: Prisma.TransactionClient,
    os: OrdemServicoContextoTestesRealizados,
  ): Promise<void> {
    if (
      (os.tipo !== TipoOS.REVISAO && os.tipo !== TipoOS.RETIRADA) ||
      !os.idAparelho ||
      !os.veiculoId
    ) {
      return;
    }

    const identificadorSaida = os.idAparelho.trim();
    if (!identificadorSaida) return;

    const aparelhoSaida = await tx.aparelho.findFirst({
      where: { identificador: identificadorSaida },
      select: { id: true, status: true, veiculoId: true },
    });
    if (!aparelhoSaida || aparelhoSaida.veiculoId !== os.veiculoId) return;

    const placa = os.veiculo?.placa ?? '-';
    const obsSaida = `Retirado do veículo ${placa} via OS #${os.numero}`;
    await tx.aparelhoHistorico.create({
      data: {
        aparelhoId: aparelhoSaida.id,
        statusAnterior: aparelhoSaida.status,
        statusNovo: StatusAparelho.COM_TECNICO,
        observacao: obsSaida,
      },
    });
    await tx.aparelho.update({
      where: { id: aparelhoSaida.id },
      data: {
        status: StatusAparelho.COM_TECNICO,
        veiculoId: null,
        subclienteId: null,
        observacao: obsSaida,
      },
    });
  }

  private async instalarNovoAparelhoRegistrarDebitoSeAplicavel(
    tx: Prisma.TransactionClient,
    ordemServicoId: number,
    os: OrdemServicoContextoTestesRealizados,
  ): Promise<void> {
    const tipoInstalaNovoAparelho =
      os.tipo === TipoOS.REVISAO ||
      os.tipo === TipoOS.INSTALACAO_COM_BLOQUEIO ||
      os.tipo === TipoOS.INSTALACAO_SEM_BLOQUEIO;
    const identificadorRastreadorNovo =
      os.tipo === TipoOS.REVISAO
        ? os.idEntrada?.trim()
        : os.idAparelho?.trim();
    if (!tipoInstalaNovoAparelho || !identificadorRastreadorNovo) return;

    const aparelho = await tx.aparelho.findFirst({
      where: {
        identificador: identificadorRastreadorNovo,
        tipo: 'RASTREADOR',
      },
      include: { simVinculado: { select: { id: true, status: true } } },
    });
    if (!aparelho) return;

    const obsInstalacao = [
      `Instalado via OS #${os.numero}`,
      os.veiculo ? `Placa: ${os.veiculo.placa}` : null,
    ]
      .filter(Boolean)
      .join(' | ');

    await tx.aparelhoHistorico.create({
      data: {
        aparelhoId: aparelho.id,
        statusAnterior: aparelho.status,
        statusNovo: StatusAparelho.INSTALADO,
        observacao: obsInstalacao,
      },
    });
    await tx.aparelho.update({
      where: { id: aparelho.id },
      data: { status: StatusAparelho.INSTALADO },
    });

    if (aparelho.simVinculadoId && aparelho.simVinculado) {
      await tx.aparelhoHistorico.create({
        data: {
          aparelhoId: aparelho.simVinculadoId,
          statusAnterior: aparelho.simVinculado.status,
          statusNovo: StatusAparelho.INSTALADO,
          observacao: obsInstalacao,
        },
      });
      await tx.aparelho.update({
        where: { id: aparelho.simVinculadoId },
        data: { status: StatusAparelho.INSTALADO },
      });
    }

    const precisaDebito =
      aparelho.proprietario === ProprietarioTipo.INFINITY ||
      (aparelho.proprietario === ProprietarioTipo.CLIENTE &&
        aparelho.clienteId !== os.clienteId);

    if (precisaDebito && aparelho.marca && aparelho.modelo) {
      const marcaEq = await tx.marcaEquipamento.findFirst({
        where: { nome: aparelho.marca },
      });
      const modeloEq = marcaEq
        ? await tx.modeloEquipamento.findFirst({
            where: { marcaId: marcaEq.id, nome: aparelho.modelo },
          })
        : null;

      if (!marcaEq || !modeloEq) {
        throw new BadRequestException(
          `Débito não pode ser registrado: modelo "${aparelho.modelo}" da marca "${aparelho.marca}" não encontrado no catálogo.`,
        );
      }

      await this.debitosService.consolidarDebitoTx(tx, {
        devedorTipo: ProprietarioTipo.CLIENTE,
        devedorClienteId: os.clienteId,
        credorTipo: aparelho.proprietario,
        credorClienteId:
          aparelho.proprietario === ProprietarioTipo.INFINITY
            ? null
            : aparelho.clienteId,
        marcaId: marcaEq.id,
        modeloId: modeloEq.id,
        delta: 1,
        aparelhoId: aparelho.id,
        ordemServicoId,
      });
    }
  }
}
