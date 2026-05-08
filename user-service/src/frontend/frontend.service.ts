import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { encodePassword } from 'src/utils/bcrypt';

@Injectable()
export class FrontendService {
  constructor(private readonly prismaService: PrismaService) {}

  async registerUser(email: string, name: string, password: string) {
    const user = await this.prismaService.user.create({
      data: {
        email,
        name,
        password: await encodePassword(password),
      },
    });

    return user;
  }
}
