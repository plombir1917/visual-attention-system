import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { VkidService } from './vkid.service.js';
import { PrismaModule } from '../../../prisma/prisma.module.js';
import { AuthController } from './auth.controller.js';

@Module({
  imports: [PrismaModule],
  providers: [AuthService, VkidService],
  controllers: [AuthController],
  exports: [AuthService, VkidService],
})
export class AuthModule {}
