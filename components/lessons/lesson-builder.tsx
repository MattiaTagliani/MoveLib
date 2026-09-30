"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

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

interface InitialLessonExercise {
  id: string;
  exercise_id: string;
  variant_id: string | null;
  position: number;
}

export interface InitialLessonBlock {
  id: string;
  name: string;
  position: number;
  lesson_exercises: InitialLessonExercise[];
}

export interface InitialUnblockedExercise {
  id: string;
  exercise_id: string;
  variant_id: string | null;
  position: number;
}

interface ReusableLessonBlockExercise {
  id: string;
  exercise_id: string;
  variant_id: string | null;
  position: number;
}

export interface ReusableLessonBlock {
  id: string;
  name: string;
  reusable_lesson_block_exercises: ReusableLessonBlockExercise[];
}

interface SelectedExercise {
  key: string;
  exerciseId: string;
  variantId: string | null;
}

interface LessonBlock {
  key: string;
  name: string;
  exercises: SelectedExercise[];
}

interface BlockLessonItem {
  type: "block";
  key: string;
  block: LessonBlock;
}

interface ExerciseLessonItem {
  type: "exercise";
  key: string;
  exercise: SelectedExercise;
}

type LessonItem = BlockLessonItem | ExerciseLessonItem;

interface LessonBuilderProps {
  lessonId: string;
  lessonTitle: string;
  exercises: LessonBuilderExercise[];
  initialBlocks: InitialLessonBlock[];
  initialUnblockedExercises: InitialUnblockedExercise[];
  reusableBlocks: ReusableLessonBlock[];
  favouriteExerciseIds: string[];
}

type ExerciseDestination = string | "unblocked";

