"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, Info, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type MessageDialogVariant = "info" | "warning" | "danger";

interface MessageDialogProps {
  open: boolean;
  title: string;
  description: string;
  variant?: MessageDialogVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  showCancel?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export function MessageDialog({
  open,
  title,
  description,
  variant = "info",
  confirmLabel = "Ho capito",
  cancelLabel = "Annulla",
  showCancel = false,
  onConfirm,
  onClose,
}: MessageDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  async function handleConfirm() {
    if (working) return;

    setWorking(true);

    try {
      await onConfirm();
    } finally {
      setWorking(false);
    }
  }

  const Icon =
    variant === "danger"
      ? Trash2
      : variant === "warning"
        ? AlertTriangle
        : Info;

  return (
    <dialog
      ref={dialogRef}
      onClose={() => {
        if (!working) onClose();
      }}
      onCancel={(event) => {
        if (working) event.preventDefault();
      }}
      className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-border bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/60"
      aria-labelledby="message-dialog-title"
      aria-describedby="message-dialog-description"
    >
      <div className="space-y-5 p-6">
        <div className="flex items-start gap-3">
          <div
            className={
              variant === "danger"
                ? "rounded-full bg-red-500/10 p-2 text-red-600"
                : variant === "warning"
                  ? "rounded-full bg-amber-500/10 p-2 text-amber-600"
                  : "rounded-full bg-primary/10 p-2 text-primary"
            }
          >
            <Icon size={22} aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <h2 id="message-dialog-title" className="text-lg font-semibold">
              {title}
            </h2>

            <p
              id="message-dialog-description"
              className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground"
            >
              {description}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
          {showCancel && (
            <Button
              type="button"
              variant="outline"
              disabled={working}
              onClick={onClose}
            >
              {cancelLabel}
            </Button>
          )}

          <Button
            type="button"
            disabled={working}
            onClick={() => void handleConfirm()}
            className={
              variant === "danger"
                ? "bg-red-600 text-white hover:bg-red-700"
                : ""
            }
          >
            {working ? "Attendere..." : confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
