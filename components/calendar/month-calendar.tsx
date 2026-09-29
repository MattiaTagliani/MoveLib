"use client";

import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import { ScheduledClassEditor } from "./scheduled-class-editor";
import { CustomCalendarColor } from "@/components/calendar/calendar-color-picker";

export interface CalendarLesson {
  id: string;
  title: string;
}

export interface ScheduledClass {
  id: string;
  title: string;
  scheduled_date: string;
  start_time: string | null;
  end_time: string | null;
  lesson_id: string | null;
  class_preset_id: string | null;
  color: string | null;
}

interface CalendarPreset {
  id: string;
  color: string;
}

interface MonthCalendarProps {
  scheduledClasses: ScheduledClass[];
  lessons: CalendarLesson[];
  presets: CalendarPreset[];
  customColors: CustomCalendarColor[];
  onCustomColorCreated: (color: CustomCalendarColor) => void;
  onCustomColorDeleted: (id: string) => void;
  onAddDate: (date: string) => void;
}

const WEEK_DAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

export function MonthCalendar({
  scheduledClasses,
  lessons,
  presets,
  customColors,
  onCustomColorCreated,
  onCustomColorDeleted,
  onAddDate,
}: MonthCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();

    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const [selectedClass, setSelectedClass] = useState<ScheduledClass | null>(
    null,
  );

  const calendarDays = useMemo(
    () => createCalendarDays(currentMonth),
    [currentMonth],
  );

  const monthLabel = new Intl.DateTimeFormat("it-IT", {
    month: "long",
    year: "numeric",
  }).format(currentMonth);

  function previousMonth() {
    setCurrentMonth(
      (month) => new Date(month.getFullYear(), month.getMonth() - 1, 1),
    );
  }

  function nextMonth() {
    setCurrentMonth(
      (month) => new Date(month.getFullYear(), month.getMonth() + 1, 1),
    );
  }

  function goToToday() {
    const today = new Date();

    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={previousMonth}>
              ←
            </Button>

            <Button type="button" variant="outline" onClick={nextMonth}>
              →
            </Button>

            <Button type="button" variant="outline" onClick={goToToday}>
              Oggi
            </Button>
          </div>

          <h2 className="text-xl font-semibold capitalize">{monthLabel}</h2>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-7 border-l border-t">
              {WEEK_DAYS.map((day, index) => (
                <div
                  key={day}
                  className={`border-b border-r bg-muted/40 p-2 text-center text-sm font-medium ${
                    index === 6 ? "text-red-500" : ""
                  }`}
                >
                  {day}
                </div>
              ))}

              {calendarDays.map((day) => {
                const dateString = formatDateForDatabase(day.date);
                const isSunday = day.date.getDay() === 0;
                const isToday =
                  dateString === formatDateForDatabase(new Date());

                const classesForDay = scheduledClasses
                  .filter(
                    (scheduledClass) =>
                      scheduledClass.scheduled_date === dateString,
                  )
                  .sort(compareScheduledClasses);

                return (
                  <div
                    key={dateString}
                    className={`min-h-32 border-b border-r p-2 ${
                      day.isCurrentMonth ? "" : "bg-muted/20"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                          isToday
                            ? "border-2 border-foreground font-semibold"
                            : isSunday
                              ? "text-red-500"
                              : day.isCurrentMonth
                                ? "font-medium"
                                : "text-muted-foreground"
                        }`}
                      >
                        {day.date.getDate()}
                      </span>

                      <button
                        type="button"
                        onClick={() => onAddDate(dateString)}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label={`Aggiungi appuntamento il ${dateString}`}
                        title="Aggiungi appuntamento"
                      >
                        +
                      </button>
                    </div>

                    <div className="space-y-1">
                      {classesForDay.map((scheduledClass) => {
                        const preset = presets.find(
                          (preset) =>
                            preset.id === scheduledClass.class_preset_id,
                        );
                        const eventColor =
                          scheduledClass.color ?? preset?.color;

                        return (
                          <button
                            key={scheduledClass.id}
                            type="button"
                            onClick={() => setSelectedClass(scheduledClass)}
                            className="block w-full rounded-md border px-2 py-1.5 text-left text-xs hover:opacity-80"
                            style={
                              eventColor
                                ? {
                                    borderColor: eventColor,
                                    borderLeftWidth: "4px",
                                  }
                                : undefined
                            }
                          >
                            {scheduledClass.start_time && (
                              <span className="mr-1 font-medium">
                                {formatTime(scheduledClass.start_time)}
                              </span>
                            )}

                            <span>{scheduledClass.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {selectedClass && (
        <ScheduledClassEditor
          scheduledClass={selectedClass}
          lessons={lessons}
          customColors={customColors}
          onCustomColorCreated={onCustomColorCreated}
          onCustomColorDeleted={onCustomColorDeleted}
          onClose={() => setSelectedClass(null)}
        />
      )}
    </div>
  );
}

function createCalendarDays(month: Date) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();

  const firstDay = new Date(year, monthIndex, 1);

  // JavaScript: Sunday = 0.
  // We want Monday = 0.
  const daysBeforeMonth = (firstDay.getDay() + 6) % 7;

  const calendarStart = new Date(year, monthIndex, 1 - daysBeforeMonth);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(
      calendarStart.getFullYear(),
      calendarStart.getMonth(),
      calendarStart.getDate() + index,
    );

    return {
      date,
      isCurrentMonth: date.getMonth() === monthIndex,
    };
  });
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

function compareScheduledClasses(
  first: ScheduledClass,
  second: ScheduledClass,
) {
  if (!first.start_time && !second.start_time) {
    return first.title.localeCompare(second.title, "it");
  }

  if (!first.start_time) {
    return -1;
  }

  if (!second.start_time) {
    return 1;
  }

  return first.start_time.localeCompare(second.start_time);
}
