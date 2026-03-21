import jwt from "jsonwebtoken";
import { AUTH_CONSTANTS } from "@/config/auth.constants";
import type { UserRole } from "@/types";

// ============================================
// TYPES
// ============================================

/** Payload encoded inside every JWT */
export type JwtPayload = {
    userId: string;
    email: string;
    /**
     * Empty string "" means user is authenticated but has not yet selected an org.
     * Populated after POST /api/auth/select-org issues a new org-scoped token.
     */
    orgId: string;
    role: UserRole | "";
    permissions: string[];
};

/** Payload stored in refresh token — minimal data */
export type RefreshTokenPayload = {
    userId: string;
    orgId: string;
};

// ============================================
// HELPERS
// ============================================

/**
 * Gets the JWT secret from environment variables
 *
 * @throws {Error} If JWT_SECRET is not defined
 * @returns JWT secret string
 */
function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET is not defined in environment");
    return secret;
}

/**
 * Gets the JWT refresh secret from environment variables
 *
 * @throws {Error} If JWT_REFRESH_SECRET is not defined
 * @returns JWT refresh secret string
 */
function getJwtRefreshSecret(): string {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) throw new Error("JWT_REFRESH_SECRET is not defined in environment");
    return secret;
}

// ============================================
// TOKEN GENERATION
// ============================================

/**
 * Generates a signed JWT access token
 *
 * @param payload - User data to encode in the token
 * @returns Signed JWT string valid for 15 minutes
 * @throws {Error} If JWT_SECRET is not defined
 *
 * @example
 * const token = generateAccessToken({
 *   userId: '123',
 *   email: 'user@example.com',
 *   orgId: 'org_123',
 *   role: 'admin',
 *   permissions: ['dashboard.view', 'iam.invite']
 * })
 */
export function generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, getJwtSecret(), {
        expiresIn: AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRY,
    });
}

/**
 * Generates a signed JWT refresh token
 * Contains minimal data — only userId and orgId
 *
 * @param payload - Minimal user data for refresh token
 * @returns Signed JWT string valid for 7 days
 * @throws {Error} If JWT_REFRESH_SECRET is not defined
 *
 * @example
 * const token = generateRefreshToken({ userId: '123', orgId: 'org_123' })
 */
export function generateRefreshToken(payload: RefreshTokenPayload): string {
    return jwt.sign(payload, getJwtRefreshSecret(), {
        expiresIn: AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRY,
    });
}

// ============================================
// TOKEN VERIFICATION
// ============================================

/**
 * Verifies and decodes a JWT access token
 *
 * @param token - JWT string to verify
 * @returns Decoded payload if valid
 * @throws {jwt.JsonWebTokenError} If token is invalid
 * @throws {jwt.TokenExpiredError} If token has expired
 *
 * @example
 * try {
 *   const payload = verifyAccessToken(token)
 *   console.log(payload.userId)
 * } catch (err) {
 *   // handle invalid/expired token
 * }
 */
export function verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, getJwtSecret()) as JwtPayload;
}

/**
 * Verifies and decodes a JWT refresh token
 *
 * @param token - JWT refresh string to verify
 * @returns Decoded refresh payload if valid
 * @throws {jwt.JsonWebTokenError} If token is invalid
 * @throws {jwt.TokenExpiredError} If token has expired
 *
 * @example
 * try {
 *   const payload = verifyRefreshToken(token)
 *   console.log(payload.userId)
 * } catch (err) {
 *   // handle invalid/expired token
 * }
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
    return jwt.verify(token, getJwtRefreshSecret()) as RefreshTokenPayload;
}

// ============================================
// COOKIE HELPERS
// ============================================

/**
 * Returns cookie header strings for access + refresh tokens
 * Used in API route responses to set httpOnly cookies
 *
 * @param accessToken - Signed JWT access token
 * @param refreshToken - Signed JWT refresh token
 * @returns Array of Set-Cookie header values
 *
 * @example
 * const cookies = buildAuthCookies(accessToken, refreshToken)
 * cookies.forEach(c => headers.append('Set-Cookie', c))
 */
export function buildAuthCookies(
    accessToken: string,
    refreshToken: string
): string[] {
    const base = `HttpOnly; Path=/; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""
        }`;

    return [
        `${AUTH_CONSTANTS.COOKIES.ACCESS_TOKEN}=${accessToken}; Max-Age=${AUTH_CONSTANTS.ACCESS_TOKEN_MAX_AGE}; ${base}`,
        `${AUTH_CONSTANTS.COOKIES.REFRESH_TOKEN}=${refreshToken}; Max-Age=${AUTH_CONSTANTS.REFRESH_TOKEN_MAX_AGE}; ${base}`,
    ];
}

/**
 * Returns cookie header strings that clear auth cookies
 * Used in logout API route
 *
 * @returns Array of Set-Cookie header values that expire cookies
 *
 * @example
 * const cookies = buildClearAuthCookies()
 * cookies.forEach(c => headers.append('Set-Cookie', c))
 */
export function buildClearAuthCookies(): string[] {
    const base = `HttpOnly; Path=/; SameSite=Lax; Max-Age=0`;
    return [
        `${AUTH_CONSTANTS.COOKIES.ACCESS_TOKEN}=; ${base}`,
        `${AUTH_CONSTANTS.COOKIES.REFRESH_TOKEN}=; ${base}`,
    ];
}
