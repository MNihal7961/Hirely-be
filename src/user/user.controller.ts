import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async getCurrentUser(@Req() req: Request) {
    const { userId } = req.user as { userId: string; email: string };
    console.log('🚀 ~ UserController ~ getCurrentUser ~ userId:', userId);
    return await this.userService.getUserById(userId);
  }
}
