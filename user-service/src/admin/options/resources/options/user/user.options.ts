import { hash } from '../../../../../utils/bcrypt.js';
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
        password: {
          isVisible: false,
        },
        key_hash: {
          isVisible: false,
        },
      },
      actions: {
        new: {
          isVisible: false,
          // before: [validateUser, hashPassword],
        },
        edit: {
          isVisible: false,
          // before: [validateUser], // нет хеширования, т.к. поле `password` isVisible: false
        },
        delete: {
          isVisible: false,
        },
        list: {
          after: [hidePassword, hideAPKey],
        },
        search: {
          after: [hidePassword, hideAPKey],
        },
        show: {
          after: [hidePassword, hideAPKey],
        },
        bulkDelete: {
          isVisible: false,
        },
      },
    };
  }
}

async function hashPassword(context: ActionRequest) {
  if (context?.payload?.password) {
    context.payload = {
      ...context.payload,
      password: await hash(context.payload.password),
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

function hideAPKey(response: ActionResponse) {
  if (response?.records) {
    response.records?.forEach((record: BaseRecord) => {
      record = setEmptyAPKeyForRecord(record);
    });
  } else if (response?.record?.params) {
    response.record = setEmptyAPKeyForRecord(response.record);
  }

  return response;
}

function setEmptyAPKeyForRecord(record: BaseRecord) {
  if (record?.params?.key_hash) {
    delete record.params.key_hash;
  }

  return record;
}
