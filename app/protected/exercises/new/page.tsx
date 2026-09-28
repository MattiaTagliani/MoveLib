import { NewExerciseForm } from "@/components/exercises/new-exercise-form";
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";

export default function NewExercisePage() {
  return (
    <main className="w-full max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Nuovo esercizio</h1>

        <p className="mt-2 text-muted-foreground">
          Aggiungi un nuovo esercizio alla libreria.
        </p>
      </div>

      <Suspense fallback={<p>Caricamento...</p>}>
        <NewExerciseFormContent />
      </Suspense>
    </main>
  );
}

async function NewExerciseFormContent() {
  const supabase = await createClient();

  const { data: tags, error } = await supabase
    .from("tags")
    .select("id, name")
    .order("name");

  if (error) {
    return (
      <p className="text-sm text-red-500">
        Errore durante il caricamento dei tag.
      </p>
    );
  }

  return <NewExerciseForm availableTags={tags} />;
}
