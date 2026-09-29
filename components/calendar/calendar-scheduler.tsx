"use client";

import { ScheduleClassForm } from "@/components/calendar/schedule-class-form";
import { SchedulePresetForm } from "@/components/calendar/schedule-preset-form";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { CustomCalendarColor } from "@/components/calendar/calendar-color-picker";

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
  customColors: CustomCalendarColor[];
  onCustomColorCreated: (color: CustomCalendarColor) => void;
  onCustomColorDeleted: (id: string) => void;
}

type SchedulerMode = "single" | "preset";

export function CalendarScheduler({
  presets,
  lessons,
  initialDate,
  customColors,
  onCustomColorCreated,
  onCustomColorDeleted,
  onDateConsumed,
}: CalendarSchedulerProps) {
  const [mode, setMode] = useState<SchedulerMode>("single");

  useEffect(() => {
    if (initialDate) {
      setMode("single");
    }
  }, [initialDate]);

  return (
    <section
      id="calendar-scheduler"
      className="max-w-2xl scroll-mt-6 rounded-lg border"
    >
      <div className="grid grid-cols-2 border-b">
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
      </div>

      <div className="p-1">
        {mode === "single" ? (
          <ScheduleClassForm
            presets={presets}
            lessons={lessons}
            initialDate={initialDate}
            customColors={customColors}
            onCustomColorCreated={onCustomColorCreated}
            onCustomColorDeleted={onCustomColorDeleted}
            onDateConsumed={onDateConsumed}
          />
        ) : (
          <SchedulePresetForm presets={presets} />
        )}
      </div>
    </section>
  );
}
