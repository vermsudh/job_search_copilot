"use client";

import { useState } from "react";
import type { Job, KitData } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={copy}
      className="rounded-md border border-hairline px-2 py-1 text-[12px] font-medium text-ink-subtle transition-colors hover:bg-surface-2 hover:text-ink"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function KitSection({
  label,
  content,
}: {
  label: string;
  content: string | string[];
}) {
  const text = Array.isArray(content) ? content.join("\n") : content;
  const display = Array.isArray(content) ? (
    <ul className="space-y-1.5">
      {content.map((item, i) => (
        <li key={i} className="flex gap-2 text-[14px] text-ink-muted">
          <span className="mt-0.5 shrink-0 text-ink-tertiary">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  ) : (
    <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-ink-muted">
      {content}
    </p>
  );

  return (
    <div className="rounded-lg border border-hairline bg-surface-2 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[12px] font-medium tracking-[0.3px] text-ink-subtle uppercase">
          {label}
        </span>
        <CopyButton text={text} />
      </div>
      {display}
    </div>
  );
}

type Props = {
  job: Job | null;
  onClose: () => void;
  onJobUpdated: (job: Job) => void;
  onJobDeleted: (id: string) => void;
};

export default function CardDrawer({
  job,
  onClose,
  onJobUpdated,
  onJobDeleted,
}: Props) {
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!job) return null;

  async function generateKit() {
    if (!job) return;
    setGenerating(true);
    setGenError("");
    try {
      const res = await fetch("/api/generate-kit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Generation failed");
      }
      const data: { kit: KitData } = await res.json();
      onJobUpdated({ ...job, kit: data.kit });
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleDelete() {
    const { deleteJob } = await import("@/lib/jobs");
    await deleteJob(job!.id);
    onJobDeleted(job!.id);
    onClose();
  }

  const kit = job.kit;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40"
        style={{ backgroundColor: "var(--overlay)" }}
      />

      {/* Drawer */}
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-xl flex-col border-l border-hairline bg-surface-1 shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-hairline px-6 py-5">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="truncate text-[18px] font-semibold tracking-[-0.3px]">
              {job.title || "Untitled role"}
            </h2>
            <div className="mt-1 flex items-center gap-3">
              <span className="text-[14px] text-ink-subtle">
                {job.company || "—"}
              </span>
              <span className="rounded-full border border-hairline px-2 py-0.5 text-[12px] text-ink-subtle">
                {STATUS_LABELS[job.status]}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-hairline text-ink-subtle transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Meta */}
          <div className="space-y-2">
            {job.url && (
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[13px] text-primary hover:text-primary-hover"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                View posting
              </a>
            )}
            {job.description && (
              <details className="group">
                <summary className="cursor-pointer list-none text-[13px] font-medium text-ink-subtle hover:text-ink">
                  <span className="group-open:hidden">▶ Show job description</span>
                  <span className="hidden group-open:inline">▼ Hide job description</span>
                </summary>
                <p className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-hairline bg-surface-2 p-3 text-[13px] leading-relaxed text-ink-muted">
                  {job.description}
                </p>
              </details>
            )}
          </div>

          {/* Generate Kit */}
          <div className="rounded-xl border border-hairline bg-surface-2 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[15px] font-semibold">Generate Kit</p>
                <p className="mt-0.5 text-[13px] text-ink-subtle">
                  Cover letter · Resume bullets · Interview Qs · Company brief
                </p>
              </div>
              <button
                onClick={generateKit}
                disabled={generating}
                className="shrink-0 rounded-lg bg-primary px-4 py-2 text-[14px] font-medium text-on-primary transition-colors hover:bg-primary-hover disabled:opacity-60"
              >
                {generating
                  ? "Generating…"
                  : kit
                  ? "Regenerate"
                  : "Generate"}
              </button>
            </div>
            {genError && (
              <p className="mt-3 text-[13px] text-red-400">{genError}</p>
            )}
            {generating && (
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-surface-3">
                <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
              </div>
            )}
          </div>

          {/* Kit sections */}
          {kit && (
            <div className="space-y-3">
              {kit.generatedAt && (
                <p className="text-[12px] text-ink-tertiary">
                  Generated {new Date(kit.generatedAt).toLocaleString()}
                </p>
              )}
              <KitSection label="Cover Letter" content={kit.coverLetter} />
              <KitSection label="Resume Bullets" content={kit.resumeBullets} />
              <KitSection
                label="Interview Questions"
                content={kit.interviewQuestions}
              />
              <KitSection label="Company Brief" content={kit.companyBrief} />
            </div>
          )}
        </div>

        {/* Footer — danger zone */}
        <div className="border-t border-hairline px-6 py-4">
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-[13px] text-ink-tertiary transition-colors hover:text-red-400"
            >
              Delete this job
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-[13px] text-ink-muted">Are you sure?</span>
              <button
                onClick={handleDelete}
                className="text-[13px] font-medium text-red-400 hover:text-red-300"
              >
                Yes, delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-[13px] text-ink-subtle hover:text-ink"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
