import { Body, Controller, Injectable, Post } from '@nestjs/common';
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

  @Post('/generate-api-key')
  async generateAPIKey(@Body('userId') userId: string) {
    return await this.authService.generateAPIKey(userId);
  }

  // TODO: integrate with JWT
  // @Post('/authorize-api-key')
  // async authorizeAPIKey(
  //   @Body('userID') userID: string,
  //   @Body('APIKey') APIKey: string,
  // ) {
  //   return await this.authService.authorizeAPIKey(userID, APIKey);
  // }
}
