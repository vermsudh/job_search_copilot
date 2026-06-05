"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "@/components/ThemeToggle";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [error, setError] = useState("");

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-md bg-primary" />
          <span className="text-sm font-semibold">Job Search Copilot</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-sm rounded-xl border border-hairline bg-surface-1 p-8">
          <h1 className="text-[22px] font-semibold tracking-[-0.4px]">
            Sign in
          </h1>
          <p className="mt-2 text-[14px] text-ink-subtle">
            We&apos;ll email you a magic link — no password needed.
          </p>

          {status === "sent" ? (
            <div className="mt-6 rounded-lg border border-hairline bg-surface-2 p-4 text-[14px] text-ink-muted">
              Check <span className="text-ink">{email}</span> for a sign-in
              link. You can close this tab.
            </div>
          ) : (
            <form onSubmit={sendMagicLink} className="mt-6 space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-[15px] text-ink placeholder:text-ink-tertiary outline-none focus:border-hairline-strong"
              />
              <button
                type="submit"
                disabled={status === "sending"}
                className="w-full rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-on-primary transition-colors hover:bg-primary-hover disabled:opacity-60"
              >
                {status === "sending" ? "Sending…" : "Send magic link"}
              </button>
              {status === "error" && (
                <p className="text-[13px] text-red-400">{error}</p>
              )}
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
