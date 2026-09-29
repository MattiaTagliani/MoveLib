"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ExerciseTag, TagSelector } from "@/components/exercises/tag-selector";

interface ExerciseVariant {
  id: string;
  variant: string;
}

interface Exercise {
  id: string;
  name: string;
  description: string | null;
  min_age: number;
  max_age: number;
  exercise_variants: ExerciseVariant[];
  exercise_tags: {
    tag_id: string;
  }[];
}

interface EditableVariant {
  id: string | null;
  variant: string;
}

interface EditExerciseFormProps {
  exercise: Exercise;
  availableTags: ExerciseTag[];
}

export function EditExerciseForm({
  exercise,
  availableTags,
}: EditExerciseFormProps) {
  const router = useRouter();

  const [name, setName] = useState(exercise.name);
  const [description, setDescription] = useState(exercise.description ?? "");
  const [minAge, setMinAge] = useState(exercise.min_age.toString());
  const [maxAge, setMaxAge] = useState(exercise.max_age.toString());

  const [variants, setVariants] = useState<EditableVariant[]>(
    exercise.exercise_variants.map((variant) => ({
      id: variant.id,
      variant: variant.variant,
    })),
  );
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    exercise.exercise_tags.map((exerciseTag) => exerciseTag.tag_id),
  );

  const [deletedVariantIds, setDeletedVariantIds] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function addVariant() {
    setVariants((currentVariants) => [
      ...currentVariants,
      {
        id: null,
        variant: "",
      },
    ]);
  }

  function updateVariant(index: number, value: string) {
    setVariants((currentVariants) =>
      currentVariants.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, variant: value } : variant,
      ),
    );
  }

  function removeVariant(index: number) {
    const variantToRemove = variants[index];

    if (variantToRemove.id) {
      setDeletedVariantIds((currentIds) => [
        ...currentIds,
        variantToRemove.id!,
      ]);
    }

    setVariants((currentVariants) =>
      currentVariants.filter((_, variantIndex) => variantIndex !== index),
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError(null);

    const parsedMinAge = Number(minAge);
    const parsedMaxAge = Number(maxAge);

    if (
      !Number.isInteger(parsedMinAge) ||
      !Number.isInteger(parsedMaxAge) ||
      parsedMinAge < 0 ||
      parsedMaxAge < parsedMinAge
    ) {
      setError("Inserisci un intervallo di età valido.");
      return;
    }

    if (!name.trim()) {
      setError("Inserisci il nome dell'esercizio.");
      return;
    }

    setIsLoading(true);

    const supabase = createClient();

    const { error: exerciseError } = await supabase
      .from("exercises")
      .update({
        name: name.trim(),
        description: description.trim() || null,
        min_age: parsedMinAge,
        max_age: parsedMaxAge,
        updated_at: new Date().toISOString(),
      })
      .eq("id", exercise.id);

    if (exerciseError) {
      setError(exerciseError.message);
      setIsLoading(false);
      return;
    }

    const existingVariants = variants.filter((variant) => variant.id !== null);

    for (const variant of existingVariants) {
      const trimmedVariant = variant.variant.trim();

      if (!trimmedVariant) {
        continue;
      }

      const { error: variantError } = await supabase
        .from("exercise_variants")
        .update({
          variant: trimmedVariant,
        })
        .eq("id", variant.id!);

      if (variantError) {
        setError(variantError.message);
        setIsLoading(false);
        return;
      }
    }

    const newVariants = variants
      .filter((variant) => variant.id === null)
      .map((variant) => variant.variant.trim())
      .filter((variant) => variant.length > 0);

    if (newVariants.length > 0) {
      const { error: newVariantsError } = await supabase
        .from("exercise_variants")
        .insert(
          newVariants.map((variant) => ({
            exercise_id: exercise.id,
            variant,
          })),
        );

      if (newVariantsError) {
        setError(newVariantsError.message);
        setIsLoading(false);
        return;
      }
    }

    if (deletedVariantIds.length > 0) {
      const { error: deleteVariantsError } = await supabase
        .from("exercise_variants")
        .delete()
        .in("id", deletedVariantIds);

      if (deleteVariantsError) {
        setError(deleteVariantsError.message);
        setIsLoading(false);
        return;
      }
    }

    const { error: removeTagsError } = await supabase
      .from("exercise_tags")
      .delete()
      .eq("exercise_id", exercise.id);

    if (removeTagsError) {
      setError(removeTagsError.message);
      setIsLoading(false);
      return;
    }

    if (selectedTagIds.length > 0) {
      const { error: addTagsError } = await supabase
        .from("exercise_tags")
        .insert(
          selectedTagIds.map((tagId) => ({
            exercise_id: exercise.id,
            tag_id: tagId,
          })),
        );

      if (addTagsError) {
        setError(addTagsError.message);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(false);

    router.push("/protected/exercises");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>

        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrizione</Label>

        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="minAge">Età minima</Label>

          <Input
            id="minAge"
            type="number"
            min="0"
            value={minAge}
            onChange={(e) => setMinAge(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxAge">Età massima</Label>

          <Input
            id="maxAge"
            type="number"
            min="0"
            value={maxAge}
            onChange={(e) => setMaxAge(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <Label>Varianti</Label>

          <p className="mt-1 text-sm text-muted-foreground">
            Aggiungi, modifica o rimuovi le varianti dell&apos;esercizio.
          </p>
        </div>

        {variants.map((variant, index) => (
          <div key={variant.id ?? `new-${index}`} className="flex gap-2">
            <Input
              value={variant.variant}
              onChange={(e) => updateVariant(index, e.target.value)}
              placeholder="Descrivi la variante"
            />

            <Button
              type="button"
              variant="outline"
              onClick={() => removeVariant(index)}
            >
              Rimuovi
            </Button>
          </div>
        ))}

        <Button type="button" variant="outline" onClick={addVariant}>
          + Aggiungi variante
        </Button>
      </div>

      <div className="space-y-3">
        <div>
          <Label>Tag</Label>

          <p className="mt-1 text-sm text-muted-foreground">
            Seleziona i tag associati all&apos;esercizio.
          </p>
        </div>

        <TagSelector
          initialTags={availableTags}
          selectedTagIds={selectedTagIds}
          onSelectedTagIdsChange={setSelectedTagIds}
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Salvataggio..." : "Salva modifiche"}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/protected/exercises")}
        >
          Annulla
        </Button>
      </div>
    </form>
  );
}
