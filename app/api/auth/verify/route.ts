import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { verifyEmailSchema } from "@/lib/validations/auth.schema";

/**
 * GET /api/auth/verify?token=xxx
 * Verifies user email using token sent in verification email
 * Marks user as verified and clears the token
 *
 * @returns 200 if verified successfully
 * @returns 400 if token is missing or invalid
 * @returns 410 if token has expired
 */
export async function GET(req: NextRequest) {
    try {
        // 1. Get token from query params
        const { searchParams } = new URL(req.url);
        const parsed = verifyEmailSchema.safeParse({
            token: searchParams.get("token"),
        });

        if (!parsed.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid verification token",
                    data: null,
                    error: { code: "VALIDATION_ERROR" },
                },
                { status: 400 }
            );
        }

        // 2. Find user with this token
        const user = await prisma.user.findUnique({
            where: { verifyToken: parsed.data.token },
        });

        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid or already used verification link",
                    data: null,
                    error: { code: "NOT_FOUND" },
                },
                { status: 400 }
            );
        }

        // 3. Check token expiry
        if (!user.verifyTokenExp || user.verifyTokenExp < new Date()) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Verification link has expired. Please request a new one.",
                    data: null,
                    error: { code: "VALIDATION_ERROR" },
                },
                { status: 410 }
            );
        }

        // 4. Mark user as verified + clear token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                isVerified: true,
                verifyToken: null,
                verifyTokenExp: null,
            },
        });

        // 5. Return success
        return NextResponse.json(
            {
                success: true,
                message: "Email verified successfully. You can now log in.",
                data: null,
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("[VERIFY EMAIL ERROR]", error);
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