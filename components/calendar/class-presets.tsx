"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export interface ClassPreset {
  id: string;
  name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  color: string;
}

interface ClassPresetsProps {
  initialPresets: ClassPreset[];
}

const DAYS = [
  { value: 1, label: "Lunedì" },
  { value: 2, label: "Martedì" },
  { value: 3, label: "Mercoledì" },
  { value: 4, label: "Giovedì" },
  { value: 5, label: "Venerdì" },
  { value: 6, label: "Sabato" },
  { value: 7, label: "Domenica" },
];

export function ClassPresets({ initialPresets }: ClassPresetsProps) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [color, setColor] = useState("#3b82f6");

  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Inserisci un nome.");
      return;
    }

    if (!startTime || !endTime) {
      setError("Inserisci l'orario di inizio e di fine.");
      return;
    }

    if (endTime <= startTime) {
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

    const { error: insertError } = await supabase.from("class_presets").insert({
      user_id: user.id,
      name: trimmedName,
      day_of_week: Number(dayOfWeek),
      start_time: startTime,
      end_time: endTime,
      color,
    });

    if (insertError) {
      setError(insertError.message);
      setIsSaving(false);
      return;
    }

    setName("");
    setStartTime("");
    setEndTime("");
    setIsSaving(false);

    router.refresh();
  }

  async function deletePreset(preset: ClassPreset) {
    const confirmed = window.confirm(
      `Vuoi eliminare il preset "${preset.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(preset.id);
    setError(null);

    const supabase = createClient();

    const { error: deleteError } = await supabase
      .from("class_presets")
      .delete()
      .eq("id", preset.id);

    if (deleteError) {
      setError(deleteError.message);
      setDeletingId(null);
      return;
    }

    setDeletingId(null);
    router.refresh();
  }

  function getDayName(dayOfWeek: number) {
    return (
      DAYS.find((day) => day.value === dayOfWeek)?.label ?? "Giorno sconosciuto"
    );
  }

  function formatTime(time: string) {
    return time.slice(0, 5);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)]">
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Preset disponibili</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Gli orari che utilizzi abitualmente.
          </p>
        </div>

        {initialPresets.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6">
            <p className="text-sm text-muted-foreground">
              Non hai ancora creato nessun preset.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {initialPresets.map((preset) => (
              <div
                key={preset.id}
                className="flex items-center justify-between gap-4 rounded-lg border p-4"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className="mt-1.5 h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: preset.color }}
                  />

                  <div>
                    <p className="font-medium">{preset.name}</p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {getDayName(preset.day_of_week)}{" "}
                      {formatTime(preset.start_time)} -{" "}
                      {formatTime(preset.end_time)}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={deletingId === preset.id}
                    onClick={() => void deletePreset(preset)}
                  >
                    {deletingId === preset.id ? "Eliminazione..." : "Elimina"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}
      </section>

      <section className="rounded-lg border p-5">
        <div>
          <h2 className="text-xl font-semibold">Nuovo preset</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Crea un orario che utilizzi regolarmente.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="preset-name" className="text-sm font-medium">
              Nome
            </label>

            <Input
              id="preset-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Es. Verticali adulti - Base/Intermedio"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="preset-day" className="text-sm font-medium">
              Giorno
            </label>

            <select
              id="preset-day"
              value={dayOfWeek}
              onChange={(event) => setDayOfWeek(event.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              {DAYS.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label htmlFor="preset-start" className="text-sm font-medium">
                Inizio
              </label>

              <Input
                id="preset-start"
                type="time"
                step={300}
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="preset-end" className="text-sm font-medium">
                Fine
              </label>

              <Input
                id="preset-end"
                type="time"
                step={300}
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="preset-color" className="text-sm font-medium">
              Colore
            </label>

            <div className="flex items-center gap-3">
              <input
                id="preset-color"
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

          <Button type="submit" disabled={isSaving} className="w-full">
            {isSaving ? "Creazione..." : "Crea preset"}
          </Button>
        </form>
      </section>
    </div>
  );
}
