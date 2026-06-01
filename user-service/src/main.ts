import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { join } from 'path';
import * as express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { PrismaClientExceptionFilter } from 'prisma/prisma-client-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Security headers. CSP is left disabled because the landing relies on inline
  // styles/scripts and AdminJS injects its own assets; the remaining headers
  // (HSTS, nosniff, frameguard, referrer-policy) apply site-wide. CORP is set
  // to cross-origin so social scrapers / CDNs can fetch og-image.png & icons.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );

  // gzip/brotli-style response compression (HTML, JS, CSS, JSON, SVG).
  app.use(compression());

  app.use(
    '/',
    express.static(join(__dirname, 'frontend/public'), {
      setHeaders: (res, filePath) => {
        const file = filePath.replace(/\\/g, '/');
        if (file.endsWith('.webmanifest')) {
          res.setHeader(
            'Content-Type',
            'application/manifest+json; charset=utf-8',
          );
        }
        if (file.endsWith('/sw.js')) {
          // The service worker must always be revalidated, and is allowed to
          // control the whole origin.
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Service-Worker-Allowed', '/');
        } else if (/\.(png|ico|jpg|jpeg|svg|webp|woff2?)$/.test(file)) {
          res.setHeader('Cache-Control', 'public, max-age=604800'); // 7d for assets
        }
      },
    }),
  );

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
