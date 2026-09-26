import { NewExerciseForm } from "@/components/exercises/new-exercise-form";

export default function NewExercisePage() {
  return (
    <main className="w-full max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Nuovo esercizio</h1>

        <p className="mt-2 text-muted-foreground">
          Aggiungi un nuovo esercizio alla libreria.
        </p>
      </div>

      <NewExerciseForm />
    </main>
  );
}
