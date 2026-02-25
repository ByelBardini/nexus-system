import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VeiculosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    const where = search?.trim()
      ? { placa: { contains: search.trim() } }
      : {};
    return this.prisma.veiculo.findMany({
      where,
      orderBy: { placa: 'asc' },
      take: 50,
    });
  }
}
