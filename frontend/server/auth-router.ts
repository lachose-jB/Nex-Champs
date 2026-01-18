import { z } from 'zod';
import { publicProcedure, router } from './_core/trpc';
import { signUp, login, validateEmail, validatePasswordStrength } from './auth-service';
import { TRPCError } from '@trpc/server';

const signUpSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const authRouter = router({
  /**
   * Sign up a new user
   */
  signup: publicProcedure
    .input(signUpSchema)
    .mutation(async ({ input }) => {
      try {
        // Validate email
        if (!validateEmail(input.email)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid email format',
          });
        }

        // Validate password strength
        const passwordValidation = validatePasswordStrength(input.password);
        if (!passwordValidation.isValid) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: passwordValidation.errors.join(', '),
          });
        }

        const user = await signUp({
          email: input.email,
          password: input.password,
          name: input.name,
        });

        return {
          success: true,
          user,
          message: 'User created successfully',
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create user',
        });
      }
    }),

  /**
   * Log in a user
   */
  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const user = await login({
          email: input.email,
          password: input.password,
        });

        // In a real implementation, you would set a session cookie here
        // For now, we'll just return the user info
        return {
          success: true,
          user,
          message: 'Logged in successfully',
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
        });
      }
    }),

  /**
   * Validate email
   */
  validateEmail: publicProcedure
    .input(z.object({ email: z.string() }))
    .query(({ input }) => {
      return {
        isValid: validateEmail(input.email),
      };
    }),

  /**
   * Validate password strength
   */
  validatePassword: publicProcedure
    .input(z.object({ password: z.string() }))
    .query(({ input }) => {
      return validatePasswordStrength(input.password);
    }),
});
