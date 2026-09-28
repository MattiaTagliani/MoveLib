import {
  ExerciseLibrary,
  LibraryExercise,
} from "@/components/exercises/exercise-library";
import { createClient } from "@/lib/supabase/server";

export async function ExerciseList() {
  const supabase = await createClient();

  const { data: exercises, error } = await supabase
    .from("exercises")
    .select(
      `
        id,
        name,
        description,
        min_age,
        max_age,
        exercise_variants (
          id,
          variant
        ),
        exercise_tags (
          tags (
            id,
            name
          )
        )
      `,
    )
    .order("name");

  if (error) {
    return (
      <p className="text-sm text-red-500">
        Errore durante il caricamento degli esercizi.
      </p>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="rounded-lg border p-6">
        <p className="text-muted-foreground">
          Non ci sono ancora esercizi nella libreria.
        </p>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let favouriteExerciseIds: string[] = [];

  if (user) {
    const { data: favourites, error: favouritesError } = await supabase
      .from("user_favourite_exercises")
      .select("exercise_id")
      .eq("user_id", user.id);

    if (!favouritesError && favourites) {
      favouriteExerciseIds = favourites.map(
        (favourite) => favourite.exercise_id,
      );
    }
  }

  return (
    <ExerciseLibrary
      exercises={exercises as LibraryExercise[]}
      initialFavouriteExerciseIds={favouriteExerciseIds}
    />
  );
}
