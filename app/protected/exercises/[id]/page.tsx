import { EditExerciseForm } from "@/components/exercises/edit-exercise-form";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface ExercisePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ExercisePage({ params }: ExercisePageProps) {
  return (
    <main className="w-full max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Modifica esercizio</h1>

        <p className="mt-2 text-muted-foreground">
          Modifica i dati e le varianti dell'esercizio.
        </p>
      </div>

      <Suspense fallback={<p>Caricamento esercizio...</p>}>
        <ExerciseFormContent params={params} />
      </Suspense>
    </main>
  );
}

async function ExerciseFormContent({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: exercise, error } = await supabase
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
      tag_id
    )
  `,
    )
    .eq("id", id)
    .single();

  if (error || !exercise) {
    notFound();
  }

  const { data: tags, error: tagsError } = await supabase
    .from("tags")
    .select("id, name")
    .order("name");

  if (tagsError) {
    return (
      <p className="text-sm text-red-500">
        Errore durante il caricamento dei tag.
      </p>
    );
  }

  return <EditExerciseForm exercise={exercise} availableTags={tags} />;
}
