import { Module } from '@nestjs/common';
import { TabelasConfigController } from './tabelas-config.controller';
import { TabelasConfigService } from './tabelas-config.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [TabelasConfigController],
  providers: [TabelasConfigService],
})
export class TabelasConfigModule {}
