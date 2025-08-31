import { Controller, Post, Body, BadRequestException, UnauthorizedException, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: { email: string; password: string; displayName: string }) {
    try {
      return await this.authService.register(body.email, body.password, body.displayName);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    try {
      const user = await this.authService.validateUser(body.email, body.password);
      return this.authService.login(user);
    } catch (error: any) {
      throw new UnauthorizedException(error.message);
    }
  }

  @Post('refresh')
  async refresh(@Body() body: { userId: string; refreshToken: string }) {
    try {
      return await this.authService.refresh(body.userId, body.refreshToken);
    } catch (error: any) {
      throw new UnauthorizedException(error.message);
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: any) {
    try {
      await this.authService.logout(req.user.userId);
      return { message: 'Logged out and refresh token revoked' };
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
