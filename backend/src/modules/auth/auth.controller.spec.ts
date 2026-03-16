import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(async () => {
    authService = {
      register: vi.fn(),
      validateUser: vi.fn(),
      login: vi.fn(),
      refresh: vi.fn(),
      logout: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('register', () => {
    it('should register a user and return result', async () => {
      const result = { id: 'user-1', email: 'a@b.com', access_token: 'jwt', refresh_token: 'rt' };
      authService.register.mockResolvedValue(result);

      const response = await controller.register({ email: 'a@b.com', password: 'password123', displayName: 'Test' });

      expect(authService.register).toHaveBeenCalledWith('a@b.com', 'password123', 'Test');
      expect(response).toEqual(result);
    });

    it('should throw BadRequestException on service error', async () => {
      authService.register.mockRejectedValue(new Error('Email taken'));

      await expect(controller.register({ email: 'a@b.com', password: 'x', displayName: 'T' }))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    it('should validate user and return login result', async () => {
      const user = { id: 'user-1', email: 'a@b.com' };
      const tokens = { ...user, access_token: 'jwt', refresh_token: 'rt' };
      authService.validateUser.mockResolvedValue(user);
      authService.login.mockResolvedValue(tokens);

      const response = await controller.login({ email: 'a@b.com', password: 'password123' });

      expect(authService.validateUser).toHaveBeenCalledWith('a@b.com', 'password123');
      expect(authService.login).toHaveBeenCalledWith(user);
      expect(response).toEqual(tokens);
    });

    it('should throw UnauthorizedException on invalid credentials', async () => {
      authService.validateUser.mockRejectedValue(new Error('Invalid credentials'));

      await expect(controller.login({ email: 'a@b.com', password: 'wrong' }))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should refresh tokens', async () => {
      const tokens = { access_token: 'new-jwt', refresh_token: 'new-rt' };
      authService.refresh.mockResolvedValue(tokens);

      const response = await controller.refresh({ userId: 'user-1', refreshToken: 'old-rt' });

      expect(authService.refresh).toHaveBeenCalledWith('user-1', 'old-rt');
      expect(response).toEqual(tokens);
    });

    it('should throw UnauthorizedException on invalid refresh token', async () => {
      authService.refresh.mockRejectedValue(new Error('Invalid refresh token'));

      await expect(controller.refresh({ userId: 'user-1', refreshToken: 'bad' }))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should logout and return message', async () => {
      authService.logout.mockResolvedValue({ message: 'Logged out' });

      const response = await controller.logout({ user: { userId: 'user-1' } });

      expect(authService.logout).toHaveBeenCalledWith('user-1');
      expect(response).toEqual({ message: 'Logged out and refresh token revoked' });
    });

    it('should throw BadRequestException on error', async () => {
      authService.logout.mockRejectedValue(new Error('Failed'));

      await expect(controller.logout({ user: { userId: 'user-1' } }))
        .rejects.toThrow(BadRequestException);
    });
  });
});
