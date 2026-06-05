"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Job, JobStatus } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";
import JobCard from "./JobCard";

const DOT: Record<JobStatus, string> = {
  wishlist: "bg-ink-tertiary",
  applied: "bg-ink-subtle",
  interviewing: "bg-primary",
  offer: "bg-success",
  rejected: "bg-ink-tertiary",
};

export default function Column({
  status,
  jobs,
  onOpenJob,
}: {
  status: JobStatus;
  jobs: Job[];
  onOpenJob: (job: Job) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex min-w-[260px] flex-1 flex-col">
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className={`h-1.5 w-1.5 rounded-full ${DOT[status]}`} />
        <span className="text-[13px] font-medium text-ink-subtle">
          {STATUS_LABELS[status]}
        </span>
        <span className="text-[12px] text-ink-tertiary">{jobs.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex flex-1 flex-col gap-2 rounded-xl border p-2 transition-colors ${
          isOver
            ? "border-hairline-strong bg-surface-1"
            : "border-hairline bg-surface-1/40"
        }`}
      >
        <SortableContext
          items={jobs.map((j) => j.id)}
          strategy={verticalListSortingStrategy}
        >
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} onOpen={onOpenJob} />
          ))}
        </SortableContext>

        {jobs.length === 0 && (
          <div className="flex flex-1 items-center justify-center py-8 text-[12px] text-ink-tertiary">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}
