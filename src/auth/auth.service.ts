import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
  ) {}

  generateToken(userId: string): string {
    const payload: Pick<JwtPayload, 'sub'> = { sub: userId };
    return this.jwtService.sign(payload);
  }

  async googleAuth(email: string, name: string) {
    try {
      const existingUser = await this.userService.findByEmail(email);
      if (existingUser) {
        const token = this.generateToken(existingUser._id.toString());
        return { user: existingUser, token };
      } else {
        const newUser = await this.userService.createUser(name, email);
        const token = this.generateToken(newUser._id.toString());
        return { user: newUser, token };
      }
    } catch (error: any) {
      this.logger.error(`Google authentication failed`, error);
    }
  }
}
