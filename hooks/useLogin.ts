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
    org: OrgContext;
    plan: Plan;
};

type LoginResponse = {
    success: boolean;
    message: string;
    data: LoginResponseData | null;
    error?: { code: string; fieldErrors?: Record<string, string[]> };
};

/**
 * Hook for handling user login.
 * Calls POST /api/auth/login, stores auth state in Zustand,
 * then redirects to the org's dashboard.
 *
 * @returns { login, isLoading, error, clearError }
 *
 * @example
 * const { login, isLoading, error } = useLogin()
 * const onSubmit = async (data) => { await login(data) }
 */
export function useLogin() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<LoginError | null>(null);
    const setLoginData = useAuthStore((state) => state.setLoginData);
    const router = useRouter();

    /**
     * Logs in the user with email and password.
     * @param input - Validated login form data
     */
    async function login(input: LoginInput) {
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(input),
            });

            const json: LoginResponse = await res.json();

            if (!json.success || !json.data) {
                setError({
                    message: json.message,
                    code: json.error?.code,
                    fieldErrors: json.error?.fieldErrors,
                });
                return;
            }

            const { user, org, plan } = json.data;

            // Persist auth state to Zustand (survives page refresh via localStorage)
            setAuth(user, org, plan);

            // Redirect to org dashboard using org slug
            router.push(`/${org.slug}/dashboard`);

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
