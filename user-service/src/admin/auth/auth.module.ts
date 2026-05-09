import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { PrismaModule } from '../../../prisma/prisma.module.js';
import { AuthController } from './auth.controller.js';

@Module({
  imports: [PrismaModule],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
