"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type RegistrationRequest = {
  id: string;
  name: string;
  email: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  created_at: string;
};

type RegistrationRequestsProps = {
  requests: RegistrationRequest[];
};

export default function RegistrationRequests({
  requests: initialRequests,
}: RegistrationRequestsProps) {
  const [requests, setRequests] = useState(initialRequests);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function updateStatus(id: string, status: "APPROVED" | "REJECTED") {
    setError("");
    setLoadingId(id);

    if (status === "APPROVED") {
      const response = await fetch("/protected/admin/requests/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId: id,
        }),
      });

      const result = await response.json();

      setLoadingId(null);

      if (!response.ok) {
        setError(result.error ?? "Si è verificato un errore.");
        return;
      }

      setRequests((currentRequests) =>
        currentRequests.map((request) =>
          request.id === id ? { ...request, status: "APPROVED" } : request,
        ),
      );

      return;
    }

    const supabase = createClient();

    const { error } = await supabase
      .from("registration_requests")
      .update({ status })
      .eq("id", id);

    setLoadingId(null);

    if (error) {
      setError(error.message);
      return;
    }

    setRequests((currentRequests) =>
      currentRequests.map((request) =>
        request.id === id ? { ...request, status } : request,
      ),
    );
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-lg border p-6 text-sm text-muted-foreground">
        Non ci sono richieste di registrazione.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md border border-red-500 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Nome</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Stato</th>
              <th className="px-4 py-3 text-left font-medium">Data</th>
              <th className="px-4 py-3 text-right font-medium">Azioni</th>
            </tr>
          </thead>

          <tbody>
            {requests.map((request) => {
              const isLoading = loadingId === request.id;

              return (
                <tr key={request.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3">{request.name}</td>

                  <td className="px-4 py-3">{request.email}</td>

                  <td className="px-4 py-3">
                    <span
                      className={
                        request.status === "PENDING"
                          ? "font-medium text-yellow-600"
                          : request.status === "APPROVED"
                            ? "font-medium text-green-600"
                            : "font-medium text-red-600"
                      }
                    >
                      {request.status === "PENDING"
                        ? "In attesa"
                        : request.status === "APPROVED"
                          ? "Approvata"
                          : "Rifiutata"}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    {new Date(request.created_at).toLocaleString("it-IT")}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {request.status === "PENDING" && (
                        <>
                          <button
                            type="button"
                            onClick={() => updateStatus(request.id, "APPROVED")}
                            disabled={isLoading}
                            className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
                          >
                            {isLoading ? "Aggiornamento..." : "Approva"}
                          </button>

                          <button
                            type="button"
                            onClick={() => updateStatus(request.id, "REJECTED")}
                            disabled={isLoading}
                            className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
                          >
                            Rifiuta
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
