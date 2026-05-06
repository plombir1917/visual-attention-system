import { Injectable } from '@nestjs/common';
// import { UserService } from '../../../api/user/user.service.js';
import { Components } from '../components.config.js';
import { PageHandler } from 'adminjs';
import { ResourceService } from '../../options/resources/resources.service.js';

export interface Dashboard {
  /**
   * Функция обработчик, которая будет вызвана при {@link ApiClient#getDashboard}.
   */
  handler?: PageHandler;
  /**
   * Название компонента, который должен отображаться при открытии пользователем панели управления.
   */
  component?: string;
}

@Injectable()
export class DashboardService {
  constructor(
    // private readonly userService: UserService,
    private readonly resourceService: ResourceService,
  ) {}

  getDashboard(): Dashboard {
    return {
      // component: Components.Dashboard,
      handler: async () => await this.getDashboardMetrics(),
    };
  }

  async getDashboardMetrics() {
    // const usersCount = await this.userService.count();
    const resources = this.resourceService.getResourcesWithOptions();
    return {
      adminJSVersion: process.env.ADMINJS_VERSION,
      // usersCount: usersCount,
      resourcesCount: resources.length,
    };
  }
}
