"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter();

  const supabase = useMemo(() => createClient(), []);

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSessionReady, setIsSessionReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) {
        return;
      }

      if (
        (event === "PASSWORD_RECOVERY" ||
          event === "SIGNED_IN" ||
          event === "INITIAL_SESSION") &&
        session
      ) {
        setIsSessionReady(true);
        setError(null);
      }
    });

    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted) {
        return;
      }

      if (sessionError) {
        setError(sessionError.message);
        return;
      }

      if (data.session) {
        setIsSessionReady(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSessionReady) {
      setError(
        "La sessione per modificare la password non è disponibile. Richiedi un nuovo link di reimpostazione.",
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        throw error;
      }

      router.replace("/protected");
      router.refresh();
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "Si è verificato un errore durante il salvataggio della password.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Nuova password</CardTitle>

          <CardDescription>
            Inserisci la nuova password che vuoi utilizzare.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleUpdatePassword}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="password">Nuova password</Label>

                <Input
                  id="password"
                  type="password"
                  placeholder="Nuova password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={!isSessionReady || isLoading}
                />
              </div>

              {!isSessionReady && !error && (
                <p className="text-sm text-muted-foreground">
                  Verifica del link di reimpostazione...
                </p>
              )}

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button
                type="submit"
                className="w-full"
                disabled={!isSessionReady || isLoading}
              >
                {isLoading ? "Salvataggio..." : "Salva nuova password"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
