/**
 * lib/api/errorHandler/messages.ts
 *
 * All user-facing error strings in one place.
 * The handler imports from here — never hardcodes strings inline.
 */

import type { ApiErrorCode } from "@/types/api.types";

type NetworkCode = "ERR_NETWORK" | "ERR_CONNECTION_REFUSED" | "TIMEOUT" | "UNKNOWN";

type ErrorMessageKey = ApiErrorCode | NetworkCode;

export const ERROR_MESSAGES: Record<ErrorMessageKey, string> = {
    // API error codes
    UNAUTHORIZED: "Your session has expired. Please log in again.",
    FORBIDDEN: "You do not have permission to perform this action.",
    NOT_FOUND: "The requested resource was not found.",
    VALIDATION_ERROR: "Please check your input and try again.",
    CONFLICT: "This resource already exists.",
    RATE_LIMITED: "Too many requests. Please slow down.",
    INTERNAL_ERROR: "Something went wrong. Please try again later.",
    PLAN_LIMIT_EXCEEDED: "Upgrade your plan to access this feature.",
    SEAT_LIMIT_EXCEEDED: "Seat limit reached. Upgrade your plan to add more users.",

    // Network / transport errors
    ERR_NETWORK: "Unable to connect. Please check your connection.",
    ERR_CONNECTION_REFUSED: "Server is unreachable. Please try again later.",
    TIMEOUT: "Request timed out. Please try again.",
    UNKNOWN: "An unexpected error occurred.",
};

/**
 * Returns the user-facing message for a given error code.
 * Falls back to the UNKNOWN message if the code is unrecognised.
 */
export function getErrorMessage(code: string): string {
    return (ERROR_MESSAGES as Record<string, string>)[code] ?? ERROR_MESSAGES.UNKNOWN;
}
