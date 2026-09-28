import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface LessonPageProps {
  params: Promise<{ id: string }>;
}

export default function LessonPage({ params }: LessonPageProps) {
  return (
    <main className="w-full space-y-8">
      <Suspense fallback={<p>Caricamento lezione...</p>}>
        <LessonContent params={params} />
      </Suspense>
    </main>
  );
}

async function LessonContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: lesson, error } = await supabase
    .from("lessons")
    .select("id, title")
    .eq("id", id)
    .single();

  if (error || !lesson) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold">{lesson.title}</h1>

      <p className="mt-2 text-muted-foreground">
        Il builder della lezione verrà aggiunto qui.
      </p>
    </div>
  );
}
