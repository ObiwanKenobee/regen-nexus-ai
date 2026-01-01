import { z } from 'zod';

// Common validation schemas
export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(255, 'Email must be less than 255 characters');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be less than 72 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const simplePasswordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(72, 'Password must be less than 72 characters');

export const nameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(100, 'Name must be less than 100 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

export const optionalNameSchema = z
  .string()
  .trim()
  .max(100, 'Name must be less than 100 characters')
  .optional()
  .or(z.literal(''));

export const amountSchema = z
  .number()
  .positive('Amount must be positive')
  .max(10_000_000_000, 'Amount exceeds maximum limit');

export const descriptionSchema = z
  .string()
  .trim()
  .max(1000, 'Description must be less than 1000 characters')
  .optional();

// Sanitization utilities
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 10000); // Limit length
};

export const sanitizeForUrl = (input: string): string => {
  return encodeURIComponent(sanitizeInput(input));
};

// Form validation helper
export const validateField = <T>(
  schema: z.ZodSchema<T>,
  value: unknown
): { success: true; data: T } | { success: false; error: string } => {
  const result = schema.safeParse(value);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.errors[0].message };
};

// Rate limiting helper (client-side)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): boolean => {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
};

// Error message sanitization
export const sanitizeErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    // Don't expose internal error details
    const message = error.message.toLowerCase();
    if (message.includes('network') || message.includes('fetch')) {
      return 'Network error. Please check your connection and try again.';
    }
    if (message.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
    if (message.includes('unauthorized') || message.includes('401')) {
      return 'Please sign in to continue.';
    }
    if (message.includes('forbidden') || message.includes('403')) {
      return 'You do not have permission to perform this action.';
    }
    // Return a generic message for other errors
    return 'An unexpected error occurred. Please try again.';
  }
  return 'An unexpected error occurred. Please try again.';
};
