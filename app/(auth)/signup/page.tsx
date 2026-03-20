
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupInput } from "@/lib/validations/auth.schema";
import { useSignup } from "@/hooks/useSignup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

/**
 * Signup page
 * Route: /signup
 * Creates new org + user, redirects to /verify-email on success
 */
export default function SignupPage() {
    const { signup, isLoading, error } = useSignup();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SignupInput>({
        resolver: zodResolver(signupSchema),
    });

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-full max-w-md bg-white rounded-xl shadow-sm border p-8">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-semibold text-gray-900">
                        Create your account
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Set up your organisation in minutes
                    </p>
                </div>

                {/* Global error */}
                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
                        <p className="text-sm text-red-600">{error.message}</p>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit(signup)} className="space-y-4">

                    {/* Name */}
                    <div className="space-y-1">
                        <Label htmlFor="name">Full name</Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="John Doe"
                            autoComplete="name"
                            {...register("name")}
                        />
                        {errors.name && (
                            <p className="text-xs text-red-500">{errors.name.message}</p>
                        )}
                    </div>

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
                            placeholder="Min 8 chars, uppercase, number"
                            autoComplete="new-password"
                            {...register("password")}
                        />
                        {errors.password && (
                            <p className="text-xs text-red-500">{errors.password.message}</p>
                        )}
                    </div>

                    {/* Org name */}
                    <div className="space-y-1">
                        <Label htmlFor="orgName">Organisation name</Label>
                        <Input
                            id="orgName"
                            type="text"
                            placeholder="Acme Inc."
                            {...register("orgName")}
                        />
                        {errors.orgName && (
                            <p className="text-xs text-red-500">{errors.orgName.message}</p>
                        )}
                    </div>

                    {/* Submit */}
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? "Creating account..." : "Create account"}
                    </Button>
                </form>

                {/* Footer */}
                <p className="text-sm text-center text-gray-500 mt-6">
                    Already have an account?{" "}
                    <Link href="/login" className="text-gray-900 font-medium hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}