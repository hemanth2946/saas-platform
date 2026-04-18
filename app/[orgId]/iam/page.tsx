"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { spacing } from "@/lib/ui";
import { Guard } from "@/components/auth/Guard";
import { PlanGate } from "@/components/plan/PlanGate";
import { UpgradePrompt } from "@/components/plan/UpgradePrompt";
import { PageHeader } from "@/components/primitives";
import { Container } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { SeatQuotaBar } from "@/components/iam/SeatQuotaBar";
import { UsersTable } from "@/components/iam/UsersTable";
import { CreateIAMUserModal } from "@/components/iam/CreateIAMUserModal";
import { useUsers } from "@/hooks/useIAM";
import { usePlanGate } from "@/hooks/usePlanGate";

// ── Page error fallback ───────────────────────────────────────────────────────

function AccessDenied() {
    return (
        <Container>
            <div className="flex flex-col items-center justify-center min-h-64 gap-3 text-center">
                <p className="text-lg font-semibold text-[var(--color-text-primary)]">
                    Access Denied
                </p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                    You don&apos;t have permission to manage users
                </p>
            </div>
        </Container>
    );
}

// ── Create IAM User button ────────────────────────────────────────────────────

function CreateIAMUserButton({ onOpen }: { onOpen: () => void }) {
    const { seatUsed, seatLimit } = useUsers();
    const planGate  = usePlanGate("entitlements.maxUsers");
    const isAtLimit = seatLimit !== null && seatUsed >= seatLimit;

    return (
        <Guard permission="iam.invite">
            <PlanGate
                feature="entitlements.maxUsers"
                fallback={
                    <UpgradePrompt
                        feature="User seats"
                        requiredPlan="pro"
                        compact
                    />
                }
            >
                <Button
                    variant="default"
                    size="default"
                    onClick={onOpen}
                    disabled={isAtLimit || planGate.isBlocked}
                    aria-label="Create IAM user"
                >
                    Create IAM User
                </Button>
            </PlanGate>
        </Guard>
    );
}

// ── Page ─────────────────────────────────────────────────────────────────────

/**
 * IAM Page — /[orgId]/iam
 *
 * Identity and Access Management page.
 * Entire page is guarded by iam.manage permission.
 */
export default function IAMPage() {
    const [modalOpen, setModalOpen] = useState(false);

    return (
        <Guard permission="iam.manage" fallback={<AccessDenied />}>
            <Container>
                <div className={cn("flex flex-col", spacing.sectionGap)}>
                    <PageHeader
                        title="Identity and Access Management (IAM)"
                        subtitle="Manage user identities and access permissions to ensure secure and compliant access to organizational resources."
                        actions={<CreateIAMUserButton onOpen={() => setModalOpen(true)} />}
                    />

                    <SeatQuotaBar />

                    <UsersTable onInvite={() => setModalOpen(true)} />
                </div>
            </Container>

            <CreateIAMUserModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
            />
        </Guard>
    );
}
