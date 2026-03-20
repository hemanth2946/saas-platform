
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import type { SignupInput } from "@/lib/validations/auth.schema";
import type { SessionUser, OrgContext, Plan } from "@/types";

type SignupError = {
    message: string;
    code?: string;
    fieldErrors?: Record<string, string[]>;
};

type SignupResponse = {
    success: boolean;
    message: string;
    data: {
        user: SessionUser;
        org: OrgContext & { plan: Plan };
    } | null;
    error?: { code: string; fieldErrors?: Record<string, string[]> };
};

/**
 * Hook for handling user signup
 * Calls POST /api/auth/signup, stores auth state in Zustand
 * Redirects to verify-email page on success
 *
 * @returns { signup, isLoading, error, clearError }
 *
 * @example
 * const { signup, isLoading, error } = useSignup()
 *
 * const onSubmit = async (data) => {
 *   await signup(data)
 * }
 */
export function useSignup() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<SignupError | null>(null);
    const setAuth = useAuthStore((state) => state.setAuth);
    const router = useRouter();

    /**
     * Signs up a new user and creates their organisation
     * @param input - Signup form data (name, email, password, orgName)
     */
    async function signup(input: SignupInput) {
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(input),
            });

            const data: SignupResponse = await res.json();

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

            // Redirect to verify email page
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

    /**
     * Clears the current signup error
     */
    function clearError() {
        setError(null);
    }

    return { signup, isLoading, error, clearError };
}