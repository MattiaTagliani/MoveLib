import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link href="/" className="text-xl font-semibold">
            MoveLib
          </Link>

          <Link
            href="/auth/login"
            className="rounded-md border px-4 py-2 text-sm font-medium"
          >
            Log in
          </Link>
        </div>
      </header>

      <section className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-5 py-24 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">
          Your movement library
        </h1>

        <p className="max-w-2xl text-lg text-muted-foreground">
          Organize exercises, build lessons, and keep your movement library easy
          to search and reuse.
        </p>

        <Link
          href="/auth/sign-up"
          className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
        >
          Request access
        </Link>
      </section>
    </main>
  );
}
