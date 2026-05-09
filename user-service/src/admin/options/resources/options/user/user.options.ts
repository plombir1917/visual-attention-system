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
      navigation: { icon: 'User' },
      properties: {
        password: { isVisible: false },
      },
      actions: {
        new: { isVisible: false },
        edit: { isVisible: false },
        delete: { isVisible: false },
        bulkDelete: { isVisible: false },
        list: { after: [hidePassword] },
        search: { after: [hidePassword] },
        show: { after: [hidePassword, this.appendApiKeyStatus.bind(this)] },
        'generate-api-key': {
          actionType: 'record',
          isAccessible: ({ currentAdmin }) => !!currentAdmin,
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
