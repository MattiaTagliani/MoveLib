"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function NewLessonForm() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError("Inserisci un titolo per la lezione.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("Utente non autenticato.");
      setIsLoading(false);
      return;
    }

    const { data: lesson, error: insertError } = await supabase
      .from("lessons")
      .insert({
        user_id: user.id,
        title: trimmedTitle,
      })
      .select("id")
      .single();

    if (insertError) {
      setError(insertError.message);
      setIsLoading(false);
      return;
    }

    router.push(`/protected/lessons/${lesson.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium">
          Titolo
        </label>

        <Input
          id="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Es. Lezione 6-8 anni"
          autoFocus
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creazione..." : "Crea lezione"}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/protected/lessons")}
          disabled={isLoading}
        >
          Annulla
        </Button>
      </div>
    </form>
  );
}
