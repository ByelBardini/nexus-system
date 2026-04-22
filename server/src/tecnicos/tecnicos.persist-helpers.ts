import type { PrecoTecnico } from '@prisma/client';
import type { CreateTecnicoDto } from './dto/create-tecnico.dto';
import type { UpdateTecnicoDto } from './dto/update-tecnico.dto';
import type { PrecosDto } from './dto/precos.dto';

export function tecnicoCreateDataFromDto(dto: CreateTecnicoDto) {
  return {
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
  };
}

export function tecnicoUpdateDataFromDto(dto: UpdateTecnicoDto) {
  return {
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
  };
}

export function precoTecnicoDataForCreate(tecnicoId: number, p: PrecosDto) {
  return {
    tecnicoId,
    instalacaoComBloqueio: p.instalacaoComBloqueio ?? 0,
    instalacaoSemBloqueio: p.instalacaoSemBloqueio ?? 0,
    revisao: p.revisao ?? 0,
    retirada: p.retirada ?? 0,
    deslocamento: p.deslocamento ?? 0,
  };
}

export function precoTecnicoMergedRowForUpsert(
  p: PrecosDto,
  existingPrecos: PrecoTecnico | null,
) {
  const data = {
    instalacaoComBloqueio:
      p.instalacaoComBloqueio ??
      Number(existingPrecos?.instalacaoComBloqueio ?? 0),
    instalacaoSemBloqueio:
      p.instalacaoSemBloqueio ??
      Number(existingPrecos?.instalacaoSemBloqueio ?? 0),
    revisao: p.revisao ?? Number(existingPrecos?.revisao ?? 0),
    retirada: p.retirada ?? Number(existingPrecos?.retirada ?? 0),
    deslocamento:
      p.deslocamento ?? Number(existingPrecos?.deslocamento ?? 0),
  };
  return { data, hadExisting: Boolean(existingPrecos) };
}
