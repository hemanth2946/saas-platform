import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { AUTH_CONSTANTS } from "@/config/auth.constants";

/**
 * Minimal JWT payload shape — defined locally to avoid importing
 * server/auth/jwt which uses jsonwebtoken (Node.js-only, not Edge-safe).
 */
type JwtPayload = {
    userId: string;
    email: string;
    orgId: string;
    orgSlug: string;
    role: string;
    permissions: string[];
};

/**
 * Next.js 16 Proxy (formerly Middleware)
 * Runs at the Edge Runtime before every request.
 * Protects all /[orgId]/* routes from unauthenticated access.
 *
 * Uses jose for JWT verification — jose is Edge Runtime compatible.
 * jsonwebtoken is NOT used here (Node.js-only, incompatible with Edge).
 *
 * Flow:
 * - Public routes → always allow
 * - Protected routes → verify access_token cookie with jose
 * - No token → redirect to /login
 * - Valid token but wrong org → redirect to correct org dashboard
 * - Valid token + correct org → allow through
 */
export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // ── Public routes → always allow ──────────────────────────────────────
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

    // ── Get access token from cookie ───────────────────────────────────────
    const accessToken = request.cookies.get(
        AUTH_CONSTANTS.COOKIES.ACCESS_TOKEN
    )?.value;

    if (!accessToken) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
    }

    try {
        // jose requires the secret as Uint8Array.
        // TextEncoder().encode() produces UTF-8 bytes — same as jsonwebtoken
        // uses when signing with a plain string secret. Fully interoperable.
        const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "");
        const { payload } = await jwtVerify(accessToken, secret);
        const jwtPayload = payload as unknown as JwtPayload;

        // Prevent cross-org access: if URL org doesn't match token org, redirect.
        // pathname format: /[orgId]/... → split("/")[1] = orgId
        const orgIdFromUrl = pathname.split("/")[1];

        if (
            orgIdFromUrl &&
            orgIdFromUrl !== jwtPayload.orgSlug &&
            !orgIdFromUrl.startsWith("api")
        ) {
            const correctUrl = new URL(
                `/${jwtPayload.orgSlug}/dashboard`,
                request.url
            );
            return NextResponse.redirect(correctUrl);
        }

        return NextResponse.next();

    } catch {
        // Token invalid, expired, or malformed → redirect to login cleanly
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
    }
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
