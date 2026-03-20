/**
 * lib/api/core/interceptors/request.ts
 *
 * Request interceptor applied to every Axios instance (except health client).
 * Injects auth-related headers and stores timing metadata for response logging.
 * Skipped for public routes defined in skipList.ts.
 */

import type { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { isSkippedRoute } from "@/lib/api/constants/skipList";
import { useAuthStore } from "@/store/auth.store";
import logger from "@/lib/api/core/logger";

// Augment AxiosRequestConfig to carry timing metadata
declare module "axios" {
    interface InternalAxiosRequestConfig {
        metadata?: {
            startTime: number;
            requestId: string;
        };
        _retry?: boolean;
        _networkRetry?: boolean;
    }
}

/**
 * Attaches the request interceptor to the given Axios instance.
 */
export function setupRequestInterceptor(instance: AxiosInstance): void {
    instance.interceptors.request.use(
        (config: InternalAxiosRequestConfig) => {
            // Skip header injection for public routes
            if (isSkippedRoute(config.url)) {
                return config;
            }

            const orgId = useAuthStore.getState().org?.id ?? "";
            const requestId = crypto.randomUUID();

            config.headers.set("x-org-id", orgId);
            config.headers.set("x-request-id", requestId);
            config.headers.set("x-requested-with", "XMLHttpRequest");

            config.metadata = {
                startTime: Date.now(),
                requestId,
            };

            logger.info(
                `[request] ${config.method?.toUpperCase()} ${config.url}`,
                { requestId, orgId }
            );

            return config;
        },
        (error: unknown) => {
            logger.error("[request] Request setup error", error);
            return Promise.reject(error);
        }
    );
}
