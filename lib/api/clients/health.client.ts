/**
 * lib/api/clients/health.client.ts
 *
 * Lightweight health check client.
 * Plain axios — no interceptors, no auth, no error handler.
 * Used to poll server availability and set window.__serverUnreachable.
 */

import axios from "axios";
import { ENDPOINTS } from "@/lib/api/constants/endpoints";

declare global {
    interface Window {
        __serverUnreachable?: boolean;
    }
}

const healthAxios = axios.create({
    baseURL: "",
    timeout: 3_000,
    withCredentials: false,
});

/**
 * Pings the health endpoint.
 * @returns true if server responded with 200, false on any error.
 */
export async function checkHealth(): Promise<boolean> {
    try {
        const response = await healthAxios.get(ENDPOINTS.HEALTH.ping);
        return response.status === 200;
    } catch {
        return false;
    }
}

/**
 * Starts polling the health endpoint at the given interval.
 * Updates window.__serverUnreachable on status changes.
 *
 * @param intervalMs - Poll interval in milliseconds (default: 30s)
 * @returns cleanup function to stop polling
 */
export function startHealthPolling(intervalMs = 30_000): () => void {
    const timer = setInterval(async () => {
        const healthy = await checkHealth();

        if (typeof window !== "undefined") {
            window.__serverUnreachable = !healthy;
        }
    }, intervalMs);

    return () => clearInterval(timer);
}
