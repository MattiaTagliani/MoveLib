import {
  CalendarLesson,
  ScheduledClass,
} from "@/components/calendar/month-calendar";
import { CalendarWorkspace } from "@/components/calendar/calendar-workspace";
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";

export default function CalendarPage() {
  return (
    <main className="w-full space-y-10">
      <div>
        <h1 className="text-3xl font-semibold">Calendario</h1>

        <p className="mt-2 text-muted-foreground">
          Organizza i tuoi corsi e le tue lezioni.
        </p>
      </div>

      <Suspense fallback={<p>Caricamento calendario...</p>}>
        <CalendarContent />
      </Suspense>
    </main>
  );
}

async function CalendarContent() {
  const supabase = await createClient();

  const [
    { data: presets, error: presetsError },
    { data: lessons, error: lessonsError },
    { data: scheduledClasses, error: scheduledClassesError },
    { data: customColors, error: customColorsError },
  ] = await Promise.all([
    supabase
      .from("class_presets")
      .select("id, name, day_of_week, start_time, end_time, color")
      .order("day_of_week")
      .order("start_time"),

    supabase.from("lessons").select("id, title").order("title"),

    supabase
      .from("scheduled_classes")
      .select(
        `
        id,
        title,
        scheduled_date,
        start_time,
        end_time,
        lesson_id,
        class_preset_id,
        color
      `,
      )
      .order("scheduled_date")
      .order("start_time"),

    supabase
      .from("user_calendar_colors")
      .select("id, color")
      .order("created_at"),
  ]);

  const error =
    presetsError || lessonsError || scheduledClassesError || customColorsError;

  if (error) {
    return (
      <div className="space-y-2 text-sm text-red-500">
        <p>Errore durante il caricamento del calendario.</p>
        <p>{error.message}</p>
      </div>
    );
  }

  return (
    <CalendarWorkspace
      scheduledClasses={scheduledClasses as ScheduledClass[]}
      lessons={lessons as CalendarLesson[]}
      presets={presets}
      initialCustomColors={customColors}
    />
  );
}
