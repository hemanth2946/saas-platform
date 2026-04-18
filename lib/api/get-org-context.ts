/**
 * lib/api/get-org-context.ts
 *
 * Shared utility used at the TOP of every protected API route.
 * Validates org membership via JWT + DB cross-check.
 *
 * Returns null on ANY failure — never throws.
 * The caller decides the response code (401 vs 403).
 *
 * @example
 * const ctx = await getOrgContext(req)
 * if (!ctx) return NextResponse.json({ ... }, { status: 401 })
 */

import { prisma } from "@/server/db";
import { verifyAccessToken } from "@/server/auth/jwt";
import { AUTH_CONSTANTS } from "@/config/auth.constants";

export interface OrgContext {
    userId: string;
    orgId:  string;
}

/**
 * Validates the incoming request and returns { userId, orgId } or null.
 *
 * Validation order:
 * 1. x-org-id header must be present
 * 2. Access token (cookie or Authorization header) must be valid
 * 3. JWT orgId must match x-org-id header
 * 4. User must have at least one role in the org (DB cross-validate)
 */
export async function getOrgContext(req: Request): Promise<OrgContext | null> {
    try {
        // 1. Read orgId from x-org-id header
        const orgId = req.headers.get("x-org-id");
        if (!orgId?.trim()) return null;

        // 2. Read access token — try cookie first, then Authorization header
        let tokenValue: string | null = null;

        // Cookie header parsing
        const cookieHeader = req.headers.get("cookie") ?? "";
        const cookieName   = AUTH_CONSTANTS.COOKIES.ACCESS_TOKEN;
        const cookieMatch  = cookieHeader
            .split(";")
            .map((c) => c.trim())
            .find((c) => c.startsWith(`${cookieName}=`));

        if (cookieMatch) {
            tokenValue = cookieMatch.slice(cookieName.length + 1);
        } else {
            // Fallback: Authorization: Bearer <token>
            const authHeader = req.headers.get("authorization") ?? "";
            if (authHeader.startsWith("Bearer ")) {
                tokenValue = authHeader.slice(7);
            }
        }

        if (!tokenValue) return null;

        // 3. Verify JWT and extract userId
        let userId: string;
        try {
            const payload = verifyAccessToken(tokenValue);
            userId = payload.userId;

            // JWT must be org-scoped and match the x-org-id header
            if (!payload.orgId || payload.orgId !== orgId) return null;
        } catch {
            return null;
        }

        // 4. Cross-validate: user must have at least one UserRole in this org
        const userRole = await prisma.userRole.findFirst({
            where: {
                userId,
                role: { orgId },
            },
        });

        if (!userRole) return null;

        return { userId, orgId };
    } catch {
        // Never throw — return null on any unexpected error
        return null;
    }
}
