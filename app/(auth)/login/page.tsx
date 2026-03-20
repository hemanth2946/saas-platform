
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations/auth.schema";
import { useLogin } from "@/hooks/useLogin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

/**
 * Login page
 * Route: /login
 * Redirects to /[orgId]/dashboard on success
 */
export default function LoginPage() {
    const { login, isLoading, error } = useLogin();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
    });

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-full max-w-md bg-white rounded-xl shadow-sm border p-8">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-semibold text-gray-900">
                        Welcome back
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Sign in to your account
                    </p>
                </div>

                {/* Global error */}
                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
                        <p className="text-sm text-red-600">{error.message}</p>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit(login)} className="space-y-4">
                    {/* Email */}
                    <div className="space-y-1">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            autoComplete="email"
                            {...register("email")}
                        />
                        {errors.email && (
                            <p className="text-xs text-red-500">{errors.email.message}</p>
                        )}
                    </div>

                    {/* Password */}
                    <div className="space-y-1">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            autoComplete="current-password"
                            {...register("password")}
                        />
                        {errors.password && (
                            <p className="text-xs text-red-500">{errors.password.message}</p>
                        )}
                    </div>

                    {/* Submit */}
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? "Signing in..." : "Sign in"}
                    </Button>
                </form>

                {/* Footer */}
                <p className="text-sm text-center text-gray-500 mt-6">
                    Don&apos;t have an account?{" "}
                    <Link href="/signup" className="text-gray-900 font-medium hover:underline">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}