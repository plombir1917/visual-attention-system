import { getModelByName } from '@adminjs/prisma';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { UserOptions } from './options/user/user.options.js';
import { FeatureType, ResourceOptions, ResourceWithOptions } from 'adminjs';
import { ActionsService } from './actions.service.js';
import { AttentionOptions } from './options/attention/attention.options.js';
import { SessionOptions } from './options/session/session.options.js';

export interface resource {
  model?: Prisma.ModelName;
  options: ResourceOptions;
  features?: Array<FeatureType>;
}

@Injectable()
export class ResourceService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly actionsService: ActionsService,
    private readonly userOptions: UserOptions,
    private readonly attentionOptions: AttentionOptions,
    private readonly sessionOptions: SessionOptions
  ) {}

  /**
   * Ресурс - сущность программы из БД
   */
  private resources(): resource[] {
    return [
      {
        model: Prisma.ModelName.user,
        options: this.userOptions.get(),
      },
      {
        model: Prisma.ModelName.attention,
        options: this.attentionOptions.get(),
      },
      {
        model: Prisma.ModelName.session,
        options: this.sessionOptions.get(),
      },
    ];
  }

  getResourcesWithOptions() {
    const resourcesWithOptions: ResourceWithOptions[] = [];
    this.resources().forEach((resource) => {
      resourcesWithOptions.push(this.setResourceOptions(resource));
    });
    this.actionsService.wrapResourcesActions(resourcesWithOptions);
    return resourcesWithOptions;
  }

  private setResourceOptions(resource: resource): ResourceWithOptions {
    return {
      resource: {
        model: getModelByName(resource.model!),
        client: this.prismaService,
      },
      options: resource.options,
      features: resource.features,
    };
  }
}
