import { Injectable } from '@nestjs/common';
import { ResourceOptions } from 'adminjs';

@Injectable()
export class AttentionOptions {
  get(): ResourceOptions {
    return {
      actions: {
        new: {
          isVisible: false,
        },
        edit: {
          isVisible: false,
        },
        delete: {
          isVisible: false,
        },
        bulkDelete: {
          isVisible: false,
        },
      },

      navigation: { icon: 'Eye' },
    };
  }
}
