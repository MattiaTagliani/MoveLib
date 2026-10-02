import { ThemeCustomizer } from "@/components/theme/theme-customizer";
import Link from "next/link";

export default function ProtectedPage() {
  return (
    <main className="w-full space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">MoveLib</h1>

        <p className="text-muted-foreground">
          Gestisci la libreria degli esercizi e prepara le tue lezioni.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/protected/exercises"
          className="rounded-lg border bg-card p-6 transition-colors hover:bg-accent"
        >
          <h2 className="font-semibold">Esercizi</h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Consulta e gestisci la libreria degli esercizi.
          </p>
        </Link>

        <Link
          href="/protected/lessons"
          className="rounded-lg border bg-card p-6 transition-colors hover:bg-accent"
        >
          <h2 className="font-semibold">Lezioni</h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Prepara e organizza le tue lezioni.
          </p>
        </Link>
      </div>

      <ThemeCustomizer />
    </main>
  );
}
