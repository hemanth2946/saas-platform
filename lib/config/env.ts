/**
 * lib/config/env.ts
 *
 * Validates all required environment variables at app startup using Zod.
 * If any required var is missing, throws immediately with a descriptive message.
 * All other files import from here — never from process.env directly.
 */

import { z } from "zod";

const envSchema = z.object({
    NEXT_PUBLIC_API_BASE_URL: z.string().default(""),
    NEXT_PUBLIC_EXTERNAL_API_URL: z.string().optional(),
    NEXT_PUBLIC_LOG_ENDPOINT: z.string().optional(),
    NEXT_PUBLIC_DEBUG: z.string().optional(),
    NODE_ENV: z.enum(["development", "production", "test"]),
});

function validateEnv() {
    const result = envSchema.safeParse({
        NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
        NEXT_PUBLIC_EXTERNAL_API_URL: process.env.NEXT_PUBLIC_EXTERNAL_API_URL,
        NEXT_PUBLIC_LOG_ENDPOINT: process.env.NEXT_PUBLIC_LOG_ENDPOINT,
        NEXT_PUBLIC_DEBUG: process.env.NEXT_PUBLIC_DEBUG,
        NODE_ENV: process.env.NODE_ENV,
    });

    if (!result.success) {
        const issues = result.error.issues ?? [];
        const missing = issues
            .map((issue) => `  • ${issue.path.join(".")}: ${issue.message}`)
            .join("\n");
        throw new Error(
            `[env] Missing or invalid environment variables:\n${missing}\n` +
            `Please check your .env file.`
        );
    }

    return result.data;
}

export const env = validateEnv();

export type Env = typeof env;
