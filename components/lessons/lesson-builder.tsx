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

  const newItemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const itemToScrollTo = useRef<string | null>(null);

  function createKey(prefix: string) {
    keyCounter.current += 1;

    return `${prefix}-${keyCounter.current}`;
  }

  const [title, setTitle] = useState(lessonTitle);

  const [lessonItems, setLessonItems] = useState<LessonItem[]>(() => {
    const positionedItems: {
      position: number;

      item: LessonItem;
    }[] = [];

    initialBlocks.forEach((block) => {
      const key = `existing-block-${block.id}`;

      positionedItems.push({
        position: block.position,

        item: {
          type: "block",

          key,

          block: {
            key,

            name: block.name,

            exercises: [...block.lesson_exercises]

              .sort((a, b) => a.position - b.position)

              .map((lessonExercise) => ({
                key: `existing-exercise-${lessonExercise.id}`,

                exerciseId: lessonExercise.exercise_id,

                variantId: lessonExercise.variant_id,
              })),
          },
        },
      });
    });

    initialUnblockedExercises.forEach((exercise) => {
      const key = `existing-unblocked-${exercise.id}`;

      positionedItems.push({
        position: exercise.position,

        item: {
          type: "exercise",

          key,

          exercise: {
            key,

            exerciseId: exercise.exercise_id,

            variantId: exercise.variant_id,
          },
        },
      });
    });

    return positionedItems

      .sort((a, b) => a.position - b.position)

      .map((entry) => entry.item);
  });

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

  const [collapsedItemKeys, setCollapsedItemKeys] = useState<Set<string>>(
    () => new Set(),
  );

  function toggleCollapsed(itemKey: string) {
    setCollapsedItemKeys((current) => {
      const next = new Set(current);

      if (next.has(itemKey)) {
        next.delete(itemKey);
      } else {
        next.add(itemKey);
      }

      return next;
    });
  }

  const blocks = useMemo(
    () =>
      lessonItems

        .filter((item): item is BlockLessonItem => item.type === "block")

        .map((item) => item.block),

    [lessonItems],
  );

  const totalExercises = useMemo(
    () =>
      lessonItems.reduce((total, item) => {
        if (item.type === "exercise") {
          return total + 1;
        }

        return total + item.block.exercises.length;
      }, 0),

    [lessonItems],
  );

  useEffect(() => {
    const itemKey = itemToScrollTo.current;

    if (!itemKey) {
      return;
    }

    const element = newItemRefs.current[itemKey];

    if (!element) {
      return;
    }

    element.scrollIntoView({
      behavior: "smooth",

      block: "center",
    });

    itemToScrollTo.current = null;
  }, [lessonItems]);

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

  const visibleTags = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("it");

    if (!normalizedSearch) {
      return availableTags;
    }

    return availableTags.filter(
      (tag) =>
        selectedTagIds.includes(tag.id) ||
        tag.name.toLocaleLowerCase("it").includes(normalizedSearch),
    );
  }, [availableTags, search, selectedTagIds]);

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
          .includes(normalizedSearch) ||
        exercise.exercise_tags.some((exerciseTag) =>
          exerciseTag.tags.name
            .toLocaleLowerCase("it")
            .includes(normalizedSearch),
        );

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

    itemToScrollTo.current = key;

    setLessonItems((current) => [
      ...current,

      {
        type: "block",

        key,

        block: {
          key,

          name: "Nuovo blocco",

          exercises: [],
        },
      },
    ]);

    setMessage(null);
  }

  function renameBlock(blockKey: string, name: string) {
    setLessonItems((current) =>
      current.map((item) => {
        if (item.type !== "block" || item.key !== blockKey) {
          return item;
        }

        return {
          ...item,

          block: {
            ...item.block,

            name,
          },
        };
      }),
    );
  }

  function removeBlock(blockKey: string) {
    const item = lessonItems.find(
      (lessonItem) =>
        lessonItem.type === "block" && lessonItem.key === blockKey,
    );

    if (!item || item.type !== "block") {
      return;
    }

    if (
      !window.confirm(
        `Vuoi rimuovere il blocco "${item.block.name}" dalla lezione?`,
      )
    ) {
      return;
    }

    setLessonItems((current) =>
      current.filter((lessonItem) => lessonItem.key !== blockKey),
    );
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

    setLessonItems((current) => {
      if (target === "unblocked") {
        return [
          ...current,

          {
            type: "exercise",

            key: selectedExercise.key,

            exercise: selectedExercise,
          },
        ];
      }

      return current.map((item) => {
        if (item.type !== "block" || item.key !== target) {
          return item;
        }

        return {
          ...item,

          block: {
            ...item.block,

            exercises: [...item.block.exercises, selectedExercise],
          },
        };
      });
    });
  }

  function quickAddExercise(exerciseId: string) {
    addExerciseToDestination(exerciseId, destination);

    closeExerciseModal();

    setMessage(null);
  }

  function addCheckedExercises() {
    const exerciseIds = [...checkedExerciseIds];

    setLessonItems((current) => {
      const selectedExercises = exerciseIds.map((exerciseId) => ({
        key: createKey("exercise"),

        exerciseId,

        variantId: null,
      }));

      if (destination === "unblocked") {
        return [
          ...current,

          ...selectedExercises.map(
            (exercise): ExerciseLessonItem => ({
              type: "exercise",

              key: exercise.key,

              exercise,
            }),
          ),
        ];
      }

      return current.map((item) => {
        if (item.type !== "block" || item.key !== destination) {
          return item;
        }

        return {
          ...item,

          block: {
            ...item.block,

            exercises: [...item.block.exercises, ...selectedExercises],
          },
        };
      });
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

  function removeExercise(exerciseKey: string) {
    setLessonItems((current) => {
      const withoutTopLevelExercise = current.filter(
        (item) =>
          !(item.type === "exercise" && item.exercise.key === exerciseKey),
      );

      return withoutTopLevelExercise.map((item) => {
        if (item.type !== "block") {
          return item;
        }

        return {
          ...item,

          block: {
            ...item.block,

            exercises: item.block.exercises.filter(
              (exercise) => exercise.key !== exerciseKey,
            ),
          },
        };
      });
    });
  }

  function updateExerciseVariant(exerciseKey: string, variantId: string) {
    setLessonItems((current) =>
      current.map((item) => {
        if (item.type === "exercise") {
          if (item.exercise.key !== exerciseKey) {
            return item;
          }

          return {
            ...item,

            exercise: {
              ...item.exercise,

              variantId: variantId || null,
            },
          };
        }

        return {
          ...item,

          block: {
            ...item.block,

            exercises: item.block.exercises.map((exercise) =>
              exercise.key === exerciseKey
                ? {
                    ...exercise,

                    variantId: variantId || null,
                  }
                : exercise,
            ),
          },
        };
      }),
    );
  }

  function moveTopLevelItem(itemKey: string, direction: -1 | 1) {
    setLessonItems((current) => {
      const index = current.findIndex((item) => item.key === itemKey);

      if (index < 0) {
        return current;
      }

      const newIndex = index + direction;

      if (newIndex < 0 || newIndex >= current.length) {
        return current;
      }

      const reordered = [...current];
      const [moved] = reordered.splice(index, 1);
      reordered.splice(newIndex, 0, moved);

      return reordered;
    });
  }

  function moveBlockExercise(
    blockKey: string,
    exerciseKey: string,
    direction: -1 | 1,
  ) {
    setLessonItems((current) =>
      current.map((item) => {
        if (item.type !== "block" || item.key !== blockKey) {
          return item;
        }

        const index = item.block.exercises.findIndex(
          (exercise) => exercise.key === exerciseKey,
        );

        if (index < 0) {
          return item;
        }

        const newIndex = index + direction;

        if (newIndex < 0 || newIndex >= item.block.exercises.length) {
          return item;
        }

        const reordered = [...item.block.exercises];
        const [moved] = reordered.splice(index, 1);
        reordered.splice(newIndex, 0, moved);

        return {
          ...item,
          block: {
            ...item.block,
            exercises: reordered,
          },
        };
      }),
    );
  }

  function changeExerciseDestination(
    exerciseKey: string,
    target: ExerciseDestination,
  ) {
    setLessonItems((current) => {
      let selectedExercise: SelectedExercise | null = null;
      let sourceBlockKey: string | null = null;

      for (const item of current) {
        if (item.type === "exercise" && item.exercise.key === exerciseKey) {
          selectedExercise = item.exercise;
          break;
        }

        if (item.type === "block") {
          const exercise = item.block.exercises.find(
            (candidate) => candidate.key === exerciseKey,
          );

          if (exercise) {
            selectedExercise = exercise;
            sourceBlockKey = item.key;
            break;
          }
        }
      }

      if (!selectedExercise) {
        return current;
      }

      if (target === "unblocked" && sourceBlockKey === null) {
        return current;
      }

      if (target !== "unblocked" && target === sourceBlockKey) {
        return current;
      }

      const withoutExercise = current
        .filter(
          (item) =>
            !(item.type === "exercise" && item.exercise.key === exerciseKey),
        )
        .map((item) => {
          if (item.type !== "block") {
            return item;
          }

          return {
            ...item,
            block: {
              ...item.block,
              exercises: item.block.exercises.filter(
                (exercise) => exercise.key !== exerciseKey,
              ),
            },
          };
        });

      if (target === "unblocked") {
        const sourceBlockIndex = withoutExercise.findIndex(
          (item) => item.type === "block" && item.key === sourceBlockKey,
        );

        const insertionIndex =
          sourceBlockIndex >= 0 ? sourceBlockIndex + 1 : withoutExercise.length;

        const next = [...withoutExercise];
        next.splice(insertionIndex, 0, {
          type: "exercise",
          key: selectedExercise.key,
          exercise: selectedExercise,
        });

        return next;
      }

      return withoutExercise.map((item) => {
        if (item.type !== "block" || item.key !== target) {
          return item;
        }

        return {
          ...item,
          block: {
            ...item.block,
            exercises: [...item.block.exercises, selectedExercise],
          },
        };
      });
    });
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

    itemToScrollTo.current = key;

    setLessonItems((current) => [
      ...current,

      {
        type: "block",

        key,

        block: {
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

    const currentBlocks = lessonItems.filter(
      (item): item is BlockLessonItem => item.type === "block",
    );

    if (currentBlocks.some((item) => !item.block.name.trim())) {
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

    for (
      let topLevelPosition = 0;
      topLevelPosition < lessonItems.length;
      topLevelPosition++
    ) {
      const item = lessonItems[topLevelPosition];

      if (item.type === "exercise") {
        const { error } = await supabase.from("lesson_exercises").insert({
          lesson_id: lessonId,

          lesson_block_id: null,

          exercise_id: item.exercise.exerciseId,

          variant_id: item.exercise.variantId,

          position: 0,

          lesson_position: topLevelPosition,
        });

        if (error) {
          setMessage("Errore durante il salvataggio degli esercizi.");

          setIsSaving(false);

          return;
        }

        continue;
      }

      const { data: insertedBlock, error: blockError } = await supabase

        .from("lesson_blocks")

        .insert({
          lesson_id: lessonId,

          name: item.block.name.trim(),

          position: topLevelPosition,
        })

        .select("id")

        .single();

      if (blockError || !insertedBlock) {
        setMessage("Errore durante il salvataggio dei blocchi.");

        setIsSaving(false);

        return;
      }

      if (item.block.exercises.length === 0) {
        continue;
      }

      const rows = item.block.exercises.map((exercise, position) => ({
        lesson_id: lessonId,

        lesson_block_id: insertedBlock.id,

        exercise_id: exercise.exerciseId,

        variant_id: exercise.variantId,

        position,

        lesson_position: null,
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

      <section className="space-y-2">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-semibold">Struttura della lezione</h2>
            <p className="text-sm text-muted-foreground">
              Usa le frecce per ordinare blocchi ed esercizi.
            </p>
          </div>

          <Button type="button" variant="outline" size="sm" onClick={addBlock}>
            + Nuovo blocco
          </Button>
        </div>

        {lessonItems.length === 0 ? (
          <div className="rounded-lg border border-dashed px-4 py-5 text-center">
            <p className="text-sm text-muted-foreground">
              La lezione è vuota. Aggiungi un esercizio o un blocco.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {lessonItems.map((item, index) => {
              const isCollapsed = collapsedItemKeys.has(item.key);

              if (item.type === "exercise") {
                const exercise = exercises.find(
                  (candidate) => candidate.id === item.exercise.exerciseId,
                );

                if (!exercise) {
                  return null;
                }

                return (
                  <div
                    key={item.key}
                    ref={(element) => {
                      newItemRefs.current[item.key] = element;
                    }}
                    className="overflow-hidden rounded-lg border border-border bg-background"
                  >
                    <ExerciseRow
                      exercise={exercise}
                      selectedExercise={item.exercise}
                      blocks={blocks}
                      destination="unblocked"
                      canMoveUp={index > 0}
                      canMoveDown={index < lessonItems.length - 1}
                      onMoveUp={() => moveTopLevelItem(item.key, -1)}
                      onMoveDown={() => moveTopLevelItem(item.key, 1)}
                      onDestinationChange={(target) =>
                        changeExerciseDestination(item.exercise.key, target)
                      }
                      onRemove={() => removeExercise(item.exercise.key)}
                      onVariantChange={(variantId) =>
                        updateExerciseVariant(item.exercise.key, variantId)
                      }
                      standalone
                      collapsed={isCollapsed}
                      onToggleCollapsed={() => toggleCollapsed(item.key)}
                    />
                  </div>
                );
              }

              return (
                <div
                  key={item.key}
                  ref={(element) => {
                    newItemRefs.current[item.key] = element;
                  }}
                  className="overflow-hidden rounded-lg border border-border bg-background"
                >
                  <div className="flex flex-wrap items-center gap-2 bg-accent px-2.5 py-2">
                    <MoveButtons
                      canMoveUp={index > 0}
                      canMoveDown={index < lessonItems.length - 1}
                      onMoveUp={() => moveTopLevelItem(item.key, -1)}
                      onMoveDown={() => moveTopLevelItem(item.key, 1)}
                      upLabel={`Sposta il blocco ${item.block.name} in alto`}
                      downLabel={`Sposta il blocco ${item.block.name} in basso`}
                    />

                    <Input
                      value={item.block.name}
                      onChange={(event) =>
                        renameBlock(item.key, event.target.value)
                      }
                      className="h-8 min-w-48 flex-1 bg-background font-semibold"
                      aria-label="Nome del blocco"
                    />

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => void saveBlockAsReusable(item.block)}
                    >
                      Salva blocco
                    </Button>

                    <button
                      type="button"
                      onClick={() => toggleCollapsed(item.key)}
                      className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border bg-background text-sm text-muted-foreground hover:text-foreground"
                      aria-label={
                        isCollapsed
                          ? `Espandi il blocco ${item.block.name}`
                          : `Riduci il blocco ${item.block.name}`
                      }
                      title={isCollapsed ? "Espandi blocco" : "Riduci blocco"}
                    >
                      {isCollapsed ? "▼" : "▲"}
                    </button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8"
                      onClick={() => removeBlock(item.key)}
                    >
                      Rimuovi
                    </Button>
                  </div>

                  {!isCollapsed && (
                    <div className="space-y-1.5 border-t border-border px-2.5 py-2">
                      {item.block.exercises.length === 0 ? (
                        <p className="rounded-md border border-dashed px-3 py-2 text-center text-sm text-muted-foreground">
                          Nessun esercizio nel blocco.
                        </p>
                      ) : (
                        item.block.exercises.map(
                          (selectedExercise, exerciseIndex) => {
                            const exercise = exercises.find(
                              (candidate) =>
                                candidate.id === selectedExercise.exerciseId,
                            );

                            if (!exercise) {
                              return null;
                            }

                            return (
                              <div
                                key={selectedExercise.key}
                                className="rounded-md border border-border bg-background"
                              >
                                <ExerciseRow
                                  exercise={exercise}
                                  selectedExercise={selectedExercise}
                                  blocks={blocks}
                                  destination={item.key}
                                  canMoveUp={exerciseIndex > 0}
                                  canMoveDown={
                                    exerciseIndex <
                                    item.block.exercises.length - 1
                                  }
                                  onMoveUp={() =>
                                    moveBlockExercise(
                                      item.key,
                                      selectedExercise.key,
                                      -1,
                                    )
                                  }
                                  onMoveDown={() =>
                                    moveBlockExercise(
                                      item.key,
                                      selectedExercise.key,
                                      1,
                                    )
                                  }
                                  onDestinationChange={(target) =>
                                    changeExerciseDestination(
                                      selectedExercise.key,
                                      target,
                                    )
                                  }
                                  onRemove={() =>
                                    removeExercise(selectedExercise.key)
                                  }
                                  onVariantChange={(variantId) =>
                                    updateExerciseVariant(
                                      selectedExercise.key,
                                      variantId,
                                    )
                                  }
                                />
                              </div>
                            );
                          },
                        )
                      )}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => openExerciseModal(item.key)}
                      >
                        + Aggiungi esercizio
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
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
                  placeholder="Cerca esercizio o tag..."
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

                {visibleTags.map((tag) => (
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
                        className="h-5 w-5 shrink-0 cursor-pointer"
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

interface MoveButtonsProps {
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  upLabel: string;
  downLabel: string;
}

function MoveButtons({
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  upLabel,
  downLabel,
}: MoveButtonsProps) {
  return (
    <div className="flex shrink-0 flex-col overflow-hidden rounded-md border bg-background">
      <button
        type="button"
        disabled={!canMoveUp}
        onClick={onMoveUp}
        className="flex h-6 w-7 cursor-pointer items-center justify-center text-[10px] hover:bg-muted disabled:cursor-default disabled:opacity-25"
        aria-label={upLabel}
        title={upLabel}
      >
        ▲
      </button>

      <button
        type="button"
        disabled={!canMoveDown}
        onClick={onMoveDown}
        className="flex h-6 w-7 cursor-pointer items-center justify-center border-t text-[10px] hover:bg-muted disabled:cursor-default disabled:opacity-25"
        aria-label={downLabel}
        title={downLabel}
      >
        ▼
      </button>
    </div>
  );
}

interface ExerciseRowProps {
  exercise: LessonBuilderExercise;
  selectedExercise: SelectedExercise;
  blocks: LessonBlock[];
  destination: ExerciseDestination;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDestinationChange: (target: ExerciseDestination) => void;
  onRemove: () => void;
  onVariantChange: (variantId: string) => void;
  standalone?: boolean;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

function ExerciseRow({
  exercise,
  selectedExercise,
  blocks,
  destination,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onDestinationChange,
  onRemove,
  onVariantChange,
  standalone = false,
  collapsed = false,
  onToggleCollapsed,
}: ExerciseRowProps) {
  return (
    <div className="bg-background">
      <div
        className={
          standalone
            ? "flex items-center gap-2 bg-muted/60 px-2.5 py-2"
            : "flex items-center gap-2 px-2.5 py-1.5"
        }
      >
        <MoveButtons
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          upLabel={`Sposta ${exercise.name} in alto`}
          downLabel={`Sposta ${exercise.name} in basso`}
        />

        <span className="min-w-0 flex-1 text-sm font-medium">
          {exercise.name}
        </span>

        {!collapsed && (
          <select
            value={destination}
            onChange={(event) =>
              onDestinationChange(event.target.value as ExerciseDestination)
            }
            className="max-w-44 cursor-pointer rounded-md border bg-background px-2 py-1.5 text-xs"
            aria-label={`Destinazione di ${exercise.name}`}
            title="Sposta esercizio"
          >
            <option value="unblocked">Fuori dai blocchi</option>

            {blocks.map((block) => (
              <option key={block.key} value={block.key}>
                {block.name}
              </option>
            ))}
          </select>
        )}

        {standalone && onToggleCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border bg-background text-sm text-muted-foreground hover:text-foreground"
            aria-label={
              collapsed ? `Espandi ${exercise.name}` : `Riduci ${exercise.name}`
            }
            title={collapsed ? "Espandi esercizio" : "Riduci esercizio"}
          >
            {collapsed ? "▼" : "▲"}
          </button>
        )}

        <button
          type="button"
          onClick={onRemove}
          className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border bg-background text-lg text-muted-foreground hover:text-foreground"
          aria-label={`Rimuovi ${exercise.name}`}
          title="Rimuovi dalla lezione"
        >
          −
        </button>
      </div>

      {!collapsed && exercise.exercise_variants.length > 0 && (
        <div
          className={
            standalone
              ? "border-t border-border bg-background px-2.5 py-2"
              : "border-t border-border px-2.5 py-1.5"
          }
        >
          <select
            value={selectedExercise.variantId ?? ""}
            onChange={(event) => onVariantChange(event.target.value)}
            className="w-full cursor-pointer rounded-md border bg-background px-2 py-1.5 text-sm"
            aria-label={`Variante di ${exercise.name}`}
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
  );
}
