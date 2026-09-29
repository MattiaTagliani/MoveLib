"use client";

import { CalendarScheduler } from "@/components/calendar/calendar-scheduler";
import {
  CalendarLesson,
  MonthCalendar,
  ScheduledClass,
} from "@/components/calendar/month-calendar";
import { useState } from "react";
import { CustomCalendarColor } from "@/components/calendar/calendar-color-picker";
import { ClassPreset, ClassPresets } from "@/components/calendar/class-presets";

interface CalendarWorkspaceProps {
  scheduledClasses: ScheduledClass[];
  lessons: CalendarLesson[];
  presets: ClassPreset[];
  initialCustomColors: CustomCalendarColor[];
}

export function CalendarWorkspace({
  scheduledClasses,
  lessons,
  presets,
  initialCustomColors,
}: CalendarWorkspaceProps) {
  const [selectedDate, setSelectedDate] = useState("");
  const [customColors, setCustomColors] =
    useState<CustomCalendarColor[]>(initialCustomColors);

  function addCustomColor(color: CustomCalendarColor) {
    setCustomColors((current) => [...current, color]);
  }

  function removeCustomColor(id: string) {
    setCustomColors((current) => current.filter((color) => color.id !== id));
  }

  function handleAddDate(date: string) {
    setSelectedDate(date);

    window.setTimeout(() => {
      document
        .getElementById("calendar-scheduler")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  return (
    <div className="space-y-8">
      <MonthCalendar
        scheduledClasses={scheduledClasses}
        lessons={lessons}
        presets={presets}
        customColors={customColors}
        onCustomColorCreated={addCustomColor}
        onCustomColorDeleted={removeCustomColor}
        onAddDate={handleAddDate}
      />

      <CalendarScheduler
        presets={presets}
        lessons={lessons}
        initialDate={selectedDate}
        customColors={customColors}
        onCustomColorCreated={addCustomColor}
        onCustomColorDeleted={removeCustomColor}
        onDateConsumed={() => setSelectedDate("")}
      />

      <section className="space-y-4 border-t pt-8">
        <div>
          <h2 className="text-2xl font-semibold">Preset corsi</h2>

          <p className="mt-1 text-muted-foreground">
            Gestisci gli orari che utilizzi abitualmente.
          </p>
        </div>

        <ClassPresets
          initialPresets={presets}
          customColors={customColors}
          onCustomColorCreated={addCustomColor}
          onCustomColorDeleted={removeCustomColor}
        />
      </section>
    </div>
  );
}
