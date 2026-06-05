import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';

/**
 * Бросается, когда VK-токен валиден, но у аккаунта нет привязанного email.
 * Отделяет этот случай от «невалидного токена» (тот по-прежнему возвращает null),
 * чтобы страница логина могла показать конкретное сообщение, а не общее
 * «неверный email или пароль».
 */
export class VkNoEmailError extends Error {
  constructor() {
    super('VK account has no email');
    this.name = 'VkNoEmailError';
  }
}

/**
 * Авторизация через VK ID.
 *
 * @description
 * Фронтенд (VK ID SDK, OneTap) сам выполняет обмен кода на токены по PKCE и
 * присылает нам `access_token`. Доверять данным из браузера нельзя, поэтому мы
 * НЕЗАВИСИМО проверяем токен на сервере, запрашивая профиль у VK по этому токену.
 * Если VK вернул профиль — токен валиден.
 *
 * Эндпоинт VK ID user_info (по документации VK): POST https://id.vk.ru/oauth2/user_info
 * body (application/x-www-form-urlencoded): client_id, access_token
 * ответ: { user: { user_id, first_name, last_name, email, phone, avatar, ... } }
 * (email присутствует только если был запрошен scope 'email').
 * Хост можно переопределить через VK_USER_INFO_URL (напр. международный .com-контур).
 */
@Injectable()
export class VkidService {
  private readonly logger = new Logger(VkidService.name);
  // Публичный app id приложения VK ID (не секрет; продублирован на фронте в
  // /js/vkid-auth.js). Хост user_info можно переопределить через VK_USER_INFO_URL
  // (напр. международный .com-контур).
  private readonly appId = '54620210';
  private readonly userInfoUrl =
    process.env.VK_USER_INFO_URL || 'https://id.vk.ru/oauth2/user_info';

  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Проверяет VK access_token и возвращает локального пользователя (создавая или
   * связывая его при необходимости). Возвращает `null`, если токен невалиден.
   * Если токен валиден, но у VK-аккаунта нет email — бросает {@link VkNoEmailError}
   * (email обязателен), чтобы вызывающий показал отдельное сообщение об этом.
   */
  async authenticateByAccessToken(
    accessToken: string,
  ): Promise<{ id: string; email: string } | null> {
    const profile = await this.fetchVkProfile(accessToken);
    if (!profile) {
      return null;
    }

    const email = profile.email?.trim().toLowerCase();
    const vkId = profile.user_id ? String(profile.user_id) : null;

    if (!vkId) {
      this.logger.warn('VK user_info returned no user_id');
      return null;
    }
    // По требованию: email обязателен.
    if (!email) {
      this.logger.warn(`VK user ${vkId} has no email — login rejected`);
      throw new VkNoEmailError();
    }

    const name =
      [profile.first_name, profile.last_name]
        .filter(Boolean)
        .join(' ')
        .trim() || 'Пользователь VK';

    const user = await this.resolveUser({ vkId, email, name });
    return { id: user.id, email: user.email };
  }

  /**
   * Запрос профиля у VK по access_token. Любая ошибка (сеть, невалидный токен,
   * не-200) трактуется как «не авторизован» → возвращаем null.
   */
  private async fetchVkProfile(accessToken: string): Promise<{
    user_id?: string | number;
    first_name?: string;
    last_name?: string;
    email?: string;
  } | null> {
    try {
      const body = new URLSearchParams({
        client_id: this.appId,
        access_token: accessToken,
      });

      const res = await fetch(this.userInfoUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });

      if (!res.ok) {
        this.logger.warn(`VK user_info responded ${res.status}`);
        return null;
      }

      const data = (await res.json()) as { user?: Record<string, unknown> };
      if (!data?.user) {
        this.logger.warn('VK user_info response has no `user`');
        return null;
      }
      return data.user as {
        user_id?: string | number;
        first_name?: string;
        last_name?: string;
        email?: string;
      };
    } catch (error) {
      this.logger.error('VK user_info request failed', error as Error);
      return null;
    }
  }

  /**
   * Находит пользователя по vk_id; иначе связывает по email с существующим
   * аккаунтом (email от VK подтверждён VK); иначе создаёт нового без пароля.
   */
  private async resolveUser(params: {
    vkId: string;
    email: string;
    name: string;
  }) {
    const { vkId, email, name } = params;

    const byVkId = await this.prismaService.user.findUnique({
      where: { vk_id: vkId },
    });
    if (byVkId) {
      return byVkId;
    }

    const byEmail = await this.prismaService.user.findUnique({
      where: { email },
    });
    if (byEmail) {
      // Связываем существующий аккаунт с VK.
      return this.prismaService.user.update({
        where: { id: byEmail.id },
        data: { vk_id: vkId },
      });
    }

    return this.prismaService.user.create({
      data: { email, name, vk_id: vkId, password: null },
    });
  }
}
