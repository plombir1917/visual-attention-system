import { Injectable } from '@nestjs/common';
import {
  ActionContext,
  ActionRequest,
  ActionResponse,
  BaseRecord,
  ResourceOptions,
} from 'adminjs';
import { AuthService } from '../../../../auth/auth.service.js';

@Injectable()
export class UserOptions {
  constructor(private readonly authService: AuthService) {}

  get(): ResourceOptions {
    return {
      // Ресурс убран из бокового меню — список пользователей не должен быть доступен.
      navigation: false,
      properties: {
        password: { isVisible: false },
      },
      actions: {
        new: { isVisible: false },
        edit: { isVisible: false },
        delete: { isVisible: false },
        bulkDelete: { isVisible: false },
        // Просмотр и поиск по всем пользователям закрыты полностью.
        list: { isVisible: false, isAccessible: false },
        search: { isVisible: false, isAccessible: false },
        // show нужен только странице «Мой профиль» (UserProfile дергает его через
        // API для своей записи), поэтому оставляем доступным, но лишь для своей
        // записи и без кнопки в интерфейсе.
        show: {
          isVisible: false,
          isAccessible: isOwnRecord,
          after: [hidePassword, this.appendApiKeyStatus.bind(this)],
        },
        'generate-api-key': {
          actionType: 'record',
          isVisible: false,
          isAccessible: isOwnRecord,
          handler: this.handleGenerateApiKey.bind(this),
        },
      },
    };
  }

  private async appendApiKeyStatus(
    response: ActionResponse,
  ): Promise<ActionResponse> {
    const userId = response?.record?.params?.id;
    if (!userId) return response;

    const hasApiKey = await this.authService.hasAPIKey(userId);
    if (response.record?.params) {
      response.record.params.has_api_key = hasApiKey;
    }

    return response;
  }

  private async handleGenerateApiKey(
    _request: ActionRequest,
    _response: ActionResponse,
    context: ActionContext,
  ) {
    const { record, currentAdmin } = context;
    if (!record) return { record: null, generatedKey: null };

    const userId = record.params.id as string;

    const rawKey = await this.authService.generateAPIKey(userId);

    return {
      record: record.toJSON(currentAdmin),
      generatedKey: rawKey,
    };
  }
}

// Доступ к записи только владельцу: recordId должен совпадать с currentAdmin.id.
// Без записи в контексте (например, при отрисовке меню) — не блокируем.
function isOwnRecord({ currentAdmin, record }: ActionContext): boolean {
  if (!currentAdmin) return false;
  const recordId = record?.params?.id;
  return !recordId || recordId === currentAdmin.id;
}

function hidePassword(response: ActionResponse) {
  if (response?.records) {
    response.records?.forEach((record: BaseRecord) => {
      if (record?.params?.password) delete record.params.password;
    });
  } else if (response?.record?.params?.password) {
    delete response.record.params.password;
  }
  return response;
}
