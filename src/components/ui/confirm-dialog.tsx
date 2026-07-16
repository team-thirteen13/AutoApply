"use client";

import { useEffect, useRef, useId } from "react";
import { Button } from "./button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
      onCancel={onCancel}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <div className="p-6">
        <h2 id={titleId} className="text-lg font-semibold text-slate-900">{title}</h2>
        <p id={descriptionId} className="mt-2 text-sm text-slate-500">{description}</p>
      </div>
      <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
        <Button variant="ghost" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button variant={variant} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
