import AdminNav from "@/components/admin/admin-nav";
import { AuthButton } from "@/components/auth-button";
import Link from "next/link";
import { Suspense } from "react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen">
      <nav className="border-b">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-semibold">
              MoveLib
            </Link>

            <Link
              href="/protected"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Dashboard
            </Link>

            <Link
              href="/protected/exercises"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Exercises
            </Link>

            <Link
              href="/protected/lessons"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Lessons
            </Link>

            <Suspense>
              <AdminNav />
            </Suspense>
          </div>

          <Suspense>
            <AuthButton />
          </Suspense>
        </div>
      </nav>

      <div className="mx-auto w-full max-w-5xl px-5 py-10">{children}</div>
    </main>
  );
}
