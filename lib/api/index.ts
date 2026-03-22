/**
 * lib/api/index.ts
 *
 * Barrel export for the entire API layer.
 * All consumers import from '@/lib/api' — never from deep internal paths.
 */

// ── Clients ──────────────────────────────────────────────────────────────────
export { internalClient } from "./clients/internal.client";
export { externalClient, isExternalApiConfigured } from "./clients/external.client";
export { checkHealth, startHealthPolling } from "./clients/health.client";

// ── Resources ─────────────────────────────────────────────────────────────────
export { authApi } from "./resources/auth.api";
export { orgApi } from "./resources/org.api";
export { usersApi } from "./resources/users.api";
export { planApi } from "./resources/plan.api";
export type { UsageData } from "./resources/plan.api";

// ── Services ──────────────────────────────────────────────────────────────────
export { getPlanConfig } from "./plan.service";
export { getFeatureFlags } from "./flags.service";

// ── Error handler ─────────────────────────────────────────────────────────────
export { handleApiError } from "./errorHandler/handler";
export { showDebouncedError, showImmediateError } from "./errorHandler/debounce";
export { ERROR_MESSAGES, getErrorMessage } from "./errorHandler/messages";

// ── Constants ─────────────────────────────────────────────────────────────────
export { HTTP_STATUS } from "./constants/httpStatus";
export type { HttpStatus } from "./constants/httpStatus";
export { ENDPOINTS } from "./constants/endpoints";
export { AUTH_SKIP_ROUTES, isSkippedRoute } from "./constants/skipList";

// ── Core utilities ────────────────────────────────────────────────────────────
export { createApiClient } from "./core/factory";
export type { ApiClientConfig } from "./core/factory";
export { CircuitBreaker, CircuitBreakerError, circuitBreakerSingleton } from "./core/circuitBreaker";
export { handleTokenRefresh } from "./core/refresh";
export { processQueue, addToQueue, getQueueLength } from "./core/queue";
export { logger, sanitizeData, setLogLevel, addLogTransport, removeLogTransport } from "./core/logger";
export type { LogEntry, LogTransport, LogLevel } from "./core/logger";
