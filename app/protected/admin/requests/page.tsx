import { Suspense } from "react";
import AdminRequestsContent from "@/components/admin/admin-requests-content";

export default function AdminRequestsPage() {
  return (
    <main className="w-full space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Richieste di registrazione</h1>

        <p className="text-muted-foreground">
          Gestisci le richieste di accesso a MoveLib.
        </p>
      </div>

      <Suspense fallback={<p>Caricamento richieste...</p>}>
        <AdminRequestsContent />
      </Suspense>
    </main>
  );
}
