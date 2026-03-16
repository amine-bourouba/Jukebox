import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockPrismaService } from '../../test/mock-prisma';
import * as bcrypt from 'bcrypt';

vi.mock('bcrypt', () => ({
  hash: vi.fn(),
  compare: vi.fn(),
}));

vi.mock('crypto', () => ({
  randomBytes: vi.fn(() => ({
    toString: vi.fn(() => 'mocked-refresh-token'),
  })),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: ReturnType<typeof createMockPrismaService>;
  let jwtService: { sign: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    prisma = createMockPrismaService();
    jwtService = { sign: vi.fn().mockReturnValue('mocked-jwt-token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should register a user and return tokens', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed-password',
        displayName: 'Test User',
        refreshToken: 'mocked-refresh-token',
      };

      (bcrypt.hash as any).mockResolvedValue('hashed-password');
      prisma.user.create.mockResolvedValue(mockUser);

      const result = await service.register('test@example.com', 'password123', 'Test User');

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          password: 'hashed-password',
          displayName: 'Test User',
          refreshToken: 'mocked-refresh-token',
        },
      });
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result).not.toHaveProperty('password');
    });

    it('should throw BadRequestException if password is too short', async () => {
      await expect(service.register('test@example.com', 'short', 'Test User'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('validateUser', () => {
    it('should return user without password on valid credentials', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed-password',
        displayName: 'Test User',
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password123');

      expect(result).not.toHaveProperty('password');
      expect(result).toHaveProperty('email', 'test@example.com');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.validateUser('invalid@example.com', 'password123'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is wrong', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed-password',
      });
      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(service.validateUser('test@example.com', 'wrong-pass'))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should update refresh token and return tokens', async () => {
      const user = { id: 'user-1', email: 'test@example.com' };
      prisma.user.update.mockResolvedValue(user);

      const result = await service.login(user);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { refreshToken: 'mocked-refresh-token' },
      });
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
    });
  });

  describe('issueTokens', () => {
    it('should return access and refresh tokens', () => {
      const result = service.issueTokens('user-1', 'test@example.com', 'my-refresh');

      expect(jwtService.sign).toHaveBeenCalledWith({ email: 'test@example.com', sub: 'user-1' });
      expect(result).toEqual({
        access_token: 'mocked-jwt-token',
        refresh_token: 'my-refresh',
      });
    });
  });

  describe('refresh', () => {
    it('should rotate refresh token and issue new tokens', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        refreshToken: 'valid-token',
      });
      prisma.user.update.mockResolvedValue({});

      const result = await service.refresh('user-1', 'valid-token');

      expect(prisma.user.update).toHaveBeenCalled();
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        refreshToken: 'valid-token',
      });

      await expect(service.refresh('user-1', 'wrong-token'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.refresh('user-1', 'any-token'))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should nullify refresh token', async () => {
      prisma.user.update.mockResolvedValue({});

      const result = await service.logout('user-1');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { refreshToken: null },
      });
      expect(result).toEqual({ message: 'Logged out' });
    });
  });
});
