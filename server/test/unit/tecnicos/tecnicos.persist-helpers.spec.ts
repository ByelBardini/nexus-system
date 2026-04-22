import type { PrecoTecnico } from '@prisma/client';
import {
  precoTecnicoDataForCreate,
  precoTecnicoMergedRowForUpsert,
  tecnicoCreateDataFromDto,
  tecnicoUpdateDataFromDto,
} from 'src/tecnicos/tecnicos.persist-helpers';
import type { CreateTecnicoDto } from 'src/tecnicos/dto/create-tecnico.dto';
import type { UpdateTecnicoDto } from 'src/tecnicos/dto/update-tecnico.dto';

describe('tecnicos.persist-helpers', () => {
  describe('tecnicoCreateDataFromDto', () => {
    it('usa ativo true quando omitido', () => {
      const dto = { nome: 'A' } as CreateTecnicoDto;
      expect(tecnicoCreateDataFromDto(dto).ativo).toBe(true);
    });

    it('preserva ativo false', () => {
      const dto = { nome: 'A', ativo: false } as CreateTecnicoDto;
      expect(tecnicoCreateDataFromDto(dto).ativo).toBe(false);
    });
  });

  describe('tecnicoUpdateDataFromDto', () => {
    it('repassa ativo undefined sem coerção', () => {
      const dto = { nome: 'B' } as UpdateTecnicoDto;
      expect(tecnicoUpdateDataFromDto(dto).ativo).toBeUndefined();
    });
  });

  describe('precoTecnicoDataForCreate', () => {
    it('preenche zeros quando campos de preço omitidos', () => {
      expect(precoTecnicoDataForCreate(7, {})).toEqual({
        tecnicoId: 7,
        instalacaoComBloqueio: 0,
        instalacaoSemBloqueio: 0,
        revisao: 0,
        retirada: 0,
        deslocamento: 0,
      });
    });

    it('aceita zero explícito', () => {
      expect(
        precoTecnicoDataForCreate(1, {
          instalacaoComBloqueio: 0,
          revisao: 0,
        }),
      ).toMatchObject({
        tecnicoId: 1,
        instalacaoComBloqueio: 0,
        revisao: 0,
        instalacaoSemBloqueio: 0,
      });
    });
  });

  describe('precoTecnicoMergedRowForUpsert', () => {
    it('marca hadExisting false quando não há linha', () => {
      const { data, hadExisting } = precoTecnicoMergedRowForUpsert(
        { revisao: 10 },
        null,
      );
      expect(hadExisting).toBe(false);
      expect(data).toMatchObject({
        instalacaoComBloqueio: 0,
        instalacaoSemBloqueio: 0,
        revisao: 10,
        retirada: 0,
        deslocamento: 0,
      });
    });

    it('herda valores do registro existente quando patch parcial', () => {
      const existing = {
        id: 1,
        tecnicoId: 1,
        instalacaoComBloqueio: '200.5' as unknown as number,
        instalacaoSemBloqueio: 80,
        revisao: 15,
        retirada: 5,
        deslocamento: 3,
      } as unknown as PrecoTecnico;
      const { data, hadExisting } = precoTecnicoMergedRowForUpsert(
        { revisao: 99 },
        existing,
      );
      expect(hadExisting).toBe(true);
      expect(data).toEqual({
        instalacaoComBloqueio: 200.5,
        instalacaoSemBloqueio: 80,
        revisao: 99,
        retirada: 5,
        deslocamento: 3,
      });
    });

    it('trata Decimal-like null como zero nos campos herdados', () => {
      const existing = {
        id: 1,
        tecnicoId: 1,
        instalacaoComBloqueio: null as unknown as number,
        instalacaoSemBloqueio: null as unknown as number,
        revisao: null as unknown as number,
        retirada: null as unknown as number,
        deslocamento: null as unknown as number,
      } as unknown as PrecoTecnico;
      const { data } = precoTecnicoMergedRowForUpsert({}, existing);
      expect(data.instalacaoComBloqueio).toBe(0);
      expect(data.revisao).toBe(0);
    });
  });
});
