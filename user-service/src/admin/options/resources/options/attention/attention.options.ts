import { Injectable } from '@nestjs/common';
import { ResourceOptions } from 'adminjs';
import { PrismaService } from '../../../../../../prisma/prisma.service.js';
import { scopedListHandler } from '../scoped-list.handler.js';
import {
  ownershipSearchFilter,
  ownershipShowGuard,
} from '../scoped-guards.js';

@Injectable()
export class AttentionOptions {
  constructor(private readonly prisma: PrismaService) {}

  get(): ResourceOptions {
    return {
      actions: {
        // Ресурс read-only: скрываем и закрываем мутирующие экшены (UI + API).
        new: {
          isVisible: false,
          isAccessible: false,
        },
        edit: {
          isVisible: false,
          isAccessible: false,
        },
        delete: {
          isVisible: false,
          isAccessible: false,
        },
        bulkDelete: {
          isVisible: false,
          isAccessible: false,
        },
        // Показываем только результаты внимания из сессий авторизованного пользователя.
        // showFilter:false убирает кнопку «Фильтр» и сам drawer из списка.
        list: {
          showFilter: false,
          handler: scopedListHandler(
            (userId, query) => this.prisma.findAttentionsByUser(userId, query),
            ['id', 'session_id', 'focus', 'teta', 'alpha', 'distance', 'created_at'],
            'created_at',
          ),
        },
        // Запрещаем открывать чужой результат внимания по прямому URL.
        show: {
          before: ownershipShowGuard((userId, recordId) =>
            this.prisma.ownsAttention(userId, recordId),
          ),
        },
        // В автокомплите search отдаём только записи из сессий пользователя.
        search: {
          after: ownershipSearchFilter(async (userId, records) => {
            const ownedSessionIds = new Set(
              await this.prisma.sessionIdsByUser(userId),
            );
            return records.filter((r) =>
              ownedSessionIds.has(r.params?.session_id as string),
            );
          }),
        },
      },

      navigation: { icon: 'Eye' },
    };
  }
}
