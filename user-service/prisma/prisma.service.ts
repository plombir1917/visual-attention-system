import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

/** Параметры пагинации/сортировки для пользовательских выборок. */
export interface UserScopedQuery {
  skip?: number;
  take?: number;
  orderBy?: Record<string, 'asc' | 'desc'>;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Сессии конкретного пользователя.
   * @description Возвращает страницу сессий и общее количество (для пагинации в AdminJS).
   */
  async findSessionsByUser(userId: string, query: UserScopedQuery = {}) {
    const where: Prisma.sessionWhereInput = { user_id: userId };
    const [rows, total] = await this.$transaction([
      this.session.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: query.orderBy ?? { started_at: 'desc' },
      }),
      this.session.count({ where }),
    ]);
    return { rows, total };
  }

  /**
   * Результаты внимания, принадлежащие сессиям пользователя.
   * @description У attention нет прямого user_id — скоупим через связанную сессию (session.user_id).
   */
  async findAttentionsByUser(userId: string, query: UserScopedQuery = {}) {
    const where: Prisma.attentionWhereInput = { session: { user_id: userId } };
    const [rows, total] = await this.$transaction([
      this.attention.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: query.orderBy ?? { created_at: 'desc' },
      }),
      this.attention.count({ where }),
    ]);
    return { rows, total };
  }

  /** Принадлежит ли сессия пользователю. */
  async ownsSession(userId: string, sessionId: string): Promise<boolean> {
    const count = await this.session.count({
      where: { id: sessionId, user_id: userId },
    });
    return count > 0;
  }

  /** Принадлежит ли результат внимания пользователю (через связанную сессию). */
  async ownsAttention(userId: string, attentionId: string): Promise<boolean> {
    const count = await this.attention.count({
      where: { id: attentionId, session: { user_id: userId } },
    });
    return count > 0;
  }

  /** Идентификаторы всех сессий пользователя (для фильтрации attention в search). */
  async sessionIdsByUser(userId: string): Promise<string[]> {
    const rows = await this.session.findMany({
      where: { user_id: userId },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }
}
