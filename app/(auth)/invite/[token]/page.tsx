"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { typography, spacing } from "@/lib/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useValidateInvite, useAcceptInvite } from "@/hooks/useIAM";

// ── Form schema ───────────────────────────────────────────────────────────────

const schema = z.object({
    name:            z.string().min(2, "Name must be at least 2 characters").max(100),
    password:        z.string()
                      .min(8, "Password must be at least 8 characters")
                      .regex(/[A-Z]/, "Password must contain an uppercase letter")
                      .regex(/[0-9]/, "Password must contain a number"),
    confirmPassword: z.string(),
}).refine(
    (data) => data.password === data.confirmPassword,
    { message: "Passwords do not match", path: ["confirmPassword"] }
);

type FormValues = z.infer<typeof schema>;

// ── Org avatar ────────────────────────────────────────────────────────────────

function OrgAvatar({ name, logo }: { name: string; logo: string | null }) {
    if (logo) {
        return (
            <img
                src={logo}
                alt={`${name} logo`}
                className="w-12 h-12 rounded-xl object-cover"
            />
        );
    }
    return (
        <div
            className="w-12 h-12 rounded-xl bg-[var(--color-surface-secondary)] flex items-center justify-center"
            aria-label={`${name} logo`}
        >
            <span className="text-lg font-semibold text-[var(--color-text-primary)]">
                {name.charAt(0).toUpperCase()}
            </span>
        </div>
    );
}

// ── Page ─────────────────────────────────────────────────────────────────────

/**
 * Accept Invite Page — /invite/[token]
 *
 * Public page. Validates the invite token and renders the account setup form.
 */
