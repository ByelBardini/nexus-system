import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SetorUsuario } from '@prisma/client';
import { CreateUserDto } from 'src/users/dto/create-user.dto';

describe('CreateUserDto', () => {
  async function valid(dto: CreateUserDto) {
    const errors = await validate(dto);
    expect(errors).toEqual([]);
  }

  it('aceita todos os valores de SetorUsuario', async () => {
    for (const setor of Object.values(SetorUsuario)) {
      const dto = plainToInstance(CreateUserDto, {
        nome: 'Teste',
        email: `t_${setor}@test.com`,
        password: '1234',
        setor,
      });
      await valid(dto);
    }
  });

  it('aceita setor omitido e null', async () => {
    const without = plainToInstance(CreateUserDto, {
      nome: 'A',
      email: 'a@b.com',
      password: '1234',
    });
    await valid(without);

    const withNull = plainToInstance(CreateUserDto, {
      nome: 'B',
      email: 'b@b.com',
      password: '1234',
      setor: null,
    });
    await valid(withNull);
  });

  it('rejeita string que não é membro do enum', async () => {
    const dto = plainToInstance(CreateUserDto, {
      nome: 'A',
      email: 'a@b.com',
      password: '1234',
      setor: 'AREA_51',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
