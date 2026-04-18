import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { logger } from "@/lib/api/core/logger";

type RouteParams = { params: Promise<{ token: string }> };

/**
 * GET /api/v1/invite/:token
 *
 * PUBLIC ROUTE — no auth required.
 * Validates an invite token and returns safe invite details.
 * Used by the /invite/[token] accept page to pre-populate the form.
 *
 * @returns 200 { email, orgName, orgLogo, expiresAt }
 * @returns 404 INVITE_NOT_FOUND
 * @returns 409 INVITE_ALREADY_ACCEPTED
 * @returns 410 INVITE_EXPIRED
 */
export async function GET(_req: NextRequest, { params }: RouteParams) {
    const { token } = await params;

    try {
        const invite = await prisma.invite.findUnique({
            where:   { token },
            include: { org: { select: { name: true, logo: true } } },
        });

        if (!invite) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invite link is invalid",
                    data:    null,
                    error:   { code: "NOT_FOUND", reason: "INVITE_NOT_FOUND" },
                },
                { status: 404 }
            );
        }

        if (invite.acceptedAt !== null) {
            return NextResponse.json(
                {
                    success: false,
                    message: "This invite has already been accepted",
                    data:    null,
                    error:   { code: "CONFLICT", reason: "INVITE_ALREADY_ACCEPTED" },
                },
                { status: 409 }
            );
        }

        if (invite.expiresAt < new Date()) {
            return NextResponse.json(
                {
                    success: false,
                    message: "This invite has expired. Contact your admin.",
                    data:    null,
                    error:   { code: "VALIDATION_ERROR", reason: "INVITE_EXPIRED" },
                },
                { status: 410 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: "Invite is valid",
                data:    {
                    email:     invite.email,
                    orgName:   invite.org.name,
                    orgLogo:   invite.org.logo,
                    expiresAt: invite.expiresAt.toISOString(),
                },
            },
            { status: 200 }
        );

    } catch (error) {
        logger.error("[INVITE GET] Failed to validate invite", { token, error });
        return NextResponse.json(
            { success: false, message: "Failed to validate invite", data: null, error: { code: "INTERNAL_ERROR" } },
            { status: 500 }
        );
    }
}
