import { Injectable } from '@nestjs/common';
import { Components } from '../components.config.js';
import { PageHandler } from 'adminjs';
import { PrismaService } from '../../../../prisma/prisma.service.js';

export interface Dashboard {
  handler?: PageHandler;
  component?: string;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  getDashboard(): Dashboard {
    return {
      component: Components.Dashboard,
      handler: async (req, _res, context) =>
        this.getDashboardMetrics(
          context?.currentAdmin?.id,
          req?.query?.sessionId as string | undefined,
        ),
    };
  }

  async getDashboardMetrics(userId?: string, sessionId?: string) {
    const userWhere = userId ? { user_id: userId } : {};

    const [totalUsers, totalSessions, sessionsList, apiKey] = await Promise.all([
      // Карточка подписана «всего в системе» — счёт всегда глобальный, а не
      // по текущему пользователю (иначе всегда было бы 1).
      this.prisma.user.count(),
      userId
        ? this.prisma.session.count({ where: userWhere })
        : this.prisma.session.count(),
      this.prisma.session.findMany({
        where: userWhere,
        orderBy: { ended_at: 'desc' },
        select: { id: true, started_at: true, ended_at: true },
      }),
      userId
        ? this.prisma.api_key.findUnique({
            where: { user_id: userId },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);

    // Есть ли у текущего пользователя API-ключ (для подсказки на дашборде).
    const hasApiKey = !!apiKey;

    const targetId = sessionId || sessionsList[0]?.id;

    if (!targetId) {
      return {
        totalUsers,
        totalSessions,
        hasApiKey,
        sessionsList: [],
        selectedSession: null,
      };
    }

    const session = await this.prisma.session.findFirst({
      where: { id: targetId, ...userWhere },
      include: {
        user: { select: { name: true, email: true } },
        attentions: { orderBy: { created_at: 'asc' }, take: 500 },
      },
    });

    if (!session) {
      return {
        totalUsers,
        totalSessions,
        hasApiKey,
        sessionsList: this.toSessionList(sessionsList),
        selectedSession: null,
      };
    }

    const att = session.attentions;
    const totalFrames = att.length;
    const focusedFrames = att.filter((a) => a.focus).length;
    const focusRate =
      totalFrames > 0
        ? Math.round((focusedFrames / totalFrames) * 1000) / 10
        : 0;

    const avg = (key: 'teta' | 'alpha' | 'distance') =>
      totalFrames > 0
        ? Math.round((att.reduce((s, a) => s + a[key], 0) / totalFrames) * 100) / 100
        : 0;

    const duration = Math.round(
      (session.ended_at.getTime() - session.started_at.getTime()) / 1000,
    );

    return {
      totalUsers,
      totalSessions,
      hasApiKey,
      sessionsList: this.toSessionList(sessionsList),
      selectedSession: {
        id: session.id,
        user: session.user,
        startedAt: session.started_at.toISOString(),
        endedAt: session.ended_at.toISOString(),
        duration,
        totalFrames,
        focusedFrames,
        focusRate,
        avgTheta: avg('teta'),
        avgAlpha: avg('alpha'),
        avgDistance: avg('distance'),
        attentions: att.map((a, i) => ({
          i,
          focus: a.focus,
          teta: a.teta,
          alpha: a.alpha,
          distance: a.distance,
        })),
      },
    };
  }

  private toSessionList(
    sessions: { id: string; started_at: Date; ended_at: Date }[],
  ) {
    return sessions.map((s) => ({
      id: s.id,
      startedAt: s.started_at.toISOString(),
      endedAt: s.ended_at.toISOString(),
    }));
  }
}
