import { Resend } from "resend";

// ============================================
// CONSTANTS
// ============================================

const FROM_EMAIL = process.env.FROM_EMAIL ?? "onboarding@resend.dev";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ============================================
// RESEND CLIENT — lazy initialization
// Not created at import time — only when sending email
// Safe at Vercel build time — no API key needed during build
// ============================================

/**
 * Gets Resend client lazily
 * Only instantiated when actually sending an email
 *
 * @throws {Error} If RESEND_API_KEY is not defined at runtime
 */
function getResendClient(): Resend {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY is not defined in environment");
    return new Resend(apiKey);
}

// ============================================
// EMAIL SENDERS
// ============================================

/**
 * Sends an email verification link to a newly registered user
 * Link expires in 48 hours
 *
 * @param email - Recipient email address
 * @param token - Unique verification token stored in DB
 * @returns Promise resolving when email is sent
 * @throws {Error} If RESEND_API_KEY is not defined
 * @throws {Error} If Resend API call fails
 *
 * @example
 * await sendVerificationEmail('user@example.com', 'abc123token')
 */
export async function sendVerificationEmail(
    email: string,
    token: string
): Promise<void> {
    const verifyUrl = `${APP_URL}/verify-email?token=${token}`;

    await getResendClient().emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: "Verify your email address",
        html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Verify your email</h2>
        <p>Click the button below to verify your email address. This link expires in 48 hours.</p>
        
          href="${verifyUrl}"
          style="display:inline-block;padding:12px 24px;background:#000;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;"
        >
          Verify Email
        </a>
        <p style="margin-top:24px;color:#666;font-size:13px;">
          If you did not create an account, you can safely ignore this email.
        </p>
      </div>
    `,
    });
}

/**
 * Sends a password reset link to a user
 * Link expires in 1 hour
 *
 * @param email - Recipient email address
 * @param token - Unique reset token stored in DB
 * @returns Promise resolving when email is sent
 * @throws {Error} If RESEND_API_KEY is not defined
 * @throws {Error} If Resend API call fails
 *
 * @example
 * await sendPasswordResetEmail('user@example.com', 'resettoken123')
 */
export async function sendPasswordResetEmail(
    email: string,
    token: string
): Promise<void> {
    const resetUrl = `${APP_URL}/reset-password?token=${token}`;

    await getResendClient().emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: "Reset your password",
        html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Reset your password</h2>
        <p>Click the button below to reset your password. This link expires in 1 hour.</p>
        
          href="${resetUrl}"
          style="display:inline-block;padding:12px 24px;background:#000;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;"
        >
          Reset Password
        </a>
        <p style="margin-top:24px;color:#666;font-size:13px;">
          If you did not request a password reset, you can safely ignore this email.
        </p>
      </div>
    `,
    });
}