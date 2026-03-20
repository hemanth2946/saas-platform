/**
 * lib/api/core/refresh.ts
 *
 * Silent token refresh logic invoked by the response interceptor on 401.
 * Uses a flag to prevent multiple concurrent refresh requests — all waiting
 * requests are queued and resolved/rejected when the single refresh settles.
 * On failure, clears auth state and redirects to /login.
 */

import axios from "axios";
import { ENDPOINTS } from "@/lib/api/constants/endpoints";
import { processQueue, addToQueue } from "./queue";
import { useAuthStore } from "@/store/auth.store";
import logger from "./logger";

let isRefreshing = false;

/**
 * Attempts a silent token refresh by calling POST /api/v1/auth/refresh.
 * The backend rotates the httpOnly cookie; no token is passed in the body.
 *
 * @returns true if refresh succeeded, false if it failed.
 */
export async function handleTokenRefresh(): Promise<boolean> {
    if (isRefreshing) {
        // Another refresh is already in-flight — queue this request
        try {
            await addToQueue();
            return true;
        } catch {
            return false;
        }
    }

    isRefreshing = true;

    try {
        // Use a plain axios instance with no interceptors to avoid loops
        await axios.post(
            ENDPOINTS.AUTH.refresh,
            {},
            { withCredentials: true }
        );

        processQueue(null);
        return true;
    } catch (error) {
        processQueue(error);
        logger.warn("[refresh] Token refresh failed — clearing auth");

        // Clear Zustand store and redirect to login
        useAuthStore.getState().clearAuth();
        if (typeof window !== "undefined") {
            window.location.href = "/login";
        }

        return false;
    } finally {
        isRefreshing = false;
    }
}
