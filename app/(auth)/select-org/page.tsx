"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { selectOrgService } from "@/lib/services/auth.service";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Users, Building2, CheckCircle2 } from "lucide-react";
import type { OrgSummary } from "@/types";

// ============================================
// PLAN CONFIG — colors + labels
// ============================================

const PLAN_STYLES: Record<string, { label: string; className: string }> = {
    free:       { label: "Free",       className: "bg-gray-100 text-gray-600" },
    pro:        { label: "Pro",        className: "bg-blue-50 text-blue-700" },
    growth:     { label: "Growth",     className: "bg-violet-50 text-violet-700" },
    enterprise: { label: "Enterprise", className: "bg-amber-50 text-amber-700" },
};

const ROLE_STYLES: Record<string, { label: string; className: string }> = {
    super_admin: { label: "Super Admin", className: "bg-rose-50 text-rose-700" },
    admin:       { label: "Admin",       className: "bg-orange-50 text-orange-700" },
    member:      { label: "Member",      className: "bg-emerald-50 text-emerald-700" },
    viewer:      { label: "Viewer",      className: "bg-gray-100 text-gray-500" },
};

// ============================================
// AVATAR — colored initials or logo
// ============================================

// Deterministic color from org name
const AVATAR_COLORS = [
    "bg-blue-500",
    "bg-violet-500",
    "bg-emerald-500",
    "bg-orange-500",
    "bg-rose-500",
    "bg-cyan-500",
    "bg-indigo-500",
    "bg-teal-500",
];

function getAvatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function OrgAvatar({ org, size = "md" }: { org: Pick<OrgSummary, "name" | "logo">; size?: "md" | "lg" }) {
    const sizeClass = size === "lg" ? "w-14 h-14 text-lg" : "w-12 h-12 text-sm";
    const initials = org.name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("");

    if (org.logo) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={org.logo}
                alt={`${org.name} logo`}
                className={`${sizeClass} rounded-xl object-cover flex-shrink-0`}
            />
        );
    }

    return (
        <div
            aria-hidden="true"
            className={`${sizeClass} ${getAvatarColor(org.name)} rounded-xl flex items-center justify-center flex-shrink-0`}
        >
            <span className="font-bold text-white select-none">{initials}</span>
        </div>
    );
}

// ============================================
// SKELETON CARD
// ============================================

function OrgCardSkeleton() {
    return (
        <div className="rounded-2xl border border-gray-100 p-5 space-y-4">
            <div className="flex items-start gap-4">
                <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-24" />
                </div>
            </div>
            <div className="flex gap-2">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-20" />
        </div>
    );
}

// ============================================
// ORG CARD
// ============================================

function OrgCard({
    org,
    isLoading,
    isDisabled,
    onSelect,
}: {
    org: OrgSummary;
    isLoading: boolean;
    isDisabled: boolean;
    onSelect: () => void;
}) {
    const plan = PLAN_STYLES[org.plan] ?? PLAN_STYLES.free;
    const role = ROLE_STYLES[org.role] ?? ROLE_STYLES.member;

    return (
        <button
            type="button"
            onClick={onSelect}
            disabled={isDisabled}
            aria-label={`Open ${org.name}`}
            aria-busy={isLoading}
            className="group w-full text-left rounded-2xl border border-gray-200 bg-white p-5 hover:border-gray-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {/* Header row */}
            <div className="flex items-start gap-4 mb-4">
                <OrgAvatar org={org} size="lg" />

                <div className="min-w-0 flex-1 pt-0.5">
                    <p className="font-semibold text-gray-900 truncate leading-snug">
                        {org.name}
                    </p>
                    <p className="text-sm text-gray-400 mt-0.5">@{org.slug}</p>
                </div>

                {/* Arrow / spinner */}
                <div className="flex-shrink-0 mt-1">
                    {isLoading ? (
                        <span
                            aria-hidden="true"
                            className="block w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"
                        />
                    ) : (
                        <ArrowRight
                            className="w-5 h-5 text-gray-300 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all"
                            aria-hidden="true"
                        />
                    )}
                </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${plan.className}`}>
                    {plan.label}
                </span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${role.className}`}>
                    {role.label}
                </span>
            </div>

            {/* Footer stat */}
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Users className="w-3.5 h-3.5" aria-hidden="true" />
                <span>
                    {org.memberCount} {org.memberCount === 1 ? "member" : "members"}
                </span>
            </div>
        </button>
    );
}

// ============================================
// SELECT ORG PAGE
// ============================================

export default function SelectOrgPage() {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const orgs = useAuthStore((s) => s.orgs);
    const currentOrg = useAuthStore((s) => s.org);
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    const [selectingOrgId, setSelectingOrgId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // ─── Auth guards ───────────────────────────────────────────────────
    useEffect(() => {
        if (!isAuthenticated) {
            router.replace("/login");
        } else if (currentOrg) {
            router.replace(`/${currentOrg.slug}/dashboard`);
        }
    }, [isAuthenticated, currentOrg, router]);

    // ─── Select handler ─────────────────────────────────────────────────
    async function handleSelectOrg(orgId: string) {
        if (selectingOrgId) return;
        setSelectingOrgId(orgId);
        setError(null);

        try {
            const { slug } = await selectOrgService(orgId);
            router.push(`/${slug}/dashboard`);
        } catch {
            setError("Failed to open this organisation. Please try again.");
            setSelectingOrgId(null);
        }
    }

    // Prevent flash while redirect is happening
    if (!isAuthenticated || currentOrg) return null;

    const isLoading = orgs.length === 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex flex-col items-center justify-center px-4 py-12">

            {/* Brand mark */}
            <div className="mb-10 flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gray-900 flex items-center justify-center shadow-lg">
                    <Building2 className="w-6 h-6 text-white" aria-hidden="true" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                    Choose an organisation
                </h1>
                {user && (
                    <p className="text-sm text-gray-500">
                        Signed in as{" "}
                        <span className="font-medium text-gray-700">{user.email}</span>
                    </p>
                )}
            </div>

            {/* Main card container */}
            <div className="w-full max-w-2xl">

                {/* Error banner */}
                {error && (
                    <div
                        role="alert"
                        className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3"
                    >
                        <span className="text-red-500 mt-0.5 text-sm">⚠</span>
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {/* Org grid */}
                <ul
                    role="list"
                    aria-label="Your organisations"
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                >
                    {isLoading ? (
                        <>
                            <li><OrgCardSkeleton /></li>
                            <li><OrgCardSkeleton /></li>
                            <li><OrgCardSkeleton /></li>
                        </>
                    ) : (
                        orgs.map((org) => (
                            <li key={org.id}>
                                <OrgCard
                                    org={org}
                                    isLoading={selectingOrgId === org.id}
                                    isDisabled={selectingOrgId !== null}
                                    onSelect={() => handleSelectOrg(org.id)}
                                />
                            </li>
                        ))
                    )}
                </ul>

                {/* Footer hint */}
                {!isLoading && orgs.length > 0 && (
                    <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-gray-400">
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>
                            {orgs.length} {orgs.length === 1 ? "organisation" : "organisations"} available
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
