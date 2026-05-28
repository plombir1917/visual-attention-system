import { Module } from '@nestjs/common';
import { UserOptions } from './user/user.options.js';
import { AttentionOptions } from './attention/attention.options.js';
import { AuthModule } from '../../../auth/auth.module.js';
import { SessionOptions } from './session/session.options.js';

@Module({
  imports: [AuthModule],
  providers: [UserOptions, AttentionOptions, SessionOptions],
  exports: [UserOptions, AttentionOptions, SessionOptions],
})
export class OptionsModule {}
