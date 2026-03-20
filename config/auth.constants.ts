
/**
 * Authentication constants
 * Single source of truth for all auth-related configuration
 * Never hardcode these values anywhere else in the codebase
 */

export const AUTH_CONSTANTS = {
    /** Access token expiry — 15 minutes */
    ACCESS_TOKEN_EXPIRY: "15m",

    /** Refresh token expiry — 7 days */
    REFRESH_TOKEN_EXPIRY: "7d",

    /** Verify email token expiry — 48 hours in milliseconds */
    VERIFY_TOKEN_EXPIRY_MS: 48 * 60 * 60 * 1000,

    /** bcrypt salt rounds — 12 is industry standard */
    BCRYPT_SALT_ROUNDS: 12,

    /** Cookie names */
    COOKIES: {
        ACCESS_TOKEN: "access_token",
        REFRESH_TOKEN: "refresh_token",
    },

    /** Cookie options */
    COOKIE_OPTIONS: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
    },

    /** Access token cookie max age — 15 minutes in seconds */
    ACCESS_TOKEN_MAX_AGE: 15 * 60,

    /** Refresh token cookie max age — 7 days in seconds */
    REFRESH_TOKEN_MAX_AGE: 7 * 24 * 60 * 60,
} as const;