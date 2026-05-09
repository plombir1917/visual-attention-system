import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { UserDTO } from '../options/resources/options/user/user.dto';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/register')
  async register(@Body() user: UserDTO) {
    return await this.authService.register(
      user.email,
      user.name,
      user.password,
    );
  }

  @Get('/authorize-api-key')
  async authorizeAPIKey(@Request() req: Request) {
    const APIKey = req.headers['x-api-key'];
    if (!APIKey) {
      throw new UnauthorizedException('API key is required');
    }
    return await this.authService.authorizeAPIKey(APIKey);
  }
}
