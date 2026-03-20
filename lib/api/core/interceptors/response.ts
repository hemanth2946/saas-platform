/**
 * lib/api/core/interceptors/response.ts
 *
 * Response interceptor applied to every Axios instance.
 * Handles 401 via silent token refresh, routes all other errors to the
 * centralized error handler, and logs response timings for observability.
 *
 * Retry policy:
 *   - 401: silent refresh → retry original request once (all methods)
 *   - Network errors (ERR_NETWORK, ERR_CONNECTION_REFUSED): GET only, once, 1s delay
 *   - POST / PATCH / DELETE: never auto-retried (idempotency protection)
 */

import type { AxiosInstance, AxiosError } from "axios";
import { handleTokenRefresh } from "@/lib/api/core/refresh";
import { handleApiError } from "@/lib/api/errorHandler/handler";
import logger from "@/lib/api/core/logger";

const NETWORK_ERROR_CODES = new Set([
    "ERR_NETWORK",
    "ERR_CONNECTION_REFUSED",
]);

const SAFE_RETRY_METHODS = new Set(["get"]);

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Attaches the response interceptor to the given Axios instance.
 */
export function setupResponseInterceptor(instance: AxiosInstance): void {
    instance.interceptors.response.use(
        (response) => {
            const { config } = response;
            const meta = config.metadata;
            const duration = meta ? Date.now() - meta.startTime : 0;

            logger.info(
                `[response] ${config.method?.toUpperCase()} ${config.url} → ${response.status} (${duration}ms)`,
                { requestId: meta?.requestId, status: response.status }
            );

            return response;
        },
        async (error: AxiosError) => {
            const config = error.config;
            const status = error.response?.status;
            const method = config?.method?.toLowerCase() ?? "";

            logger.error(
                `[response] Error ${config?.method?.toUpperCase()} ${config?.url} → ${status ?? error.code}`,
                { requestId: config?.metadata?.requestId, code: error.code }
            );

            // ── 401 handling: silent refresh + retry ──────────────────────
            if (status === 401 && config && !config._retry) {
                config._retry = true;

                const refreshed = await handleTokenRefresh();

                if (refreshed) {
                    return instance(config);
                }

                // refresh.ts already called clearAuth() + redirect
                return Promise.reject(error);
            }

            // ── Network error retry (GET only, once) ──────────────────────
            if (
                error.code &&
                NETWORK_ERROR_CODES.has(error.code) &&
                config &&
                !config._networkRetry &&
                SAFE_RETRY_METHODS.has(method)
            ) {
                config._networkRetry = true;
                await delay(1000);
                return instance(config);
            }

            // ── Route all other errors to centralized handler ─────────────
            const normalized = handleApiError(error);
            return Promise.reject(normalized);
        }
    );
}
