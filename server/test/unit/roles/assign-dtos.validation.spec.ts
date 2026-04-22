import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AssignPermissionsDto } from 'src/roles/dto/assign-permissions.dto';
import { AssignRolesDto } from 'src/roles/dto/assign-roles.dto';

describe('AssignPermissionsDto / AssignRolesDto (validação)', () => {
  it('AssignPermissionsDto aceita array numérico vazio', async () => {
    const dto = plainToInstance(AssignPermissionsDto, {
      permissionIds: [],
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('AssignPermissionsDto rejeita permissionIds ausente', async () => {
    const dto = plainToInstance(AssignPermissionsDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('AssignPermissionsDto rejeita elemento não numérico', async () => {
    const dto = plainToInstance(AssignPermissionsDto, {
      permissionIds: [1, 'a'],
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('AssignRolesDto aceita roleIds numéricos', async () => {
    const dto = plainToInstance(AssignRolesDto, { roleIds: [10, 20] });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('AssignRolesDto rejeita roleIds ausente', async () => {
    const dto = plainToInstance(AssignRolesDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
