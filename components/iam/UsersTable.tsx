"use client";

import React, { useState, useCallback } from "react";
import { format } from "date-fns";
import {
    ChevronUp, ChevronRight,
    CheckCircle, XCircle, RefreshCw, MoreHorizontal, Users,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { typography, spacing } from "@/lib/ui";
import { userStatusVariants } from "@/features/iam/constants/iam.variants";
import { useUsers, useUpdateUser, useRemoveUser } from "@/hooks/useIAM";
import { Guard } from "@/components/auth/Guard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton-table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Grid, Divider } from "@/components/primitives";
import { ChangeRolesModal } from "@/components/iam/ChangeRolesModal";
import type { IAMUser } from "@/types";

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: IAMUser["status"] }) {
    const variant = userStatusVariants[status] ?? userStatusVariants.pending;
    return (
        <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium", variant.className)}>
            <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", variant.dot)} aria-hidden="true" />
            {variant.label}
        </span>
    );
}

// ── Error state ───────────────────────────────────────────────────────────────

function ErrorState({ onRetry }: { onRetry: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center" role="alert">
            <p className={typography.empty.title}>Failed to load users</p>
            <p className={typography.empty.body}>Check your connection and try again</p>
            <Button variant="outline" size="sm" onClick={onRetry} className="mt-1">
                Retry
            </Button>
        </div>
    );
}

// ── Expanded row ──────────────────────────────────────────────────────────────

