import { ExerciseList } from "@/components/exercises/exercise-list";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Suspense } from "react";

export default function ExercisesPage() {
  return (
    <main className="w-full space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Esercizi</h1>

          <p className="mt-2 text-muted-foreground">
            Consulta e gestisci la libreria degli esercizi.
          </p>
        </div>

        <Button asChild>
          <Link href="/protected/exercises/new">Nuovo esercizio</Link>
        </Button>
      </div>

      <Suspense fallback={<ExerciseListLoading />}>
        <ExerciseList />
      </Suspense>
    </main>
  );
}

function ExerciseListLoading() {
  return (
    <div className="rounded-lg border p-6">
      <p className="text-muted-foreground">Caricamento esercizi...</p>
    </div>
  );
}
