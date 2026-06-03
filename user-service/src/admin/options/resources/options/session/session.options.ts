import { Injectable } from '@nestjs/common';
import { ResourceOptions } from 'adminjs';
import { PrismaService } from '../../../../../../prisma/prisma.service.js';
import { scopedListHandler } from '../scoped-list.handler.js';
import { ownershipSearchFilter, ownershipShowGuard } from '../scoped-guards.js';

@Injectable()
export class SessionOptions {
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
        // Показываем только сессии авторизованного пользователя.
        list: {
          showFilter: false,
          handler: scopedListHandler(
            (userId, query) => this.prisma.findSessionsByUser(userId, query),
            ['id', 'user_id', 'started_at', 'ended_at'],
            'started_at',
          ),
        },
        // Запрещаем открывать чужую сессию по прямому URL.
        show: {
          before: ownershipShowGuard((userId, recordId) =>
            this.prisma.ownsSession(userId, recordId),
          ),
        },
        // В автокомплите search отдаём только сессии пользователя.
        search: {
          after: ownershipSearchFilter(async (userId, records) =>
            records.filter((r) => r.params?.user_id === userId),
          ),
        },
      },
      navigation: { icon: 'Activity' },
    };
  }
}
