import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async register(email: string, password: string, displayName: string) {
    // Enforce minimum password length
    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }
    // Hash password
    const hashed = await bcrypt.hash(password, 10);
    const refreshToken = randomBytes(32).toString('hex');
    // Save user to DB
    const user = await this.prisma.user.create({
      data: { email, password: hashed, displayName, refreshToken },
    });
    // Exclude password from response
    const { password: _, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      ...this.issueTokens(user.id, user.email, refreshToken)
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new UnauthorizedException('Invalid credentials');
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async login(user: any) {
    const refreshToken = randomBytes(32).toString('hex');
    await this.prisma.user.update({ where: { id: user.id }, data: { refreshToken } });
    return {
      ...user,
      ...this.issueTokens(user.id, user.email, refreshToken)
    };
  }

  issueTokens(userId: string, email: string, refreshToken: string) {
    const payload = { email, sub: userId };
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: refreshToken
    };
  }

  async refresh(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    // Issue new tokens
    const newRefreshToken = randomBytes(32).toString('hex');
    await this.prisma.user.update({ where: { id: userId }, data: { refreshToken: newRefreshToken } });
    return this.issueTokens(userId, user.email, newRefreshToken);
  }

  async logout(userId: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { refreshToken: null } });
    return { message: 'Logged out' };
  }
}
