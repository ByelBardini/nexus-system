import { Module } from '@nestjs/common';
import { OrdensServicoController } from './ordens-servico.controller';
import { OrdensServicoService } from './ordens-servico.service';
import { OrdemServicoStatusSideEffectsService } from './ordem-servico-status-side-effects.service';
import { HtmlOrdemServicoGenerator } from './html-ordem-servico.generator';
import { PdfOrdemServicoGenerator } from './pdf-ordem-servico.generator';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { DebitosRastreadoresModule } from '../debitos-rastreadores/debitos-rastreadores.module';

@Module({
  imports: [PrismaModule, UsersModule, DebitosRastreadoresModule],
  controllers: [OrdensServicoController],
  providers: [
    OrdensServicoService,
    OrdemServicoStatusSideEffectsService,
    HtmlOrdemServicoGenerator,
    PdfOrdemServicoGenerator,
  ],
})
export class OrdensServicoModule {}
