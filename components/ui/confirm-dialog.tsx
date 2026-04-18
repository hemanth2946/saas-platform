"use client";

import { cn } from "@/lib/utils";
import { typography } from "@/lib/ui";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ConfirmDialogProps {
    open:          boolean;
    title:         string;
    description:   string;
    confirmLabel?: string;
    cancelLabel?:  string;
    variant?:      "default" | "destructive";
    loading?:      boolean;
    onConfirm:     () => void;
    onCancel:      () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * ConfirmDialog
 *
 * Generic confirmation dialog backed by shadcn/ui Dialog.
 * Supports default and destructive confirm button variants.
 *
 * @example
 * <ConfirmDialog
 *   open={open}
 *   title="Delete record?"
 *   description="This cannot be undone."
 *   confirmLabel="Delete"
 *   variant="destructive"
 *   loading={isPending}
 *   onConfirm={handleDelete}
 *   onCancel={() => setOpen(false)}
 * />
 */
export function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel = "Confirm",
    cancelLabel  = "Cancel",
    variant      = "default",
    loading      = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel(); }}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle className={typography.modal.title}>
                        {title}
                    </DialogTitle>
                    <DialogDescription className={cn(typography.modal.body)}>
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        {cancelLabel}
                    </Button>

                    <Button
                        type="button"
                        variant={variant}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? "Working…" : confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
