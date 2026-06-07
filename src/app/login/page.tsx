"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Invalid email or password.");
      setStatus("error");
    } else {
      router.push("/");
      router.refresh();
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
            Your personal job search dashboard.
          </p>

          <form onSubmit={handleSignIn} className="mt-6 space-y-3">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-ink-subtle">
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-[15px] text-ink placeholder:text-ink-tertiary outline-none focus:border-hairline-strong"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-ink-subtle">
                Password
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-[15px] text-ink placeholder:text-ink-tertiary outline-none focus:border-hairline-strong"
              />
            </div>

            {status === "error" && (
              <p className="text-[13px] text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-lg bg-primary px-3.5 py-2.5 text-sm font-medium text-on-primary transition-colors hover:bg-primary-hover disabled:opacity-60"
            >
              {status === "loading" ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
