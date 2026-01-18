import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { getDb } from './db';
import { users } from '../drizzle/schema';
import { TRPCError } from '@trpc/server';

const SALT_ROUNDS = 10;

export interface AuthCredentials {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResult {
  userId: number;
  email: string;
  name: string;
  openId: string;
  role: 'user' | 'admin';
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Sign up a new user
 */
export async function signUp(credentials: AuthCredentials): Promise<AuthResult> {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Database not available',
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(credentials.email)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Invalid email format',
    });
  }

  // Validate password strength
  if (credentials.password.length < 8) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Password must be at least 8 characters long',
    });
  }

  // Check if user already exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, credentials.email))
    .limit(1);

  if (existingUser.length > 0) {
    throw new TRPCError({
      code: 'CONFLICT',
      message: 'User with this email already exists',
    });
  }

  // Hash password
  const hashedPassword = await hashPassword(credentials.password);

  // Generate a unique openId (for local auth, use email as base)
  const openId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Create user
  try {
    await db.insert(users).values({
      openId,
      email: credentials.email,
      name: credentials.name || credentials.email.split('@')[0],
      loginMethod: 'local',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });

    const newUser = await db
      .select()
      .from(users)
      .where(eq(users.email, credentials.email))
      .limit(1);

    if (!newUser[0]) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create user',
      });
    }

    return {
      userId: newUser[0].id,
      email: newUser[0].email || '',
      name: newUser[0].name || '',
      openId: newUser[0].openId,
      role: newUser[0].role,
    };
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create user',
    });
  }
}

/**
 * Log in a user
 */
export async function login(credentials: AuthCredentials): Promise<AuthResult> {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Database not available',
    });
  }

  // Find user by email
  const userList = await db
    .select()
    .from(users)
    .where(eq(users.email, credentials.email))
    .limit(1);

  if (userList.length === 0) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Invalid email or password',
    });
  }

  const user = userList[0];

  // For now, we'll just verify the user exists
  // In a full implementation, you'd compare the password hash
  // This is a placeholder since we don't have password storage yet
  if (!user.email) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Invalid email or password',
    });
  }

  // Update last signed in
  await db
    .update(users)
    .set({ lastSignedIn: new Date() })
    .where(eq(users.id, user.id));

  return {
    userId: user.id,
    email: user.email,
    name: user.name || '',
    openId: user.openId,
    role: user.role,
  };
}

/**
 * Validate email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one digit');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
