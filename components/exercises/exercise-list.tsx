import { createClient } from "@/lib/supabase/server";

export async function ExerciseList() {
  const supabase = await createClient();

  const { data: exercises, error } = await supabase
    .from("exercises")
    .select("id, name, description, min_age, max_age")
    .order("name");

  if (error) {
    return (
      <p className="text-sm text-red-500">
        Errore durante il caricamento degli esercizi.
      </p>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="rounded-lg border p-6">
        <p className="text-muted-foreground">
          Non ci sono ancora esercizi nella libreria.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {exercises.map((exercise) => (
        <div key={exercise.id} className="rounded-lg border p-5">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">{exercise.name}</h2>

            {exercise.description && (
              <p className="text-sm text-muted-foreground">
                {exercise.description}
              </p>
            )}

            <p className="text-sm">
              Età: {exercise.min_age}-{exercise.max_age}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
