import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StatusOS } from '@prisma/client';
import { CreateOrdemServicoDto } from './dto/create-ordem-servico.dto';
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

  async getClienteInfinityOuCriar() {
    let cliente = await this.prisma.cliente.findFirst({
      where: { nome: OrdensServicoService.INFINITY_NOME },
    });
    if (!cliente) {
      cliente = await this.prisma.cliente.create({
        data: {
          nome: OrdensServicoService.INFINITY_NOME,
          nomeFantasia: OrdensServicoService.INFINITY_NOME,
        },
      });
    }
    return cliente.id;
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
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 15));
    const skip = (page - 1) * limit;

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
      items,
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
        historico: { orderBy: { criadoEm: 'desc' }, take: 20 },
      },
    });
    if (!os) throw new NotFoundException('Ordem de serviço não encontrada');
    return os;
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

  async create(dto: CreateOrdemServicoDto, criadoPorId?: number) {
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
          data: {
            numero,
            tipo: dto.tipo,
            status: dto.status ?? StatusOS.AGENDADO,
            clienteId: dto.clienteId,
            subclienteId: sub.id,
            veiculoId: dto.veiculoId,
            tecnicoId: dto.tecnicoId,
            criadoPorId,
            observacoes: dto.observacoes,
            idAparelho: dto.idAparelho?.trim() || null,
            localInstalacao: dto.localInstalacao?.trim() || null,
            posChave: dto.posChave || null,
            ...snapshot,
          },
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
          data: {
            numero,
            tipo: dto.tipo,
            status: dto.status ?? StatusOS.AGENDADO,
            clienteId: dto.clienteId,
            subclienteId: dto.subclienteId,
            veiculoId: dto.veiculoId,
            tecnicoId: dto.tecnicoId,
            criadoPorId,
            observacoes: dto.observacoes,
            idAparelho: dto.idAparelho?.trim() || null,
            localInstalacao: dto.localInstalacao?.trim() || null,
            posChave: dto.posChave || null,
            ...snapshot,
          },
          include,
        });
      });
    }

    if (dto.subclienteId) {
      const sub = await this.prisma.subcliente.findUnique({
        where: { id: dto.subclienteId },
      });
      const snapshot = sub ? OrdensServicoService.snapshotFromSubclienteData(sub) : {};
      const max = await this.prisma.ordemServico.aggregate({ _max: { numero: true } });
      const numero = (max._max.numero ?? 0) + 1;
      return this.prisma.ordemServico.create({
        data: {
          numero,
          tipo: dto.tipo,
          status: dto.status ?? StatusOS.AGENDADO,
          clienteId: dto.clienteId,
          subclienteId: dto.subclienteId,
          veiculoId: dto.veiculoId,
          tecnicoId: dto.tecnicoId,
          criadoPorId,
          observacoes: dto.observacoes,
          idAparelho: dto.idAparelho?.trim() || null,
          localInstalacao: dto.localInstalacao?.trim() || null,
          posChave: dto.posChave || null,
          ...snapshot,
        },
        include,
      });
    }

    const max = await this.prisma.ordemServico.aggregate({ _max: { numero: true } });
    const numero = (max._max.numero ?? 0) + 1;

    return this.prisma.ordemServico.create({
      data: {
        numero,
        tipo: dto.tipo,
        status: dto.status ?? StatusOS.AGENDADO,
        clienteId: dto.clienteId,
        subclienteId: dto.subclienteId,
        veiculoId: dto.veiculoId,
        tecnicoId: dto.tecnicoId,
        criadoPorId,
        observacoes: dto.observacoes,
        idAparelho: dto.idAparelho?.trim() || null,
        localInstalacao: dto.localInstalacao?.trim() || null,
        posChave: dto.posChave || null,
      },
      include,
    });
  }

  async updateStatus(id: number, dto: UpdateStatusDto) {
    const os = await this.findOne(id);
    const statusAnterior = os.status;
    if (statusAnterior === dto.status) return this.findOne(id);

    await this.prisma.$transaction([
      this.prisma.oSHistorico.create({
        data: {
          ordemServicoId: id,
          statusAnterior,
          statusNovo: dto.status,
          observacao: dto.observacao,
        },
      }),
      this.prisma.ordemServico.update({
        where: { id },
        data: { status: dto.status },
      }),
    ]);

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
