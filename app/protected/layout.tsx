import AdminNav from "@/components/admin/admin-nav";
import { AuthButton } from "@/components/auth-button";
import { MoveLibThemeProvider } from "@/components/theme/movelib-theme-provider";
import { isMoveLibTheme, type MoveLibTheme } from "@/lib/movelib-theme";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Suspense } from "react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <ProtectedContent>{children}</ProtectedContent>
    </Suspense>
  );
}

async function ProtectedContent({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let theme: MoveLibTheme = "sage";

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("theme")
      .eq("id", user.id)
      .single();

    if (isMoveLibTheme(profile?.theme)) {
      theme = profile.theme;
    }
  }

  return (
    <MoveLibThemeProvider initialTheme={theme}>
      <main className="min-h-screen bg-background">
        <nav className="border-b bg-card/80">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
            <div className="flex items-center gap-6">
              <Link
                href="/"
                className="font-semibold text-primary transition-colors hover:text-primary/80"
              >
                MoveLib
              </Link>

              <Link
                href="/protected"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Home
              </Link>

              <Link
                href="/protected/exercises"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Esercizi
              </Link>

              <Link
                href="/protected/lessons"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Lezioni
              </Link>

              <Link
                href="/protected/calendar"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Calendario
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
    </MoveLibThemeProvider>
  );
}
