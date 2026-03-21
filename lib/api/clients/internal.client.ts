/**
 * lib/api/clients/internal.client.ts
 *
 * Axios client for Next.js API routes (same-origin).
 * Relies on httpOnly cookies sent automatically by the browser.
 * Used by all resources/*.api.ts files by default.
 */

import { createApiClient } from "@/lib/api/core/factory";
import { env } from "@/lib/config/env";

export const internalClient = createApiClient({
    baseURL: env.NEXT_PUBLIC_API_BASE_URL || "",
    // 15s — accommodates Neon serverless cold starts (can take 3–8s on first request)
    timeout: 15_000,
    enableCircuitBreaker: false,
});
