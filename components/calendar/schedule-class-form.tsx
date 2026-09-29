"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ClassPreset {
  id: string;
  name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  color: string;
}

interface Lesson {
  id: string;
  title: string;
}

interface ScheduleClassFormProps {
  presets: ClassPreset[];
  lessons: Lesson[];
  initialDate?: string;
  onDateConsumed?: () => void;
}

export function ScheduleClassForm({
  presets,
  lessons,
  initialDate = "",
  onDateConsumed,
}: ScheduleClassFormProps) {
  const router = useRouter();

  const [presetId, setPresetId] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [title, setTitle] = useState("");
  const [scheduledDate, setScheduledDate] = useState(initialDate);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [color, setColor] = useState("#3b82f6");

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialDate) {
      setScheduledDate(initialDate);
    }
  }, [initialDate]);

  function selectPreset(id: string) {
    setPresetId(id);
    setError(null);

    if (!id) {
      return;
    }

    const preset = presets.find((preset) => preset.id === id);

    if (!preset) {
      return;
    }

    setTitle(preset.name);
    setStartTime(preset.start_time.slice(0, 5));
    setEndTime(preset.end_time.slice(0, 5));
    setColor(preset.color);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

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

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("Utente non autenticato.");
      setIsSaving(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("scheduled_classes")
      .insert({
        user_id: user.id,
        class_preset_id: presetId || null,
        lesson_id: lessonId || null,
        title: trimmedTitle,
        scheduled_date: scheduledDate,
        start_time: startTime || null,
        end_time: endTime || null,
        color,
      });

    if (insertError) {
      setError(insertError.message);
      setIsSaving(false);
      return;
    }

    setPresetId("");
    setLessonId("");
    setTitle("");
    setScheduledDate("");
    setStartTime("");
    setEndTime("");
    setColor("#3b82f6");

    onDateConsumed?.();

    setIsSaving(false);
    router.refresh();
  }

  return (
    <section className="rounded-lg border p-5">
      <div>
        <h2 className="text-xl font-semibold">Programma una lezione</h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Usa un preset oppure crea un appuntamento diverso.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <label htmlFor="schedule-preset" className="text-sm font-medium">
            Preset
          </label>

          <select
            id="schedule-preset"
            value={presetId}
            onChange={(event) => selectPreset(event.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          >
            <option value="">Nessun preset</option>

            {presets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="schedule-title" className="text-sm font-medium">
            Titolo
          </label>

          <Input
            id="schedule-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Es. Workshop verticale"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="schedule-date" className="text-sm font-medium">
            Data
          </label>

          <Input
            id="schedule-date"
            type="date"
            min="2000-01-01"
            max="2099-12-31"
            value={scheduledDate}
            onChange={(event) => setScheduledDate(event.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label htmlFor="schedule-start" className="text-sm font-medium">
              Inizio
            </label>

            <Input
              id="schedule-start"
              type="time"
              step={300}
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="schedule-end" className="text-sm font-medium">
              Fine
            </label>

            <Input
              id="schedule-end"
              type="time"
              step={300}
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="schedule-color" className="text-sm font-medium">
            Colore
          </label>

          <div className="flex items-center gap-3">
            <input
              id="schedule-color"
              type="color"
              value={color}
              onChange={(event) => setColor(event.target.value)}
              className="h-10 w-14 cursor-pointer rounded border bg-background p-1"
            />

            <span className="text-sm text-muted-foreground">
              Colore utilizzato nel calendario
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="schedule-lesson" className="text-sm font-medium">
            Lezione
          </label>

          <select
            id="schedule-lesson"
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

        <Button type="submit" disabled={isSaving} className="w-full">
          {isSaving ? "Programmazione..." : "Programma"}
        </Button>
      </form>
    </section>
  );
}
