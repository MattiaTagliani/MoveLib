"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useMemo, useState } from "react";

export interface LibraryLesson {
  id: string;
  title: string;
  updated_at: string;
  lesson_exercises: {
    id: string;
  }[];
}

interface LessonLibraryProps {
  lessons: LibraryLesson[];
}

export function LessonLibrary({ lessons }: LessonLibraryProps) {
  const [search, setSearch] = useState("");

  const filteredLessons = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("it");

    if (!normalizedSearch) {
      return lessons;
    }

    return lessons.filter((lesson) =>
      lesson.title.toLocaleLowerCase("it").includes(normalizedSearch),
    );
  }, [lessons, search]);

  return (
    <div className="space-y-6">
      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Cerca lezione..."
        className="max-w-xl"
      />

      {filteredLessons.length === 0 ? (
        <div className="rounded-lg border p-6">
          <p className="text-muted-foreground">
            Nessuna lezione corrisponde alla ricerca.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredLessons.map((lesson) => {
            const exerciseCount = lesson.lesson_exercises.length;

            return (
              <div
                key={lesson.id}
                className="flex min-h-36 flex-col rounded-lg border p-4"
              >
                <h2 className="font-semibold">{lesson.title}</h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  {exerciseCount === 1
                    ? "1 esercizio"
                    : `${exerciseCount} esercizi`}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Modificata il{" "}
                  {new Intl.DateTimeFormat("it-IT", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  }).format(new Date(lesson.updated_at))}
                </p>

                <div className="mt-auto pt-4">
                  <Button asChild size="sm">
                    <Link href={`/protected/lessons/${lesson.id}`}>
                      Modifica
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
