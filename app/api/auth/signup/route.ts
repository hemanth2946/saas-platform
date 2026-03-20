import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/server/db";
import { hashPassword } from "@/server/auth/password";
import { generateAccessToken, generateRefreshToken, buildAuthCookies } from "@/server/auth/jwt";
import { sendVerificationEmail } from "@/server/auth/email";
import { signupSchema } from "@/lib/validations/auth.schema";
import { AUTH_CONSTANTS } from "@/config/auth.constants";
import type { ApiResponse } from "@/types";

/**
 * POST /api/auth/signup
 * Creates a new organisation + user + default role + org membership
 * Sends verification email after successful registration
 *
 * @returns 201 with user + org data and auth cookies set
 * @returns 400 if validation fails
 * @returns 409 if email already exists
 * @returns 500 on server error
 */
export async function POST(req: NextRequest) {
    try {
        // 1. Parse + validate request body
        const body = await req.json();
        const parsed = signupSchema.safeParse(body);

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

        const { name, email, password, orgName } = parsed.data;

        // 2. Check if email already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json(
                {
                    success: false,
                    message: "An account with this email already exists",
                    data: null,
                    error: { code: "CONFLICT" },
                },
                { status: 409 }
            );
        }

        // 3. Hash password
        const hashedPassword = await hashPassword(password);

        // 4. Generate email verification token
        const verifyToken = crypto.randomBytes(32).toString("hex");
        const verifyTokenExp = new Date(
            Date.now() + AUTH_CONSTANTS.VERIFY_TOKEN_EXPIRY_MS
        );

        // 5. Create org slug from org name
        const slug = orgName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");

        // 6. Check slug uniqueness
        const existingOrg = await prisma.org.findUnique({ where: { slug } });
        const finalSlug = existingOrg
            ? `${slug}-${crypto.randomBytes(4).toString("hex")}`
            : slug;

        // 7. Create everything in one transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create org
            const org = await tx.org.create({
                data: {
                    name: orgName,
                    slug: finalSlug,
                    createdById: "temp", // updated below after user creation
                },
            });

            // Create user
            const user = await tx.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    verifyToken,
                    verifyTokenExp,
                    isVerified: false,
                },
            });

            // Update org createdById
            await tx.org.update({
                where: { id: org.id },
                data: { createdById: user.id },
            });

            // Create default super_admin role for this org
            const role = await tx.role.create({
                data: {
                    name: "super_admin",
                    orgId: org.id,
                    isDefault: false,
                    permissions: [
                        "dashboard.view",
                        "dashboard.edit",
                        "iam.view",
                        "iam.invite",
                        "iam.remove",
                        "iam.role.assign",
                        "billing.view",
                        "billing.manage",
                        "settings.view",
                        "settings.edit",
                    ],
                },
            });

            // Create org membership
            const member = await tx.orgMember.create({
                data: {
                    userId: user.id,
                    orgId: org.id,
                    roleId: role.id,
                    status: "active",
                },
            });

            // Create free plan subscription
            const freePlan = await tx.plan.findFirst({
                where: { name: "free" },
            });

            if (freePlan) {
                await tx.subscription.create({
                    data: {
                        orgId: org.id,
                        planId: freePlan.id,
                        status: "active",
                    },
                });
            }

            return { user, org, role, member };
        });

        // 8. Send verification email
        await sendVerificationEmail(email, verifyToken);

        // 9. Generate tokens
        const accessToken = generateAccessToken({
            userId: result.user.id,
            email: result.user.email,
            orgId: result.org.id,
            role: "super_admin",
            permissions: [
                "dashboard.view",
                "dashboard.edit",
                "iam.view",
                "iam.invite",
                "iam.remove",
                "iam.role.assign",
                "billing.view",
                "billing.manage",
                "settings.view",
                "settings.edit",
            ],
        });

        const refreshToken = generateRefreshToken({
            userId: result.user.id,
            orgId: result.org.id,
        });

        // 10. Build response with cookies
        const cookies = buildAuthCookies(accessToken, refreshToken);
        const response = NextResponse.json(
            {
                success: true,
                message: "Account created successfully. Please verify your email.",
                data: {
                    user: {
                        id: result.user.id,
                        name: result.user.name,
                        email: result.user.email,
                        isVerified: result.user.isVerified,
                        role: "super_admin",
                    },
                    org: {
                        id: result.org.id,
                        name: result.org.name,
                        slug: result.org.slug,
                    },
                },
            } satisfies ApiResponse<unknown>,
            { status: 201 }
        );

        cookies.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
        return response;

    } catch (error) {
        console.error("[SIGNUP ERROR]", error);
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