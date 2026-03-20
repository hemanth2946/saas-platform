/**
 * lib/api/errorHandler/debounce.ts
 *
 * Batches multiple simultaneous API errors into a single toast notification.
 * Detects permission-related errors and uses toast.warning instead of toast.error.
 * Provides an immediate (non-debounced) variant for critical errors.
 */

import { toast } from "sonner";

const DEBOUNCE_DELAY = 500;

const PERMISSION_KEYWORDS: string[] = [
    "permission",
    "insufficient",
    "forbidden",
    "access denied",
    "not authorized",
    "role",
];

let errorMessages: string[] = [];
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function isPermissionError(message: string): boolean {
    const lower = message.toLowerCase();
    return PERMISSION_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Adds the error message to the buffer and fires a debounced toast.
 * If all buffered messages are permission-related → toast.warning.
 * Otherwise → toast.error. Only the first message is shown.
 */
export function showDebouncedError(
    message: string,
    type: "error" | "warning" = "error"
): void {
    errorMessages.push(message);

    if (debounceTimer !== null) {
        clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
        const pending = errorMessages.filter(Boolean);
        errorMessages = [];
        debounceTimer = null;

        if (pending.length === 0) return;

        const allPermission = pending.every(isPermissionError);
        const display = pending[0];

        if (allPermission || type === "warning") {
            toast.warning(display);
        } else {
            toast.error(display);
        }
    }, DEBOUNCE_DELAY);
}

/**
 * Shows a toast immediately without debouncing. Use for critical errors
 * like network failures where instant feedback matters.
 */
export function showImmediateError(message: string): void {
    toast.error(message);
}
