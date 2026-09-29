import {
  InitialLessonExercise,
  LessonBuilder,
  LessonBuilderExercise,
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
      lesson_exercises (
        id,
        exercise_id,
        variant_id,
        position
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

  let favouriteExerciseIds: string[] = [];

  if (user) {
    const { data: favourites } = await supabase
      .from("user_favourite_exercises")
      .select("exercise_id")
      .eq("user_id", user.id);

    if (favourites) {
      favouriteExerciseIds = favourites.map(
        (favourite) => favourite.exercise_id,
      );
    }
  }

  const normalizedExercises: LessonBuilderExercise[] = exercises.map(
    (exercise) => ({
      ...exercise,
      exercise_tags: exercise.exercise_tags.flatMap((exerciseTag) =>
        exerciseTag.tags.map((tag) => ({
          tags: tag,
        })),
      ),
    }),
  );

  return (
    <LessonBuilder
      lessonId={lesson.id}
      lessonTitle={lesson.title}
      exercises={normalizedExercises}
      initialLessonExercises={
        lesson.lesson_exercises as InitialLessonExercise[]
      }
      favouriteExerciseIds={favouriteExerciseIds}
    />
  );
}
