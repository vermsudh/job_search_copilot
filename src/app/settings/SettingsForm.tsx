"use client";

import { useState } from "react";
import { saveProfile } from "@/lib/profile";
import type { Profile } from "@/lib/types";

export default function SettingsForm({
  initialProfile,
}: {
  initialProfile: Profile | null;
}) {
  const [fullName, setFullName] = useState(
    initialProfile?.full_name ?? "",
  );
  const [resumeText, setResumeText] = useState(
    initialProfile?.resume_text ?? "",
  );
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [error, setError] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setError("");
    try {
      await saveProfile({
        full_name: fullName.trim() || null,
        resume_text: resumeText.trim(),
      });
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
      setStatus("error");
    }
  }

  const charCount = resumeText.length;

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Full name */}
      <div className="rounded-xl border border-hairline bg-surface-1 p-6">
        <label className="mb-1.5 block text-[14px] font-medium">
          Full name
        </label>
        <p className="mb-3 text-[13px] text-ink-subtle">
          Used in the cover letter salutation.
        </p>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Sudhanshu Verma"
          className="w-full rounded-lg border border-hairline bg-surface-2 px-3 py-2.5 text-[14px] text-ink placeholder:text-ink-tertiary outline-none focus:border-hairline-strong"
        />
      </div>

      {/* Resume */}
      <div className="rounded-xl border border-hairline bg-surface-1 p-6">
        <label className="mb-1.5 block text-[14px] font-medium">
          Base resume
        </label>
        <p className="mb-3 text-[13px] text-ink-subtle">
          Paste your full resume text. Every kit generation uses this to tailor
          the cover letter and rewrite resume bullets for the specific role.
        </p>
        <textarea
          rows={16}
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          placeholder="Paste your resume here — skills, experience, education, projects…"
          className="w-full resize-y rounded-lg border border-hairline bg-surface-2 px-3 py-2.5 text-[14px] leading-relaxed text-ink placeholder:text-ink-tertiary outline-none focus:border-hairline-strong font-mono text-[13px]"
        />
        <p className="mt-1.5 text-right text-[12px] text-ink-tertiary">
          {charCount.toLocaleString()} characters
        </p>
      </div>

      {/* Save row */}
      <div className="flex items-center justify-between">
        <div>
          {status === "error" && (
            <p className="text-[13px] text-red-400">{error}</p>
          )}
          {status === "saved" && (
            <p className="text-[13px] text-success">✓ Saved</p>
          )}
        </div>
        <button
          type="submit"
          disabled={status === "saving"}
          className="rounded-lg bg-primary px-5 py-2.5 text-[14px] font-medium text-on-primary transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {status === "saving" ? "Saving…" : "Save profile"}
        </button>
      </div>
    </form>
  );
}
