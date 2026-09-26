import { Suspense } from "react";
import AdminRequestsContent from "@/components/admin/admin-requests-content";

export default function AdminRequestsPage() {
  return (
    <main className="w-full space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Registration Requests</h1>

        <p className="text-muted-foreground">
          Review requests from people who want access to MoveLib.
        </p>
      </div>

      <Suspense fallback={<p>Loading registration requests...</p>}>
        <AdminRequestsContent />
      </Suspense>
    </main>
  );
}
