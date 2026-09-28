import { LessonList } from "@/components/lessons/lesson-list";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Suspense } from "react";

export default function LessonsPage() {
  return (
    <main className="w-full space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Lezioni</h1>

          <p className="mt-2 text-muted-foreground">
            Crea e gestisci le tue lezioni.
          </p>
        </div>

        <Button asChild>
          <Link href="/protected/lessons/new">Nuova lezione</Link>
        </Button>
      </div>

      <Suspense fallback={<LessonListLoading />}>
        <LessonList />
      </Suspense>
    </main>
  );
}

function LessonListLoading() {
  return (
    <div className="rounded-lg border p-6">
      <p className="text-muted-foreground">Caricamento lezioni...</p>
    </div>
  );
}
