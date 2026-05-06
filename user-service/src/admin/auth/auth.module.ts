import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
// import { UserModule } from '../../api/user/user.module.js';

@Module({
  // imports: [UserModule],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
