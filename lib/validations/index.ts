/**
 * lib/validations/index.ts
 *
 * Barrel export for all Zod validation schemas and inferred types.
 */

export {
    signupSchema,
    loginSchema,
    verifyEmailSchema,
} from "./auth.schema";

export type {
    SignupInput,
    LoginInput,
    VerifyEmailInput,
} from "./auth.schema";
