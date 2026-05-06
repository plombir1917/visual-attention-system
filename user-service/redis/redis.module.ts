import { Module } from '@nestjs/common';
import { RedisModule as NestRedisModule } from '@nestjs-modules/ioredis';

@Module({
  imports: [
    NestRedisModule.forRootAsync({
      useFactory: async () => ({
        type: 'single',
        options: {
          host: process.env.REDIS_HOST,
          port: Number(process.env.REDIS_PORT),
          username: process.env.REDIS_USER,
          password: process.env.REDIS_USER_PASSWORD,
          db: Number(process.env.REDIS_DB),
          keyPrefix: process.env.PROJECT_PREFIX + ':',
        },
      }),
    }),
  ],
  exports: [NestRedisModule],
})
export class RedisModule {}
