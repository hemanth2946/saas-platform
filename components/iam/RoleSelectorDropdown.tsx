"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { typography, spacing } from "@/lib/ui";
import { useRoles } from "@/hooks/useIAM";
import type { RoleRecord } from "@/types";

// ── Types ─────────────────────────────────────────────────────────────────────

interface RoleSelectorDropdownProps {
    value:    string[];
    onChange: (ids: string[]) => void;
}

// ── RoleCard sub-component ───────────────────────────────────────────────────

interface RoleCardProps {
    role:     RoleRecord;
    selected: boolean;
    onToggle: () => void;
}

function RoleCard({ role, selected, onToggle }: RoleCardProps) {
    return (
        <button
            type="button"
            onClick={onToggle}
            className={cn(
                "w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left",
                "min-h-[var(--min-touch-target)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]",
                "transition-colors",
                selected
                    ? "bg-[var(--color-surface-secondary)] border border-[var(--color-border-strong)]"
                    : "hover:bg-[var(--color-surface-secondary)] border border-transparent"
            )}
            aria-pressed={selected}
        >
            {/* Checkbox indicator */}
            <span
                className={cn(
                    "mt-0.5 flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center",
                    selected
                        ? "border-[var(--color-border-focus)] bg-[var(--color-surface-brand)]"
                        : "border-[var(--color-border-default)]"
                )}
                aria-hidden="true"
            >
                {selected && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
            </span>

            <span className="flex flex-col gap-0.5 min-w-0">
                <span className={typography.label.default}>{role.name}</span>
                {role.description && (
                    <span className={cn(typography.body.subtle, "truncate")}>
                        {role.description}
                    </span>
                )}
            </span>
        </button>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

/**
 * RoleSelectorDropdown
 *
 * Two-tab role selector: Quick Roles and Service-Based Roles.
 * Supports multi-select with filter input.
 */
export function RoleSelectorDropdown({ value, onChange }: RoleSelectorDropdownProps) {
    const [open, setOpen]               = useState(false);
    const [activeTab, setActiveTab]     = useState<"quick" | "service">("quick");
    const [filter, setFilter]           = useState("");
    const [selectedService, setSelectedService] = useState<string | null>(null);

    const { quickRoles, serviceBased, isLoading } = useRoles();
    const containerRef = useRef<HTMLDivElement>(null);

    // Auto-select first service when tab opens
    useEffect(() => {
        if (activeTab === "service" && serviceBased.length > 0 && !selectedService) {
            setSelectedService(serviceBased[0]?.serviceKey ?? null);
        }
    }, [activeTab, serviceBased, selectedService]);

    // Close on outside click
    useEffect(() => {
        function handleOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        if (open) document.addEventListener("mousedown", handleOutside);
        return () => document.removeEventListener("mousedown", handleOutside);
    }, [open]);

    const toggleRole = useCallback((roleId: string) => {
        onChange(
            value.includes(roleId)
                ? value.filter((id) => id !== roleId)
                : [...value, roleId]
        );
    }, [value, onChange]);

    function matchesFilter(role: RoleRecord): boolean {
        if (!filter.trim()) return true;
        const lower = filter.toLowerCase();
        return (
            role.name.toLowerCase().includes(lower) ||
            (role.description?.toLowerCase().includes(lower) ?? false) ||
            role.permissions.some((p) => p.toLowerCase().includes(lower))
        );
    }

    const selectedServiceGroup = serviceBased.find(
        (g) => g.serviceKey === selectedService
    ) ?? serviceBased[0] ?? null;

    const selectedCount = value.length;

    return (
        <div ref={containerRef} className="relative w-full">
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={cn(
                    "w-full flex items-center justify-between",
                    "px-3 py-2 rounded-lg border min-h-[var(--min-touch-target)]",
                    "bg-[var(--color-surface-primary)] border-[var(--color-border-default)]",
                    "hover:border-[var(--color-border-strong)] focus-visible:outline-none",
                    "focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]",
                    "transition-colors"
                )}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span className={selectedCount > 0 ? typography.body.default : typography.body.muted}>
                    {selectedCount > 0 ? `${selectedCount} role(s) selected` : "Select a role"}
                </span>
                {open
                    ? <ChevronUp size={16} aria-hidden="true" className="flex-shrink-0 text-[var(--color-text-secondary)]" />
                    : <ChevronDown size={16} aria-hidden="true" className="flex-shrink-0 text-[var(--color-text-secondary)]" />
                }
            </button>

            {/* Dropdown panel */}
            {open && (
                <div
                    className={cn(
                        "absolute z-50 mt-1 w-full min-w-80 rounded-xl border shadow-lg",
                        "bg-[var(--color-surface-primary)] border-[var(--color-border-default)]",
                        "overflow-hidden"
                    )}
                    role="listbox"
                    aria-multiselectable="true"
                >
                    {/* Filter bar */}
                    <div className={cn("p-2 border-b border-[var(--color-border-default)]")}>
                        <div className="relative flex items-center">
                            <Filter
                                size={14}
                                className="absolute left-2.5 text-[var(--color-text-tertiary)] pointer-events-none"
                                aria-hidden="true"
                            />
                            <input
                                type="text"
                                placeholder="Search by role or permission"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className={cn(
                                    "w-full pl-8 pr-3 py-1.5 rounded-lg text-sm",
                                    "bg-[var(--color-surface-secondary)] border border-[var(--color-border-default)]",
                                    "focus:outline-none focus:ring-1 focus:ring-[var(--color-border-focus)]",
                                    typography.body.default
                                )}
                            />
                        </div>
                    </div>

                    {/* Tab bar */}
                    <div className="flex border-b border-[var(--color-border-default)]">
                        {(["quick", "service"] as const).map((tab) => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "flex-1 px-4 py-2 text-sm font-medium transition-colors",
                                    "focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-1 focus-visible:ring-[var(--color-border-focus)]",
                                    activeTab === tab
                                        ? "border-b-2 border-[var(--color-text-link)] text-[var(--color-text-link)]"
                                        : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                                )}
                            >
                                {tab === "quick" ? "Quick Roles" : "Service-Based Roles"}
                            </button>
                        ))}
                    </div>

                    {isLoading ? (
                        <div className="px-4 py-6 text-center">
                            <span className={typography.body.muted}>Loading roles…</span>
                        </div>
                    ) : (
                        <>
                            {/* Quick Roles tab */}
                            {activeTab === "quick" && (
                                <div className="p-2 max-h-64 overflow-y-auto space-y-0.5">
                                    <p className={cn(typography.nav.section, "px-2 pb-1")}>
                                        QUICK ROLES
                                    </p>
                                    {quickRoles
                                        .filter(matchesFilter)
                                        .map((role) => (
                                            <RoleCard
                                                key={role.id}
                                                role={role}
                                                selected={value.includes(role.id)}
                                                onToggle={() => toggleRole(role.id)}
                                            />
                                        ))
                                    }
                                    {quickRoles.filter(matchesFilter).length === 0 && (
                                        <p className={cn(typography.body.muted, "px-2 py-3 text-center")}>
                                            No roles match your search
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Service-Based Roles tab */}
                            {activeTab === "service" && (
                                <div className="grid grid-cols-2 divide-x divide-[var(--color-border-default)]" style={{ minHeight: "200px" }}>
                                    {/* Left: services list */}
                                    <div className="p-2 max-h-64 overflow-y-auto space-y-0.5">
                                        <p className={cn(typography.nav.section, "px-2 pb-1")}>SERVICES</p>
                                        {serviceBased.map((group) => (
                                            <button
                                                key={group.serviceKey}
                                                type="button"
                                                onClick={() => setSelectedService(group.serviceKey)}
                                                className={cn(
                                                    "w-full text-left px-3 py-2 rounded-lg min-h-[var(--min-touch-target)]",
                                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]",
                                                    "transition-colors",
                                                    selectedService === group.serviceKey
                                                        ? "bg-[var(--color-surface-secondary)] font-medium"
                                                        : "hover:bg-[var(--color-surface-secondary)]"
                                                )}
                                            >
                                                <span className={typography.body.default}>
                                                    {group.serviceName}
                                                </span>
                                            </button>
                                        ))}
                                        {serviceBased.length === 0 && (
                                            <p className={cn(typography.body.muted, "px-2 py-3 text-center")}>
                                                No services available
                                            </p>
                                        )}
                                    </div>

                                    {/* Right: roles for selected service */}
                                    <div className="p-2 max-h-64 overflow-y-auto space-y-0.5">
                                        {selectedServiceGroup ? (
                                            <>
                                                <p className={cn(typography.nav.section, "px-2 pb-0.5")}>
                                                    {selectedServiceGroup.serviceName.toUpperCase()} ROLES
                                                </p>
                                                <p className={cn(typography.body.subtle, "px-2 pb-1")}>
                                                    {selectedServiceGroup.description}
                                                </p>
                                                {selectedServiceGroup.roles
                                                    .filter(matchesFilter)
                                                    .map((role) => (
                                                        <RoleCard
                                                            key={role.id}
                                                            role={role}
                                                            selected={value.includes(role.id)}
                                                            onToggle={() => toggleRole(role.id)}
                                                        />
                                                    ))
                                                }
                                                {selectedServiceGroup.roles.filter(matchesFilter).length === 0 && (
                                                    <p className={cn(typography.body.muted, "px-2 py-3 text-center")}>
                                                        No roles match your search
                                                    </p>
                                                )}
                                            </>
                                        ) : (
                                            <p className={cn(typography.body.muted, "px-2 py-4 text-center")}>
                                                Select a service
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
