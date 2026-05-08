import { Module } from '@nestjs/common';
import { UserOptions } from './user/user.options.js';
import { AttentionOptions } from './attention/attention.options.js';

@Module({
  providers: [UserOptions, AttentionOptions],
  exports: [UserOptions, AttentionOptions],
})
export class OptionsModule {}
