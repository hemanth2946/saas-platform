/**
 * lib/api/constants/skipList.ts
 *
 * Routes that bypass the auth request interceptor.
 * These endpoints must NOT receive x-org-id or x-request-id headers
 * as they are public and do not require an authenticated org context.
 */

export const AUTH_SKIP_ROUTES: string[] = [
    "/api/auth/login",
    "/api/auth/signup",
    "/api/auth/refresh",
    "/api/auth/verify",
    "/api/health",
];

/**
 * Returns true if the given URL should skip auth header injection.
 * Performs a prefix check so query params and trailing slashes are ignored.
 */
export function isSkippedRoute(url: string | undefined): boolean {
    if (!url) return false;
    return AUTH_SKIP_ROUTES.some((route) => url.startsWith(route));
}
