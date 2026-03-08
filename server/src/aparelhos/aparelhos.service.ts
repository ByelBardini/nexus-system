import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TipoAparelho, ProprietarioTipo, StatusAparelho, Prisma } from '@prisma/client';

interface CreateLoteDto {
  referencia: string;
  notaFiscal?: string | null;
  dataChegada: string;
  proprietarioTipo: ProprietarioTipo;
  clienteId?: number | null;
  tipo: TipoAparelho;
  marca?: string | null;
  modelo?: string | null;
  operadora?: string | null;
  marcaSimcardId?: number | null;
  planoSimcardId?: number | null;
  quantidade: number;
  valorUnitario: number;
  identificadores?: string[];
}

interface CreateIndividualDto {
  identificador: string;
  tipo: TipoAparelho;
  marca?: string | null;
  modelo?: string | null;
  operadora?: string | null;
  marcaSimcardId?: number | null;
  planoSimcardId?: number | null;
  origem: 'RETIRADA_CLIENTE' | 'DEVOLUCAO_TECNICO' | 'COMPRA_AVULSA';
  responsavelEntrega?: string | null;
  tecnicoId?: number | null;
  observacoes?: string | null;
  statusEntrada: 'NOVO_OK' | 'EM_MANUTENCAO' | 'CANCELADO_DEFEITO';
  categoriaFalha?: string | null;
  destinoDefeito?: string | null;
}

