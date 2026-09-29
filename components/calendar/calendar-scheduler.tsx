"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { ScheduleClassForm } from "@/components/calendar/schedule-class-form";
import { SchedulePresetForm } from "@/components/calendar/schedule-preset-form";

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

interface CalendarSchedulerProps {
  presets: ClassPreset[];
  lessons: Lesson[];
  initialDate: string;
  onDateConsumed: () => void;
}

type SchedulerMode = "preset" | "single";

export function CalendarScheduler({
  presets,
  lessons,
  initialDate,
  onDateConsumed,
}: CalendarSchedulerProps) {
  const [mode, setMode] = useState<SchedulerMode>(
    initialDate ? "single" : "preset",
  );

  useEffect(() => {
    if (initialDate) {
      setMode("single");
    }
  }, [initialDate]);

  return (
    <section className="max-w-2xl rounded-lg border">
      <div className="grid grid-cols-2 border-b">
        <Button
          type="button"
          variant="ghost"
          className={`rounded-none ${
            mode === "preset" ? "bg-muted font-semibold" : ""
          }`}
          onClick={() => setMode("preset")}
        >
          Preset
        </Button>

        <Button
          type="button"
          variant="ghost"
          className={`rounded-none ${
            mode === "single" ? "bg-muted font-semibold" : ""
          }`}
          onClick={() => setMode("single")}
        >
          Appuntamento singolo
        </Button>
      </div>

      <div className="p-1">
        {mode === "preset" ? (
          <SchedulePresetForm presets={presets} />
        ) : (
          <ScheduleClassForm
            presets={presets}
            lessons={lessons}
            initialDate={initialDate}
            onDateConsumed={onDateConsumed}
          />
        )}
      </div>
    </section>
  );
}
