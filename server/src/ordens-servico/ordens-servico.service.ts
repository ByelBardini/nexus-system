import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { paginateParams } from '../common/pagination.helper';
import { CLIENTE_INFINITY_ID } from '../common/constants';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { StatusCadastro, StatusOS, StatusAparelho } from '@prisma/client';
import { CreateOrdemServicoDto } from './dto/create-ordem-servico.dto';
import { UpdateOrdemServicoDto } from './dto/update-ordem-servico.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { HtmlOrdemServicoGenerator } from './html-ordem-servico.generator';
import { PdfOrdemServicoGenerator } from './pdf-ordem-servico.generator';

@Injectable()
export class OrdensServicoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly htmlOrdemServicoGenerator: HtmlOrdemServicoGenerator,
    private readonly pdfOrdemServicoGenerator: PdfOrdemServicoGenerator,
  ) {}

  private static readonly INFINITY_NOME = 'Infinity';

  private static readonly TRANSICOES_VALIDAS: Partial<Record<StatusOS, StatusOS[]>> = {
    AGENDADO: [StatusOS.EM_TESTES, StatusOS.CANCELADO],
    EM_TESTES: [StatusOS.TESTES_REALIZADOS, StatusOS.AGENDADO, StatusOS.CANCELADO],
    TESTES_REALIZADOS: [StatusOS.AGUARDANDO_CADASTRO, StatusOS.AGENDADO, StatusOS.CANCELADO],
    AGUARDANDO_CADASTRO: [StatusOS.FINALIZADO, StatusOS.AGENDADO, StatusOS.CANCELADO],
    FINALIZADO: [],
    CANCELADO: [StatusOS.AGENDADO],
  };

  async getClienteInfinityOuCriar() {
    const maxRetries = 5;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            // Prioriza o cliente Infinity com ID fixo (criado pelo seed)
            let cliente = await tx.cliente.findUnique({
              where: { id: CLIENTE_INFINITY_ID },
            });
            if (!cliente) {
              cliente = await tx.cliente.findFirst({
                where: { nome: OrdensServicoService.INFINITY_NOME },
              });
            }
            if (!cliente) {
              cliente = await tx.cliente.create({
                data: {
                  nome: OrdensServicoService.INFINITY_NOME,
                  nomeFantasia: OrdensServicoService.INFINITY_NOME,
                },
              });
            }
            return cliente.id;
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          },
        );
      } catch (e) {
        const isRetryable =
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2034'; // Transaction conflict / serialization failure
        if (attempt < maxRetries - 1 && isRetryable) {
          continue;
        }
        throw e;
      }
    }
    throw new Error('getClienteInfinityOuCriar: retries exhausted');
  }

  async findTestando(search?: string) {
    const where: Prisma.OrdemServicoWhereInput = { status: StatusOS.EM_TESTES };
    if (search?.trim()) {
      const s = search.trim();
      const isNum = !isNaN(Number(s));
      where.OR = [
        ...(isNum ? [{ numero: Number(s) }] : []),
        { cliente: { nome: { contains: s } } },
        { subcliente: { nome: { contains: s } } },
        { subclienteSnapshotNome: { contains: s } },
        { veiculo: { placa: { contains: s } } },
        { tecnico: { nome: { contains: s } } },
        { idAparelho: { contains: s } },
      ];
    }

    const items = await this.prisma.ordemServico.findMany({
      where,
      orderBy: { criadoEm: 'desc' },
      include: {
        cliente: { select: { id: true, nome: true } },
        subcliente: { select: { id: true, nome: true } },
        veiculo: { select: { id: true, placa: true, marca: true, modelo: true } },
        tecnico: { select: { id: true, nome: true } },
        historico: {
          where: { statusNovo: StatusOS.EM_TESTES },
          orderBy: { criadoEm: 'desc' },
          take: 1,
        },
      },
    });

    const now = new Date();
    return items.map((os) => {
      const entradaEmTestes = os.historico[0]?.criadoEm ?? os.atualizadoEm;
      const tempoEmTestesMin = Math.floor((now.getTime() - new Date(entradaEmTestes).getTime()) / 60000);
      const { historico, ...rest } = os;
      const result = { ...rest, tempoEmTestesMin };
      // Retiradas: zerar dados do rastreador/veículo vinculado ao exibir em testes
      if (os.tipo === 'RETIRADA') {
        result.veiculo = null;
        result.subcliente = null;
        result.subclienteSnapshotNome = null;
      }
      return result;
    });
  }

  async getResumo() {
    const [agendado, emTestes, testesRealizados, agCadastro, finalizado] = await Promise.all([
      this.prisma.ordemServico.count({ where: { status: StatusOS.AGENDADO } }),
      this.prisma.ordemServico.count({ where: { status: StatusOS.EM_TESTES } }),
      this.prisma.ordemServico.count({ where: { status: StatusOS.TESTES_REALIZADOS } }),
      this.prisma.ordemServico.count({ where: { status: StatusOS.AGUARDANDO_CADASTRO } }),
      this.prisma.ordemServico.count({ where: { status: StatusOS.FINALIZADO } }),
    ]);
    return {
      agendado,
      emTestes,
      testesRealizados,
      aguardandoCadastro: agCadastro,
      finalizado,
    };
  }

  async findAll(params: { page?: number; limit?: number; status?: StatusOS; search?: string }) {
    const { page, limit, skip } = paginateParams(params, {
      maxLimit: 100,
      defaultLimit: 15,
    });

    const where: Record<string, unknown> = {};
    if (params.status) where.status = params.status;
    if (params.search?.trim()) {
      const s = params.search.trim();
      const isNum = !isNaN(Number(s));
      where.OR = [
        ...(isNum ? [{ numero: Number(s) }] : []),
        { cliente: { nome: { contains: s } } },
        { subcliente: { nome: { contains: s } } },
        { veiculo: { placa: { contains: s } } },
        { tecnico: { nome: { contains: s } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.ordemServico.findMany({
        where,
        skip,
        take: limit,
        orderBy: { criadoEm: 'desc' },
        include: {
          cliente: true,
          subcliente: true,
          veiculo: true,
          tecnico: true,
        },
      }),
      this.prisma.ordemServico.count({ where }),
    ]);

    return {
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const os = await this.prisma.ordemServico.findUnique({
      where: { id },
      include: {
        cliente: true,
        subcliente: true,
        veiculo: true,
        tecnico: true,
        criadoPor: true,
        concluidoPor: true,
        historico: { orderBy: { criadoEm: 'desc' }, take: 20 },
      },
    });
    if (!os) throw new NotFoundException('Ordem de serviço não encontrada');
    return os;
  }

  private static buildOrdemServicoData(
    dto: CreateOrdemServicoDto,
    numero: number,
    subclienteId: number | null | undefined,
    criadoPorId: number | undefined,
    snapshot: Record<string, unknown>,
  ) {
    return {
      numero,
      tipo: dto.tipo,
      status: dto.status ?? StatusOS.AGENDADO,
      clienteId: dto.clienteId,
      subclienteId,
      veiculoId: dto.veiculoId,
      tecnicoId: dto.tecnicoId,
      criadoPorId,
      observacoes: dto.observacoes,
      idAparelho: dto.idAparelho?.trim() || null,
      localInstalacao: dto.localInstalacao?.trim() || null,
      posChave: dto.posChave || null,
      ...snapshot,
    };
  }

  private static snapshotFromSubclienteData(data: {
    nome: string;
    cep?: string | null;
    logradouro?: string | null;
    numero?: string | null;
    complemento?: string | null;
    bairro?: string | null;
    cidade?: string | null;
    estado?: string | null;
    cpf?: string | null;
    email?: string | null;
    telefone?: string | null;
    cobrancaTipo?: string | null;
  }) {
    return {
      subclienteSnapshotNome: data.nome || null,
      subclienteSnapshotCep: data.cep ?? null,
      subclienteSnapshotLogradouro: data.logradouro ?? null,
      subclienteSnapshotNumero: data.numero ?? null,
      subclienteSnapshotComplemento: data.complemento ?? null,
      subclienteSnapshotBairro: data.bairro ?? null,
      subclienteSnapshotCidade: data.cidade ?? null,
      subclienteSnapshotEstado: data.estado ?? null,
      subclienteSnapshotCpf: data.cpf ?? null,
      subclienteSnapshotEmail: data.email ?? null,
      subclienteSnapshotTelefone: data.telefone ?? null,
      subclienteSnapshotCobrancaTipo: data.cobrancaTipo ?? null,
    };
  }

  private static isUniqueConstraintError(e: unknown): boolean {
    return e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002';
  }

  async create(dto: CreateOrdemServicoDto, criadoPorId?: number) {
    const maxRetries = 5;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.createOnce(dto, criadoPorId);
      } catch (e) {
        if (attempt < maxRetries - 1 && OrdensServicoService.isUniqueConstraintError(e)) {
          continue;
        }
        throw e;
      }
    }
    throw new Error('create ordem-servico: retries exhausted');
  }

  private async createOnce(dto: CreateOrdemServicoDto, criadoPorId?: number) {
    const include = {
      cliente: true,
      subcliente: true,
      veiculo: true,
      tecnico: true,
    };

    if (dto.subclienteCreate) {
      return this.prisma.$transaction(async (tx) => {
        const sub = await tx.subcliente.create({
          data: {
            clienteId: dto.clienteId,
            nome: dto.subclienteCreate!.nome,
            cep: dto.subclienteCreate!.cep,
            logradouro: dto.subclienteCreate!.logradouro ?? null,
            numero: dto.subclienteCreate!.numero ?? null,
            complemento: dto.subclienteCreate!.complemento ?? null,
            bairro: dto.subclienteCreate!.bairro ?? null,
            cidade: dto.subclienteCreate!.cidade,
            estado: dto.subclienteCreate!.estado,
            cpf: dto.subclienteCreate!.cpf ?? null,
            email: dto.subclienteCreate!.email ?? null,
            telefone: dto.subclienteCreate!.telefone ?? null,
            cobrancaTipo: dto.subclienteCreate!.cobrancaTipo ?? null,
          },
        });
        const max = await tx.ordemServico.aggregate({ _max: { numero: true } });
        const numero = (max._max.numero ?? 0) + 1;
        const snapshot = OrdensServicoService.snapshotFromSubclienteData(dto.subclienteCreate!);
        return tx.ordemServico.create({
          data: OrdensServicoService.buildOrdemServicoData(
            dto,
            numero,
            sub.id,
            criadoPorId,
            snapshot,
          ),
          include,
        });
      });
    }

    const subclienteUpdate = dto.subclienteId && dto.subclienteUpdate ? dto.subclienteUpdate : null;
    if (dto.subclienteId && subclienteUpdate) {
      return this.prisma.$transaction(async (tx) => {
        await tx.subcliente.update({
          where: { id: dto.subclienteId! },
          data: {
            nome: subclienteUpdate.nome,
            cep: subclienteUpdate.cep,
            logradouro: subclienteUpdate.logradouro ?? null,
            numero: subclienteUpdate.numero ?? null,
            complemento: subclienteUpdate.complemento ?? null,
            bairro: subclienteUpdate.bairro ?? null,
            cidade: subclienteUpdate.cidade,
            estado: subclienteUpdate.estado,
            cpf: subclienteUpdate.cpf ?? null,
            email: subclienteUpdate.email ?? null,
            telefone: subclienteUpdate.telefone ?? null,
            cobrancaTipo: subclienteUpdate.cobrancaTipo ?? null,
          },
        });
        const max = await tx.ordemServico.aggregate({ _max: { numero: true } });
        const numero = (max._max.numero ?? 0) + 1;
        const snapshot = OrdensServicoService.snapshotFromSubclienteData(subclienteUpdate);
        return tx.ordemServico.create({
          data: OrdensServicoService.buildOrdemServicoData(
            dto,
            numero,
            dto.subclienteId!,
            criadoPorId,
            snapshot,
          ),
          include,
        });
      });
    }

    if (dto.subclienteId) {
      return this.prisma.$transaction(async (tx) => {
        const sub = await tx.subcliente.findUnique({
          where: { id: dto.subclienteId! },
        });
        const snapshot = sub ? OrdensServicoService.snapshotFromSubclienteData(sub) : {};
        const max = await tx.ordemServico.aggregate({ _max: { numero: true } });
        const numero = (max._max.numero ?? 0) + 1;
        return tx.ordemServico.create({
          data: OrdensServicoService.buildOrdemServicoData(
            dto,
            numero,
            dto.subclienteId,
            criadoPorId,
            snapshot,
          ),
          include,
        });
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const max = await tx.ordemServico.aggregate({ _max: { numero: true } });
      const numero = (max._max.numero ?? 0) + 1;
      return tx.ordemServico.create({
        data: OrdensServicoService.buildOrdemServicoData(
          dto,
          numero,
          dto.subclienteId ?? null,
          criadoPorId,
          {},
        ),
        include,
      });
    });
  }

  async updateStatus(id: number, dto: UpdateStatusDto) {
    const os = await this.findOne(id);
    const statusAnterior = os.status;
    if (statusAnterior === dto.status) return this.findOne(id);

    const permitidos = OrdensServicoService.TRANSICOES_VALIDAS[statusAnterior];
    const transicaoPermitida =
      permitidos?.includes(dto.status) ||
      (os.tipo === 'RETIRADA' &&
        statusAnterior === StatusOS.AGENDADO &&
        dto.status === StatusOS.AGUARDANDO_CADASTRO);

    if (!transicaoPermitida) {
      throw new BadRequestException(
        `Transição de status inválida: ${statusAnterior} → ${dto.status}`,
      );
    }

    const updateData: {
      status: StatusOS
      statusCadastro?: StatusCadastro
      localInstalacao?: string | null
      posChave?: string | null
      observacoes?: string | null
    } = { status: dto.status };

    if (dto.status === StatusOS.AGUARDANDO_CADASTRO) {
      updateData.statusCadastro = StatusCadastro.AGUARDANDO;
    }
    if (dto.localInstalacao !== undefined) {
      updateData.localInstalacao = dto.localInstalacao?.trim() || null;
    }
    if (dto.posChave !== undefined) {
      updateData.posChave = dto.posChave;
    }
    if (dto.observacao?.trim()) {
      const prefixo = 'Observações do Teste:'
      const novaParte = `${prefixo} ${dto.observacao.trim()}`
      updateData.observacoes = [os.observacoes, novaParte].filter(Boolean).join('\n')
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.oSHistorico.create({
        data: {
          ordemServicoId: id,
          statusAnterior,
          statusNovo: dto.status,
          observacao: dto.observacao,
        },
      });
      await tx.ordemServico.update({
        where: { id },
        data: updateData,
      });
      if (
        dto.status === StatusOS.TESTES_REALIZADOS &&
        os.idAparelho?.trim()
      ) {
        const aparelho = await tx.aparelho.findFirst({
          where: { identificador: os.idAparelho.trim(), tipo: 'RASTREADOR' },
          include: { simVinculado: { select: { id: true, status: true } } },
        });
        if (aparelho) {
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
        }
      }
    });

    return this.findOne(id);
  }

  async update(id: number, dto: UpdateOrdemServicoDto) {
    await this.findOne(id);
    const data: { idEntrada?: string | null; aparelhoEncontrado?: boolean | null } = {};
    if (dto.idEntrada !== undefined) {
      data.idEntrada = dto.idEntrada?.trim() || null;
    }
    if (dto.aparelhoEncontrado !== undefined) {
      data.aparelhoEncontrado = dto.aparelhoEncontrado;
    }
    if (Object.keys(data).length === 0) return this.findOne(id);
    await this.prisma.ordemServico.update({
      where: { id },
      data,
    });
    return this.findOne(id);
  }

  async updateIdAparelho(id: number, idAparelho: string) {
    await this.findOne(id);
    await this.prisma.ordemServico.update({
      where: { id },
      data: { idAparelho: idAparelho || null },
    });
    return this.findOne(id);
  }

  async gerarHtmlImpressao(id: number): Promise<string> {
    const os = await this.findOne(id);
    return this.htmlOrdemServicoGenerator.gerar(os);
  }

  async gerarPdf(id: number): Promise<{ buffer: Buffer; numero: number }> {
    const os = await this.findOne(id);
    const buffer = await this.pdfOrdemServicoGenerator.gerar(os);
    return { buffer, numero: os.numero };
  }
}
