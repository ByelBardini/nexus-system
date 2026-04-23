import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SetorUsuario } from '@prisma/client';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';

describe('UpdateUserDto', () => {
  it('aceita payload vazio (patch parcial)', async () => {
    const dto = plainToInstance(UpdateUserDto, {});
    const errors = await validate(dto);
    expect(errors).toEqual([]);
  });

  it('aceita setor do enum e null', async () => {
    const withEnum = plainToInstance(UpdateUserDto, {
      setor: SetorUsuario.ADMINISTRATIVO,
    });
    expect(await validate(withEnum)).toEqual([]);

    const withNull = plainToInstance(UpdateUserDto, { setor: null });
    expect(await validate(withNull)).toEqual([]);
  });

  it('rejeita setor inválido quando informado', async () => {
    const dto = plainToInstance(UpdateUserDto, {
      setor: 'XYZ',
    } as Record<string, unknown>);
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejeita email malformado', async () => {
    const dto = plainToInstance(UpdateUserDto, { email: 'não-é-email' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
