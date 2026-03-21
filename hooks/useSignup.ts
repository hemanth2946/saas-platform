"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { selectOrgService } from "@/lib/services/auth.service";
import type { SignupInput } from "@/lib/validations/auth.schema";
import type { SessionUser, OrgSummary } from "@/types";

type SignupError = {
    message: string;
    code?: string;
    fieldErrors?: Record<string, string[]>;
};

type SignupResponseData = {
    user: SessionUser;
    orgs: OrgSummary[];
};

type SignupApiResponse = {
    success: boolean;
    message: string;
    data: SignupResponseData | null;
    error?: { code: string; fieldErrors?: Record<string, string[]> };
};

/**
 * Hook for handling user signup.
 * After signup the server always returns exactly 1 org (the new one).
 * Auto-selects it and redirects to /verify-email.
 *
 * @returns { signup, isLoading, error, clearError }
 */
export function useSignup() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<SignupError | null>(null);
    const setLoginData = useAuthStore((state) => state.setLoginData);
    const router = useRouter();

    async function signup(input: SignupInput) {
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(input),
            });

            const data: SignupApiResponse = await res.json();

            if (!data.success || !data.data) {
                setError({
                    message: data.message,
                    code: data.error?.code,
                    fieldErrors: data.error?.fieldErrors,
                });
                return;
            }

            const { user, orgs } = data.data;

            // Store user + orgs in Zustand
            setLoginData(user, orgs);

            // Auto-select the single new org
            if (orgs.length > 0) {
                try {
                    await selectOrgService(orgs[0].id);
                } catch {
                    // Non-fatal — user can select on next page
                }
            }

            // Redirect to email verification
            router.push("/verify-email");

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

    return { signup, isLoading, error, clearError };
}
