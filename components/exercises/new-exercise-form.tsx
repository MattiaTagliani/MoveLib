"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { ExerciseTag, TagSelector } from "@/components/exercises/tag-selector";

interface NewExerciseFormProps {
  availableTags: ExerciseTag[];
}

export function NewExerciseForm({ availableTags }: NewExerciseFormProps) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [variants, setVariants] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function addVariant() {
    setVariants((currentVariants) => [...currentVariants, ""]);
  }

  function removeVariant(index: number) {
    setVariants((currentVariants) =>
      currentVariants.filter((_, variantIndex) => variantIndex !== index),
    );
  }

  function updateVariant(index: number, value: string) {
    setVariants((currentVariants) =>
      currentVariants.map((variant, variantIndex) =>
        variantIndex === index ? value : variant,
      ),
    );
  }

  function resetForm() {
    setName("");
    setDescription("");
    setMinAge("");
    setMaxAge("");
    setVariants([]);
    setSelectedTagIds([]);
    setError(null);
    setIsLoading(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError(null);

    const trimmedName = name.trim();
    const parsedMinAge = Number(minAge);
    const parsedMaxAge = Number(maxAge);

    if (!trimmedName) {
      setError("Inserisci il nome dell'esercizio.");
      return;
    }

    if (
      !Number.isInteger(parsedMinAge) ||
      !Number.isInteger(parsedMaxAge) ||
      parsedMinAge < 0 ||
      parsedMaxAge < parsedMinAge
    ) {
      setError("Inserisci un intervallo di età valido.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      const { data: exercise, error: insertError } = await supabase
        .from("exercises")
        .insert({
          name: trimmedName,
          description: description.trim() || null,
          min_age: parsedMinAge,
          max_age: parsedMaxAge,
        })
        .select("id")
        .single();

      if (insertError) {
        throw insertError;
      }

      const validVariants = variants
        .map((variant) => variant.trim())
        .filter((variant) => variant.length > 0);

      if (validVariants.length > 0) {
        const { error: variantsError } = await supabase
          .from("exercise_variants")
          .insert(
            validVariants.map((variant) => ({
              exercise_id: exercise.id,
              variant,
            })),
          );

        if (variantsError) {
          throw variantsError;
        }
      }

      if (selectedTagIds.length > 0) {
        const { error: tagsError } = await supabase
          .from("exercise_tags")
          .insert(
            selectedTagIds.map((tagId) => ({
              exercise_id: exercise.id,
              tag_id: tagId,
            })),
          );

        if (tagsError) {
          throw tagsError;
        }
      }

      resetForm();
      router.replace("/protected/exercises");
    } catch (submitError) {
      console.error("Exercise creation failed:", submitError);

      setError(
        submitError instanceof Error
          ? submitError.message
          : "Errore durante la creazione dell'esercizio.",
      );

      setIsLoading(false);
    }
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
            Aggiungi eventuali varianti dell&apos;esercizio.
          </p>
        </div>

        {variants.map((variant, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={variant}
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
          {isLoading ? "Salvataggio..." : "Salva esercizio"}
        </Button>

        <Button type="button" variant="outline" asChild>
          <Link href="/protected/exercises">Annulla</Link>
        </Button>
      </div>
    </form>
  );
}
