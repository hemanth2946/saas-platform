/**
 * lib/query/queryClient.ts
 *
 * TanStack Query v5 QueryClient with global defaults.
 * Exports a singleton queryClient and a QueryProvider component that
 * wraps the app with QueryClientProvider and (dev-only) ReactQueryDevtools.
 */

"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { AxiosError } from "axios";
import type { ApiErrorResponse } from "@/types/api.types";

// Error codes that should never be retried
const NO_RETRY_CODES = new Set([401, 403, 404]);

function shouldRetry(failureCount: number, error: unknown): boolean {
    const axiosError = error as AxiosError | ApiErrorResponse | undefined;

    // ApiErrorResponse (already normalised by our handler)
    if (axiosError && "success" in axiosError && axiosError.success === false) {
        return false;
    }

    // AxiosError with a response status
    if (axiosError && "response" in axiosError) {
        const status = (axiosError as AxiosError).response?.status;
        if (status && NO_RETRY_CODES.has(status)) return false;
    }

    // Retry once for network errors
    return failureCount < 1;
}

function makeQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 5 * 60 * 1000, // 5 minutes
                retry: shouldRetry,
                refetchOnWindowFocus: true,
                refetchOnReconnect: true,
            },
            mutations: {
                retry: 0,
            },
        },
    });
}

/**
 * Module-level singleton for use outside React (e.g. invalidating cache from
 * service functions). Do NOT pass to QueryClientProvider directly — the
 * provider uses its own useState instance to avoid sharing state across
 * server-rendered requests.
 */
export const queryClient = makeQueryClient();

// ── Provider component ────────────────────────────────────────────────────────

/**
 * Wraps the application with QueryClientProvider and dev tools.
 * Creates a new QueryClient per component mount via useState so that
 * server renders never share client state.
 */
export function QueryProvider({
    children,
}: {
    children: React.ReactNode;
}): React.ReactElement {
    // useState with lazy initializer ensures one client per browser session
    const [client] = useState(makeQueryClient);

    return React.createElement(
        QueryClientProvider,
        { client },
        children,
        process.env.NODE_ENV === "development"
            ? React.createElement(ReactQueryDevtools)
            : null
    );
}
