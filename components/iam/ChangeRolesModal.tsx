"use client";

import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { typography, spacing } from "@/lib/ui";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RoleSelectorDropdown } from "@/components/iam/RoleSelectorDropdown";
import { RoleChip } from "@/components/iam/RoleChip";
import { useUpdateUser, useRoles } from "@/hooks/useIAM";
import type { IAMUser, RoleRecord } from "@/types";

// ── Schema ─────────────────────────────────────────────────────────────────────

const schema = z.object({
    roleIds: z.array(z.string()).min(1, "Select at least one role"),
});

type FormValues = z.infer<typeof schema>;

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ChangeRolesModalProps {
    open:    boolean;
    onClose: () => void;
    user:    IAMUser;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * ChangeRolesModal
 *
 * Modal form to update the roles assigned to an existing org member.
 * Pre-populates with the user's current roles.
 * On submit: calls PATCH /api/v1/users/:userId with { roleIds }.
 */
export function ChangeRolesModal({ open, onClose, user }: ChangeRolesModalProps) {
    const { quickRoles, serviceBased } = useRoles();
    const { mutate: updateUserRoles, isPending } = useUpdateUser();

    const {
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<FormValues>({
        resolver:      zodResolver(schema),
        defaultValues: { roleIds: user.roles.map((r) => r.id) },
    });

    const selectedRoleIds = watch("roleIds");

    // Build flat lookup: id → RoleRecord
    const allRoles: RoleRecord[] = [
        ...quickRoles,
        ...serviceBased.flatMap((g) => g.roles),
    ];
    const roleById = new Map(allRoles.map((r) => [r.id, r]));

    const selectedRoles = selectedRoleIds
        .map((id) => roleById.get(id))
        .filter((r): r is RoleRecord => r !== undefined);

    const handleRoleChange = useCallback(
        (ids: string[]) => setValue("roleIds", ids, { shouldValidate: true }),
        [setValue]
    );

    const handleRemoveRole = useCallback(
        (roleId: string) =>
            setValue(
                "roleIds",
                selectedRoleIds.filter((id) => id !== roleId),
                { shouldValidate: true }
            ),
        [selectedRoleIds, setValue]
    );

    function handleClose() {
        reset({ roleIds: user.roles.map((r) => r.id) });
        onClose();
    }

    function onSubmit(values: FormValues) {
        updateUserRoles(
            { userId: user.id, data: { roleIds: values.roleIds } },
            {
                onSuccess: () => {
                    toast.success("Roles updated", {
                        description: `Roles for ${user.email} have been updated.`,
                    });
                    handleClose();
                },
                onError: () => {
                    toast.error("Failed to update roles. Please try again.");
                },
            }
        );
    }

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className={typography.modal.title}>
                        Change Roles
                    </DialogTitle>
                    <DialogDescription className={typography.modal.body}>
                        {user.email}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <div className={cn("flex flex-col", spacing.formGap, "pt-2")}>

                        {/* Role selector */}
                        <div className={cn("flex flex-col", spacing.formLabelGap)}>
                            <span className={typography.label.form}>
                                Roles{" "}
                                <span aria-hidden="true" className="text-[var(--color-text-error)]">
                                    *
                                </span>
                            </span>

                            <RoleSelectorDropdown
                                value={selectedRoleIds}
                                onChange={handleRoleChange}
                            />

                            {errors.roleIds ? (
                                <span className={typography.label.error} role="alert">
                                    {errors.roleIds.message}
                                </span>
                            ) : (
                                <span className={typography.label.hint}>
                                    Changes take effect immediately
                                </span>
                            )}

                            {/* Selected role chips */}
                            {selectedRoles.length > 0 && (
                                <div
                                    className="flex flex-wrap gap-1.5 mt-1"
                                    aria-label="Selected roles"
                                >
                                    {selectedRoles.map((role) => (
                                        <RoleChip
                                            key={role.id}
                                            role={role}
                                            onRemove={() => handleRemoveRole(role.id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Form actions */}
                        <div className="flex items-center justify-end gap-2 pt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={handleClose}
                                disabled={isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isPending}
                            >
                                {isPending ? "Saving…" : "Save"}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