export function LessonBuilder({
  lessonId,
  lessonTitle,
  exercises,
  initialBlocks,
  initialUnblockedExercises,
  reusableBlocks: initialReusableBlocks,
  favouriteExerciseIds,
}: LessonBuilderProps) {
  const router = useRouter();

  const keyCounter = useRef(0);
  const newBlockRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const blockToScrollTo = useRef<string | null>(null);

  function createKey(prefix: string) {
    keyCounter.current += 1;
    return `${prefix}-${keyCounter.current}`;
  }

  const [title, setTitle] = useState(lessonTitle);

  const [blocks, setBlocks] = useState<LessonBlock[]>(() =>
    [...initialBlocks]
      .sort((a, b) => a.position - b.position)
      .map((block) => ({
        key: `existing-block-${block.id}`,
        name: block.name,
        exercises: [...block.lesson_exercises]
          .sort((a, b) => a.position - b.position)
          .map((lessonExercise) => ({
            key: `existing-exercise-${lessonExercise.id}`,
            exerciseId: lessonExercise.exercise_id,
            variantId: lessonExercise.variant_id,
          })),
      })),
  );

  const [unblockedExercises, setUnblockedExercises] = useState<
    SelectedExercise[]
  >(() =>
    [...initialUnblockedExercises]
      .sort((a, b) => a.position - b.position)
      .map((exercise) => ({
        key: `existing-unblocked-${exercise.id}`,
        exerciseId: exercise.exercise_id,
        variantId: exercise.variant_id,
      })),
  );

  const [reusableBlocks, setReusableBlocks] = useState(initialReusableBlocks);

  const [exerciseModalOpen, setExerciseModalOpen] = useState(false);
  const [reusableModalOpen, setReusableModalOpen] = useState(false);

  const [destination, setDestination] =
    useState<ExerciseDestination>("unblocked");

  const [checkedExerciseIds, setCheckedExerciseIds] = useState<string[]>([]);

  const [search, setSearch] = useState("");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [showOnlyFavourites, setShowOnlyFavourites] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const blockKey = blockToScrollTo.current;

    if (!blockKey) {
      return;
    }

    const element = newBlockRefs.current[blockKey];

    if (!element) {
      return;
    }

    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    blockToScrollTo.current = null;
  }, [blocks]);

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

      if (!selectedTagIds.every((tagId) => exerciseTagIds.includes(tagId))) {
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

  const totalExercises =
    unblockedExercises.length +
    blocks.reduce((total, block) => total + block.exercises.length, 0);

  function resetExerciseSelection() {
    setCheckedExerciseIds([]);
  }

  function openExerciseModal(target: ExerciseDestination) {
    setDestination(target);
    resetExerciseSelection();
    setExerciseModalOpen(true);
  }

  function closeExerciseModal() {
    setExerciseModalOpen(false);
    resetExerciseSelection();
  }

  function toggleTag(tagId: string) {
    setSelectedTagIds((current) =>
      current.includes(tagId)
        ? current.filter((id) => id !== tagId)
        : [...current, tagId],
    );
  }

  function clearFilters() {
    setSearch("");
    setMinAge("");
    setMaxAge("");
    setSelectedTagIds([]);
    setShowOnlyFavourites(false);
  }

  function addBlock() {
    const key = createKey("new-block");

    blockToScrollTo.current = key;

    setBlocks((current) => [
      ...current,
      {
        key,
        name: "Nuovo blocco",
        exercises: [],
      },
    ]);

    setMessage(null);
  }

  function renameBlock(blockKey: string, name: string) {
    setBlocks((current) =>
      current.map((block) =>
        block.key === blockKey ? { ...block, name } : block,
      ),
    );
  }

  function moveBlock(index: number, direction: -1 | 1) {
    const newIndex = index + direction;

    if (newIndex < 0 || newIndex >= blocks.length) {
      return;
    }

    setBlocks((current) => {
      const reordered = [...current];
      const [moved] = reordered.splice(index, 1);
      reordered.splice(newIndex, 0, moved);
      return reordered;
    });
  }

  function removeBlock(blockKey: string) {
    const block = blocks.find((item) => item.key === blockKey);

    if (!block) {
      return;
    }

    if (
      !window.confirm(`Vuoi rimuovere il blocco "${block.name}" dalla lezione?`)
    ) {
      return;
    }

    setBlocks((current) => current.filter((item) => item.key !== blockKey));
  }

  function addExerciseToDestination(
    exerciseId: string,
    target: ExerciseDestination,
  ) {
    const selectedExercise: SelectedExercise = {
      key: createKey("exercise"),
      exerciseId,
      variantId: null,
    };

    if (target === "unblocked") {
      setUnblockedExercises((current) => [...current, selectedExercise]);

      return;
    }

    setBlocks((current) =>
      current.map((block) =>
        block.key === target
          ? {
              ...block,
              exercises: [...block.exercises, selectedExercise],
            }
          : block,
      ),
    );
  }

  function quickAddExercise(exerciseId: string) {
    addExerciseToDestination(exerciseId, destination);
    closeExerciseModal();
    setMessage(null);
  }

  function addCheckedExercises() {
    checkedExerciseIds.forEach((exerciseId) => {
      addExerciseToDestination(exerciseId, destination);
    });

    closeExerciseModal();
    setMessage(null);
  }

  function toggleCheckedExercise(exerciseId: string) {
    setCheckedExerciseIds((current) =>
      current.includes(exerciseId)
        ? current.filter((id) => id !== exerciseId)
        : [...current, exerciseId],
    );
  }

  function removeBlockExercise(blockKey: string, exerciseKey: string) {
    setBlocks((current) =>
      current.map((block) =>
        block.key === blockKey
          ? {
              ...block,
              exercises: block.exercises.filter(
                (exercise) => exercise.key !== exerciseKey,
              ),
            }
          : block,
      ),
    );
  }

  function removeUnblockedExercise(exerciseKey: string) {
    setUnblockedExercises((current) =>
      current.filter((exercise) => exercise.key !== exerciseKey),
    );
  }

  function updateBlockVariant(
    blockKey: string,
    exerciseKey: string,
    variantId: string,
  ) {
    setBlocks((current) =>
      current.map((block) =>
        block.key === blockKey
          ? {
              ...block,
              exercises: block.exercises.map((exercise) =>
                exercise.key === exerciseKey
                  ? {
                      ...exercise,
                      variantId: variantId || null,
                    }
                  : exercise,
              ),
            }
          : block,
      ),
    );
  }

  function updateUnblockedVariant(exerciseKey: string, variantId: string) {
    setUnblockedExercises((current) =>
      current.map((exercise) =>
        exercise.key === exerciseKey
          ? {
              ...exercise,
              variantId: variantId || null,
            }
          : exercise,
      ),
    );
  }

  async function saveBlockAsReusable(block: LessonBlock) {
    const name = block.name.trim();

    if (!name) {
      setMessage("Il blocco deve avere un nome.");
      return;
    }

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Sessione non valida.");
      return;
    }

    const { data: savedBlock, error } = await supabase
      .from("reusable_lesson_blocks")
      .insert({
        user_id: user.id,
        name,
      })
      .select("id, name")
      .single();

    if (error || !savedBlock) {
      setMessage("Errore durante il salvataggio del blocco.");
      return;
    }

    if (block.exercises.length > 0) {
      const rows = block.exercises.map((exercise, position) => ({
        reusable_lesson_block_id: savedBlock.id,
        exercise_id: exercise.exerciseId,
        variant_id: exercise.variantId,
        position,
      }));

      const { error: exercisesError } = await supabase
        .from("reusable_lesson_block_exercises")
        .insert(rows);

      if (exercisesError) {
        await supabase
          .from("reusable_lesson_blocks")
          .delete()
          .eq("id", savedBlock.id);

        setMessage("Errore durante il salvataggio del blocco.");
        return;
      }
    }

    setReusableBlocks((current) => [
      ...current,
      {
        id: savedBlock.id,
        name,
        reusable_lesson_block_exercises: block.exercises.map(
          (exercise, position) => ({
            id: createKey("local-reusable"),
            exercise_id: exercise.exerciseId,
            variant_id: exercise.variantId,
            position,
          }),
        ),
      },
    ]);

    setMessage(`Blocco "${name}" salvato.`);
  }

  function addReusableBlock(block: ReusableLessonBlock) {
    const key = createKey("reusable-block");

    blockToScrollTo.current = key;

    setBlocks((current) => [
      ...current,
      {
        key,
        name: block.name,
        exercises: [...block.reusable_lesson_block_exercises]
          .sort((a, b) => a.position - b.position)
          .map((exercise) => ({
            key: createKey("reusable-exercise"),
            exerciseId: exercise.exercise_id,
            variantId: exercise.variant_id,
          })),
      },
    ]);

    setReusableModalOpen(false);
  }

  async function deleteReusableBlock(block: ReusableLessonBlock) {
    if (
      !window.confirm(
        `Vuoi eliminare il blocco riutilizzabile "${block.name}"? Le copie già presenti nelle lezioni rimarranno invariate.`,
      )
    ) {
      return;
    }

    const supabase = createClient();

    const { error } = await supabase
      .from("reusable_lesson_blocks")
      .delete()
      .eq("id", block.id);

    if (error) {
      setMessage("Errore durante l'eliminazione del blocco.");
      return;
    }

    setReusableBlocks((current) =>
      current.filter((item) => item.id !== block.id),
    );
  }

  async function saveLesson() {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setMessage("Inserisci un titolo per la lezione.");
      return;
    }

    if (blocks.some((block) => !block.name.trim())) {
      setMessage("Tutti i blocchi devono avere un nome.");
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

    // Delete every old lesson exercise first.
    // This includes both blocked and unblocked exercises.
    const { error: deleteExercisesError } = await supabase
      .from("lesson_exercises")
      .delete()
      .eq("lesson_id", lessonId);

    if (deleteExercisesError) {
      setMessage("Errore durante il salvataggio degli esercizi.");
      setIsSaving(false);
      return;
    }

    const { error: deleteBlocksError } = await supabase
      .from("lesson_blocks")
      .delete()
      .eq("lesson_id", lessonId);

    if (deleteBlocksError) {
      setMessage("Errore durante il salvataggio dei blocchi.");
      setIsSaving(false);
      return;
    }

    if (unblockedExercises.length > 0) {
      const rows = unblockedExercises.map((exercise, position) => ({
        lesson_id: lessonId,
        lesson_block_id: null,
        exercise_id: exercise.exerciseId,
        variant_id: exercise.variantId,
        position,
      }));

      const { error } = await supabase.from("lesson_exercises").insert(rows);

      if (error) {
        setMessage("Errore durante il salvataggio degli esercizi.");
        setIsSaving(false);
        return;
      }
    }

    for (
      let blockPosition = 0;
      blockPosition < blocks.length;
      blockPosition++
    ) {
      const block = blocks[blockPosition];

      const { data: insertedBlock, error: blockError } = await supabase
        .from("lesson_blocks")
        .insert({
          lesson_id: lessonId,
          name: block.name.trim(),
          position: blockPosition,
        })
        .select("id")
        .single();

      if (blockError || !insertedBlock) {
        setMessage("Errore durante il salvataggio dei blocchi.");
        setIsSaving(false);
        return;
      }

      if (block.exercises.length === 0) {
        continue;
      }

      const rows = block.exercises.map((exercise, position) => ({
        lesson_id: lessonId,
        lesson_block_id: insertedBlock.id,
        exercise_id: exercise.exerciseId,
        variant_id: exercise.variantId,
        position,
      }));

      const { error } = await supabase.from("lesson_exercises").insert(rows);

      if (error) {
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
    if (!window.confirm(`Vuoi eliminare la lezione "${title}"?`)) {
      return;
    }

    setIsDeleting(true);

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
      <section className="border-b pb-5">
        <label
          htmlFor="lesson-title"
          className="mb-1 block text-sm font-medium"
        >
          Titolo della lezione
        </label>

        <Input
          id="lesson-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="max-w-xl text-lg font-semibold"
        />

        <p className="mt-2 text-sm text-muted-foreground">
          {blocks.length} {blocks.length === 1 ? "blocco" : "blocchi"} -{" "}
          {totalExercises} {totalExercises === 1 ? "esercizio" : "esercizi"}
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => openExerciseModal("unblocked")}
          className="flex min-h-20 items-center justify-between rounded-xl border p-4 text-left hover:bg-muted/40"
        >
          <span>
            <span className="block font-semibold">Esercizi</span>
            <span className="mt-1 block text-sm text-muted-foreground">
              Cerca e aggiungi esercizi alla lezione
            </span>
          </span>

          <span className="text-xl">+</span>
        </button>

        <button
          type="button"
          onClick={() => setReusableModalOpen(true)}
          className="flex min-h-20 items-center justify-between rounded-xl border p-4 text-left hover:bg-muted/40"
        >
          <span>
            <span className="block font-semibold">Blocchi salvati</span>
            <span className="mt-1 block text-sm text-muted-foreground">
              Riutilizza o elimina i tuoi blocchi
            </span>
          </span>

          <span className="text-xl">▦</span>
        </button>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-semibold">Struttura della lezione</h2>
            <p className="text-sm text-muted-foreground">
              Organizza gli esercizi in blocchi oppure lasciali liberi.
            </p>
          </div>

          <Button type="button" variant="outline" onClick={addBlock}>
            + Nuovo blocco
          </Button>
        </div>

        {blocks.map((block, blockIndex) => (
          <div
            key={block.key}
            ref={(element) => {
              newBlockRefs.current[block.key] = element;
            }}
            className="rounded-xl border bg-muted/20 p-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex shrink-0 flex-col overflow-hidden rounded-lg border">
                <button
                  type="button"
                  disabled={blockIndex === 0}
                  onClick={() => moveBlock(blockIndex, -1)}
                  className="flex h-7 w-8 items-center justify-center text-xs disabled:opacity-25"
                  aria-label="Sposta blocco in alto"
                >
                  ▲
                </button>

                <button
                  type="button"
                  disabled={blockIndex === blocks.length - 1}
                  onClick={() => moveBlock(blockIndex, 1)}
                  className="flex h-7 w-8 items-center justify-center border-t text-xs disabled:opacity-25"
                  aria-label="Sposta blocco in basso"
                >
                  ▼
                </button>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={block.name}
                    onChange={(event) =>
                      renameBlock(block.key, event.target.value)
                    }
                    className="font-semibold"
                    aria-label="Nome del blocco"
                  />

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void saveBlockAsReusable(block)}
                  >
                    Salva blocco
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBlock(block.key)}
                  >
                    Rimuovi
                  </Button>
                </div>

                <div className="mt-3 space-y-1">
                  {block.exercises.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nessun esercizio.
                    </p>
                  ) : (
                    block.exercises.map((selectedExercise, index) => {
                      const exercise = exercises.find(
                        (item) => item.id === selectedExercise.exerciseId,
                      );

                      if (!exercise) {
                        return null;
                      }

                      return (
                        <ExerciseRow
                          key={selectedExercise.key}
                          exercise={exercise}
                          selectedExercise={selectedExercise}
                          index={index}
                          onRemove={() =>
                            removeBlockExercise(block.key, selectedExercise.key)
                          }
                          onVariantChange={(variantId) =>
                            updateBlockVariant(
                              block.key,
                              selectedExercise.key,
                              variantId,
                            )
                          }
                        />
                      );
                    })
                  )}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => openExerciseModal(block.key)}
                >
                  + Aggiungi esercizio
                </Button>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-dashed p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold">Esercizi fuori dai blocchi</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Esercizi che appartengono alla lezione ma non a un blocco.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => openExerciseModal("unblocked")}
          >
            + Aggiungi esercizio
          </Button>
        </div>

        <div className="mt-3 space-y-1">
          {unblockedExercises.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessun esercizio.</p>
          ) : (
            unblockedExercises.map((selectedExercise, index) => {
              const exercise = exercises.find(
                (item) => item.id === selectedExercise.exerciseId,
              );

              if (!exercise) {
                return null;
              }

              return (
                <ExerciseRow
                  key={selectedExercise.key}
                  exercise={exercise}
                  selectedExercise={selectedExercise}
                  index={index}
                  onRemove={() => removeUnblockedExercise(selectedExercise.key)}
                  onVariantChange={(variantId) =>
                    updateUnblockedVariant(selectedExercise.key, variantId)
                  }
                />
              );
            })
          )}
        </div>
      </section>

      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <section className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Hai finito di preparare la lezione?
        </p>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void deleteLesson()}
            disabled={isSaving || isDeleting}
          >
            {isDeleting ? "Eliminazione..." : "Elimina lezione"}
          </Button>

          <Button
            type="button"
            onClick={() => void saveLesson()}
            disabled={isSaving || isDeleting}
          >
            {isSaving ? "Salvataggio..." : "Salva lezione"}
          </Button>
        </div>
      </section>

      {exerciseModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeExerciseModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="exercise-modal-title"
            className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border bg-background shadow-lg"
          >
            <div className="flex items-start justify-between gap-3 border-b p-4">
              <div>
                <h2 id="exercise-modal-title" className="font-semibold">
                  Aggiungi esercizi
                </h2>

                <p className="text-sm text-muted-foreground">
                  {destination === "unblocked"
                    ? "Aggiungi direttamente alla lezione."
                    : `Aggiungi a "${
                        blocks.find((block) => block.key === destination)
                          ?.name ?? "blocco"
                      }".`}
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={closeExerciseModal}
              >
                Chiudi
              </Button>
            </div>

            <div className="space-y-4 overflow-y-auto p-4">
              <div className="space-y-1">
                <label
                  htmlFor="exercise-destination"
                  className="text-sm font-medium"
                >
                  Destinazione
                </label>

                <select
                  id="exercise-destination"
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="unblocked">Direttamente nella lezione</option>

                  {blocks.map((block) => (
                    <option key={block.key} value={block.key}>
                      {block.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cerca esercizio..."
                  className="flex-1"
                />

                <div className="flex items-center gap-2">
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

                  <span>-</span>

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

                {availableTags.map((tag) => (
                  <Button
                    key={tag.id}
                    type="button"
                    variant={
                      selectedTagIds.includes(tag.id) ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => toggleTag(tag.id)}
                  >
                    {tag.name}
                  </Button>
                ))}
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

              <div className="space-y-2">
                {filteredExercises.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nessun esercizio trovato.
                  </p>
                ) : (
                  filteredExercises.map((exercise) => (
                    <div
                      key={exercise.id}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      <input
                        type="checkbox"
                        checked={checkedExerciseIds.includes(exercise.id)}
                        onChange={() => toggleCheckedExercise(exercise.id)}
                        aria-label={`Seleziona ${exercise.name}`}
                        className="h-5 w-5 shrink-0"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="font-medium">
                          {exercise.name}{" "}
                          {favouriteExerciseIds.includes(exercise.id)
                            ? "★"
                            : ""}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          Età: {exercise.min_age}-{exercise.max_age}
                        </p>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        onClick={() => quickAddExercise(exercise.id)}
                        aria-label={`Aggiungi ${exercise.name} e chiudi`}
                        title="Aggiungi e chiudi"
                      >
                        +
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4">
              <span className="text-sm text-muted-foreground">
                {checkedExerciseIds.length}{" "}
                {checkedExerciseIds.length === 1
                  ? "esercizio selezionato"
                  : "esercizi selezionati"}
              </span>

              <Button
                type="button"
                disabled={checkedExerciseIds.length === 0}
                onClick={addCheckedExercises}
              >
                Aggiungi selezionati
              </Button>
            </div>
          </div>
        </div>
      )}

      {reusableModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setReusableModalOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reusable-modal-title"
            className="w-full max-w-xl rounded-xl border bg-background shadow-lg"
          >
            <div className="flex items-start justify-between gap-3 border-b p-4">
              <div>
                <h2 id="reusable-modal-title" className="font-semibold">
                  Blocchi salvati
                </h2>

                <p className="text-sm text-muted-foreground">
                  Aggiungere un blocco crea una copia indipendente.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReusableModalOpen(false)}
              >
                Chiudi
              </Button>
            </div>

            <div className="max-h-[70vh] space-y-2 overflow-y-auto p-4">
              {reusableBlocks.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Non hai blocchi salvati.
                </p>
              ) : (
                reusableBlocks.map((block) => (
                  <div
                    key={block.id}
                    className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium">{block.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {block.reusable_lesson_block_exercises.length} esercizi
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => addReusableBlock(block)}
                      >
                        Aggiungi
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void deleteReusableBlock(block)}
                      >
                        Elimina
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ExerciseRowProps {
  exercise: LessonBuilderExercise;
  selectedExercise: SelectedExercise;
  index: number;
  onRemove: () => void;
  onVariantChange: (variantId: string) => void;
}

function ExerciseRow({
  exercise,
  selectedExercise,
  index,
  onRemove,
  onVariantChange,
}: ExerciseRowProps) {
  return (
    <div className="rounded-lg bg-background px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{index + 1}.</span>

        <span className="min-w-0 flex-1 text-sm font-medium">
          {exercise.name}
        </span>

        <button
          type="button"
          onClick={onRemove}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-lg text-muted-foreground hover:text-foreground"
          aria-label={`Rimuovi ${exercise.name}`}
          title="Rimuovi dalla lezione"
        >
          −
        </button>
      </div>

      {exercise.exercise_variants.length > 0 && (
        <select
          value={selectedExercise.variantId ?? ""}
          onChange={(event) => onVariantChange(event.target.value)}
          className="mt-2 w-full rounded-md border bg-background px-2 py-2 text-sm"
          aria-label={`Variante di ${exercise.name}`}
        >
          <option value="">Nessuna variante</option>

          {exercise.exercise_variants.map((variant) => (
            <option key={variant.id} value={variant.id}>
              {variant.variant}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
