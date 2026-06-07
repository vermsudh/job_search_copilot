"use client";

import { useState } from "react";
import { saveProfile } from "@/lib/profile";
import type { Profile } from "@/lib/types";

export default function SettingsForm({
  initialProfile,
}: {
  initialProfile: Profile | null;
}) {
  const [fullName, setFullName] = useState(initialProfile?.full_name ?? "");
  const [resumeText, setResumeText] = useState(
    initialProfile?.resume_text ?? "",
  );
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [saveError, setSaveError] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveStatus("saving");
    setSaveError("");
    try {
      await saveProfile({
        full_name: fullName.trim() || null,
        resume_text: resumeText.trim(),
      });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setSaveError(msg || "Failed to save.");
      setSaveStatus("error");
    }
  }

  const charCount = resumeText.length;

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Full name */}
      <div className="rounded-xl border border-hairline bg-surface-1 p-6">
        <label className="mb-1 block text-[14px] font-medium">Full name</label>
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
        <div className="mb-4">
          <label className="block text-[14px] font-medium">
            Base resume
          </label>
          <p className="mt-1 text-[13px] text-ink-subtle">
            Paste your resume text here — skills, experience, education,
            projects. Used to tailor every kit to your background.
          </p>
        </div>

        <textarea
          rows={16}
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          placeholder="Upload your PDF above, or paste your resume text here — skills, experience, education, projects…"
          className="w-full resize-y rounded-lg border border-hairline bg-surface-2 px-3 py-2.5 font-mono text-[13px] leading-relaxed text-ink placeholder:text-ink-tertiary outline-none focus:border-hairline-strong"
        />
        <p className="mt-1.5 text-right text-[12px] text-ink-tertiary">
          {charCount.toLocaleString()} characters
        </p>
      </div>

      {/* Save */}
      <div className="flex items-center justify-between">
        <div>
          {saveStatus === "error" && (
            <p className="text-[13px] text-red-400">{saveError}</p>
          )}
          {saveStatus === "saved" && (
            <p className="text-[13px] text-success">✓ Profile saved</p>
          )}
        </div>
        <button
          type="submit"
          disabled={saveStatus === "saving"}
          className="rounded-lg bg-primary px-5 py-2.5 text-[14px] font-medium text-on-primary transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {saveStatus === "saving" ? "Saving…" : "Save profile"}
        </button>
      </div>
    </form>
  );
}
