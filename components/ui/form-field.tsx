"use client";

import { cn } from "@/lib/utils";
import { typography } from "@/lib/ui";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FormFieldProps {
    label:      string;
    required?:  boolean;
    error?:     string;
    hint?:      string;
    children:   React.ReactNode;
    className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * FormField
 *
 * Wraps a form control with a label, optional hint, and optional error message.
 * The `children` slot receives the input element.
 *
 * @example
 * <FormField label="Email" required error={errors.email?.message}>
 *   <Input type="email" {...register("email")} />
 * </FormField>
 */
export function FormField({
    label,
    required  = false,
    error,
    hint,
    children,
    className,
}: FormFieldProps) {
    return (
        <div className={cn("flex flex-col gap-[var(--form-label-gap,0.375rem)]", className)}>
            <label className={typography.label.form}>
                {label}
                {required && (
                    <span
                        aria-hidden="true"
                        className="ml-0.5 text-[var(--color-text-error)]"
                    >
                        *
                    </span>
                )}
            </label>

            {children}

            {error ? (
                <span className={typography.label.error} role="alert">
                    {error}
                </span>
            ) : hint ? (
                <span className={typography.label.hint}>
                    {hint}
                </span>
            ) : null}
        </div>
    );
}
