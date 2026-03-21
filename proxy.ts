import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_CONSTANTS } from "@/config/auth.constants";
import { verifyAccessToken } from "@/server/auth/jwt";

/**
 * proxy.ts — Next.js 16 route protection (runs before every request)
 *
 * Priority order:
 * 1. /login  → if authenticated + org set  → redirect to /select-org (client resolves slug)
 * 2. /login  → if authenticated + no org   → redirect to /select-org
 * 3. /select-org → if NOT authenticated    → redirect to /login
 * 4. /select-org → if authenticated + org already set → pass through (client redirects)
 * 5. /[orgId]/* → if NOT authenticated     → redirect to /login
 * 6. /[orgId]/* → if authenticated + no org selected → redirect to /select-org
 * 7. /[orgId]/* → if authenticated + org mismatch   → redirect to /select-org (client resolves)
 */
export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // ── Always allow: static assets, API routes, root ──────────────────
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/api/") ||
        pathname === "/favicon.ico" ||
        pathname === "/"
    ) {
        return NextResponse.next();
    }

    // ── Read + verify JWT ────────────────────────────────────────────────
    const tokenCookie = request.cookies.get(AUTH_CONSTANTS.COOKIES.ACCESS_TOKEN)?.value;

    let isAuthenticated = false;
    let hasOrgSelected = false;

    if (tokenCookie) {
        try {
            const payload = verifyAccessToken(tokenCookie);
            isAuthenticated = true;
            hasOrgSelected = !!payload.orgId && payload.orgId !== "";
        } catch {
            // Token invalid or expired — treat as unauthenticated
            isAuthenticated = false;
            hasOrgSelected = false;
        }
    }

    // ── Rule 1 + 2: /login ───────────────────────────────────────────────
    if (pathname === "/login") {
        if (isAuthenticated) {
            // Authenticated (with or without org) → go to select-org
            // The select-org page will immediately redirect to dashboard if org is already set
            return NextResponse.redirect(new URL("/select-org", request.url));
        }
        return NextResponse.next();
    }

    // ── Rule 3 + 4: /select-org ──────────────────────────────────────────
    if (pathname === "/select-org") {
        if (!isAuthenticated) {
            return NextResponse.redirect(new URL("/login", request.url));
        }
        // Authenticated — allow through; page handles "already has org" redirect via Zustand
        return NextResponse.next();
    }

    // ── Public auth pages — always allow ─────────────────────────────────
    const publicPages = ["/signup", "/verify-email", "/reset-password"];
    if (publicPages.some((p) => pathname.startsWith(p))) {
        return NextResponse.next();
    }

    // ── Rules 5 + 6 + 7: /[orgId]/* ─────────────────────────────────────
    // Rule 5: not authenticated → /login
    if (!isAuthenticated) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Rule 6: authenticated but no org selected → /select-org
    if (!hasOrgSelected) {
        return NextResponse.redirect(new URL("/select-org", request.url));
    }

    // Rule 7: org mismatch check
    // We know orgId from JWT (DB id). URL uses slug or id.
    // The client (TenantProvider) handles the slug vs id mismatch.
    // Proxy just ensures the user is authenticated + has an org selected.
    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
