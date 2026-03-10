import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTecnicoDto } from './dto/create-tecnico.dto';
import { UpdateTecnicoDto } from './dto/update-tecnico.dto';


@Injectable()
export class TecnicosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.tecnico.findMany({
      orderBy: { nome: 'asc' },
      include: { precos: true },
    });
  }

  async findOne(id: number) {
    const tecnico = await this.prisma.tecnico.findUnique({
      where: { id },
      include: { precos: true },
    });
    if (!tecnico) throw new NotFoundException('Técnico não encontrado');
    return tecnico;
  }

  async create(dto: CreateTecnicoDto) {
    const tecnico = await this.prisma.tecnico.create({
      data: {
        nome: dto.nome,
        cpfCnpj: dto.cpfCnpj,
        telefone: dto.telefone,
        cidade: dto.cidade,
        estado: dto.estado,
        cep: dto.cep,
        logradouro: dto.logradouro,
        numero: dto.numero,
        complemento: dto.complemento,
        bairro: dto.bairro,
        cidadeEndereco: dto.cidadeEndereco,
        estadoEndereco: dto.estadoEndereco,
        ativo: dto.ativo ?? true,
      },
    });
    if (dto.precos) {
      const p = dto.precos;
      await this.prisma.precoTecnico.create({
        data: {
          tecnicoId: tecnico.id,
          instalacaoComBloqueio: p.instalacaoComBloqueio ?? 0,
          instalacaoSemBloqueio: p.instalacaoSemBloqueio ?? 0,
          revisao: p.revisao ?? 0,
          retirada: p.retirada ?? 0,
          deslocamento: p.deslocamento ?? 0,
        },
      });
    }
    return this.findOne(tecnico.id);
  }

  async update(id: number, dto: UpdateTecnicoDto) {
    await this.findOne(id);
    await this.prisma.$transaction(async (tx) => {
      await tx.tecnico.update({
        where: { id },
        data: {
          nome: dto.nome,
          cpfCnpj: dto.cpfCnpj,
          telefone: dto.telefone,
          cidade: dto.cidade,
          estado: dto.estado,
          cep: dto.cep,
          logradouro: dto.logradouro,
          numero: dto.numero,
          complemento: dto.complemento,
          bairro: dto.bairro,
          cidadeEndereco: dto.cidadeEndereco,
          estadoEndereco: dto.estadoEndereco,
          ativo: dto.ativo,
        },
      });
      if (dto.precos) {
        const p = dto.precos;
        const existing = await tx.precoTecnico.findUnique({
          where: { tecnicoId: id },
        });
        const data = {
          instalacaoComBloqueio: p.instalacaoComBloqueio ?? Number(existing?.instalacaoComBloqueio ?? 0),
          instalacaoSemBloqueio: p.instalacaoSemBloqueio ?? Number(existing?.instalacaoSemBloqueio ?? 0),
          revisao: p.revisao ?? Number(existing?.revisao ?? 0),
          retirada: p.retirada ?? Number(existing?.retirada ?? 0),
          deslocamento: p.deslocamento ?? Number(existing?.deslocamento ?? 0),
        };
        if (existing) {
          await tx.precoTecnico.update({
            where: { tecnicoId: id },
            data,
          });
        } else {
          await tx.precoTecnico.create({
            data: { tecnicoId: id, ...data },
          });
        }
      }
    });
    return this.findOne(id);
  }
}
