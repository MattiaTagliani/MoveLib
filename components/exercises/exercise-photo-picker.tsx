"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";

interface ExercisePhotoPickerProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
}

export function ExercisePhotoPicker({
  file,
  onFileChange,
  disabled = false,
}: ExercisePhotoPickerProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);

    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  return (
    <div className="space-y-3">
      <div>
        <Label>Foto</Label>

        <p className="mt-1 text-sm text-muted-foreground">
          Aggiungi una foto di riferimento per l&apos;esercizio.
        </p>
      </div>

      {previewUrl && (
        <div className="overflow-hidden rounded-lg border bg-muted">
          <img
            src={previewUrl}
            alt="Anteprima foto esercizio"
            className="max-h-80 w-full object-contain"
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
          {file ? "Sostituisci foto" : "Aggiungi foto"}

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={disabled}
            className="hidden"
            onChange={(event) => {
              const selectedFile = event.target.files?.[0] ?? null;

              onFileChange(selectedFile);

              event.target.value = "";
            }}
          />
        </label>

        {file && (
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() => onFileChange(null)}
          >
            Rimuovi
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        JPG, PNG o WebP. Massimo 5 MB.
      </p>
    </div>
  );
}
