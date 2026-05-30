import { Injectable } from '@nestjs/common';
import { ResourceOptions } from 'adminjs';

@Injectable()
export class SessionOptions {
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
      navigation: { icon: 'Activity' },
    };
  }
}
