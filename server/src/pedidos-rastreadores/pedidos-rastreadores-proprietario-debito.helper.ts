import { Injectable } from '@nestjs/common';
import { Prisma, ProprietarioTipo } from '@prisma/client';
import { DebitosRastreadoresService } from '../debitos-rastreadores/debitos-rastreadores.service';

export type MarcaModeloIdCache = Map<
  string,
  { marcaId: number; modeloId: number } | null
>;

export type AparelhoProprietarioDebitoRef = {
  marca: string | null;
  modelo: string | null;
  proprietario: ProprietarioTipo;
  clienteId: number | null;
};

@Injectable()
export class PedidosRastreadoresProprietarioDebitoHelper {
  constructor(private readonly debitosService: DebitosRastreadoresService) {}

  /**
   * Resolve marca/modelo por nome dentro da transação, com cache por par (nome marca, nome modelo)
   * para evitar N+1 quando vários aparelhos compartilham o mesmo equipamento.
   */
  private async resolveMarcaModeloIds(
    tx: Prisma.TransactionClient,
    marcaNome: string,
    modeloNome: string,
    cache: MarcaModeloIdCache,
  ): Promise<{ marcaId: number; modeloId: number } | null> {
    const key = `${marcaNome}\0${modeloNome}`;
    if (cache.has(key)) {
      return cache.get(key) ?? null;
    }
    const marcaRecord = await tx.marcaEquipamento.findFirst({
      where: { nome: marcaNome },
    });
    if (!marcaRecord) {
      cache.set(key, null);
      return null;
    }
    const modeloRecord = await tx.modeloEquipamento.findFirst({
      where: { nome: modeloNome, marcaId: marcaRecord.id },
    });
    if (!modeloRecord) {
      cache.set(key, null);
      return null;
    }
    const ids = { marcaId: marcaRecord.id, modeloId: modeloRecord.id };
    cache.set(key, ids);
    return ids;
  }

  async consolidarDebitoSeProprietarioMudou(
    tx: Prisma.TransactionClient,
    marcaModeloCache: MarcaModeloIdCache,
    args: {
      ap: AparelhoProprietarioDebitoRef;
      destProprietario: ProprietarioTipo;
      destClienteId: number | null;
      pedidoId: number;
    },
  ): Promise<void> {
    const { ap, destProprietario, destClienteId, pedidoId } = args;
    const proprietarioMudou =
      ap.proprietario !== destProprietario || ap.clienteId !== destClienteId;
    if (!proprietarioMudou || !ap.marca || !ap.modelo) {
      return;
    }
    const resolved = await this.resolveMarcaModeloIds(
      tx,
      ap.marca,
      ap.modelo,
      marcaModeloCache,
    );
    if (!resolved) {
      return;
    }
    await this.debitosService.consolidarDebitoTx(tx, {
      devedorTipo: destProprietario,
      devedorClienteId: destClienteId,
      credorTipo: ap.proprietario,
      credorClienteId: ap.clienteId,
      marcaId: resolved.marcaId,
      modeloId: resolved.modeloId,
      delta: 1,
      pedidoId,
    });
  }
}
