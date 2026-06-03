import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
  comparePassword,
  generateAPIKey,
  hashAPIKey,
  hashPassword,
  verifyAPIKey,
} from '../../utils/crypt.js';
import { ActionContext } from 'adminjs';
import { PrismaService } from '../../../prisma/prisma.service.js';

@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) {}

  async register(email: string, name: string, password: string) {
    const user = await this.prismaService.user.create({
      data: {
        email,
        name,
        password: await hashPassword(password),
      },
    });

    return user;
  }

  async login(email: string, rawPassword: string) {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { email },
      });
      // Пользователи, зарегистрированные через VK ID, не имеют пароля и входят
      // только через VK ID — форму email/пароль для них не пропускаем.
      if (
        user &&
        user.password &&
        (await comparePassword(rawPassword, user.password))
      ) {
        return { id: user.id, email: user.email };
      }
      return null;
    } catch (error) {
      throw new UnauthorizedException(error);
    }
  }

  /**
   * Генерируем API-ключ для пользователя. Если ключ уже есть, то перезаписываем его новым.
   * @description
   * API-ключ состоит из двух частей: префикса и секрета.
   * Префикс нужен для быстрого поиска ключа в базе данных,
   * а секрет - для проверки его валидности.
   *
   * @param userId
   * @returns rawAPIKey - ключ в открытом виде, который нужно отдать пользователю.
   * Его нельзя восстановить, поэтому нужно сохранить его сразу после генерации.
   */
  async generateAPIKey(userId: string) {
    const rawKey = generateAPIKey();

    const leftPart = rawKey.split('.')[0];
    const prefix = leftPart.replace('vas_live_', '');

    const hashedKey = hashAPIKey(rawKey);

    await this.prismaService.api_key.upsert({
      where: { user_id: userId },
      update: { prefix, key_hash: hashedKey, created_at: new Date() },
      create: { user_id: userId, prefix, key_hash: hashedKey },
    });

    return rawKey;
  }

  async hasAPIKey(userId: string): Promise<boolean> {
    const key = await this.prismaService.api_key.findUnique({
      where: { user_id: userId },
    });
    return !!key;
  }

  /**
   * Авторизуем пользователя по API-ключу
   * @description
   * Проверяем валидность API-ключа и возвращаем информацию о пользователе
   *
   *
   * @param rawAPIKey - ключ в открытом виде,
   * который прислал пользователь при запросе.
   * @returns информацию о пользователе
   */
  async authorizeAPIKey(rawAPIKey: string) {
    // Парсим ключ, чтобы достать из него префикс и найти в базе данных соответствующий ему хэш.
    const parts = rawAPIKey.split('.');
    if (parts.length !== 2) {
      throw new UnauthorizedException('Invalid API key format');
    }
    const leftPart = parts[0];
    const prefix = leftPart.replace('vas_live_', '');

    if (!prefix) {
      throw new UnauthorizedException('Invalid API key prefix');
    }

    const APIKey = await this.prismaService.api_key.findUniqueOrThrow({
      where: { prefix: prefix },
      include: { user: true },
    });
    const isValid = verifyAPIKey(rawAPIKey, APIKey.key_hash);

    if (!isValid) {
      throw new UnauthorizedException('Invalid API key');
    }

    return APIKey.user;
  }
}

export const currentUserIsAdmin = ({ currentAdmin }: ActionContext) => {
  return !!currentAdmin && currentAdmin?.role === 'admin';
};
