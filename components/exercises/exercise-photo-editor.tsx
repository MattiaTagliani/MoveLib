"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  uploadExercisePhoto,
  validateExercisePhoto,
} from "@/lib/exercise-photo";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

interface ExerciseMedia {
  id: string;
  storage_path: string;
  uploaded_by: string | null;
}

interface MoveDestination {
  id: string;
  name: string;
}

interface ExercisePhotoEditorProps {
  exerciseId: string;
  initialMedia: ExerciseMedia | null;
  moveDestinations: MoveDestination[];
}

export function ExercisePhotoEditor({
  exerciseId,
  initialMedia,
  moveDestinations,
}: ExercisePhotoEditorProps) {
  const [media, setMedia] = useState(initialMedia);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [moveTargetId, setMoveTargetId] = useState("");
  const [showMove, setShowMove] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPreview() {
      if (!media) {
        setPreviewUrl(null);
        return;
      }

      const supabase = createClient();

      const { data, error: signedUrlError } = await supabase.storage
        .from("movelib-media")
        .createSignedUrl(media.storage_path, 60 * 60);

      if (cancelled) {
        return;
      }

      if (signedUrlError) {
        setError(signedUrlError.message);
        return;
      }

      setPreviewUrl(data.signedUrl);
    }

    void loadPreview();

    return () => {
      cancelled = true;
    };
  }, [media]);

  async function removeCurrentPhoto() {
    if (!media) {
      return;
    }

    setError(null);
    setIsWorking(true);

    const supabase = createClient();

    const { error: storageError } = await supabase.storage
      .from("movelib-media")
      .remove([media.storage_path]);

    if (storageError) {
      setError(storageError.message);
      setIsWorking(false);
      return;
    }

    const { error: databaseError } = await supabase
      .from("exercise_media")
      .delete()
      .eq("id", media.id);

    if (databaseError) {
      setError(databaseError.message);
      setIsWorking(false);
      return;
    }

    setMedia(null);
    setPreviewUrl(null);
    setShowMove(false);
    setMoveTargetId("");
    setIsWorking(false);
  }

  async function replacePhoto(file: File) {
    const validationError = validateExercisePhoto(file);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsWorking(true);

    try {
      if (media) {
        const supabase = createClient();

        /*
         * Delete the old physical object while exercise_media still points
         * to it. This matters because Storage RLS uses that relationship
         * when somebody other than the original uploader replaces it.
         */
        const { error: storageError } = await supabase.storage
          .from("movelib-media")
          .remove([media.storage_path]);

        if (storageError) {
          throw storageError;
        }

        const { error: databaseError } = await supabase
          .from("exercise_media")
          .delete()
          .eq("id", media.id);

        if (databaseError) {
          throw databaseError;
        }
      }

      await uploadExercisePhoto(exerciseId, file);

      const supabase = createClient();

      const { data: newMedia, error: reloadError } = await supabase
        .from("exercise_media")
        .select("id, storage_path, uploaded_by")
        .eq("exercise_id", exerciseId)
        .eq("media_type", "PHOTO")
        .single();

      if (reloadError) {
        throw reloadError;
      }

      setMedia(newMedia);
    } catch (replaceError) {
      setError(
        replaceError instanceof Error
          ? replaceError.message
          : "Errore durante la sostituzione della foto.",
      );
    } finally {
      setIsWorking(false);
    }
  }

  async function movePhoto() {
    if (!media || !moveTargetId) {
      return;
    }

    setError(null);
    setIsWorking(true);

    const supabase = createClient();

    const { error: moveError } = await supabase
      .from("exercise_media")
      .update({
        exercise_id: moveTargetId,
      })
      .eq("id", media.id);

    if (moveError) {
      setError(moveError.message);
      setIsWorking(false);
      return;
    }

    setMedia(null);
    setPreviewUrl(null);
    setMoveTargetId("");
    setShowMove(false);
    setIsWorking(false);
  }

  return (
    <div className="space-y-3">
      <div>
        <Label>Foto</Label>

        <p className="mt-1 text-sm text-muted-foreground">
          Foto di riferimento dell&apos;esercizio.
        </p>
      </div>

      {media ? (
        <>
          {previewUrl ? (
            <div className="overflow-hidden rounded-lg border bg-muted">
              <img
                src={previewUrl}
                alt="Foto esercizio"
                className="max-h-80 w-full object-contain"
              />
            </div>
          ) : (
            <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
              Caricamento foto...
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
              Sostituisci
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={isWorking}
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];

                  if (file) {
                    void replacePhoto(file);
                  }

                  event.target.value = "";
                }}
              />
            </label>

            <Button
              type="button"
              variant="outline"
              disabled={isWorking || moveDestinations.length === 0}
              onClick={() => setShowMove((current) => !current)}
            >
              Sposta
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={isWorking}
              onClick={() => void removeCurrentPhoto()}
            >
              Rimuovi
            </Button>
          </div>

          {showMove && (
            <div className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row">
              <select
                value={moveTargetId}
                onChange={(event) => setMoveTargetId(event.target.value)}
                disabled={isWorking}
                className="min-w-0 flex-1 cursor-pointer rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="">Scegli esercizio...</option>

                {moveDestinations.map((exercise) => (
                  <option key={exercise.id} value={exercise.id}>
                    {exercise.name}
                  </option>
                ))}
              </select>

              <Button
                type="button"
                disabled={!moveTargetId || isWorking}
                onClick={() => void movePhoto()}
              >
                Sposta foto
              </Button>
            </div>
          )}
        </>
      ) : (
        <label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
          Aggiungi foto
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={isWorking}
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];

              if (file) {
                void replacePhoto(file);
              }

              event.target.value = "";
            }}
          />
        </label>
      )}

      {moveDestinations.length === 0 && media && (
        <p className="text-xs text-muted-foreground">
          Non ci sono altri esercizi senza foto disponibili.
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        JPG, PNG o WebP. Massimo 5 MB.
      </p>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
