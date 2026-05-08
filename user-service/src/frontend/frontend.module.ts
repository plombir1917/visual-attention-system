import { Module } from '@nestjs/common';
import { FrontendController } from './frontend.controller';
import { PrismaModule } from 'prisma/prisma.module';
import { FrontendService } from './frontend.service';

@Module({
  imports: [PrismaModule],
  controllers: [FrontendController],
  providers: [FrontendService],
})
export class FrontendModule {}
