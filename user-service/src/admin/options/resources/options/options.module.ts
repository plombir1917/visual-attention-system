import { Module } from '@nestjs/common';
import { UserOptions } from './user/user.options.js';

@Module({
  providers: [UserOptions],
  exports: [UserOptions],
})
export class OptionsModule {}
