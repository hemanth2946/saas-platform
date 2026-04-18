"use client";

import { cn } from "@/lib/utils";
import { typography } from "@/lib/ui";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EmptyStateProps {
    icon?:        React.ComponentType<{ size?: number; className?: string }>;
    title:        string;
    description?: string;
    action?:      React.ReactNode;
    className?:   string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * EmptyState
 *
 * Generic empty state with optional icon, description, and action slot.
 *
 * @example
 * <EmptyState
 *   icon={Users}
 *   title="No users yet"
 *   description="Invite your first team member to get started."
 *   action={<Button onClick={onInvite}>Invite user</Button>}
 * />
 */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center py-16 gap-3 text-center",
                className
            )}
        >
            {Icon && (
                <div className="w-12 h-12 rounded-full bg-[var(--color-surface-secondary)] flex items-center justify-center">
                    <Icon
                        size={24}
                        className="text-[var(--color-text-tertiary)]"
                        aria-hidden="true"
                    />
                </div>
            )}

            <p className={typography.empty.title}>{title}</p>

            {description && (
                <p className={typography.empty.body}>{description}</p>
            )}

            {action}
        </div>
    );
}
