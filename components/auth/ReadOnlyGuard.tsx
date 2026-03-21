"use client";

import { useReadOnly } from "@/hooks/useReadOnly";

type ReadOnlyGuardProps = {
    children: React.ReactNode;
    /**
     * What to render when subscription has expired (read-only mode).
     * Defaults to null (hides the children entirely).
     * Common use: render a disabled version of the button/form.
     */
    fallback?: React.ReactNode;
};

/**
 * Wraps any write-action UI element.
 * When the org's subscription has expired → renders fallback (or null).
 * When subscription is active → renders children normally.
 *
 * This is about subscription expiry, NOT permissions.
 * For permission checks, use <Guard> instead.
 *
 * @example
 * // Hide entirely when read-only
 * <ReadOnlyGuard>
 *   <SaveButton />
 * </ReadOnlyGuard>
 *
 * // Show disabled state when read-only
 * <ReadOnlyGuard fallback={<Button disabled>Save (subscription expired)</Button>}>
 *   <Button>Save</Button>
 * </ReadOnlyGuard>
 */
export function ReadOnlyGuard({ children, fallback = null }: ReadOnlyGuardProps) {
    const isReadOnly = useReadOnly();
    return isReadOnly ? <>{fallback}</> : <>{children}</>;
}
