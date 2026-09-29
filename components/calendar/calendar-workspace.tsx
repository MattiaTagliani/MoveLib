"use client";

import { CalendarScheduler } from "@/components/calendar/calendar-scheduler";
import {
  CalendarLesson,
  MonthCalendar,
  ScheduledClass,
} from "@/components/calendar/month-calendar";
import { useState } from "react";

interface ClassPreset {
  id: string;
  name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  color: string;
}

interface CalendarWorkspaceProps {
  scheduledClasses: ScheduledClass[];
  lessons: CalendarLesson[];
  presets: ClassPreset[];
}

export function CalendarWorkspace({
  scheduledClasses,
  lessons,
  presets,
}: CalendarWorkspaceProps) {
  const [selectedDate, setSelectedDate] = useState("");

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
        onAddDate={handleAddDate}
      />

      <CalendarScheduler
        presets={presets}
        lessons={lessons}
        initialDate={selectedDate}
        onDateConsumed={() => setSelectedDate("")}
      />
    </div>
  );
}