function ExpandedRow({ user }: { user: IAMUser }) {
    const allPermissions = Array.from(
        new Set(user.roles.flatMap((r) => r.permissions))
    );

    const lastAccessFormatted = user.lastLogin
        ? format(new Date(user.lastLogin), "EEE MMM dd yyyy")
        : "—";
    const invitedOnFormatted = user.invitedAt
        ? format(new Date(user.invitedAt), "EEE MMM dd yyyy")
        : "—";

    return (
        <tr>
            <td colSpan={6} className="px-4 pb-4 pt-0">
                <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-secondary)] p-4">
                    <Grid cols={2} gap="lg">
                        {/* Left — Roles (permissions) */}
                        <div className={cn("flex flex-col", spacing.gapSm)}>
                            <p className={typography.heading.panel}>Roles</p>
                            <Divider spacing="sm" />
                            {allPermissions.length > 0 ? (
                                <ul className="space-y-1">
                                    {allPermissions.map((p) => (
                                        <li key={p} className={typography.body.sm}>{p}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className={typography.body.muted}>No permissions assigned</p>
                            )}
                        </div>

                        {/* Right — User Attributes */}
                        <div className={cn("flex flex-col", spacing.gapSm)}>
                            <p className={typography.heading.panel}>User Attributes</p>
                            <Divider spacing="sm" />
                            <dl className="space-y-2">
                                <div className="flex justify-between">
                                    <dt className={typography.label.muted}>Last Access</dt>
                                    <dd className={typography.ui.timestamp}>{lastAccessFormatted}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className={typography.label.muted}>Status</dt>
                                    <dd><StatusBadge status={user.status} /></dd>
                                </div>
                                <div className="flex justify-between items-center">
                                    <dt className={typography.label.muted}>Invitation Accepted</dt>
                                    <dd className="flex items-center gap-1">
                                        {user.invitationAccepted ? (
                                            <>
                                                <CheckCircle size={14} className="text-[var(--color-text-success)]" aria-hidden="true" />
                                                <span className={cn(typography.body.sm, "text-[var(--color-text-success)]")}>Yes</span>
                                            </>
                                        ) : (
                                            <>
                                                <XCircle size={14} className="text-[var(--color-text-error)]" aria-hidden="true" />
                                                <span className={cn(typography.body.sm, "text-[var(--color-text-error)]")}>No</span>
                                            </>
                                        )}
                                    </dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className={typography.label.muted}>Invited On</dt>
                                    <dd className={typography.ui.timestamp}>{invitedOnFormatted}</dd>
                                </div>
                            </dl>
                        </div>
                    </Grid>
                </div>
            </td>
        </tr>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

interface UsersTableProps {
    onInvite?: () => void;
}

/**
 * UsersTable
 *
 * Full IAM users table with expandable rows, search, and actions.
 */
export function UsersTable({ onInvite }: UsersTableProps) {
    const [search, setSearch]               = useState("");
    const [expandedIds, setExpandedIds]     = useState<Set<string>>(new Set());
    const [suspendTarget, setSuspendTarget] = useState<IAMUser | null>(null);
    const [removeTarget, setRemoveTarget]   = useState<IAMUser | null>(null);
    const [changeRolesUser, setChangeRolesUser] = useState<IAMUser | null>(null);

    const { users, isLoading, isError, refetch } = useUsers(
        search ? { search } : undefined
    );

    const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();
    const { mutate: removeUser, isPending: isRemoving } = useRemoveUser();

    const toggleExpand = useCallback((id: string) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    function handleSuspend(user: IAMUser) {
        const isSuspended = user.status === "suspended";
        updateUser(
            { userId: user.id, data: { status: isSuspended ? "ACTIVE" : "SUSPENDED" } },
            {
                onSuccess: () => {
                    toast.success(isSuspended ? "User unsuspended" : "User suspended");
                    setSuspendTarget(null);
                },
            }
        );
    }

    function handleRemove(userId: string) {
        removeUser(userId, {
            onSuccess: () => {
                toast.success("User removed from organization");
                setRemoveTarget(null);
            },
        });
    }

    return (
        <div className={cn("flex flex-col", spacing.gapMd)}>
            {/* Top bar */}
            <div className="flex items-center justify-between gap-3">
                <Input
                    type="search"
                    placeholder="Search IAM Users"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                    aria-label="Search IAM users"
                />
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => void refetch()}
                    aria-label="Refresh users list"
                    className="min-h-[var(--min-touch-target)] min-w-[var(--min-touch-target)]"
                >
                    <RefreshCw size={16} aria-hidden="true" />
                </Button>
            </div>

            {/* Table */}
            {isLoading ? (
                <SkeletonTable />
            ) : isError ? (
                <ErrorState onRetry={refetch} />
            ) : users.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title="No users yet"
                    description="Invite your first team member to get started"
                    action={
                        onInvite
                            ? <Button variant="outline" size="sm" onClick={onInvite} className="mt-1">Invite user</Button>
                            : undefined
                    }
                />
            ) : (
                <div className="rounded-xl border border-[var(--color-border-default)] overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[var(--color-border-default)] bg-[var(--color-surface-secondary)]">
                                <th className="w-10 px-3 py-3" aria-label="Expand row" />
                                <th className="px-4 py-3 text-left">
                                    <span className={typography.table.header}>Email</span>
                                </th>
                                <th className="px-4 py-3 text-left">
                                    <span className={typography.table.header}>No. of Roles</span>
                                </th>
                                <th className="px-4 py-3 text-left">
                                    <span className={typography.table.header}>Invited On</span>
                                </th>
                                <th className="px-4 py-3 text-center">
                                    <span className={typography.table.header}>Invitation Accepted</span>
                                </th>
                                <th className="w-10 px-3 py-3" aria-label="Actions" />
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-[var(--color-border-default)]">
                            {users.map((user) => {
                                const isExpanded = expandedIds.has(user.id);
                                const invitedOn  = user.invitedAt
                                    ? format(new Date(user.invitedAt), "EEE MMM dd yyyy")
                                    : "—";

                                return (
                                    <React.Fragment key={user.id}>
                                        <tr
                                            className={cn(
                                                "cursor-pointer transition-colors",
                                                "hover:bg-[var(--color-surface-secondary)]",
                                                isExpanded && "bg-[var(--color-surface-secondary)]"
                                            )}
                                            onClick={() => toggleExpand(user.id)}
                                        >
                                            {/* Expand indicator */}
                                            <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleExpand(user.id)}
                                                    aria-label={isExpanded ? "Collapse row" : "Expand row"}
                                                    aria-expanded={isExpanded}
                                                    className="min-h-[var(--min-touch-target)] min-w-[var(--min-touch-target)] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] rounded"
                                                >
                                                    {isExpanded
                                                        ? <ChevronUp size={14} className="text-[var(--color-text-secondary)]" aria-hidden="true" />
                                                        : <ChevronRight size={14} className="text-[var(--color-text-secondary)]" aria-hidden="true" />
                                                    }
                                                </button>
                                            </td>

                                            {/* Email */}
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className={typography.table.cell}>{user.email}</span>
                                                    {user.name && (
                                                        <span className={typography.table.cellMuted}>{user.name}</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Role count */}
                                            <td className="px-4 py-3">
                                                <span className={typography.table.cellMono}>{user.roleCount}</span>
                                            </td>

                                            {/* Invited on */}
                                            <td className="px-4 py-3">
                                                <span className={typography.ui.timestamp}>{invitedOn}</span>
                                            </td>

                                            {/* Invitation accepted */}
                                            <td className="px-4 py-3 text-center">
                                                {user.invitationAccepted ? (
                                                    <>
                                                        <CheckCircle
                                                            size={16}
                                                            className="inline text-[var(--color-text-success)]"
                                                            aria-hidden="true"
                                                        />
                                                        <span className="sr-only">Accepted</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle
                                                            size={16}
                                                            className="inline text-[var(--color-text-error)]"
                                                            aria-hidden="true"
                                                        />
                                                        <span className="sr-only">Not accepted</span>
                                                    </>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td
                                                className="px-3 py-3"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Guard permission="iam.manage">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                aria-label={`Actions for ${user.email}`}
                                                                className="min-h-[var(--min-touch-target)] min-w-[var(--min-touch-target)]"
                                                            >
                                                                <MoreHorizontal size={16} aria-hidden="true" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                onSelect={() => setChangeRolesUser(user)}
                                                            >
                                                                Change Roles
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onSelect={() => setSuspendTarget(user)}
                                                                className="text-[var(--color-text-warning)]"
                                                            >
                                                                {user.status === "suspended" ? "Unsuspend User" : "Suspend User"}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onSelect={() => setRemoveTarget(user)}
                                                                className="text-[var(--color-text-error)]"
                                                            >
                                                                Remove User
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </Guard>
                                            </td>
                                        </tr>

                                        {/* Expanded content */}
                                        {isExpanded && <ExpandedRow user={user} />}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Suspend confirm dialog */}
            {suspendTarget && (
                <ConfirmDialog
                    open
                    title={suspendTarget.status === "suspended" ? "Unsuspend user?" : "Suspend user?"}
                    description={
                        suspendTarget.status === "suspended"
                            ? `${suspendTarget.email} will be reinstated and can log in again.`
                            : `${suspendTarget.email} will be suspended and cannot log in until reinstated.`
                    }
                    confirmLabel={suspendTarget.status === "suspended" ? "Unsuspend" : "Suspend"}
                    variant="destructive"
                    loading={isUpdating}
                    onConfirm={() => handleSuspend(suspendTarget)}
                    onCancel={() => setSuspendTarget(null)}
                />
            )}

            {/* Remove confirm dialog */}
            {removeTarget && (
                <ConfirmDialog
                    open
                    title="Remove user?"
                    description={`${removeTarget.email} will be removed from your organization. This cannot be undone.`}
                    confirmLabel="Remove"
                    variant="destructive"
                    loading={isRemoving}
                    onConfirm={() => handleRemove(removeTarget.id)}
                    onCancel={() => setRemoveTarget(null)}
                />
            )}

            {/* Change roles modal */}
            {changeRolesUser && (
                <ChangeRolesModal
                    open={changeRolesUser !== null}
                    onClose={() => setChangeRolesUser(null)}
                    user={changeRolesUser}
                />
            )}
        </div>
    );
}
