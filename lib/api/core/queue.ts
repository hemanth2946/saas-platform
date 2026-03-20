/**
 * lib/api/core/queue.ts
 *
 * Failed request queue for token refresh race condition protection.
 * When a 401 occurs while a refresh is already in-flight, subsequent
 * requests are queued here and resolved/rejected once the refresh settles.
 * This ensures only ONE refresh call is made regardless of how many
 * concurrent requests receive a 401.
 */

interface FailedRequest {
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
}

let failedQueue: FailedRequest[] = [];

/**
 * Resolves or rejects all queued requests after a refresh attempt.
 *
 * @param error - If non-null, all requests are rejected with this error.
 * @param token - Unused in cookie-based auth; kept for API symmetry.
 */
export function processQueue(error: unknown, token?: string): void {
    for (const request of failedQueue) {
        if (error) {
            request.reject(error);
        } else {
            request.resolve(token);
        }
    }
    failedQueue = [];
}

/**
 * Adds the current request to the failed queue and returns a Promise
 * that resolves/rejects when processQueue() is called.
 */
export function addToQueue(): Promise<unknown> {
    return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
    });
}

/**
 * Returns the current length of the failed queue (for debugging only).
 */
export function getQueueLength(): number {
    return failedQueue.length;
}
