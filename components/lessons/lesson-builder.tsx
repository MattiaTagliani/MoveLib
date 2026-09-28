"use client";

import { DragDropProvider } from "@dnd-kit/react";
import { isSortable, useSortable } from "@dnd-kit/react/sortable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

interface ExerciseVariant {
  id: string;
  variant: string;
}

interface Tag {
  id: string;
  name: string;
}

export interface LessonBuilderExercise {
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

export interface InitialLessonExercise {
  id: string;
  exercise_id: string;
  variant_id: string | null;
  position: number;
}

interface SelectedExercise {
  key: string;
  exerciseId: string;
  variantId: string | null;
}

interface LessonBuilderProps {
  lessonId: string;
  lessonTitle: string;
  exercises: LessonBuilderExercise[];
  initialLessonExercises: InitialLessonExercise[];
  favouriteExerciseIds: string[];
}

interface SortableLessonExerciseProps {
  selectedExercise: SelectedExercise;
  exercise: LessonBuilderExercise;
  index: number;
  onRemove: () => void;
  onVariantChange: (variantId: string) => void;
}

export function LessonBuilder({
  lessonId,
  lessonTitle,
  exercises,
  initialLessonExercises,
  favouriteExerciseIds,
}: LessonBuilderProps) {
  const router = useRouter();

  const newExerciseCounter = useRef(0);

  const [title, setTitle] = useState(lessonTitle);

  const [selectedExercises, setSelectedExercises] = useState<
    SelectedExercise[]
  >(
    [...initialLessonExercises]
      .sort((a, b) => a.position - b.position)
      .map((lessonExercise) => ({
        key: `existing-${lessonExercise.id}`,
        exerciseId: lessonExercise.exercise_id,
        variantId: lessonExercise.variant_id,
      })),
  );

  const [search, setSearch] = useState("");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [showOnlyFavourites, setShowOnlyFavourites] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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

  function addExercise(exerciseId: string) {
    newExerciseCounter.current += 1;

    setSelectedExercises((currentExercises) => [
      ...currentExercises,
      {
        key: `new-${newExerciseCounter.current}`,
        exerciseId,
        variantId: null,
      },
    ]);

    setMessage(null);
  }

  function removeExercise(index: number) {
    setSelectedExercises((currentExercises) =>
      currentExercises.filter((_, exerciseIndex) => exerciseIndex !== index),
    );

    setMessage(null);
  }

  function updateVariant(index: number, variantId: string) {
    setSelectedExercises((currentExercises) =>
      currentExercises.map((exercise, exerciseIndex) =>
        exerciseIndex === index
          ? {
              ...exercise,
              variantId: variantId === "" ? null : variantId,
            }
          : exercise,
      ),
    );

    setMessage(null);
  }

  async function saveLesson() {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setMessage("Inserisci un titolo per la lezione.");
      return;
    }

    setIsSaving(true);
    setMessage(null);

    const supabase = createClient();

    const { error: lessonError } = await supabase
      .from("lessons")
      .update({
        title: trimmedTitle,
        updated_at: new Date().toISOString(),
      })
      .eq("id", lessonId);

    if (lessonError) {
      setMessage("Errore durante il salvataggio della lezione.");
      setIsSaving(false);
      return;
    }

    const { error: deleteError } = await supabase
      .from("lesson_exercises")
      .delete()
      .eq("lesson_id", lessonId);

    if (deleteError) {
      setMessage("Errore durante il salvataggio degli esercizi.");
      setIsSaving(false);
      return;
    }

    if (selectedExercises.length > 0) {
      const rows = selectedExercises.map((selectedExercise, index) => ({
        lesson_id: lessonId,
        exercise_id: selectedExercise.exerciseId,
        variant_id: selectedExercise.variantId,
        position: index,
      }));

      const { error: insertError } = await supabase
        .from("lesson_exercises")
        .insert(rows);

      if (insertError) {
        setMessage("Errore durante il salvataggio degli esercizi.");
        setIsSaving(false);
        return;
      }
    }

    setTitle(trimmedTitle);
    setMessage("Lezione salvata.");
    setIsSaving(false);

    router.refresh();
  }

  async function deleteLesson() {
    const confirmed = window.confirm(`Vuoi eliminare la lezione "${title}"?`);

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setMessage(null);

    const supabase = createClient();

    const { error } = await supabase
      .from("lessons")
      .delete()
      .eq("id", lessonId);

    if (error) {
      setMessage("Errore durante l'eliminazione della lezione.");
      setIsDeleting(false);
      return;
    }

    router.push("/protected/lessons");
    router.refresh();
  }

  const hasActiveFilters =
    search.trim() !== "" ||
    minAge !== "" ||
    maxAge !== "" ||
    selectedTagIds.length > 0 ||
    showOnlyFavourites;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full max-w-xl space-y-2">
          <label htmlFor="lesson-title" className="text-sm font-medium">
            Titolo della lezione
          </label>

