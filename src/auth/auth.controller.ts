import {
  Body,
  Controller,
  InternalServerErrorException,
  Post,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('google')
  async googleAuth(
    @Body() body: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { email, name } = body;
    const result = await this.authService.googleAuth(email, name);
    if (!result) {
      throw new InternalServerErrorException('Authentication failed');
    }
    res.cookie('access_token', result.token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { user: result.user };
  }

  @Public()
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
    });
    return { message: 'Logged out successfully' };
  }
}
