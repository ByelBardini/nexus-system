import { Module } from '@nestjs/common';
import { TabelasConfigController } from './tabelas-config.controller';
import { TabelasConfigService } from './tabelas-config.service';

@Module({
  controllers: [TabelasConfigController],
  providers: [TabelasConfigService],
})
export class TabelasConfigModule {}
