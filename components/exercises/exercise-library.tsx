"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useMemo, useState } from "react";

interface ExerciseVariant {
  id: string;
  variant: string;
}

interface Tag {
  id: string;
  name: string;
}

export interface LibraryExercise {
  id: string;
  name: string;
  description: string | null;
  min_age: number;
  max_age: number;
  exercise_variants: ExerciseVariant[];
  exercise_tags: {
    tags: Tag;
  }[];
}

interface ExerciseLibraryProps {
  exercises: LibraryExercise[];
  initialFavouriteExerciseIds: string[];
}

export function ExerciseLibrary({
  exercises,
  initialFavouriteExerciseIds,
}: ExerciseLibraryProps) {
  const [search, setSearch] = useState("");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [favouriteExerciseIds, setFavouriteExerciseIds] = useState<string[]>(
    initialFavouriteExerciseIds,
  );
  const [showOnlyFavourites, setShowOnlyFavourites] = useState(false);

  const availableTags = useMemo(() => {
    const tagsById = new Map<string, Tag>();

    exercises.forEach((exercise) => {
      exercise.exercise_tags.forEach((exerciseTag) => {
        tagsById.set(exerciseTag.tags.id, exerciseTag.tags);
      });
    });

    return Array.from(tagsById.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "it"),
    );
  }, [exercises]);

  const filteredExercises = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("it");

    const parsedMinAge = minAge === "" ? 0 : Number(minAge);
    const parsedMaxAge = maxAge === "" ? 99 : Number(maxAge);

    return exercises.filter((exercise) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        exercise.name.toLocaleLowerCase("it").includes(normalizedSearch) ||
        exercise.description
          ?.toLocaleLowerCase("it")
          .includes(normalizedSearch);

      if (!matchesSearch) {
        return false;
      }

      if (exercise.max_age < parsedMinAge || exercise.min_age > parsedMaxAge) {
        return false;
      }

      const exerciseTagIds = exercise.exercise_tags.map(
        (exerciseTag) => exerciseTag.tags.id,
      );

      const matchesTags = selectedTagIds.every((tagId) =>
        exerciseTagIds.includes(tagId),
      );

      if (!matchesTags) {
        return false;
      }

      if (showOnlyFavourites && !favouriteExerciseIds.includes(exercise.id)) {
        return false;
      }

      return true;
    });
  }, [
    exercises,
    search,
    minAge,
    maxAge,
    selectedTagIds,
    showOnlyFavourites,
    favouriteExerciseIds,
  ]);

  function toggleTag(tagId: string) {
    setSelectedTagIds((currentTagIds) => {
      if (currentTagIds.includes(tagId)) {
        return currentTagIds.filter((selectedTagId) => selectedTagId !== tagId);
      }

      return [...currentTagIds, tagId];
    });
  }

  function clearFilters() {
    setSearch("");
    setMinAge("");
    setMaxAge("");
    setSelectedTagIds([]);
    setShowOnlyFavourites(false);
  }

  async function toggleFavourite(exerciseId: string) {
    const supabase = createClient();

    const isFavourite = favouriteExerciseIds.includes(exerciseId);

    if (isFavourite) {
      const { error } = await supabase
        .from("user_favourite_exercises")
        .delete()
        .eq("exercise_id", exerciseId);

      if (error) {
        return;
      }

      setFavouriteExerciseIds((currentIds) =>
        currentIds.filter((id) => id !== exerciseId),
      );

      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    const { error } = await supabase.from("user_favourite_exercises").insert({
      user_id: user.id,
      exercise_id: exerciseId,
    });

    if (error) {
      return;
    }

    setFavouriteExerciseIds((currentIds) => [...currentIds, exerciseId]);
  }

  const hasActiveFilters =
    search.trim() !== "" ||
    minAge !== "" ||
    maxAge !== "" ||
    selectedTagIds.length > 0 ||
    showOnlyFavourites;

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-lg border p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca esercizio..."
            className="sm:flex-1"
          />

          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap text-sm font-medium">Età</span>

            <Input
              type="number"
              min="0"
              max="99"
              value={minAge}
              onChange={(e) => setMinAge(e.target.value)}
              placeholder="0"
              aria-label="Età minima"
              className="w-20"
            />

            <span className="text-muted-foreground">-</span>

            <Input
              type="number"
              min="0"
              max="99"
              value={maxAge}
              onChange={(e) => setMaxAge(e.target.value)}
              placeholder="99"
              aria-label="Età massima"
              className="w-20"
            />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Filtri</p>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={showOnlyFavourites ? "default" : "outline"}
              size="sm"
              onClick={() => setShowOnlyFavourites((current) => !current)}
            >
              ★ Preferiti
            </Button>

            {availableTags.map((tag) => {
              const isSelected = selectedTagIds.includes(tag.id);

              return (
                <Button
                  key={tag.id}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleTag(tag.id)}
                >
                  {tag.name}
                </Button>
              );
            })}
          </div>
        </div>

        {hasActiveFilters && (
          <Button type="button" variant="ghost" onClick={clearFilters}>
            Azzera filtri
          </Button>
        )}
      </div>

      {filteredExercises.length === 0 ? (
        <div className="rounded-lg border p-6">
          <p className="text-muted-foreground">
            Nessun esercizio corrisponde ai filtri selezionati.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredExercises.map((exercise) => {
            const isFavourite = favouriteExerciseIds.includes(exercise.id);

            return (
              <div
                key={exercise.id}
                className="flex flex-col rounded-lg border p-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-semibold">{exercise.name}</h2>

                    <button
                      type="button"
                      onClick={() => void toggleFavourite(exercise.id)}
                      aria-label={
                        isFavourite
                          ? "Rimuovi dai preferiti"
                          : "Aggiungi ai preferiti"
                      }
                      title={
                        isFavourite
                          ? "Rimuovi dai preferiti"
                          : "Aggiungi ai preferiti"
                      }
                      className="text-xl leading-none transition-transform hover:scale-110"
                    >
                      {isFavourite ? "★" : "☆"}
                    </button>
                  </div>

                  {exercise.description && (
                    <p className="text-sm text-muted-foreground">
                      {exercise.description}
                    </p>
                  )}

                  <p className="text-sm">
                    Età: {exercise.min_age}-{exercise.max_age}
                  </p>
                </div>

                {exercise.exercise_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {exercise.exercise_tags.map((exerciseTag) => (
                      <span
                        key={exerciseTag.tags.id}
                        className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        {exerciseTag.tags.name}
                      </span>
                    ))}
                  </div>
                )}

                {exercise.exercise_variants.length > 0 && (
                  <div className="mt-4">
                    <label
                      htmlFor={`variants-${exercise.id}`}
                      className="mb-1 block text-xs font-medium text-muted-foreground"
                    >
                      Varianti ({exercise.exercise_variants.length})
                    </label>

                    <select
                      id={`variants-${exercise.id}`}
                      defaultValue=""
                      className="w-full rounded-md border bg-background px-2 py-2 text-sm"
                    >
                      <option value="" disabled>
                        Visualizza varianti
                      </option>

                      {exercise.exercise_variants.map((variant) => (
                        <option key={variant.id} value={variant.id}>
                          {variant.variant}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="mt-auto pt-4">
                  <Button asChild>
                    <Link href={`/protected/exercises/${exercise.id}`}>
                      Modifica
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