@Injectable()
export class AparelhosService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll() {
    return this.prisma.aparelho.findMany({
      orderBy: { criadoEm: 'desc' },
      include: {
        cliente: { select: { id: true, nome: true } },
        lote: { select: { id: true, referencia: true } },
        tecnico: { select: { id: true, nome: true } },
        kit: { select: { id: true, nome: true } },
        marcaSimcard: { select: { id: true, nome: true, operadora: { select: { id: true, nome: true } } } },
        planoSimcard: { select: { id: true, planoMb: true } },
        simVinculado: { select: { id: true, identificador: true, operadora: true } },
        historico: {
          orderBy: { criadoEm: 'desc' },
          take: 5,
        },
      },
    });
  }

  async findOne(id: number) {
    const aparelho = await this.prisma.aparelho.findUnique({
      where: { id },
      include: {
        cliente: true,
        lote: true,
        tecnico: true,
        kit: { select: { id: true, nome: true } },
        marcaSimcard: { include: { operadora: true } },
        planoSimcard: true,
        simVinculado: true,
        historico: { orderBy: { criadoEm: 'desc' } },
      },
    });
    if (!aparelho) throw new NotFoundException('Aparelho não encontrado');
    return aparelho;
  }

  async createLote(dto: CreateLoteDto) {
    const {
      referencia,
      notaFiscal,
      dataChegada,
      proprietarioTipo,
      clienteId,
      tipo,
      marca,
      modelo,
      operadora,
      marcaSimcardId,
      planoSimcardId,
      quantidade,
      valorUnitario,
      identificadores,
    } = dto;

    if (quantidade <= 0) {
      throw new BadRequestException('Quantidade deve ser maior que zero');
    }

    let operadoraSim = operadora;
    if (tipo === 'SIM' && marcaSimcardId) {
      const marcaSim = await this.prisma.marcaSimcard.findUnique({
        where: { id: marcaSimcardId },
        include: { operadora: true },
      });
      if (!marcaSim) throw new BadRequestException('Marca de simcard não encontrada');
      operadoraSim = marcaSim.operadora.nome;
    }

    const temIdentificadores = identificadores && identificadores.length > 0;
    const qtdFinal = temIdentificadores ? identificadores.length : quantidade;
    const valorTotal = qtdFinal * valorUnitario;

    return this.prisma.$transaction(async (tx) => {
      const lote = await tx.loteAparelho.create({
        data: {
          referencia,
          notaFiscal,
          dataChegada: new Date(dataChegada),
          tipo,
          proprietario: proprietarioTipo,
          clienteId: proprietarioTipo === 'CLIENTE' ? clienteId : null,
          marca: tipo === 'RASTREADOR' ? marca : null,
          modelo: tipo === 'RASTREADOR' ? modelo : null,
          operadora: tipo === 'SIM' ? operadoraSim : null,
          marcaSimcardId: tipo === 'SIM' ? marcaSimcardId ?? null : null,
          planoSimcardId: tipo === 'SIM' ? planoSimcardId ?? null : null,
          quantidade: qtdFinal,
          valorUnitario,
          valorTotal,
        },
      });

      const aparelhosData: Prisma.AparelhoCreateManyInput[] = [];

      const baseSimData = {
        operadora: operadoraSim,
        marcaSimcardId: marcaSimcardId ?? undefined,
        planoSimcardId: planoSimcardId ?? undefined,
      };

      if (temIdentificadores) {
        for (const identificador of identificadores) {
          aparelhosData.push({
            tipo,
            identificador,
            status: 'EM_ESTOQUE',
            proprietario: proprietarioTipo,
            clienteId: proprietarioTipo === 'CLIENTE' ? clienteId : null,
            marca: tipo === 'RASTREADOR' ? marca : null,
            modelo: tipo === 'RASTREADOR' ? modelo : null,
            ...(tipo === 'SIM' ? baseSimData : { operadora: null }),
            loteId: lote.id,
            valorUnitario,
          });
        }
      } else {
        for (let i = 0; i < quantidade; i++) {
          aparelhosData.push({
            tipo,
            identificador: null,
            status: 'EM_ESTOQUE',
            proprietario: proprietarioTipo,
            clienteId: proprietarioTipo === 'CLIENTE' ? clienteId : null,
            marca: tipo === 'RASTREADOR' ? marca : null,
            modelo: tipo === 'RASTREADOR' ? modelo : null,
            ...(tipo === 'SIM' ? baseSimData : { operadora: null }),
            loteId: lote.id,
            valorUnitario,
          });
        }
      }

      await tx.aparelho.createMany({ data: aparelhosData });

      return tx.loteAparelho.findUnique({
        where: { id: lote.id },
        include: {
          aparelhos: true,
          cliente: { select: { id: true, nome: true } },
        },
      });
    });
  }

  async updateStatus(id: number, status: StatusAparelho, observacao?: string) {
    const aparelho = await this.findOne(id);

    await this.prisma.aparelhoHistorico.create({
      data: {
        aparelhoId: id,
        statusAnterior: aparelho.status,
        statusNovo: status,
        observacao,
      },
    });

    return this.prisma.aparelho.update({
      where: { id },
      data: { status },
      include: {
        cliente: { select: { id: true, nome: true } },
        lote: { select: { id: true, referencia: true } },
        tecnico: { select: { id: true, nome: true } },
        simVinculado: { select: { id: true, identificador: true, operadora: true } },
      },
    });
  }

  async getResumo() {
    const [total, porStatus, porTipo] = await Promise.all([
      this.prisma.aparelho.count(),
      this.prisma.aparelho.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.aparelho.groupBy({
        by: ['tipo'],
        _count: { tipo: true },
      }),
    ]);

    return {
      total,
      porStatus: porStatus.reduce(
        (acc, item) => ({ ...acc, [item.status]: item._count.status }),
        {} as Record<string, number>,
      ),
      porTipo: porTipo.reduce(
        (acc, item) => ({ ...acc, [item.tipo]: item._count.tipo }),
        {} as Record<string, number>,
      ),
    };
  }

  async createIndividual(dto: CreateIndividualDto) {
    const {
      identificador,
      tipo,
      marca,
      modelo,
      operadora,
      marcaSimcardId,
      planoSimcardId,
      origem,
      responsavelEntrega,
      tecnicoId,
      observacoes,
      statusEntrada,
      categoriaFalha,
      destinoDefeito,
    } = dto;

    const existente = await this.prisma.aparelho.findFirst({
      where: { identificador },
    });

    if (existente) {
      throw new BadRequestException(
        `O identificador ${identificador} já está cadastrado no sistema`,
      );
    }

    let operadoraSim = operadora;
    if (tipo === 'SIM' && marcaSimcardId) {
      const marcaSim = await this.prisma.marcaSimcard.findUnique({
        where: { id: marcaSimcardId },
        include: { operadora: true },
      });
      if (!marcaSim) throw new BadRequestException('Marca de simcard não encontrada');
      operadoraSim = marcaSim.operadora.nome;
    }

    let statusAparelho: StatusAparelho = 'EM_ESTOQUE';
    if (statusEntrada === 'EM_MANUTENCAO') {
      statusAparelho = 'EM_ESTOQUE';
    } else if (statusEntrada === 'CANCELADO_DEFEITO') {
      statusAparelho = 'EM_ESTOQUE';
    }

    const aparelho = await this.prisma.aparelho.create({
      data: {
        tipo,
        identificador,
        status: statusAparelho,
        proprietario: 'INFINITY',
        marca: tipo === 'RASTREADOR' ? marca : null,
        modelo: tipo === 'RASTREADOR' ? modelo : null,
        operadora: tipo === 'SIM' ? operadoraSim : null,
        marcaSimcardId: tipo === 'SIM' ? marcaSimcardId ?? null : null,
        planoSimcardId: tipo === 'SIM' ? planoSimcardId ?? null : null,
        tecnicoId: tecnicoId || null,
      },
      include: {
        tecnico: { select: { id: true, nome: true } },
      },
    });

    await this.prisma.aparelhoHistorico.create({
      data: {
        aparelhoId: aparelho.id,
        statusAnterior: statusAparelho,
        statusNovo: statusAparelho,
        observacao: [
          `Entrada individual - Origem: ${origem}`,
          responsavelEntrega ? `Responsável: ${responsavelEntrega}` : null,
          statusEntrada === 'CANCELADO_DEFEITO'
            ? `Status: Defeito - ${categoriaFalha} - Destino: ${destinoDefeito}`
            : statusEntrada === 'EM_MANUTENCAO'
              ? 'Status: Em manutenção'
              : 'Status: Novo/OK',
          observacoes ? `Obs: ${observacoes}` : null,
        ]
          .filter(Boolean)
          .join(' | '),
      },
    });

    return aparelho;
  }

  /** Normaliza texto de IDs: vírgula, ponto-vírgula, newline. Remove vazios e caracteres invisíveis. */
  private parseIds(text: string): string[] {
    if (!text || typeof text !== 'string') return [];
    return text
      .split(/[,;\n\r]+/)
      .map((s) => s.replace(/\s+/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '').trim())
      .filter(Boolean);
  }

  /** Resolve rastreador por IMEI: FOUND_AVAILABLE | FOUND_ALREADY_LINKED | NEEDS_CREATE | INVALID_FORMAT */
  private async resolveRastreador(imei: string): Promise<{
    status: 'FOUND_AVAILABLE' | 'FOUND_ALREADY_LINKED' | 'NEEDS_CREATE' | 'INVALID_FORMAT';
    trackerId?: number;
    marca?: string;
    modelo?: string;
  }> {
    const clean = imei.replace(/\D/g, '');
    if (clean.length < 14 || clean.length > 16) {
      return { status: 'INVALID_FORMAT' };
    }
    const rastreador = await this.prisma.aparelho.findFirst({
      where: { tipo: 'RASTREADOR', identificador: clean },
      include: { simVinculado: true },
    });
    if (!rastreador) return { status: 'NEEDS_CREATE' };
    if (rastreador.simVinculadoId) {
      return { status: 'FOUND_ALREADY_LINKED', trackerId: rastreador.id };
    }
    return {
      status: 'FOUND_AVAILABLE',
      trackerId: rastreador.id,
      marca: rastreador.marca ?? undefined,
      modelo: rastreador.modelo ?? undefined,
    };
  }

  /** Resolve SIM por ICCID: FOUND_AVAILABLE | FOUND_ALREADY_LINKED | NEEDS_CREATE | INVALID_FORMAT */
  private async resolveSim(iccid: string): Promise<{
    status: 'FOUND_AVAILABLE' | 'FOUND_ALREADY_LINKED' | 'NEEDS_CREATE' | 'INVALID_FORMAT';
    simId?: number;
    operadora?: string;
    marcaSimcardId?: number;
    planoSimcardId?: number;
  }> {
    const clean = iccid.replace(/\D/g, '');
    if (clean.length < 18 || clean.length > 21) {
      return { status: 'INVALID_FORMAT' };
    }
    const sim = await this.prisma.aparelho.findFirst({
      where: { tipo: 'SIM', identificador: clean },
      include: { aparelhosVinculados: true },
    });
    if (!sim) return { status: 'NEEDS_CREATE' };
    const jaVinculado = sim.aparelhosVinculados?.length > 0;
    if (jaVinculado) {
      return { status: 'FOUND_ALREADY_LINKED', simId: sim.id };
    }
    return {
      status: 'FOUND_AVAILABLE',
      simId: sim.id,
      operadora: sim.operadora ?? undefined,
      marcaSimcardId: sim.marcaSimcardId ?? undefined,
      planoSimcardId: sim.planoSimcardId ?? undefined,
    };
  }

  /** Preview de pareamento: retorna status de cada par */
  async pareamentoPreview(pares: { imei: string; iccid: string }[]) {
    const resultados: Array<{
      imei: string;
      iccid: string;
      tracker_status: 'FOUND_AVAILABLE' | 'FOUND_ALREADY_LINKED' | 'NEEDS_CREATE' | 'INVALID_FORMAT';
      sim_status: 'FOUND_AVAILABLE' | 'FOUND_ALREADY_LINKED' | 'NEEDS_CREATE' | 'INVALID_FORMAT';
      action_needed: 'OK' | 'SELECT_TRACKER_LOT' | 'SELECT_SIM_LOT' | 'FIX_ERROR';
      trackerId?: number;
      simId?: number;
      marca?: string;
      modelo?: string;
      operadora?: string;
    }> = [];

    for (const { imei, iccid } of pares) {
      const [trackerRes, simRes] = await Promise.all([
        this.resolveRastreador(imei),
        this.resolveSim(iccid),
      ]);

      let action_needed: 'OK' | 'SELECT_TRACKER_LOT' | 'SELECT_SIM_LOT' | 'FIX_ERROR' = 'OK';
      if (
        trackerRes.status === 'INVALID_FORMAT' ||
        simRes.status === 'INVALID_FORMAT' ||
        trackerRes.status === 'FOUND_ALREADY_LINKED' ||
        simRes.status === 'FOUND_ALREADY_LINKED'
      ) {
        action_needed = 'FIX_ERROR';
      } else if (trackerRes.status === 'NEEDS_CREATE' && simRes.status === 'NEEDS_CREATE') {
        action_needed = 'SELECT_TRACKER_LOT'; // prioriza rastreador
      } else if (trackerRes.status === 'NEEDS_CREATE') {
        action_needed = 'SELECT_TRACKER_LOT';
      } else if (simRes.status === 'NEEDS_CREATE') {
        action_needed = 'SELECT_SIM_LOT';
      }

      resultados.push({
        imei,
        iccid,
        tracker_status: trackerRes.status,
        sim_status: simRes.status,
        action_needed,
        trackerId: trackerRes.trackerId,
        simId: simRes.simId,
        marca: trackerRes.marca,
        modelo: trackerRes.modelo,
        operadora: simRes.operadora,
      });
    }

    const validos = resultados.filter((r) => r.action_needed === 'OK').length;
    const exigemLote = resultados.filter(
      (r) =>
        r.action_needed === 'SELECT_TRACKER_LOT' || r.action_needed === 'SELECT_SIM_LOT',
    ).length;
    const erros = resultados.filter((r) => r.action_needed === 'FIX_ERROR').length;

    return {
      linhas: resultados,
      contadores: { validos, exigemLote, erros },
    };
  }

  /** Executa pareamento: cria equipamentos (vincula rastreador + SIM) */
  async pareamento(dto: {
    pares: { imei: string; iccid: string }[];
    loteRastreadorId?: number;
    loteSimId?: number;
    rastreadorManual?: { marca: string; modelo: string };
    simManual?: { operadora?: string; marcaSimcardId?: number; planoSimcardId?: number };
    kitId?: number;
    kitNome?: string;
  }) {
    const { pares, loteRastreadorId, loteSimId, rastreadorManual, simManual, kitId, kitNome } = dto;
    if (!pares?.length) {
      throw new BadRequestException('Nenhum par informado');
    }

    const preview = await this.pareamentoPreview(pares);
    const linhasNeedTracker = preview.linhas.filter((l) => l.tracker_status === 'NEEDS_CREATE');
    const linhasNeedSim = preview.linhas.filter((l) => l.sim_status === 'NEEDS_CREATE');

    const temLoteTracker = !!loteRastreadorId;
    const temManualTracker = !!(rastreadorManual?.marca && rastreadorManual?.modelo);
    const temLoteSim = !!loteSimId;
    const temManualSim = !!simManual?.operadora || !!simManual?.marcaSimcardId;

    if (linhasNeedTracker.length > 0 && !temLoteTracker && !temManualTracker) {
      throw new BadRequestException(
        `${linhasNeedTracker.length} rastreador(es) não encontrado(s). Selecione um lote ou informe marca e modelo para criação manual.`,
      );
    }
    if (linhasNeedSim.length > 0 && !temLoteSim && !temManualSim) {
      throw new BadRequestException(
        `${linhasNeedSim.length} SIM(s) não encontrado(s). Selecione um lote ou informe a operadora para criação manual.`,
      );
    }

    let kitIdFinal = kitId;
    if (kitNome?.trim()) {
      const kit = await this.criarOuBuscarKitPorNome(kitNome.trim());
      kitIdFinal = kit?.id ?? undefined;
    }

    return this.prisma.$transaction(async (tx) => {
      const criados: { rastreadorId: number; simId: number; equipamentoId: number }[] = [];

      for (const linha of preview.linhas) {
        let rastreadorId: number;
        let simId: number;

        // Resolver rastreador
        if (linha.tracker_status === 'FOUND_AVAILABLE' && linha.trackerId) {
          rastreadorId = linha.trackerId;
        } else if (linha.tracker_status === 'NEEDS_CREATE' && loteRastreadorId) {
          const aparelhoSemId = await tx.aparelho.findFirst({
            where: {
              loteId: loteRastreadorId,
              tipo: 'RASTREADOR',
              identificador: null,
              status: 'EM_ESTOQUE',
            },
          });
          if (!aparelhoSemId) {
            throw new BadRequestException(
              `Lote de rastreadores sem saldo disponível para IMEI ${linha.imei}`,
            );
          }
          const cleanImei = linha.imei.replace(/\D/g, '');
          await tx.aparelho.update({
            where: { id: aparelhoSemId.id },
            data: { identificador: cleanImei },
          });
          rastreadorId = aparelhoSemId.id;
        } else if (linha.tracker_status === 'NEEDS_CREATE' && rastreadorManual?.marca && rastreadorManual?.modelo) {
          const cleanImei = linha.imei.replace(/\D/g, '');
          const novo = await tx.aparelho.create({
            data: {
              tipo: 'RASTREADOR',
              identificador: cleanImei,
              status: 'EM_ESTOQUE',
              proprietario: 'INFINITY',
              marca: rastreadorManual.marca,
              modelo: rastreadorManual.modelo,
            },
          });
          rastreadorId = novo.id;
        } else {
          continue; // linha com erro, pula
        }

        // Resolver SIM
        if (linha.sim_status === 'FOUND_AVAILABLE' && linha.simId) {
          simId = linha.simId;
        } else if (linha.sim_status === 'NEEDS_CREATE' && loteSimId) {
          const aparelhoSemId = await tx.aparelho.findFirst({
            where: {
              loteId: loteSimId,
              tipo: 'SIM',
              identificador: null,
              status: 'EM_ESTOQUE',
            },
          });
          if (!aparelhoSemId) {
            throw new BadRequestException(
              `Lote de SIMs sem saldo disponível para ICCID ${linha.iccid}`,
            );
          }
          const cleanIccid = linha.iccid.replace(/\D/g, '');
          await tx.aparelho.update({
            where: { id: aparelhoSemId.id },
            data: { identificador: cleanIccid },
          });
          simId = aparelhoSemId.id;
        } else if (linha.sim_status === 'NEEDS_CREATE' && (simManual?.operadora || simManual?.marcaSimcardId)) {
          const cleanIccid = linha.iccid.replace(/\D/g, '');
          let operadoraNome = simManual.operadora;
          if (simManual.marcaSimcardId) {
            const marcaSim = await tx.marcaSimcard.findUnique({
              where: { id: simManual.marcaSimcardId },
              include: { operadora: true },
            });
            if (!marcaSim) throw new BadRequestException('Marca de simcard não encontrada');
            operadoraNome = marcaSim.operadora.nome;
          }
          const novo = await tx.aparelho.create({
            data: {
              tipo: 'SIM',
              identificador: cleanIccid,
              status: 'EM_ESTOQUE',
              proprietario: 'INFINITY',
              operadora: operadoraNome ?? null,
              marcaSimcardId: simManual.marcaSimcardId ?? null,
              planoSimcardId: simManual.planoSimcardId ?? null,
            },
          });
          simId = novo.id;
        } else {
          continue;
        }

        // Vincular: rastreador recebe simVinculadoId e status CONFIGURADO
        await tx.aparelho.update({
          where: { id: rastreadorId },
          data: {
            simVinculadoId: simId,
            status: 'CONFIGURADO',
            kitId: kitIdFinal ?? null,
          },
        });
        await tx.aparelho.update({
          where: { id: simId },
          data: { status: 'CONFIGURADO' },
        });

        await tx.aparelhoHistorico.create({
          data: {
            aparelhoId: rastreadorId,
            statusAnterior: 'EM_ESTOQUE',
            statusNovo: 'CONFIGURADO',
            observacao: `Pareamento com SIM ${linha.iccid}`,
          },
        });

        criados.push({
          rastreadorId,
          simId,
          equipamentoId: rastreadorId,
        });
      }

      return { criados: criados.length, equipamentos: criados };
    });
  }

  /** Lista kits disponíveis (kitConcluido = false) para pareamento */
  async getKits() {
    const kits = await this.prisma.kit.findMany({
      where: { kitConcluido: false },
      orderBy: { nome: 'asc' },
      select: { id: true, nome: true },
    });
    return kits;
  }

  /** Lista kits com detalhes (nome, data criação, quantidade, modelos/operadoras) */
  async getKitsComDetalhes() {
    const kits = await this.prisma.kit.findMany({
      orderBy: { nome: 'asc' },
      include: {
        aparelhos: {
          select: { marca: true, modelo: true, operadora: true },
        },
        _count: { select: { aparelhos: true } },
      },
    });
    return kits.map((k) => {
      const modelos = new Set<string>()
      const operadoras = new Set<string>()
      k.aparelhos.forEach((a) => {
        if (a.marca || a.modelo) modelos.add([a.marca, a.modelo].filter(Boolean).join(' / '))
        if (a.operadora) operadoras.add(a.operadora)
      })
      return {
        id: k.id,
        nome: k.nome,
        criadoEm: k.criadoEm,
        quantidade: k._count.aparelhos,
        modelosOperadoras:
          [...modelos, ...operadoras].filter(Boolean).join(', ') || '-',
      }
    })
  }

  /** Busca kit por ID com aparelhos */
  async getKitById(id: number) {
    const kit = await this.prisma.kit.findUnique({
      where: { id },
      include: {
        aparelhos: {
          where: { tipo: 'RASTREADOR' },
          include: {
            simVinculado: { select: { identificador: true, operadora: true } },
            cliente: { select: { id: true, nome: true } },
            tecnico: { select: { id: true, nome: true } },
            kit: { select: { id: true, nome: true } },
          },
        },
      },
    })
    if (!kit) throw new NotFoundException('Kit não encontrado')
    return kit
  }

  /** Atualiza kitId do aparelho (adicionar ou remover do kit) */
  async updateAparelhoKit(aparelhoId: number, kitId: number | null) {
    const aparelho = await this.prisma.aparelho.findUnique({
      where: { id: aparelhoId },
    })
    if (!aparelho) throw new NotFoundException('Aparelho não encontrado')
    if (aparelho.tipo !== 'RASTREADOR') {
      throw new BadRequestException('Apenas rastreadores podem ser adicionados ao kit')
    }
    return this.prisma.aparelho.update({
      where: { id: aparelhoId },
      data: { kitId },
    })
  }

  /** Lista rastreadores disponíveis: CONFIGURADO, sem kit, sem cliente, sem técnico */
  async getAparelhosDisponiveisParaKit() {
    const where: Prisma.AparelhoWhereInput = {
      tipo: 'RASTREADOR',
      status: 'CONFIGURADO',
      kitId: null,
      clienteId: null,
      tecnicoId: null,
    }
    return this.prisma.aparelho.findMany({
      where,
      orderBy: { criadoEm: 'desc' },
      include: {
        simVinculado: { select: { identificador: true, operadora: true } },
        cliente: { select: { id: true, nome: true } },
      },
    })
  }

  /** Cria ou busca kit por nome */
  async criarOuBuscarKitPorNome(nome: string) {
    const trimmed = nome.trim();
    if (!trimmed) return null;
    let kit = await this.prisma.kit.findUnique({ where: { nome: trimmed } });
    if (!kit) {
      kit = await this.prisma.kit.create({ data: { nome: trimmed } });
    }
    return kit;
  }

  /** Lista lotes disponíveis para consumo (com itens sem ID) */
  async getLotesParaPareamento(tipo: TipoAparelho) {
    const lotes = await this.prisma.loteAparelho.findMany({
      where: { tipo },
      include: {
        aparelhos: {
          where: { identificador: null, status: 'EM_ESTOQUE' },
          select: { id: true },
        },
      },
    });
    return lotes
      .filter((l) => l.aparelhos.length > 0)
      .map((l) => ({
        id: l.id,
        referencia: l.referencia,
        quantidadeDisponivelSemId: l.aparelhos.length,
      }));
  }
}
