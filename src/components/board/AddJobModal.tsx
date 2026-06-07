"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import type { Job, JobStatus } from "@/lib/types";
import { JOB_STATUSES, STATUS_LABELS } from "@/lib/types";
import { createJob } from "@/lib/jobs";

type Props = {
  open: boolean;
  defaultStatus?: JobStatus;
  onClose: () => void;
  onCreated: (job: Job) => void;
};

export default function AddJobModal({
  open,
  defaultStatus = "wishlist",
  onClose,
  onCreated,
}: Props) {
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<JobStatus>(defaultStatus);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setTitle("");
    setCompany("");
    setUrl("");
    setDescription("");
    setStatus(defaultStatus);
    setError("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function autoExtract() {
    if (!description.trim()) return;
    setExtracting(true);
    setError("");
    try {
      const res = await fetch("/api/parse-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: description }),
      });
      if (!res.ok) throw new Error("Extraction failed");
      const data = await res.json();
      if (data.title) setTitle(data.title);
      if (data.company) setCompany(data.company);
    } catch {
      setError("Auto-extract failed — fill title and company manually.");
    } finally {
      setExtracting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) {
      setError("Paste the job description to continue.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const job = await createJob({
        title: title.trim() || "Untitled role",
        company: company.trim(),
        url: url.trim() || null,
        description: description.trim(),
        status,
        sort_order: Date.now(),
      });
      onCreated(job);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save job.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add job" width="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Description — primary input */}
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-ink-subtle">
            Job description <span className="text-primary">*</span>
          </label>
          <textarea
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Paste the job posting text here…"
            className="w-full resize-none rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-[14px] text-ink placeholder:text-ink-tertiary outline-none focus:border-hairline-strong"
          />
          <button
            type="button"
            onClick={autoExtract}
            disabled={!description.trim() || extracting}
            className="mt-1.5 text-[13px] text-primary transition-colors hover:text-primary-hover disabled:opacity-50"
          >
            {extracting ? "Extracting…" : "✦ Auto-extract title & company"}
          </button>
        </div>

        {/* Title & Company */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-ink-subtle">
              Role title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Frontend Intern"
              className="w-full rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-[14px] text-ink placeholder:text-ink-tertiary outline-none focus:border-hairline-strong"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-ink-subtle">
              Company
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Acme Inc."
              className="w-full rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-[14px] text-ink placeholder:text-ink-tertiary outline-none focus:border-hairline-strong"
            />
          </div>
        </div>

        {/* URL & Pipeline column */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-ink-subtle">
              Job URL <span className="text-ink-tertiary">(optional)</span>
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              className="w-full rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-[14px] text-ink placeholder:text-ink-tertiary outline-none focus:border-hairline-strong"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-ink-subtle">
              Pipeline column
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as JobStatus)}
              className="w-full rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-[14px] text-ink outline-none focus:border-hairline-strong"
            >
              {JOB_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p className="text-[13px] text-red-400">{error}</p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-hairline bg-surface-1 px-4 py-2 text-[14px] font-medium text-ink-subtle transition-colors hover:bg-surface-2 hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary px-4 py-2 text-[14px] font-medium text-on-primary transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            {saving ? "Saving…" : "Add job"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
