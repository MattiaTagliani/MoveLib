import {
  InitialLessonBlock,
  InitialUnblockedExercise,
  LessonBuilder,
  LessonBuilderExercise,
  ReusableLessonBlock,
} from "@/components/lessons/lesson-builder";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface LessonPageProps {
  params: Promise<{ id: string }>;
}

export default function LessonPage({ params }: LessonPageProps) {
  return (
    <main className="w-full">
      <Suspense fallback={<p>Caricamento lezione...</p>}>
        <LessonContent params={params} />
      </Suspense>
    </main>
  );
}

async function LessonContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select(
      `
      id,
      title,
      lesson_blocks (
        id,
        name,
        position,
        lesson_exercises (
          id,
          exercise_id,
          variant_id,
          position
        )
      ),
      lesson_exercises (
        id,
        exercise_id,
        variant_id,
        position,
        lesson_block_id
      )
    `,
    )
    .eq("id", id)
    .single();

  if (lessonError || !lesson) {
    notFound();
  }

  const { data: exercises, error: exercisesError } = await supabase
    .from("exercises")
    .select(
      `
      id,
      name,
      description,
      min_age,
      max_age,
      exercise_variants (
        id,
        variant
      ),
      exercise_tags (
        tags (
          id,
          name
        )
      )
    `,
    )
    .order("name");

  if (exercisesError) {
    return (
      <p className="text-sm text-red-500">
        Errore durante il caricamento degli esercizi.
      </p>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: favourites } = await supabase
    .from("user_favourite_exercises")
    .select("exercise_id")
    .eq("user_id", user.id);

  const favouriteExerciseIds =
    favourites?.map((favourite) => favourite.exercise_id) ?? [];

  const { data: reusableBlocks } = await supabase
    .from("reusable_lesson_blocks")
    .select(
      `
      id,
      name,
      reusable_lesson_block_exercises (
        id,
        exercise_id,
        variant_id,
        position
      )
    `,
    )
    .eq("user_id", user.id)
    .order("name");

  const normalizedExercises: LessonBuilderExercise[] = exercises.map(
    (exercise) => ({
      ...exercise,
      exercise_tags: exercise.exercise_tags.map((exerciseTag) => ({
        tags: Array.isArray(exerciseTag.tags)
          ? exerciseTag.tags[0]
          : exerciseTag.tags,
      })),
    }),
  );

  const unblockedExercises = lesson.lesson_exercises
    .filter((lessonExercise) => lessonExercise.lesson_block_id === null)
    .map((lessonExercise) => ({
      id: lessonExercise.id,
      exercise_id: lessonExercise.exercise_id,
      variant_id: lessonExercise.variant_id,
      position: lessonExercise.position,
    }));

  return (
    <LessonBuilder
      lessonId={lesson.id}
      lessonTitle={lesson.title}
      exercises={normalizedExercises}
      initialBlocks={lesson.lesson_blocks as InitialLessonBlock[]}
      initialUnblockedExercises={
        unblockedExercises as InitialUnblockedExercise[]
      }
      reusableBlocks={(reusableBlocks ?? []) as ReusableLessonBlock[]}
      favouriteExerciseIds={favouriteExerciseIds}
    />
  );
}