          <Input
            id="lesson-title"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setMessage(null);
            }}
            className="text-lg font-semibold"
          />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => void deleteLesson()}
          disabled={isDeleting || isSaving}
        >
          {isDeleting ? "Eliminazione..." : "Elimina lezione"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-lg border p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Lezione</h2>

              <p className="text-sm text-muted-foreground">
                {selectedExercises.length === 1
                  ? "1 esercizio"
                  : `${selectedExercises.length} esercizi`}
              </p>
            </div>

            <Button
              type="button"
              onClick={() => void saveLesson()}
              disabled={isSaving || isDeleting}
            >
              {isSaving ? "Salvataggio..." : "Salva lezione"}
            </Button>
          </div>

          {message && (
            <p className="text-sm text-muted-foreground">{message}</p>
          )}

          {selectedExercises.length === 0 ? (
            <div className="rounded-md border border-dashed p-6">
              <p className="text-sm text-muted-foreground">
                Aggiungi gli esercizi dalla libreria.
              </p>
            </div>
          ) : (
            <DragDropProvider
              onDragEnd={(event) => {
                if (event.canceled) {
                  return;
                }

                const { source } = event.operation;

                if (!isSortable(source)) {
                  return;
                }

                const { initialIndex, index } = source;

                if (initialIndex === index) {
                  return;
                }

                setSelectedExercises((currentExercises) => {
                  const reorderedExercises = [...currentExercises];

                  const [movedExercise] = reorderedExercises.splice(
                    initialIndex,
                    1,
                  );

                  reorderedExercises.splice(index, 0, movedExercise);

                  return reorderedExercises;
                });

                setMessage(null);
              }}
            >
              <div className="space-y-3">
                {selectedExercises.map((selectedExercise, index) => {
                  const exercise = exercises.find(
                    (exercise) => exercise.id === selectedExercise.exerciseId,
                  );

                  if (!exercise) {
                    return null;
                  }

                  return (
                    <SortableLessonExercise
                      key={selectedExercise.key}
                      selectedExercise={selectedExercise}
                      exercise={exercise}
                      index={index}
                      onRemove={() => removeExercise(index)}
                      onVariantChange={(variantId) =>
                        updateVariant(index, variantId)
                      }
                    />
                  );
                })}
              </div>
            </DragDropProvider>
          )}
        </section>

        <section className="space-y-4 rounded-lg border p-4">
          <div>
            <h2 className="text-lg font-semibold">Libreria esercizi</h2>

            <p className="text-sm text-muted-foreground">
              Cerca e aggiungi esercizi alla lezione.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
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
                onChange={(event) => setMinAge(event.target.value)}
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
                onChange={(event) => setMaxAge(event.target.value)}
                placeholder="99"
                aria-label="Età massima"
                className="w-20"
              />
            </div>
          </div>

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

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearFilters}
            >
              Azzera filtri
            </Button>
          )}

          {filteredExercises.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nessun esercizio corrisponde ai filtri selezionati.
            </p>
          ) : (
            <div className="space-y-2">
              {filteredExercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="flex items-start justify-between gap-3 rounded-md border p-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{exercise.name}</p>

                      {favouriteExerciseIds.includes(exercise.id) && (
                        <span aria-label="Preferito" title="Preferito">
                          ★
                        </span>
                      )}
                    </div>

                    {exercise.description && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {exercise.description}
                      </p>
                    )}

                    <p className="mt-1 text-xs text-muted-foreground">
                      Età: {exercise.min_age}-{exercise.max_age}
                    </p>

                    {exercise.exercise_tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
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
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => addExercise(exercise.id)}
                    aria-label={`Aggiungi ${exercise.name}`}
                    title={`Aggiungi ${exercise.name}`}
                  >
                    +
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function SortableLessonExercise({
  selectedExercise,
  exercise,
  index,
  onRemove,
  onVariantChange,
}: SortableLessonExerciseProps) {
  const { ref, handleRef, isDragging } = useSortable({
    id: selectedExercise.key,
    index,
  });

  return (
    <div
      ref={ref}
      className={`rounded-md border p-3 ${isDragging ? "opacity-60" : ""}`}
    >
      <div className="flex items-start gap-3">
        <button
          ref={handleRef}
          type="button"
          className="cursor-grab touch-none rounded px-2 py-1 text-xl text-muted-foreground hover:bg-muted active:cursor-grabbing"
          aria-label={`Sposta ${exercise.name}`}
          title="Trascina per riordinare"
        >
          ⠿
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">
                {index + 1}. {exercise.name}
              </p>

              {exercise.description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {exercise.description}
                </p>
              )}
            </div>

            <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
              Rimuovi
            </Button>
          </div>

          {exercise.exercise_variants.length > 0 && (
            <div className="mt-3">
              <label
                htmlFor={`lesson-variant-${selectedExercise.key}`}
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                Variante
              </label>

              <select
                id={`lesson-variant-${selectedExercise.key}`}
                value={selectedExercise.variantId ?? ""}
                onChange={(event) => onVariantChange(event.target.value)}
                className="w-full rounded-md border bg-background px-2 py-2 text-sm"
              >
                <option value="">Nessuna variante</option>

                {exercise.exercise_variants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.variant}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
