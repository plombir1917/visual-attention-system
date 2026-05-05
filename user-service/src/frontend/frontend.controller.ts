import { Controller, Get, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { join } from 'path';
import { getBotHtml } from './bot-render';

const BOT_PATTERN =
  /googlebot|yandexbot|bingbot|duckduckbot|slurp|baiduspider|applebot|facebot/i;

@Controller()
export class FrontendController {
  @Get('/')
  getLandingPage(@Req() req: Request, @Res() res: Response): void {
    const ua = req.headers['user-agent'] ?? '';
    if (BOT_PATTERN.test(ua)) {
      res.type('html').send(getBotHtml());
    } else {
      res.sendFile(join(__dirname, '/public/index.html'));
    }
  }
}
