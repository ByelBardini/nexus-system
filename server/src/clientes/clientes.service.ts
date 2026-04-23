import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CLIENTE_INFINITY_ID } from '../common/constants';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { toPrismaContatoWriteData } from './clientes.contato.helpers';

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
              create: contatos.map((c) => toPrismaContatoWriteData(c)),
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
      await this.prisma.$transaction(async (tx) => {
        for (const contato of contatos) {
          if (contato.id != null) {
            const owned = await tx.contatoCliente.findFirst({
              where: { id: contato.id, clienteId: id },
              select: { id: true },
            });
            if (!owned) {
              throw new BadRequestException(
                'Contato não pertence a este cliente',
              );
            }
          }
        }

        const existingIds = contatos
          .filter((c) => c.id != null)
          .map((c) => c.id as number);

        await tx.contatoCliente.deleteMany({
          where: {
            clienteId: id,
            id: { notIn: existingIds },
          },
        });

        for (const contato of contatos) {
          if (contato.id != null) {
            await tx.contatoCliente.update({
              where: { id: contato.id },
              data: toPrismaContatoWriteData(contato),
            });
          } else {
            await tx.contatoCliente.create({
              data: {
                clienteId: id,
                ...toPrismaContatoWriteData(contato),
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
