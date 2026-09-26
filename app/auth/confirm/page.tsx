"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ConfirmPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function acceptInvitation() {
      const supabase = createClient();

      const hashParams = new URLSearchParams(window.location.hash.substring(1));

      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const type = hashParams.get("type");

      if (type !== "invite" || !accessToken || !refreshToken) {
        setError("The invitation link is invalid or has expired.");
        return;
      }

      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        setError(error.message);
        return;
      }

      // Remove the tokens from the visible browser URL immediately.
      window.history.replaceState(null, "", "/auth/confirm");

      router.replace("/auth/update-password");
    }

    acceptInvitation();
  }, [router]);

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4 text-center">
        {error ? (
          <>
            <h1 className="text-2xl font-semibold">
              Invitation could not be accepted
            </h1>

            <p className="text-sm text-muted-foreground">{error}</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold">Accepting invitation...</h1>

            <p className="text-sm text-muted-foreground">
              Please wait while we finish setting up your account.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
