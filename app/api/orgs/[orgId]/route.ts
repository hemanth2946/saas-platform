import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { verifyAccessToken } from "@/server/auth/jwt";
import { AUTH_CONSTANTS } from "@/config/auth.constants";

/**
 * GET /api/orgs/[orgId]
 * Returns the current org's context including live plan from DB.
 * Called by useOrg() on the dashboard via TanStack Query.
 *
 * Auth flow:
 *  1. Read access_token from httpOnly cookie
 *  2. Verify JWT — invalid/expired → 401
 *  3. Confirm payload.orgId matches the requested orgId — mismatch → 403
 *  4. Fetch org + subscription plan from DB
 *  5. Return OrgContext shape
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ orgId: string }> }
) {
    try {
        // 1. Read access_token from cookie
        const token = req.cookies.get(
            AUTH_CONSTANTS.COOKIES.ACCESS_TOKEN
        )?.value;

        if (!token) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Unauthorized",
                    data: null,
                    error: { code: "UNAUTHORIZED" },
                },
                { status: 401 }
            );
        }

        // 2. Verify JWT — Node.js runtime, verifyAccessToken (jsonwebtoken) is safe here
        let payload;
        try {
            payload = verifyAccessToken(token);
        } catch {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid or expired session",
                    data: null,
                    error: { code: "UNAUTHORIZED" },
                },
                { status: 401 }
            );
        }

        // 3. Confirm the token's orgId matches the requested orgId param
        const { orgId } = await params;

        if (payload.orgId !== orgId) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Access denied",
                    data: null,
                    error: { code: "FORBIDDEN" },
                },
                { status: 403 }
            );
        }

        // 4. Fetch org with live subscription plan
        // findFirst used (not findUnique) so deletedAt filter is valid
        const org = await prisma.org.findFirst({
            where: { id: orgId, deletedAt: null },
            include: {
                subscription: {
                    include: { plan: true },
                },
            },
        });

        if (!org) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Organisation not found",
                    data: null,
                    error: { code: "NOT_FOUND" },
                },
                { status: 404 }
            );
        }

        // Falls back to "free" if no subscription record exists
        const planName = org.subscription?.plan.name ?? "free";

        // 5. Return OrgContext shape — matches types/org.types.ts exactly
        return NextResponse.json(
            {
                success: true,
                message: "OK",
                data: {
                    id: org.id,
                    name: org.name,
                    slug: org.slug,
                    logo: org.logo ?? null,
                    domain: org.domain ?? null,
                    timezone: org.timezone,
                    plan: planName,
                    createdAt: org.createdAt.toISOString(),
                },
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("[ORG GET ERROR]", error);
        return NextResponse.json(
            {
                success: false,
                message: "Something went wrong. Please try again.",
                data: null,
                error: { code: "INTERNAL_ERROR" },
            },
            { status: 500 }
        );
    }
}
