/**
 * lib/api/errorHandler/handler.ts
 *
 * Central API error handler. Routes each error by HTTP status code to the
 * appropriate toast variant or silent logging. Returns a normalised
 * ApiErrorResponse so callers always receive a consistent shape.
 *
 * 401 responses are handled by refresh.ts and should not reach here.
 */

import type { AxiosError } from "axios";
import type { ApiErrorResponse } from "@/types/api.types";
import { HTTP_STATUS } from "@/lib/api/constants/httpStatus";
import { ERROR_MESSAGES, getErrorMessage } from "./messages";
import { showDebouncedError, showImmediateError } from "./debounce";
import logger from "@/lib/api/core/logger";

interface ServerErrorBody {
    success: false;
    message?: string;
    error?: {
        code?: string;
        fieldErrors?: Record<string, string[]>;
    };
}

function extractRequestId(error: AxiosError): string | undefined {
    return error.config?.metadata?.requestId;
}

function buildErrorResponse(
    code: string,
    message: string,
    fieldErrors?: Record<string, string[]>
): ApiErrorResponse {
    return {
        success: false,
        message,
        data: null,
        error: { code, fieldErrors },
    };
}

/**
 * Normalises an AxiosError into an ApiErrorResponse and triggers the
 * appropriate user-facing notification. Never throws.
 */
export function handleApiError(error: AxiosError): ApiErrorResponse {
    const requestId = extractRequestId(error);
    const status = error.response?.status;
    const body = error.response?.data as ServerErrorBody | undefined;
    const serverCode = body?.error?.code ?? "";
    const serverMessage = body?.message ?? "";
    const fieldErrors = body?.error?.fieldErrors;

    // ── 401 ── should not reach here; log a warning if it does ────────────
    if (status === HTTP_STATUS.UNAUTHORIZED) {
        logger.warn("[handler] Unexpected 401 reached error handler", {
            requestId,
        });
        return buildErrorResponse("UNAUTHORIZED", ERROR_MESSAGES.UNAUTHORIZED);
    }

    // ── 403 ── plan/seat limit or generic forbidden ────────────────────────
    if (status === HTTP_STATUS.FORBIDDEN) {
        if (serverCode === "PLAN_LIMIT_EXCEEDED") {
            showDebouncedError(ERROR_MESSAGES.PLAN_LIMIT_EXCEEDED, "warning");
            return buildErrorResponse(serverCode, ERROR_MESSAGES.PLAN_LIMIT_EXCEEDED);
        }
        if (serverCode === "SEAT_LIMIT_EXCEEDED") {
            showDebouncedError(ERROR_MESSAGES.SEAT_LIMIT_EXCEEDED, "warning");
            return buildErrorResponse(serverCode, ERROR_MESSAGES.SEAT_LIMIT_EXCEEDED);
        }
        showDebouncedError(ERROR_MESSAGES.FORBIDDEN, "warning");
        return buildErrorResponse("FORBIDDEN", ERROR_MESSAGES.FORBIDDEN);
    }

    // ── 404 ── silent (no toast) ───────────────────────────────────────────
    if (status === HTTP_STATUS.NOT_FOUND) {
        logger.warn("[handler] 404 Not Found", {
            url: error.config?.url,
            requestId,
        });
        return buildErrorResponse("NOT_FOUND", ERROR_MESSAGES.NOT_FOUND);
    }

    // ── 409 ── conflict ────────────────────────────────────────────────────
    if (status === HTTP_STATUS.CONFLICT) {
        const message = serverMessage || ERROR_MESSAGES.CONFLICT;
        showDebouncedError(message);
        return buildErrorResponse("CONFLICT", message);
    }

    // ── 422 ── validation: return fieldErrors, no toast ───────────────────
    if (status === HTTP_STATUS.UNPROCESSABLE) {
        logger.warn("[handler] 422 Validation error", { requestId, fieldErrors });
        return buildErrorResponse(
            "VALIDATION_ERROR",
            serverMessage || ERROR_MESSAGES.VALIDATION_ERROR,
            fieldErrors
        );
    }

    // ── 429 ── rate limited ────────────────────────────────────────────────
    if (status === HTTP_STATUS.TOO_MANY_REQUESTS) {
        showDebouncedError(ERROR_MESSAGES.RATE_LIMITED, "warning");
        return buildErrorResponse("RATE_LIMITED", ERROR_MESSAGES.RATE_LIMITED);
    }

    // ── 500 ────────────────────────────────────────────────────────────────
    if (status === HTTP_STATUS.INTERNAL_ERROR) {
        logger.error("[handler] 500 Internal Server Error", { requestId });
        showDebouncedError(ERROR_MESSAGES.INTERNAL_ERROR);
        return buildErrorResponse("INTERNAL_ERROR", ERROR_MESSAGES.INTERNAL_ERROR);
    }

    // ── 502 ────────────────────────────────────────────────────────────────
    if (status === HTTP_STATUS.BAD_GATEWAY) {
        logger.error("[handler] 502 Bad Gateway", { requestId });
        showDebouncedError(ERROR_MESSAGES.INTERNAL_ERROR);
        return buildErrorResponse("INTERNAL_ERROR", ERROR_MESSAGES.INTERNAL_ERROR);
    }

    // ── 503 ────────────────────────────────────────────────────────────────
    if (status === HTTP_STATUS.SERVICE_UNAVAILABLE) {
        logger.error("[handler] 503 Service Unavailable", { requestId });
        showDebouncedError(getErrorMessage("SERVICE_UNAVAILABLE"));
        return buildErrorResponse("SERVICE_UNAVAILABLE", getErrorMessage("SERVICE_UNAVAILABLE"));
    }

    // ── Network errors ─────────────────────────────────────────────────────
    if (error.code === "ERR_NETWORK") {
        showImmediateError(ERROR_MESSAGES.ERR_NETWORK);
        return buildErrorResponse("ERR_NETWORK", ERROR_MESSAGES.ERR_NETWORK);
    }

    if (error.code === "ERR_CONNECTION_REFUSED") {
        showImmediateError(ERROR_MESSAGES.ERR_CONNECTION_REFUSED);
        return buildErrorResponse("ERR_CONNECTION_REFUSED", ERROR_MESSAGES.ERR_CONNECTION_REFUSED);
    }

    // ── Timeout ────────────────────────────────────────────────────────────
    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
        showDebouncedError(ERROR_MESSAGES.TIMEOUT);
        return buildErrorResponse("TIMEOUT", ERROR_MESSAGES.TIMEOUT);
    }

    // ── Unknown ────────────────────────────────────────────────────────────
    logger.error("[handler] Unknown error", { requestId, error: error.message });
    showDebouncedError(ERROR_MESSAGES.UNKNOWN);
    return buildErrorResponse("UNKNOWN", ERROR_MESSAGES.UNKNOWN);
}
