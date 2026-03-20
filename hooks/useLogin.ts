"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import type { LoginInput } from "@/lib/validations/auth.schema";
import type { SessionUser, OrgContext, Plan } from "@/types";

type LoginError = {
    message: string;
    code?: string;
    fieldErrors?: Record<string, string[]>;
};

type LoginResponse = {
    success: boolean;
    message: string;
    data: {
        user: SessionUser;
        org: OrgContext & { plan: Plan };
    } | null;
    error?: { code: string; fieldErrors?: Record<string, string[]> };
};

/**
 * Hook for handling user login
 * Calls POST /api/auth/login, stores auth state in Zustand
 * Redirects to org dashboard on success
 *
 * @returns { login, isLoading, error, clearError }
 *
 * @example
 * const { login, isLoading, error } = useLogin()
 *
 * const onSubmit = async (data) => {
 *   await login(data)
 * }
 */
export function useLogin() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<LoginError | null>(null);
    const setAuth = useAuthStore((state) => state.setAuth);
    const router = useRouter();

    /**
     * Logs in the user with email and password
     * @param input - Login form data (email, password)
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

            const data: LoginResponse = await res.json();

            if (!data.success || !data.data) {
                setError({
                    message: data.message,
                    code: data.error?.code,
                    fieldErrors: data.error?.fieldErrors,
                });
                return;
            }

            // Store auth state in Zustand
            setAuth(
                data.data.user,
                data.data.org,
                data.data.org.plan
            );

            // Redirect to org dashboard
            router.push(`/${data.data.org.slug}/dashboard`);

        } catch {
            setError({
                message: "Something went wrong. Please try again.",
                code: "INTERNAL_ERROR",
            });
        } finally {
            setIsLoading(false);
        }
    }

    /**
     * Clears the current login error
     */
    function clearError() {
        setError(null);
    }

    return { login, isLoading, error, clearError };
}