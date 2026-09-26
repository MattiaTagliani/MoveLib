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
      setError("Please enter your name and email.");
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
          "A pending registration request already exists for this email address.",
        );
      } else {
        setError("Something went wrong while submitting your request.");
      }

      return;
    }

    setMessage(
      "Your registration request has been submitted. An administrator will review it.",
    );

    setName("");
    setEmail("");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold">Request access</h1>
          <p className="text-muted-foreground">
            Submit your details and an administrator will review your request.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>

            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-md border px-3 py-2"
              placeholder="Your name"
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
              placeholder="you@example.com"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Request access"}
          </button>
        </form>

        {message && <p className="rounded-md border p-3 text-sm">{message}</p>}

        {error && (
          <p className="rounded-md border border-red-500 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/auth/login" className="underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
