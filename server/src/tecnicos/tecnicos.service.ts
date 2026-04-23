import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  EnderecoGeocoding,
  GeocodingService,
} from '../common/geocoding/geocoding.service';
import { CreateTecnicoDto } from './dto/create-tecnico.dto';
import { UpdateTecnicoDto } from './dto/update-tecnico.dto';
import {
  precoTecnicoDataForCreate,
  precoTecnicoMergedRowForUpsert,
  tecnicoCreateDataFromDto,
  tecnicoUpdateDataFromDto,
} from './tecnicos.persist-helpers';

interface EnderecoSnapshot {
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  cidadeEndereco?: string | null;
  estadoEndereco?: string | null;
}

@Injectable()
export class TecnicosService {
  private readonly logger = new Logger(TecnicosService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly geocoding: GeocodingService,
  ) {}

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
      data: tecnicoCreateDataFromDto(dto),
    });
    if (dto.precos) {
      await this.prisma.precoTecnico.create({
        data: precoTecnicoDataForCreate(tecnico.id, dto.precos),
      });
    }
    await this.persistGeocoding(tecnico.id, dto);
    return this.findOne(tecnico.id);
  }

  async update(id: number, dto: UpdateTecnicoDto) {
    const existing = await this.findOne(id);
    await this.prisma.$transaction(async (tx) => {
      await tx.tecnico.update({
        where: { id },
        data: tecnicoUpdateDataFromDto(dto),
      });
      if (dto.precos) {
        const existingPrecos = await tx.precoTecnico.findUnique({
          where: { tecnicoId: id },
        });
        const { data, hadExisting } = precoTecnicoMergedRowForUpsert(
          dto.precos,
          existingPrecos,
        );
        if (hadExisting) {
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
    if (this.addressChanged(existing, dto)) {
      await this.persistGeocoding(id, this.mergeAddress(existing, dto));
    }
    return this.findOne(id);
  }

  private addressChanged(
    existing: EnderecoSnapshot,
    incoming: UpdateTecnicoDto,
  ): boolean {
    const fields: (keyof EnderecoSnapshot)[] = [
      'cep',
      'logradouro',
      'numero',
      'cidadeEndereco',
      'estadoEndereco',
    ];
    return fields.some(
      (f) => incoming[f] !== undefined && incoming[f] !== existing[f],
    );
  }

  private mergeAddress(
    existing: EnderecoSnapshot,
    incoming: UpdateTecnicoDto,
  ): EnderecoSnapshot {
    return {
      cep: incoming.cep ?? existing.cep,
      logradouro: incoming.logradouro ?? existing.logradouro,
      numero: incoming.numero ?? existing.numero,
      cidadeEndereco: incoming.cidadeEndereco ?? existing.cidadeEndereco,
      estadoEndereco: incoming.estadoEndereco ?? existing.estadoEndereco,
    };
  }

  private toGeocodingInput(endereco: EnderecoSnapshot): EnderecoGeocoding {
    return {
      cep: endereco.cep,
      logradouro: endereco.logradouro,
      numero: endereco.numero,
      cidade: endereco.cidadeEndereco,
      uf: endereco.estadoEndereco,
    };
  }

  private async persistGeocoding(
    tecnicoId: number,
    endereco: EnderecoSnapshot,
  ): Promise<void> {
    try {
      const result = await this.geocoding.geocode(
        this.toGeocodingInput(endereco),
      );
      if (!result) return;
      await this.prisma.tecnico.update({
        where: { id: tecnicoId },
        data: {
          latitude: result.lat,
          longitude: result.lng,
          geocodingPrecision: result.precision,
          geocodedAt: new Date(),
        },
      });
    } catch (err) {
      this.logger.warn({
        msg: 'Falha ao persistir geocoding do técnico',
        tecnicoId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}
