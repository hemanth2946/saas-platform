import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_CONSTANTS } from "@/config/auth.constants";
import { verifyAccessToken } from "@/server/auth/jwt";

/**
 * Next.js proxy (middleware)
 * Runs at the edge before every request
 * Protects all /[orgId]/* routes from unauthenticated access
 *
 * Flow:
 * - Public routes (login, signup, verify-email) → always allow
 * - Protected routes → check access_token cookie
 * - No token → redirect to /login
 * - Valid token but wrong org → redirect to correct org
 * - Valid token + correct org → allow through
 */
export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // ── Public routes — always allow ──
    const publicRoutes = [
        "/login",
        "/signup",
        "/verify-email",
        "/reset-password",
        "/api/auth/login",
        "/api/auth/signup",
        "/api/auth/refresh",
        "/api/auth/verify",
        "/api/auth/logout",
    ];

    const isPublic =
        publicRoutes.some((route) => pathname.startsWith(route)) ||
        pathname === "/";

    if (isPublic) return NextResponse.next();

    // ── Get access token from cookie ──
    const accessToken = request.cookies.get(
        AUTH_CONSTANTS.COOKIES.ACCESS_TOKEN
    )?.value;

    // No token → redirect to login
    if (!accessToken) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
    }

    try {
        // Verify token
        const payload = verifyAccessToken(accessToken);

        // Check if accessing correct org
        // pathname starts with /[orgId]/...
        const orgIdFromUrl = pathname.split("/")[1];

        if (
            orgIdFromUrl &&
            orgIdFromUrl !== payload.orgId &&
            !orgIdFromUrl.startsWith("api")
        ) {
            // Wrong org — redirect to correct org dashboard
            const correctUrl = new URL(
                `/${payload.orgId}/dashboard`,
                request.url
            );
            return NextResponse.redirect(correctUrl);
        }

        // All good — allow request through
        return NextResponse.next();

    } catch {
        // Token invalid or expired → redirect to login
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
    }
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};