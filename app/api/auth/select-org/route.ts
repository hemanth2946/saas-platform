import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import {
    verifyAccessToken,
    generateAccessToken,
    generateRefreshToken,
    buildAuthCookies,
} from "@/server/auth/jwt";
import { AUTH_CONSTANTS } from "@/config/auth.constants";
import type { UserRole, OrgPlanSummary } from "@/types";
import { z } from "zod";

const selectOrgSchema = z.object({
    orgId: z.string().min(1, "orgId is required"),
});

/**
 * POST /api/auth/select-org
 *
 * Scopes the authenticated session to a specific organisation.
 * Verifies the user belongs to the org, fetches full org + plan,
 * then issues a new JWT with orgId included.
 *
 * @returns 200 { org: OrgContext, plan: PlanConfig }
 * @returns 400 if orgId missing or invalid
 * @returns 401 if not authenticated
 * @returns 403 if user is not a member of this org
 * @returns 500 on server error
 */
export async function POST(req: NextRequest) {
    try {
        // 1. Verify the caller is authenticated (has a valid access token cookie)
        const accessTokenCookie = req.cookies.get(AUTH_CONSTANTS.COOKIES.ACCESS_TOKEN);
        if (!accessTokenCookie?.value) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Authentication required",
                    data: null,
                    error: { code: "UNAUTHORIZED" },
                },
                { status: 401 }
            );
        }

        let jwtPayload;
        try {
            jwtPayload = verifyAccessToken(accessTokenCookie.value);
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

        const userId = jwtPayload.userId;

        // 2. Parse + validate request body
        const body = await req.json();
        const parsed = selectOrgSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Validation failed",
                    data: null,
                    error: {
                        code: "VALIDATION_ERROR",
                        fieldErrors: parsed.error.flatten().fieldErrors,
                    },
                },
                { status: 400 }
            );
        }

        const { orgId } = parsed.data;

        // 3. Verify user is an active member of this org
        const membership = await prisma.orgMember.findFirst({
            where: {
                userId,
                orgId,
                status: "active",
                deletedAt: null,
            },
            include: {
                org: {
                    include: {
                        subscription: {
                            include: { plan: true },
                        },
                    },
                },
                role: true,
            },
        });

        if (!membership) {
            return NextResponse.json(
                {
                    success: false,
                    message: "You do not have access to this organization",
                    data: null,
                    error: { code: "FORBIDDEN" },
                },
                { status: 403 }
            );
        }

        const { org, role } = membership;

        // 4. Build plan summary from subscription
        const subscription = org.subscription;
        const rawPlan = subscription?.plan;
        const planConfig: OrgPlanSummary = {
            plan:     (rawPlan?.name ?? "free") as OrgPlanSummary["plan"],
            features: {},
            limits:   {},
            quotas:   {},
        };

        // 5. Issue a new org-scoped access token
        const permissions = role.permissions as string[];
        const newAccessToken = generateAccessToken({
            userId,
            email: jwtPayload.email,
            orgId: org.id,
            role: role.name as UserRole,
            permissions,
        });

        const newRefreshToken = generateRefreshToken({
            userId,
            orgId: org.id,
        });

        // 6. Build org context response
        const orgContext = {
            id: org.id,
            name: org.name,
            slug: org.slug,
            logo: org.logo ?? null,
            domain: org.domain ?? null,
            timezone: org.timezone,
            plan: planConfig.plan,
            createdAt: org.createdAt.toISOString(),
        };

        // 7. Return new cookies + org + plan data
        const cookies = buildAuthCookies(newAccessToken, newRefreshToken);
        const response = NextResponse.json(
            {
                success: true,
                message: "Organisation selected",
                data: {
                    org: orgContext,
                    plan: planConfig,
                },
            },
            { status: 200 }
        );

        cookies.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
        return response;

    } catch (error) {
        console.error("[SELECT-ORG ERROR]", error);
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
