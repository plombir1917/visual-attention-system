import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';

function subDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

@Injectable()
export class StatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(userId: string | undefined, startDate?: string, endDate?: string) {
    const now = new Date();
    const start = startDate ? new Date(startDate) : subDays(now, 30);
    const end = endDate ? endOfDay(new Date(endDate)) : endOfDay(now);

    const sessions = await this.prisma.session.findMany({
      where: {
        ...(userId ? { user_id: userId } : {}),
        started_at: { gte: start, lte: end },
      },
      include: {
        attentions: { select: { focus: true } },
      },
      orderBy: { started_at: 'asc' },
    });

    const sessionStats = sessions.map((s) => {
      const frames = s.attentions.length;
      const focusedFrames = s.attentions.filter((a) => a.focus).length;
      const focusRate =
        frames > 0 ? Math.round((focusedFrames / frames) * 1000) / 10 : 0;
      const duration = Math.round(
        (s.ended_at.getTime() - s.started_at.getTime()) / 1000,
      );
      return {
        id: s.id,
        startedAt: s.started_at.toISOString(),
        endedAt: s.ended_at.toISOString(),
        duration,
        frames,
        focusedFrames,
        focusRate,
      };
    });

    const totalFrames = sessionStats.reduce((s, a) => s + a.frames, 0);
    const totalFocused = sessionStats.reduce((s, a) => s + a.focusedFrames, 0);
    const totalDuration = sessionStats.reduce((s, a) => s + a.duration, 0);
    const n = sessionStats.length;

    return {
      period: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
      totals: {
        sessions: n,
        frames: totalFrames,
        focusRate:
          totalFrames > 0
            ? Math.round((totalFocused / totalFrames) * 1000) / 10
            : 0,
        totalDuration,
        avgFocusRate:
          n > 0
            ? Math.round(
                (sessionStats.reduce((s, a) => s + a.focusRate, 0) / n) * 10,
              ) / 10
            : 0,
        avgSessionDuration: n > 0 ? Math.round(totalDuration / n) : 0,
      },
      sessions: sessionStats,
    };
  }
}
