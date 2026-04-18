"use client";

import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { typography, spacing } from "@/lib/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RoleSelectorDropdown } from "@/components/iam/RoleSelectorDropdown";
import { RoleChip } from "@/components/iam/RoleChip";
import { useInviteUser, useRoles } from "@/hooks/useIAM";
import type { RoleRecord } from "@/types";

// ── Schema ─────────────────────────────────────────────────────────────────────

const schema = z.object({
    email:   z.string().email("Enter a valid email address"),
    roleIds: z.array(z.string()).min(1, "Select at least one role"),
});

type FormValues = z.infer<typeof schema>;

// ── Props ─────────────────────────────────────────────────────────────────────

interface CreateIAMUserModalProps {
    open:    boolean;
    onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * CreateIAMUserModal
 *
 * Modal form to invite a new user with one or more roles.
 * Uses React Hook Form + Zod validation.
 */
export function CreateIAMUserModal({ open, onClose }: CreateIAMUserModalProps) {
    const { quickRoles, serviceBased } = useRoles();
    const { mutate: invite, isPending } = useInviteUser();

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<FormValues>({
        resolver:     zodResolver(schema),
        defaultValues: { email: "", roleIds: [] },
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
        reset();
        onClose();
    }

    function onSubmit(values: FormValues) {
        invite(
            { email: values.email, roleIds: values.roleIds },
            {
                onSuccess: () => {
                    toast.success("Invitation sent", {
                        description: `An invite has been sent to ${values.email}`,
                    });
                    handleClose();
                },
                onError: () => {
                    // Interceptor already shows error toast
                },
            }
        );
    }

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className={typography.modal.title}>
                        Create IAM User
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <div className={cn("flex flex-col", spacing.formGap, "pt-2")}>

                        {/* Email field */}
                        <div className={cn("flex flex-col", spacing.formLabelGap)}>
                            <Label htmlFor="invite-email" className={typography.label.form}>
                                Email <span aria-hidden="true" className="text-[var(--color-text-error)]">*</span>
                            </Label>
                            <Input
                                id="invite-email"
                                type="email"
                                placeholder="user@company.com"
                                aria-describedby={errors.email ? "invite-email-error" : "invite-email-hint"}
                                aria-invalid={!!errors.email}
                                {...register("email")}
                            />
                            {errors.email ? (
                                <span id="invite-email-error" className={typography.label.error} role="alert">
                                    {errors.email.message}
                                </span>
                            ) : (
                                <span id="invite-email-hint" className={typography.label.hint}>
                                    We&apos;ll send an invite link to this address
                                </span>
                            )}
                        </div>

                        {/* Roles field */}
                        <div className={cn("flex flex-col", spacing.formLabelGap)}>
                            <Label className={typography.label.form}>
                                Assign Roles <span aria-hidden="true" className="text-[var(--color-text-error)]">*</span>
                            </Label>
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
                                    Roles define permissions for the user
                                </span>
                            )}

                            {/* Selected role chips */}
                            {selectedRoles.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-1" aria-label="Selected roles">
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
                                {isPending ? "Sending…" : "Save"}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
