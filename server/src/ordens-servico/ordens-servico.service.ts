import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StatusOS } from '@prisma/client';
import { CreateOrdemServicoDto } from './dto/create-ordem-servico.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@Injectable()
export class OrdensServicoService {
  constructor(private readonly prisma: PrismaService) {}

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
        historico: { orderBy: { criadoEm: 'desc' }, take: 20 },
      },
    });
    if (!os) throw new NotFoundException('Ordem de serviço não encontrada');
    return os;
  }

  async create(dto: CreateOrdemServicoDto, criadoPorId?: number) {
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
      },
      include: {
        cliente: true,
        subcliente: true,
        veiculo: true,
        tecnico: true,
      },
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
}
