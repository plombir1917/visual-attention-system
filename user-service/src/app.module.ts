import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { FrontendController } from './frontend/frontend.controller';

@Module({
  imports: [],
  controllers: [FrontendController],
  providers: [AppService],
})
export class AppModule {}
