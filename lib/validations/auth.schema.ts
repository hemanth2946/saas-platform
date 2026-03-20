import { z } from "zod";

// ============================================
// SIGNUP SCHEMA
// ============================================

/**
 * Zod schema for user signup form
 * Used on both frontend (form validation) and backend (API validation)
 * Single source of truth — one schema, two uses
 */
export const signupSchema = z.object({
    name: z
        .string()
        .min(2, "Name must be at least 2 characters")
        .max(50, "Name must be less than 50 characters")
        .trim(),

    email: z
        .string()
        .email("Please enter a valid email address")
        .toLowerCase()
        .trim(),

    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(100, "Password is too long")
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            "Password must contain uppercase, lowercase and a number"
        ),

    orgName: z
        .string()
        .min(2, "Organisation name must be at least 2 characters")
        .max(50, "Organisation name must be less than 50 characters")
        .trim(),
});

/** TypeScript type inferred from signupSchema */
export type SignupInput = z.infer<typeof signupSchema>;

// ============================================
// LOGIN SCHEMA
// ============================================

/**
 * Zod schema for user login form
 * Minimal validation — detailed errors handled by server
 */
export const loginSchema = z.object({
    email: z
        .string()
        .email("Please enter a valid email address")
        .toLowerCase()
        .trim(),

    password: z
        .string()
        .min(1, "Password is required"),
});

/** TypeScript type inferred from loginSchema */
export type LoginInput = z.infer<typeof loginSchema>;

// ============================================
// VERIFY EMAIL SCHEMA
// ============================================

/**
 * Zod schema for email verification token from URL query param
 */
export const verifyEmailSchema = z.object({
    token: z.string().min(1, "Verification token is required"),
});

/** TypeScript type inferred from verifyEmailSchema */
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;