import { Injectable, UnauthorizedException } from '@nestjs/common';
import { compare, generateAPIKey, hash } from '../../utils/bcrypt.js';
import { ActionContext } from 'adminjs';
import { PrismaService } from '../../../prisma/prisma.service.js';

@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) {}

  async register(email: string, name: string, password: string) {
    const user = await this.prismaService.user.create({
      data: {
        email,
        name,
        password: await hash(password),
      },
    });

    return user;
  }

  async login(email: string, rawPassword: string) {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { email },
      });
      if (user && (await compare(rawPassword, user.password))) {
        return { id: user.id, email: user.email };
      }
      return null;
    } catch (error) {
      throw new UnauthorizedException(error);
    }
  }

  async generateAPIKey(userId: string) {
    const APIKey = generateAPIKey(userId);

    const hashedAPIKey = await hash(APIKey);

    await this.prismaService.user.update({
      where: { id: userId },
      data: { key_hash: hashedAPIKey },
    });

    return APIKey;
  }

  async authorizeAPIKey(userID: string, rawAPIKey: string) {
    const user = await this.prismaService.user.findUniqueOrThrow({
      where: { id: userID },
    });

    if (!user.key_hash) {
      return false;
    }

    return await compare(rawAPIKey, user.key_hash);
  }
}

export const currentUserIsAdmin = ({ currentAdmin }: ActionContext) => {
  return !!currentAdmin && currentAdmin?.role === 'admin';
};
