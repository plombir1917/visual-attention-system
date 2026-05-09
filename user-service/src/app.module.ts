import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { FrontendController } from './frontend/frontend.controller';
import { AdminJSModule } from './admin/admin.module';
import { RedisModule } from 'redis/redis.module';
import { FrontendModule } from './frontend/frontend.module';

@Module({
  imports: [AdminJSModule, RedisModule, FrontendModule],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}
