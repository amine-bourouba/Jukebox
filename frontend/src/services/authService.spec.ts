import { describe, it, expect, vi, beforeEach } from 'vitest';
import authService from './authService';
import api from './api';

vi.mock('./api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should POST credentials and return data', async () => {
      const responseData = { id: 'u1', access_token: 'jwt', refresh_token: 'rt' };
      (api.post as any).mockResolvedValue({ data: responseData });

      const result = await authService.login({ email: 'a@b.com', password: 'pass' });

      expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'a@b.com', password: 'pass' });
      expect(result).toEqual(responseData);
    });

    it('should propagate errors', async () => {
      (api.post as any).mockRejectedValue(new Error('Network error'));

      await expect(authService.login({ email: 'a@b.com', password: 'x' }))
        .rejects.toThrow('Network error');
    });
  });

  describe('register', () => {
    it('should POST registration data and return data', async () => {
      const responseData = { id: 'u1', access_token: 'jwt' };
      (api.post as any).mockResolvedValue({ data: responseData });

      const result = await authService.register({
        displayName: 'Test',
        email: 'a@b.com',
        password: 'pass123',
      });

      expect(api.post).toHaveBeenCalledWith('/auth/register', {
        displayName: 'Test',
        email: 'a@b.com',
        password: 'pass123',
      });
      expect(result).toEqual(responseData);
    });
  });

  describe('refresh', () => {
    it('should POST userId and refreshToken', async () => {
      const responseData = { access_token: 'new-jwt', refresh_token: 'new-rt' };
      (api.post as any).mockResolvedValue({ data: responseData });

      const result = await authService.refresh('u1', 'old-rt');

      expect(api.post).toHaveBeenCalledWith('/auth/refresh', { userId: 'u1', refreshToken: 'old-rt' });
      expect(result).toEqual(responseData);
    });
  });

  describe('getUser', () => {
    it('should GET /users/me with authorization header', async () => {
      const userData = { id: 'u1', displayName: 'Test', email: 'a@b.com' };
      (api.get as any).mockResolvedValue({ data: userData });

      const result = await authService.getUser('my-token');

      expect(api.get).toHaveBeenCalledWith('/users/me', {
        headers: { Authorization: 'Bearer my-token' },
      });
      expect(result).toEqual(userData);
    });
  });
});
