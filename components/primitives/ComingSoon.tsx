"use client";

import {
    Construction,
    CreditCard,
    Settings,
    ClipboardList,
    Bot,
    ScanSearch,
    type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { typography } from "@/lib/ui";

const ICON_MAP: Record<string, LucideIcon> = {
    construction:    Construction,
    "credit-card":   CreditCard,
    settings:        Settings,
    "clipboard-list": ClipboardList,
    bot:             Bot,
    "scan-search":   ScanSearch,
};

export type ComingSoonIcon = keyof typeof ICON_MAP;

interface ComingSoonProps {
    title:        string;
    description?: string;
    icon?:        ComingSoonIcon;
}

/**
 * ComingSoon
 *
 * Full-page placeholder for routes that are under development.
 * Accepts an icon name string (serializable) so it can be used from
 * Server Component pages without crossing the server/client boundary.
 */
export function ComingSoon({
    title,
    description = "This feature is under development and will be available in a future release.",
    icon = "construction",
}: ComingSoonProps) {
    const Icon = ICON_MAP[icon] ?? Construction;

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--color-surface-secondary)] mb-6">
                <Icon
                    className="w-8 h-8 text-[var(--color-text-tertiary)]"
                    aria-hidden="true"
                />
            </div>

            <h1 className={cn(typography.heading.section, "mb-2")}>
                {title}
            </h1>

            <p className={cn(typography.body.muted, "max-w-sm")}>
                {description}
            </p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--color-surface-secondary)] px-4 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-status-warning-text)] animate-pulse" />
                <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                    Under Development
                </span>
            </div>
        </div>
    );
}
