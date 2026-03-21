"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { selectOrgService } from "@/lib/services/auth.service";
import type { LoginInput } from "@/lib/validations/auth.schema";
import type { OrgSummary, SessionUser } from "@/types";

type LoginError = {
    message: string;
    code?: string;
    fieldErrors?: Record<string, string[]>;
};

type LoginResponseData = {
    user: SessionUser;
    orgs: OrgSummary[];
};

type LoginApiResponse = {
    success: boolean;
    message: string;
    data: LoginResponseData | null;
    error?: { code: string; fieldErrors?: Record<string, string[]> };
};

/**
 * Hook for handling user login.
 *
 * Flow:
 * 1. POST /api/auth/login → { user, orgs[] }
 * 2. Store in Zustand via setLoginData
 * 3a. orgs.length === 0 → show error (server handles this but guard here too)
 * 3b. orgs.length === 1 → auto-call select-org, redirect to /[slug]/dashboard
 * 3c. orgs.length  > 1 → redirect to /select-org
 *
 * @returns { login, isLoading, error, clearError }
 */
export function useLogin() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<LoginError | null>(null);
    const setLoginData = useAuthStore((state) => state.setLoginData);
    const router = useRouter();

    async function login(input: LoginInput) {
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(input),
            });

            const data: LoginApiResponse = await res.json();

            if (!data.success || !data.data) {
                setError({
                    message: data.message,
                    code: data.error?.code,
                    fieldErrors: data.error?.fieldErrors,
                });
                return;
            }

            const { user, orgs } = data.data;

            // Store user + orgs in Zustand (no org selected yet)
            setLoginData(user, orgs);

            if (orgs.length === 0) {
                // Should not happen (server returns 400 for this), but guard defensively
                setError({
                    message:
                        "Your account is not associated with any organization. Contact your admin.",
                    code: "FORBIDDEN",
                });
                return;
            }

            if (orgs.length === 1) {
                // Single org — auto-select and redirect straight to dashboard
                try {
                    const { slug } = await selectOrgService(orgs[0].id);
                    router.push(`/${slug}/dashboard`);
                } catch {
                    setError({
                        message: "Failed to load your organisation. Please try again.",
                        code: "INTERNAL_ERROR",
                    });
                }
                return;
            }

            // Multiple orgs — let the user choose
            router.push("/select-org");

        } catch {
            setError({
                message: "Something went wrong. Please try again.",
                code: "INTERNAL_ERROR",
            });
        } finally {
            setIsLoading(false);
        }
    }

    function clearError() {
        setError(null);
    }

    return { login, isLoading, error, clearError };
}
