"use client";

import { useState } from "react";
import {
  CalendarLesson,
  MonthCalendar,
  ScheduledClass,
} from "@/components/calendar/month-calendar";
import { CalendarScheduler } from "@/components/calendar/calendar-scheduler";

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

  return (
    <div className="space-y-8">
      <MonthCalendar
        scheduledClasses={scheduledClasses}
        lessons={lessons}
        presets={presets}
        onAddDate={setSelectedDate}
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
