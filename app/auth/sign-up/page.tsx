"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!name.trim() || !email.trim()) {
      setError("Inserisci nome ed email.");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.from("registration_requests").insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
    });

    setLoading(false);

    if (error) {
      if (error.code === "23505") {
        setError(
          "Esiste già una richiesta di registrazione in attesa per questo indirizzo email.",
        );
      } else {
        setError("Si è verificato un errore durante l'invio della richiesta.");
      }

      return;
    }

    setMessage(
      "La richiesta di registrazione è stata inviata. Un amministratore la esaminerà.",
    );

    setName("");
    setEmail("");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold">Richiedi accesso</h1>

          <p className="text-muted-foreground">
            Inserisci i tuoi dati. Un amministratore esaminerà la richiesta.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Nome
            </label>

            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-md border px-3 py-2"
              placeholder="Il tuo nome"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-md border px-3 py-2"
              placeholder="nome@esempio.it"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
          >
            {loading ? "Invio..." : "Invia richiesta"}
          </button>
        </form>

        {message && <p className="rounded-md border p-3 text-sm">{message}</p>}

        {error && (
          <p className="rounded-md border border-red-500 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Hai già un account?{" "}
          <Link href="/auth/login" className="underline">
            Accedi
          </Link>
        </p>
      </div>
    </main>
  );
}
