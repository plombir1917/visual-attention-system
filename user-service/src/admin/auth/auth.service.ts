import { Injectable, UnauthorizedException } from '@nestjs/common';
// import { UserService } from '../../api/user/user.service.js';
import { comparePassword } from '../../utils/bcrypt.js';
import { ActionContext } from 'adminjs';

@Injectable()
export class AuthService {
  // constructor(private readonly userService: UserService) {}

  async login(email: string, rawPassword: string) {
    try {
      // const user = await this.userService.findOneByEmail(email);
      // if (user && (await comparePassword(rawPassword, user.password))) {
      //   return { email: user.email, role: user.role };
      // }
      return { email, rawPassword };
    } catch (error) {
      throw new UnauthorizedException(error);
    }
  }
}

export const currentUserIsAdmin = ({ currentAdmin }: ActionContext) => {
  return !!currentAdmin && currentAdmin?.role === 'admin';
};
