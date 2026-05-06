import { encodePassword } from '../../../../../utils/bcrypt.js';
import {
  ActionRequest,
  ActionResponse,
  BaseRecord,
  ResourceOptions,
} from 'adminjs';
import { currentUserIsAdmin } from '../../../../auth/auth.service.js';
import { validateUser } from './user.dto.js';

export class UserOptions {
  get(): ResourceOptions {
    return {
      navigation: { icon: 'User' },
      properties: {
        role: {
          isVisible: {
            edit: true,
          },
        },
        password: {
          isVisible: false,
        },
      },
      actions: {
        new: {
          isAccessible: false,
          before: [validateUser, hashPassword],
        },
        edit: {
          isAccessible: currentUserIsAdmin,
          before: [validateUser], // нет хеширования, т.к. поле `password` isVisible: false
        },
        delete: {
          isAccessible: currentUserIsAdmin,
        },
        list: {
          after: [hidePassword],
        },
        search: {
          after: [hidePassword],
        },
        show: {
          after: [hidePassword],
        },
        bulkDelete: {
          isAccessible: currentUserIsAdmin,
        },
      },
    };
  }
}

async function hashPassword(context: ActionRequest) {
  if (context?.payload?.password) {
    context.payload = {
      ...context.payload,
      password: await encodePassword(context.payload.password),
    };
  }
  return context;
}

function hidePassword(response: ActionResponse) {
  if (response?.records) {
    response.records?.forEach((record: BaseRecord) => {
      record = setEmptyPasswordForRecord(record);
    });
  } else if (response?.record?.params) {
    response.record = setEmptyPasswordForRecord(response.record);
  }

  return response;
}

function setEmptyPasswordForRecord(record: BaseRecord) {
  if (record?.params?.password) {
    delete record.params.password;
  }

  return record;
}
