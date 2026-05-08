import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { join } from 'path';
import * as express from 'express';
import { PrismaClientExceptionFilter } from 'prisma/prisma-client-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use('/', express.static(join(__dirname, 'frontend/public')));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      exceptionFactory: (errors) => {
        const fieldErrors: Record<string, string> = {};
        for (const err of errors) {
          fieldErrors[err.property] =
            Object.values(err.constraints ?? {})[0] ?? 'Ошибка';
        }
        return new BadRequestException({ statusCode: 400, fieldErrors });
      },
    }),
  );

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapter));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
