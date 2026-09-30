"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { move } from "@dnd-kit/helpers";
import { DragDropProvider, useDroppable } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { useRouter } from "next/navigation";
import {
  type ComponentProps,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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

type DragDropProps = ComponentProps<typeof DragDropProvider>;

interface DragItem {
  id: string;
}

type DragGroups = Record<string, DragItem[]>;

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
  const dragSnapshot = useRef<LessonItem[] | null>(null);

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

  function toDragGroups(items: LessonItem[]): DragGroups {
    const groups: DragGroups = {
      "lesson-top": items.map((item) => ({
        id: item.key,
      })),
    };

    items.forEach((item) => {
      if (item.type === "block") {
        groups[item.key] = item.block.exercises.map((exercise) => ({
          id: exercise.key,
        }));
      }
    });

    return groups;
  }

  function applyDragGroups(
    items: LessonItem[],
    groups: DragGroups,
  ): LessonItem[] {
    const blocksByKey = new Map<string, BlockLessonItem>();
    const exercisesByKey = new Map<string, SelectedExercise>();

    items.forEach((item) => {
      if (item.type === "block") {
        blocksByKey.set(item.key, item);

        item.block.exercises.forEach((exercise) => {
          exercisesByKey.set(exercise.key, exercise);
        });
      } else {
        exercisesByKey.set(item.exercise.key, item.exercise);
      }
    });

    const result: LessonItem[] = [];

    for (const dragItem of groups["lesson-top"] ?? []) {
      const block = blocksByKey.get(dragItem.id);

      if (block) {
        const blockExerciseKeys = groups[block.key] ?? [];

        result.push({
          ...block,
          block: {
            ...block.block,
            exercises: blockExerciseKeys
              .map((entry) => exercisesByKey.get(entry.id))
              .filter(
                (exercise): exercise is SelectedExercise =>
                  exercise !== undefined,
              ),
          },
        });

        continue;
      }

      const exercise = exercisesByKey.get(dragItem.id);

      if (exercise) {
        result.push({
          type: "exercise",
          key: exercise.key,
          exercise,
        });
      }
    }

    return result;
  }

  function handleDragStart() {
    dragSnapshot.current = lessonItems;
  }

  const handleDragOver: NonNullable<DragDropProps["onDragOver"]> = (event) => {
    const source = event.operation.source;

    if (!source || source.type === "block") {
      return;
    }

    setLessonItems((current) => {
      const groups = toDragGroups(current);
      const movedGroups = move(groups, event) as DragGroups;

      return applyDragGroups(current, movedGroups);
    });
  };

  const handleDragEnd: NonNullable<DragDropProps["onDragEnd"]> = (event) => {
    if (event.canceled) {
      if (dragSnapshot.current) {
        setLessonItems(dragSnapshot.current);
      }

      dragSnapshot.current = null;
      return;
    }

    const source = event.operation.source;

    if (!source) {
      dragSnapshot.current = null;
      return;
    }

    if (source.type === "exercise") {
      dragSnapshot.current = null;
      return;
    }

    setLessonItems((current) => {
      const groups = toDragGroups(current);

      const movedTopLevel = move(groups["lesson-top"], event) as DragItem[];

      return applyDragGroups(current, {
        ...groups,
        "lesson-top": movedTopLevel,
      });
    });

    dragSnapshot.current = null;
  };

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

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-semibold">Struttura della lezione</h2>
            <p className="text-sm text-muted-foreground">
              Trascina blocchi ed esercizi per organizzare la lezione.
            </p>
          </div>

          <Button type="button" variant="outline" onClick={addBlock}>
            + Nuovo blocco
          </Button>
        </div>

        <DragDropProvider
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="min-h-20">
            {lessonItems.length === 0 ? (
              <div className="rounded-xl border border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  La lezione è vuota. Aggiungi un esercizio o un blocco.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {lessonItems.map((item, index) => {
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
                      >
                        <SortableTopExercise
                          item={item}
                          index={index}
                          exercise={exercise}
                          onRemove={() => removeExercise(item.exercise.key)}
                          onVariantChange={(variantId) =>
                            updateExerciseVariant(item.exercise.key, variantId)
                          }
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
                    >
                      <SortableBlock
                        item={item}
                        index={index}
                        exercises={exercises}
                        onRename={(name) => renameBlock(item.key, name)}
                        onRemove={() => removeBlock(item.key)}
                        onSaveReusable={() =>
                          void saveBlockAsReusable(item.block)
                        }
                        onAddExercise={() => openExerciseModal(item.key)}
                        onRemoveExercise={removeExercise}
                        onVariantChange={updateExerciseVariant}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DragDropProvider>
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

interface SortableTopExerciseProps {
  item: ExerciseLessonItem;
  index: number;
  exercise: LessonBuilderExercise;
  onRemove: () => void;
  onVariantChange: (variantId: string) => void;
}

function SortableTopExercise({
  item,
  index,
  exercise,
  onRemove,
  onVariantChange,
}: SortableTopExerciseProps) {
  const sortable = useSortable({
    id: item.key,
    index,
    group: "lesson-top",
    type: "exercise",
    accept: ["exercise", "block"],
  });

  return (
    <div
      ref={sortable.ref}
      className={`rounded-xl border bg-card p-1 transition ${
        sortable.isDragging ? "opacity-50" : ""
      } ${sortable.isDropTarget ? "ring-2 ring-primary/40" : ""}`}
    >
      <ExerciseRow
        exercise={exercise}
        selectedExercise={item.exercise}
        dragHandleRef={sortable.handleRef}
        onRemove={onRemove}
        onVariantChange={onVariantChange}
      />
    </div>
  );
}

interface SortableBlockProps {
  item: BlockLessonItem;
  index: number;
  exercises: LessonBuilderExercise[];
  onRename: (name: string) => void;
  onRemove: () => void;
  onSaveReusable: () => void;
  onAddExercise: () => void;
  onRemoveExercise: (exerciseKey: string) => void;
  onVariantChange: (exerciseKey: string, variantId: string) => void;
}

function SortableBlock({
  item,
  index,
  exercises,
  onRename,
  onRemove,
  onSaveReusable,
  onAddExercise,
  onRemoveExercise,
  onVariantChange,
}: SortableBlockProps) {
  const sortable = useSortable({
    id: item.key,
    index,
    group: "lesson-top",
    type: "block",
    accept: "block",
  });

  return (
    <div
      ref={sortable.ref}
      className={`rounded-xl border bg-muted/20 transition ${
        sortable.isDragging ? "opacity-50" : ""
      } ${sortable.isDropTarget ? "ring-2 ring-primary/40" : ""}`}
    >
      <div className="flex flex-wrap items-center gap-2 border-b p-3">
        <button
          ref={sortable.handleRef}
          type="button"
          className="flex h-9 w-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-md border bg-background text-lg text-muted-foreground active:cursor-grabbing"
          aria-label={`Trascina il blocco ${item.block.name}`}
          title="Trascina blocco"
        >
          ⠿
        </button>

        <Input
          value={item.block.name}
          onChange={(event) => onRename(event.target.value)}
          className="min-w-48 flex-1 font-semibold"
          aria-label="Nome del blocco"
        />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onSaveReusable}
        >
          Salva blocco
        </Button>

        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          Rimuovi
        </Button>
      </div>

      <BlockExerciseDropZone blockKey={item.key}>
        <div className="space-y-2 p-3">
          {item.block.exercises.length === 0 ? (
            <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
              Trascina qui un esercizio oppure aggiungine uno.
            </p>
          ) : (
            item.block.exercises.map((selectedExercise, exerciseIndex) => {
              const exercise = exercises.find(
                (candidate) => candidate.id === selectedExercise.exerciseId,
              );

              if (!exercise) {
                return null;
              }

              return (
                <SortableBlockExercise
                  key={selectedExercise.key}
                  blockKey={item.key}
                  selectedExercise={selectedExercise}
                  exercise={exercise}
                  index={exerciseIndex}
                  onRemove={() => onRemoveExercise(selectedExercise.key)}
                  onVariantChange={(variantId) =>
                    onVariantChange(selectedExercise.key, variantId)
                  }
                />
              );
            })
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddExercise}
          >
            + Aggiungi esercizio
          </Button>
        </div>
      </BlockExerciseDropZone>
    </div>
  );
}

interface BlockExerciseDropZoneProps {
  blockKey: string;
  children: ReactNode;
}

function BlockExerciseDropZone({
  blockKey,
  children,
}: BlockExerciseDropZoneProps) {
  const { ref, isDropTarget } = useDroppable({
    id: blockKey,
    accept: "exercise",
    collisionPriority: -10,
  });

  return (
    <div
      ref={ref}
      className={`min-h-20 transition ${isDropTarget ? "bg-muted/50" : ""}`}
    >
      {children}
    </div>
  );
}

interface SortableBlockExerciseProps {
  blockKey: string;
  selectedExercise: SelectedExercise;
  exercise: LessonBuilderExercise;
  index: number;
  onRemove: () => void;
  onVariantChange: (variantId: string) => void;
}

function SortableBlockExercise({
  blockKey,
  selectedExercise,
  exercise,
  index,
  onRemove,
  onVariantChange,
}: SortableBlockExerciseProps) {
  const sortable = useSortable({
    id: selectedExercise.key,
    index,
    group: blockKey,
    type: "exercise",
    accept: "exercise",
    collisionPriority: 1,
  });

  return (
    <div
      ref={sortable.ref}
      className={`rounded-lg border bg-background transition ${
        sortable.isDragging ? "opacity-50" : ""
      } ${sortable.isDropTarget ? "ring-2 ring-primary/40" : ""}`}
    >
      <ExerciseRow
        exercise={exercise}
        selectedExercise={selectedExercise}
        dragHandleRef={sortable.handleRef}
        onRemove={onRemove}
        onVariantChange={onVariantChange}
      />
    </div>
  );
}

interface ExerciseRowProps {
  exercise: LessonBuilderExercise;
  selectedExercise: SelectedExercise;
  dragHandleRef?: (element: Element | null) => void;
  onRemove: () => void;
  onVariantChange: (variantId: string) => void;
}

function ExerciseRow({
  exercise,
  selectedExercise,
  dragHandleRef,
  onRemove,
  onVariantChange,
}: ExerciseRowProps) {
  return (
    <div className="rounded-lg bg-background px-3 py-2">
      <div className="flex items-center gap-2">
        <button
          ref={dragHandleRef}
          type="button"
          className="flex h-8 w-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md border text-base text-muted-foreground active:cursor-grabbing"
          aria-label={`Trascina ${exercise.name}`}
          title="Trascina esercizio"
        >
          ⠿
        </button>

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
