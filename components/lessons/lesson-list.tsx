import {
  LessonLibrary,
  LibraryLesson,
} from "@/components/lessons/lesson-library";
import { createClient } from "@/lib/supabase/server";

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

  return <LessonLibrary lessons={lessons as LibraryLesson[]} />;
}
