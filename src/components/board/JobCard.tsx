"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Job } from "@/lib/types";

export function JobCardBody({ job }: { job: Job }) {
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[14px] font-medium leading-snug text-ink">
          {job.title || "Untitled role"}
        </p>
        {job.kit && (
          <span className="shrink-0 rounded-full bg-surface-3 px-2 py-0.5 text-[11px] font-medium text-success">
            Kit
          </span>
        )}
      </div>
      <p className="mt-1 text-[13px] text-ink-subtle">{job.company || "—"}</p>
    </>
  );
}

export default function JobCard({
  job,
  onOpen,
}: {
  job: Job;
  onOpen: (job: Job) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: job.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(job)}
      className="cursor-grab touch-none rounded-lg border border-hairline bg-surface-2 p-3 transition-colors hover:border-hairline-strong active:cursor-grabbing"
    >
      <JobCardBody job={job} />
    </div>
  );
}
