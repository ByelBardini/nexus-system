import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CLIENTE_INFINITY_ID } from '../common/constants';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@Injectable()
export class ClientesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(opts?: { includeSubclientes?: boolean }) {
    return this.prisma.cliente.findMany({
      where: { id: { not: CLIENTE_INFINITY_ID } },
      orderBy: { nome: 'asc' },
      include: {
        contatos: true,
        _count: { select: { ordensServico: true } },
        ...(opts?.includeSubclientes ? { subclientes: true } : {}),
      },
    });
  }

  async findOne(id: number) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id },
      include: { contatos: true, subclientes: true },
    });
    if (!cliente) throw new NotFoundException('Cliente não encontrado');
    return cliente;
  }

  async create(dto: CreateClienteDto) {
    const { contatos, ...clienteData } = dto;

    return this.prisma.cliente.create({
      data: {
        ...clienteData,
        contatos: contatos?.length
          ? {
              create: contatos.map((c) => ({
                nome: c.nome,
                celular: c.celular,
                email: c.email,
              })),
            }
          : undefined,
      },
      include: { contatos: true },
    });
  }

  async update(id: number, dto: UpdateClienteDto) {
    await this.findOne(id);

    const { contatos, ...clienteData } = dto;

    if (contatos !== undefined) {
      const existingIds = contatos
        .filter((c) => c.id)
        .map((c) => c.id as number);

      await this.prisma.$transaction(async (tx) => {
        await tx.contatoCliente.deleteMany({
          where: {
            clienteId: id,
            id: { notIn: existingIds },
          },
        });

        for (const contato of contatos) {
          if (contato.id) {
            await tx.contatoCliente.update({
              where: { id: contato.id },
              data: {
                nome: contato.nome,
                celular: contato.celular,
                email: contato.email,
              },
            });
          } else {
            await tx.contatoCliente.create({
              data: {
                clienteId: id,
                nome: contato.nome,
                celular: contato.celular,
                email: contato.email,
              },
            });
          }
        }
      });
    }

    return this.prisma.cliente.update({
      where: { id },
      data: clienteData,
      include: { contatos: true },
    });
  }
}
