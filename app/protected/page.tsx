import Link from "next/link";

export default function ProtectedPage() {
  return (
    <main className="w-full space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">MoveLib</h1>

        <p className="text-muted-foreground">
          Manage your movement library and prepare lessons.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/protected/exercises"
          className="rounded-lg border p-6 transition-colors hover:bg-muted"
        >
          <h2 className="font-semibold">Exercises</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Browse and manage the movement library.
          </p>
        </Link>

        <Link
          href="/protected/lessons"
          className="rounded-lg border p-6 transition-colors hover:bg-muted"
        >
          <h2 className="font-semibold">Lessons</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Prepare and organize lessons.
          </p>
        </Link>
      </div>
    </main>
  );
}
