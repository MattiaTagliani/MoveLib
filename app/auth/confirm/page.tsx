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

      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);

      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (!accessToken || !refreshToken) {
        setError("The invitation link does not contain a valid session.");
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
              Sorry, something went wrong.
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
