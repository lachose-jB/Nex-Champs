import { describe, it, expect } from 'vitest';
import { appRouter } from './routers';
import type { TrpcContext } from './_core/context';
import { validatePasswordStrength, validateEmail } from './auth-service';

type AuthenticatedUser = NonNullable<TrpcContext['user']>;

function createAuthContext(user?: AuthenticatedUser): { ctx: TrpcContext; clearedCookies: Array<{ name: string; options: Record<string, unknown> }> } {
  const clearedCookies: Array<{ name: string; options: Record<string, unknown> }> = [];

  const defaultUser: AuthenticatedUser = {
    id: 1,
    openId: 'test-user',
    email: 'test@example.com',
    name: 'Test User',
    loginMethod: 'email',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user: user || defaultUser,
    req: {
      protocol: 'https',
      headers: {},
    } as TrpcContext['req'],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext['res'],
  };

  return { ctx, clearedCookies };
}

describe('Authentication', () => {
  describe('auth.logout', () => {
    it('should clear the session cookie and report success', async () => {
      const { ctx, clearedCookies } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.logout();

      expect(result).toEqual({ success: true });
      expect(clearedCookies).toHaveLength(1);
      expect(clearedCookies[0]?.name).toBe('app_session_id');
    });
  });

  describe('auth.me', () => {
    it('should return current user information', async () => {
      const testUser: AuthenticatedUser = {
        id: 42,
        openId: 'user-42',
        email: 'user42@example.com',
        name: 'User 42',
        loginMethod: 'google',
        role: 'admin',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-18'),
        lastSignedIn: new Date('2026-01-18'),
      };

      const { ctx } = createAuthContext(testUser);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.me();

      expect(result).toEqual(testUser);
      expect(result?.id).toBe(42);
      expect(result?.role).toBe('admin');
    });

    it('should return null for unauthenticated users', async () => {
      const { ctx } = createAuthContext(undefined as any);
      ctx.user = null as any;
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.me();

      expect(result).toBeNull();
    });
  });

  describe('Password Validation', () => {
    it('should validate strong passwords', () => {
      const result = validatePasswordStrength('SecurePass123!@#');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject weak passwords', () => {
      const result = validatePasswordStrength('weak');

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject passwords without uppercase letters', () => {
      const result = validatePasswordStrength('lowercase123!@#');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject passwords without numbers', () => {
      const result = validatePasswordStrength('NoNumbers!@#');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one digit');
    });

    it('should reject passwords without special characters', () => {
      const result = validatePasswordStrength('NoSpecial123');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should reject passwords shorter than 8 characters', () => {
      const result = validatePasswordStrength('Short1!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });
  });

  describe('Email Validation', () => {
    it('should validate correct email format', () => {
      const result = validateEmail('user@example.com');

      expect(result).toBe(true);
    });

    it('should reject invalid email format', () => {
      const result = validateEmail('invalid-email');

      expect(result).toBe(false);
    });

    it('should reject emails without @ symbol', () => {
      const result = validateEmail('userexample.com');

      expect(result).toBe(false);
    });

    it('should reject emails without domain', () => {
      const result = validateEmail('user@');

      expect(result).toBe(false);
    });

    it('should accept emails with valid format', () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.co.uk',
        'first+last@example.com',
      ];

      validEmails.forEach((email) => {
        expect(validateEmail(email)).toBe(true);
      });
    });
  });
});
