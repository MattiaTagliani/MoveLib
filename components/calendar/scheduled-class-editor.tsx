"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CalendarLesson,
  ScheduledClass,
} from "@/components/calendar/month-calendar";

interface ScheduledClassEditorProps {
  scheduledClass: ScheduledClass;
  lessons: CalendarLesson[];
  onClose: () => void;
}

export function ScheduledClassEditor({
  scheduledClass,
  lessons,
  onClose,
}: ScheduledClassEditorProps) {
  const router = useRouter();

  const [title, setTitle] = useState(scheduledClass.title);
  const [scheduledDate, setScheduledDate] = useState(
    scheduledClass.scheduled_date,
  );
  const [startTime, setStartTime] = useState(
    scheduledClass.start_time?.slice(0, 5) ?? "",
  );
  const [endTime, setEndTime] = useState(
    scheduledClass.end_time?.slice(0, 5) ?? "",
  );
  const [lessonId, setLessonId] = useState(scheduledClass.lesson_id ?? "");

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveScheduledClass() {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError("Inserisci un titolo.");
      return;
    }

    if (!scheduledDate) {
      setError("Seleziona una data.");
      return;
    }

    const scheduledYear = Number(scheduledDate.slice(0, 4));

    if (scheduledYear < 2000 || scheduledYear > 2099) {
      setError("Inserisci una data compresa tra il 2000 e il 2099.");
      return;
    }

    if ((startTime && !endTime) || (!startTime && endTime)) {
      setError("Inserisci sia l'orario di inizio che quello di fine.");
      return;
    }

    if (startTime && endTime && endTime <= startTime) {
      setError("L'orario di fine deve essere successivo a quello di inizio.");
      return;
    }

    setIsSaving(true);
    setError(null);

    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("scheduled_classes")
      .update({
        title: trimmedTitle,
        scheduled_date: scheduledDate,
        start_time: startTime || null,
        end_time: endTime || null,
        lesson_id: lessonId || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", scheduledClass.id);

    if (updateError) {
      setError(updateError.message);
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    onClose();
    router.refresh();
  }

  async function deleteScheduledClass() {
    const confirmed = window.confirm(
      `Vuoi eliminare "${scheduledClass.title}" dal calendario?`,
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    const supabase = createClient();

    const { error: deleteError } = await supabase
      .from("scheduled_classes")
      .delete()
      .eq("id", scheduledClass.id);

    if (deleteError) {
      setError(deleteError.message);
      setIsDeleting(false);
      return;
    }

    setIsDeleting(false);
    onClose();
    router.refresh();
  }

  return (
    <section className="rounded-lg border p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Modifica appuntamento</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Modifica o elimina questa occorrenza dal calendario.
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          disabled={isSaving || isDeleting}
        >
          Chiudi
        </Button>
      </div>

      <div className="mt-6 space-y-4">
        <div className="space-y-2">
          <label htmlFor="edit-scheduled-title" className="text-sm font-medium">
            Titolo
          </label>

          <Input
            id="edit-scheduled-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="edit-scheduled-date" className="text-sm font-medium">
            Data
          </label>

          <Input
            id="edit-scheduled-date"
            type="date"
            min="2000-01-01"
            max="2099-12-31"
            value={scheduledDate}
            onChange={(event) => setScheduledDate(event.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label
              htmlFor="edit-scheduled-start"
              className="text-sm font-medium"
            >
              Inizio
            </label>

            <Input
              id="edit-scheduled-start"
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="edit-scheduled-end" className="text-sm font-medium">
              Fine
            </label>

            <Input
              id="edit-scheduled-end"
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="edit-scheduled-lesson"
            className="text-sm font-medium"
          >
            Lezione
          </label>

          <select
            id="edit-scheduled-lesson"
            value={lessonId}
            onChange={(event) => setLessonId(event.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          >
            <option value="">Nessuna lezione associata</option>

            {lessons.map((lesson) => (
              <option key={lesson.id} value={lesson.id}>
                {lesson.title}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={() => void saveScheduledClass()}
            disabled={isSaving || isDeleting}
          >
            {isSaving ? "Salvataggio..." : "Salva modifiche"}
          </Button>

          {scheduledClass.lesson_id && (
            <Button asChild type="button" variant="outline">
              <Link href={`/protected/lessons/${scheduledClass.lesson_id}`}>
                Apri lezione
              </Link>
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={() => void deleteScheduledClass()}
            disabled={isSaving || isDeleting}
          >
            {isDeleting ? "Eliminazione..." : "Elimina dal calendario"}
          </Button>
        </div>
      </div>
    </section>
  );
}
