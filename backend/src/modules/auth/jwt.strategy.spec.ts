import { describe, it, expect } from 'vitest';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    strategy = new JwtStrategy();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should return userId and email from JWT payload', async () => {
    const payload = { sub: 'user-123', email: 'test@example.com', iat: 123, exp: 999 };
    const result = await strategy.validate(payload);

    expect(result).toEqual({
      userId: 'user-123',
      email: 'test@example.com',
    });
  });

  it('should extract userId from sub field', async () => {
    const payload = { sub: 'abc-def', email: 'a@b.com' };
    const result = await strategy.validate(payload);

    expect(result.userId).toBe('abc-def');
  });

  it('should handle payload with extra fields', async () => {
    const payload = { sub: 'u1', email: 'x@y.com', role: 'admin', name: 'Test' };
    const result = await strategy.validate(payload);

    // Should only return userId and email
    expect(result).toEqual({ userId: 'u1', email: 'x@y.com' });
    expect((result as any).role).toBeUndefined();
  });
});
