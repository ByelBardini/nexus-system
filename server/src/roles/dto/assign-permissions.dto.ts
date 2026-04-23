import { IsNumericIdArrayProperty } from './is-numeric-id-array.decorator';

export class AssignPermissionsDto {
  @IsNumericIdArrayProperty({ example: [1, 2, 3] })
  permissionIds: number[];
}
