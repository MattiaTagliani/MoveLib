"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

interface ClassPreset {
  id: string;
  name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  color: string;
}

interface SchedulePresetFormProps {
  presets: ClassPreset[];
}

const DAY_NAMES = [
  "",
  "lunedì",
  "martedì",
  "mercoledì",
  "giovedì",
  "venerdì",
  "sabato",
  "domenica",
];

export function SchedulePresetForm({ presets }: SchedulePresetFormProps) {
  const router = useRouter();

  const [presetId, setPresetId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const selectedPreset = useMemo(
    () => presets.find((preset) => preset.id === presetId) ?? null,
    [presetId, presets],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage(null);

    if (!selectedPreset) {
      setMessage("Seleziona un preset.");
      return;
    }

    if (!startDate || !endDate) {
      setMessage("Seleziona una data iniziale e una data finale.");
      return;
    }

    if (
      !isValidApplicationDate(startDate) ||
      !isValidApplicationDate(endDate)
    ) {
      setMessage("Inserisci una data compresa tra il 2000 e il 2099.");
      return;
    }

    if (endDate < startDate) {
      setMessage("La data finale deve essere successiva a quella iniziale.");
      return;
    }

    const matchingDates = getMatchingDates(
      startDate,
      endDate,
      selectedPreset.day_of_week,
    );

    if (matchingDates.length === 0) {
      setMessage(
        `Nell'intervallo selezionato non ci sono ${
          DAY_NAMES[selectedPreset.day_of_week]
        }.`,
      );
      return;
    }

    setIsSaving(true);

    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage("Utente non autenticato.");
      setIsSaving(false);
      return;
    }

    // Check whether this preset is already scheduled on any of the
    // matching dates. This lets us skip existing occurrences instead
    // of failing the whole operation.
    const { data: existingClasses, error: existingClassesError } =
      await supabase
        .from("scheduled_classes")
        .select("scheduled_date")
        .eq("class_preset_id", selectedPreset.id)
        .in("scheduled_date", matchingDates);

    if (existingClassesError) {
      setMessage(existingClassesError.message);
      setIsSaving(false);
      return;
    }

    const existingDates = new Set(
      existingClasses.map((scheduledClass) => scheduledClass.scheduled_date),
    );

    const datesToCreate = matchingDates.filter(
      (date) => !existingDates.has(date),
    );

    if (datesToCreate.length === 0) {
      setMessage("Tutte le date selezionate sono già presenti nel calendario.");
      setIsSaving(false);
      return;
    }

    const rows = datesToCreate.map((scheduledDate) => ({
      user_id: user.id,
      class_preset_id: selectedPreset.id,
      lesson_id: null,
      title: selectedPreset.name,
      scheduled_date: scheduledDate,
      start_time: selectedPreset.start_time,
      end_time: selectedPreset.end_time,
    }));

    const { error: insertError } = await supabase
      .from("scheduled_classes")
      .insert(rows);

    if (insertError) {
      setMessage(insertError.message);
      setIsSaving(false);
      return;
    }

    const skippedCount = matchingDates.length - datesToCreate.length;

    if (skippedCount > 0) {
      setMessage(
        `${datesToCreate.length} ${
          datesToCreate.length === 1
            ? "lezione programmata"
            : "lezioni programmate"
        }. ${skippedCount} ${
          skippedCount === 1
            ? "lezione già presente è stata ignorata"
            : "lezioni già presenti sono state ignorate"
        }.`,
      );
    } else {
      setMessage(
        `${datesToCreate.length} ${
          datesToCreate.length === 1
            ? "lezione programmata"
            : "lezioni programmate"
        }.`,
      );
    }

    setPresetId("");
    setStartDate("");
    setEndDate("");
    setIsSaving(false);

    router.refresh();
  }

  return (
    <section className="rounded-lg border p-5">
      <div>
        <h2 className="text-xl font-semibold">Programma un preset</h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Aggiungi automaticamente il corso nei giorni corrispondenti.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <label htmlFor="bulk-preset" className="text-sm font-medium">
            Preset
          </label>

          <select
            id="bulk-preset"
            value={presetId}
            onChange={(event) => {
              setPresetId(event.target.value);
              setMessage(null);
            }}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          >
            <option value="">Seleziona un preset</option>

            {presets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </div>

        {selectedPreset && (
          <div className="flex items-center gap-3 rounded-md bg-muted/40 p-3 text-sm">
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: selectedPreset.color }}
            />

            <div>
              <p className="font-medium">
                Ogni {DAY_NAMES[selectedPreset.day_of_week]}
              </p>

              <p className="text-muted-foreground">
                {formatTime(selectedPreset.start_time)} -{" "}
                {formatTime(selectedPreset.end_time)}
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="bulk-start-date" className="text-sm font-medium">
              Dal
            </label>

            <Input
              id="bulk-start-date"
              type="date"
              min="2000-01-01"
              max="2099-12-31"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="bulk-end-date" className="text-sm font-medium">
              Al
            </label>

            <Input
              id="bulk-end-date"
              type="date"
              min="2000-01-01"
              max="2099-12-31"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </div>
        </div>

        {message && <p className="text-sm text-muted-foreground">{message}</p>}

        <Button
          type="submit"
          disabled={isSaving || presets.length === 0}
          className="w-full"
        >
          {isSaving ? "Programmazione..." : "Programma preset"}
        </Button>
      </form>
    </section>
  );
}

function getMatchingDates(
  startDate: string,
  endDate: string,
  presetDayOfWeek: number,
) {
  const start = parseDatabaseDate(startDate);
  const end = parseDatabaseDate(endDate);

  const matchingDates: string[] = [];

  const current = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
  );

  while (current <= end) {
    if (getDatabaseDayOfWeek(current) === presetDayOfWeek) {
      matchingDates.push(formatDateForDatabase(current));
    }

    current.setDate(current.getDate() + 1);
  }

  return matchingDates;
}

function getDatabaseDayOfWeek(date: Date) {
  const javascriptDay = date.getDay();

  return javascriptDay === 0 ? 7 : javascriptDay;
}

function parseDatabaseDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function formatDateForDatabase(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatTime(time: string) {
  return time.slice(0, 5);
}

function isValidApplicationDate(date: string) {
  const year = Number(date.slice(0, 4));

  return year >= 2000 && year <= 2099;
}
