/**
 * lib/api/clients/external.client.ts
 *
 * Axios client for future external server integrations (AI, scanning, etc.).
 * Circuit breaker enabled — protects the UI when the external server is down.
 * Longer timeout to accommodate heavy AI/compute responses.
 */

import { createApiClient } from "@/lib/api/core/factory";
import { circuitBreakerSingleton } from "@/lib/api/core/circuitBreaker";
import { env } from "@/lib/config/env";

export const externalClient = createApiClient({
    baseURL: env.NEXT_PUBLIC_EXTERNAL_API_URL || "",
    timeout: 60_000,
    enableCircuitBreaker: true,
    circuitBreaker: circuitBreakerSingleton,
});

/**
 * Returns true if an external API URL has been configured.
 * Components can gate external features behind this check.
 */
export function isExternalApiConfigured(): boolean {
    return Boolean(env.NEXT_PUBLIC_EXTERNAL_API_URL);
}
