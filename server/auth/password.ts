import bcrypt from "bcryptjs";
import { AUTH_CONSTANTS } from "@/config/auth.constants";

/**
 * Hashes a plain text password using bcrypt
 * Uses 12 salt rounds — industry standard for security/performance balance
 *
 * @param plainPassword - The raw password string from user input
 * @returns Promise resolving to bcrypt hashed string
 *
 * @example
 * const hashed = await hashPassword('mySecurePassword123')
 * // store hashed in DB, never store plainPassword
 */
export async function hashPassword(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, AUTH_CONSTANTS.BCRYPT_SALT_ROUNDS);
}

/**
 * Compares a plain text password against a bcrypt hash
 *
 * @param plainPassword - Raw password from login form
 * @param hashedPassword - Bcrypt hash stored in database
 * @returns Promise resolving to true if match, false otherwise
 *
 * @example
 * const isMatch = await comparePassword('myPassword', user.password)
 * if (!isMatch) throw new Error('Invalid credentials')
 */
export async function comparePassword(
    plainPassword: string,
    hashedPassword: string
): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
}