import { IsNumericIdArrayProperty } from './is-numeric-id-array.decorator';

export class AssignRolesDto {
  @IsNumericIdArrayProperty({ example: [1, 2] })
  roleIds: number[];
}
