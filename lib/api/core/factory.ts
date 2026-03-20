/**
 * lib/api/core/factory.ts
 *
 * Single factory for creating Axios instances.
 * Every API client is created exclusively through createApiClient().
 * Applies request + response interceptors and optionally wraps with
 * a circuit breaker for resilience.
 */

import axios, { type AxiosInstance } from "axios";
import { setupRequestInterceptor } from "./interceptors/request";
import { setupResponseInterceptor } from "./interceptors/response";
import type { CircuitBreaker } from "./circuitBreaker";

export interface ApiClientConfig {
    baseURL: string;
    timeout: number;
    enableCircuitBreaker: boolean;
    circuitBreaker?: CircuitBreaker;
}

/**
 * Creates a configured Axios instance with request/response interceptors.
 * Pass enableCircuitBreaker: true with a CircuitBreaker instance to protect
 * against external service outages.
 */
export function createApiClient(config: ApiClientConfig): AxiosInstance {
    const instance = axios.create({
        baseURL: config.baseURL,
        timeout: config.timeout,
        withCredentials: true,
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
    });

    setupRequestInterceptor(instance);
    setupResponseInterceptor(instance);

    // Wrap request method with circuit breaker if enabled
    if (config.enableCircuitBreaker && config.circuitBreaker) {
        const cb = config.circuitBreaker;
        const originalRequest = instance.request.bind(instance);

        instance.request = async (requestConfig) => {
            return cb.execute(() => originalRequest(requestConfig));
        };
    }

    return instance;
}