export default function InviteAcceptPage() {
    const { token } = useParams<{ token: string }>();
    const router    = useRouter();
    const [success, setSuccess] = useState(false);

    const { invite, isLoading, isError, errorCode } = useValidateInvite(token ?? "");
    const { mutate: accept, isPending } = useAcceptInvite();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormValues>({ resolver: zodResolver(schema) });

    function onSubmit(values: FormValues) {
        if (!token) return;
        accept(
            { token, data: { name: values.name, password: values.password } },
            {
                onSuccess: () => {
                    setSuccess(true);
                    // Auto-redirect after 3 seconds
                    setTimeout(() => router.push("/login"), 3000);
                },
            }
        );
    }

    // ── Loading ───────────────────────────────────────────────────────────────

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 size={32} className="animate-spin text-[var(--color-text-secondary)]" aria-hidden="true" />
                    <p className={typography.body.muted}>Validating your invite…</p>
                </div>
            </div>
        );
    }

    // ── Error states ──────────────────────────────────────────────────────────

    if (isError) {
        if (errorCode === "INVITE_EXPIRED") {
            return (
                <InviteStatusCard
                    icon={<Clock size={32} className="text-[var(--color-status-warning-text)]" />}
                    title="Invite link expired"
                    body="This invite link has expired. Contact your organization admin for a new invite."
                />
            );
        }
        if (errorCode === "INVITE_ALREADY_ACCEPTED") {
            return (
                <InviteStatusCard
                    icon={<CheckCircle size={32} className="text-[var(--color-status-success-text)]" />}
                    title="Already accepted"
                    body="This invite has already been accepted."
                    action={
                        <Button onClick={() => router.push("/login")}>
                            Go to login
                        </Button>
                    }
                />
            );
        }
        // INVITE_NOT_FOUND or other error
        return (
            <InviteStatusCard
                icon={<XCircle size={32} className="text-[var(--color-status-error-text)]" />}
                title="Invalid invite link"
                body="This invite link is invalid or has expired."
            />
        );
    }

    // ── Success state ─────────────────────────────────────────────────────────

    if (success) {
        return (
            <InviteStatusCard
                icon={<CheckCircle size={32} className="text-[var(--color-status-success-text)]" />}
                title="Account created!"
                body="You can now log in with your email and password."
                action={
                    <Button onClick={() => router.push("/login")}>
                        Go to login
                    </Button>
                }
                footer="Redirecting to login in 3 seconds…"
            />
        );
    }

    // ── Valid invite — show form ───────────────────────────────────────────────

    if (!invite) return null;

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-surface-secondary)]">
            <div className="w-full max-w-md bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-default)] shadow-sm p-8">

                {/* Org header */}
                <div className={cn("flex flex-col items-center text-center", spacing.gapMd, "mb-6")}>
                    <OrgAvatar name={invite.orgName} logo={invite.orgLogo} />
                    <div>
                        <h1 className={typography.heading.section}>
                            You&apos;ve been invited to join {invite.orgName}
                        </h1>
                        <p className={cn(typography.body.muted, "mt-1")}>
                            Complete your account setup to accept this invitation.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <div className={cn("flex flex-col", spacing.formGap)}>

                        {/* Email (read-only) */}
                        <div className={cn("flex flex-col", spacing.formLabelGap)}>
                            <Label className={typography.label.form}>Email</Label>
                            <Input
                                type="email"
                                value={invite.email}
                                readOnly
                                disabled
                                aria-label="Email address (pre-filled from invitation)"
                            />
                        </div>

                        {/* Full name */}
                        <div className={cn("flex flex-col", spacing.formLabelGap)}>
                            <Label htmlFor="invite-name" className={typography.label.form}>
                                Full Name <span aria-hidden="true" className="text-[var(--color-text-error)]">*</span>
                            </Label>
                            <Input
                                id="invite-name"
                                type="text"
                                placeholder="Jane Smith"
                                aria-describedby={errors.name ? "invite-name-error" : undefined}
                                aria-invalid={!!errors.name}
                                {...register("name")}
                            />
                            {errors.name && (
                                <span id="invite-name-error" className={typography.label.error} role="alert">
                                    {errors.name.message}
                                </span>
                            )}
                        </div>

                        {/* Password */}
                        <div className={cn("flex flex-col", spacing.formLabelGap)}>
                            <Label htmlFor="invite-password" className={typography.label.form}>
                                Password <span aria-hidden="true" className="text-[var(--color-text-error)]">*</span>
                            </Label>
                            <Input
                                id="invite-password"
                                type="password"
                                placeholder="At least 8 chars, 1 uppercase, 1 number"
                                aria-describedby={errors.password ? "invite-password-error" : undefined}
                                aria-invalid={!!errors.password}
                                {...register("password")}
                            />
                            {errors.password && (
                                <span id="invite-password-error" className={typography.label.error} role="alert">
                                    {errors.password.message}
                                </span>
                            )}
                        </div>

                        {/* Confirm password */}
                        <div className={cn("flex flex-col", spacing.formLabelGap)}>
                            <Label htmlFor="invite-confirm" className={typography.label.form}>
                                Confirm Password <span aria-hidden="true" className="text-[var(--color-text-error)]">*</span>
                            </Label>
                            <Input
                                id="invite-confirm"
                                type="password"
                                placeholder="Repeat your password"
                                aria-describedby={errors.confirmPassword ? "invite-confirm-error" : undefined}
                                aria-invalid={!!errors.confirmPassword}
                                {...register("confirmPassword")}
                            />
                            {errors.confirmPassword && (
                                <span id="invite-confirm-error" className={typography.label.error} role="alert">
                                    {errors.confirmPassword.message}
                                </span>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isPending}
                        >
                            {isPending ? (
                                <>
                                    <Loader2 size={14} className="animate-spin mr-2" aria-hidden="true" />
                                    Creating your account…
                                </>
                            ) : (
                                "Accept Invitation"
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Status card helper ────────────────────────────────────────────────────────

function InviteStatusCard({
    icon,
    title,
    body,
    action,
    footer,
}: {
    icon:    React.ReactNode;
    title:   string;
    body:    string;
    action?: React.ReactNode;
    footer?: string;
}) {
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-sm text-center space-y-4 bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-default)] shadow-sm p-8">
                <div className="flex justify-center">{icon}</div>
                <h1 className={typography.heading.section}>{title}</h1>
                <p className={typography.body.muted}>{body}</p>
                {action}
                {footer && <p className={typography.body.subtle}>{footer}</p>}
            </div>
        </div>
    );
}
