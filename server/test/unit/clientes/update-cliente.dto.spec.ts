import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { TipoContrato } from 'src/clientes/dto/create-cliente.dto';
import {
  UpdateClienteDto,
  UpdateContatoDto,
} from 'src/clientes/dto/update-cliente.dto';

describe('UpdateContatoDto', () => {
  it('aceita contato sem id (novo)', async () => {
    const dto = plainToInstance(UpdateContatoDto, {
      nome: 'Novo',
      email: 'a@b.com',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('aceita id numérico opcional', async () => {
    const dto = plainToInstance(UpdateContatoDto, {
      id: 7,
      nome: 'Velho',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejeita nome vazio', async () => {
    const dto = plainToInstance(UpdateContatoDto, { nome: '' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejeita email inválido quando informado', async () => {
    const dto = plainToInstance(UpdateContatoDto, {
      nome: 'X',
      email: 'not-an-email',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('UpdateClienteDto', () => {
  it('aceita payload vazio (update parcial)', async () => {
    const dto = plainToInstance(UpdateClienteDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('aceita apenas nome', async () => {
    const dto = plainToInstance(UpdateClienteDto, { nome: 'Só nome' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejeita nome com string vazia quando informado', async () => {
    const dto = plainToInstance(UpdateClienteDto, { nome: '' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('aceita tipoContrato válido do enum', async () => {
    const dto = plainToInstance(UpdateClienteDto, {
      tipoContrato: TipoContrato.AQUISICAO,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejeita tipoContrato inválido', async () => {
    const dto = plainToInstance(UpdateClienteDto, {
      tipoContrato: 'INVALIDO',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('valida array aninhado de contatos', async () => {
    const dto = plainToInstance(UpdateClienteDto, {
      contatos: [{ nome: 'OK' }, { id: 1, nome: 'Atual' }],
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejeita contato inválido dentro do array', async () => {
    const dto = plainToInstance(UpdateClienteDto, {
      contatos: [{ nome: '' }],
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
