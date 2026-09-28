import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export async function LessonList() {
  const supabase = await createClient();

  const { data: lessons, error } = await supabase
    .from("lessons")
    .select(
      `
      id,
      title,
      updated_at,
      lesson_exercises (
        id
      )
    `,
    )
    .order("updated_at", { ascending: false });

  if (error) {
    return (
      <p className="text-sm text-red-500">
        Errore durante il caricamento delle lezioni.
      </p>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className="rounded-lg border p-6">
        <p className="text-muted-foreground">
          Non hai ancora creato nessuna lezione.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {lessons.map((lesson) => (
        <div
          key={lesson.id}
          className="flex items-center justify-between gap-4 rounded-lg border p-4"
        >
          <div>
            <h2 className="font-semibold">{lesson.title}</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {lesson.lesson_exercises.length === 1
                ? "1 esercizio"
                : `${lesson.lesson_exercises.length} esercizi`}
            </p>
          </div>

          <Button asChild>
            <Link href={`/protected/lessons/${lesson.id}`}>Modifica</Link>
          </Button>
        </div>
      ))}
    </div>
  );
}
