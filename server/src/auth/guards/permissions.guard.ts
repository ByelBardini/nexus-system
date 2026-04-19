import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { UsersService } from '../../users/users.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) return true;

    const request = context
      .switchToHttp()
      .getRequest<{ user?: { email: string } }>();
    const user = request.user;
    if (!user) return false;

    const fullUser = await this.usersService.findByEmail(user.email);
    if (!fullUser) return false;

    const permissions = this.usersService.getPermissions(fullUser);
    const hasAll = required.every((p) => permissions.includes(p));
    if (!hasAll) {
      throw new ForbiddenException('Sem permissão para esta ação');
    }
    return true;
  }
}
