"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

type VerifyStatus = "idle" | "verifying" | "success" | "error";

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const [status, setStatus] = useState<VerifyStatus>("idle");
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!token) return;

        async function verifyToken() {
            setStatus("verifying");
            try {
                const res = await fetch(`/api/auth/verify?token=${token}`);
                const data = await res.json();

                if (data.success) {
                    setStatus("success");
                    setMessage(data.message);
                    setTimeout(() => router.push("/login"), 2000);
                } else {
                    setStatus("error");
                    setMessage(data.message);
                }
            } catch {
                setStatus("error");
                setMessage("Something went wrong. Please try again.");
            }
        }

        verifyToken();
    }, [token, router]);

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-full max-w-md bg-white rounded-xl shadow-sm border p-8 text-center">
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">📧</span>
                    </div>
                    <h1 className="text-xl font-semibold text-gray-900 mb-2">
                        Check your email
                    </h1>
                    <p className="text-sm text-gray-500">
                        We sent a verification link to your email address.
                        Click the link to verify your account.
                    </p>
                    <p className="text-xs text-gray-400 mt-4">
                        Link expires in 48 hours
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-full max-w-md bg-white rounded-xl shadow-sm border p-8 text-center">

                {status === "verifying" && (
                    <>
                        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-sm text-gray-500">Verifying your email...</p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">✅</span>
                        </div>
                        <h1 className="text-xl font-semibold text-gray-900 mb-2">
                            Email verified!
                        </h1>
                        <p className="text-sm text-gray-500">{message}</p>
                        <p className="text-xs text-gray-400 mt-2">
                            Redirecting to login...
                        </p>
                    </>
                )}

                {status === "error" && (
                    <>
                        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">❌</span>
                        </div>
                        <h1 className="text-xl font-semibold text-gray-900 mb-2">
                            Verification failed
                        </h1>
                        <p className="text-sm text-gray-500">{message}</p>
                        <a
                            href="/login"
                            className="inline-block mt-4 text-sm text-gray-900 font-medium hover:underline"
                        >
                            Back to login
                        </a>
                    </>
                )}
            </div>
        </div >
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense>
            <VerifyEmailContent />
        </Suspense>
    );
}