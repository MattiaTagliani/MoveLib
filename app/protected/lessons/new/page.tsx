import { NewLessonForm } from "@/components/lessons/new-lesson-form";

export default function NewLessonPage() {
  return (
    <main className="w-full max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Nuova lezione</h1>

        <p className="mt-2 text-muted-foreground">
          Crea una nuova lezione. Potrai aggiungere gli esercizi nel passaggio
          successivo.
        </p>
      </div>

      <NewLessonForm />
    </main>
  );
}
