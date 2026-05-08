import { Module } from '@nestjs/common';
import { FrontendController } from './frontend.controller';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FrontendController],
})
export class FrontendModule {}
