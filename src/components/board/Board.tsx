"use client";

import { useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { Job, JobStatus } from "@/lib/types";
import { JOB_STATUSES } from "@/lib/types";
import { persistOrder } from "@/lib/jobs";
import Column from "./Column";
import { JobCardBody } from "./JobCard";
import AddJobModal from "./AddJobModal";
import CardDrawer from "./CardDrawer";

type Columns = Record<JobStatus, Job[]>;

function group(jobs: Job[]): Columns {
  const cols: Columns = {
    wishlist: [],
    applied: [],
    interviewing: [],
    offer: [],
    rejected: [],
  };
  for (const job of [...jobs].sort((a, b) => a.sort_order - b.sort_order)) {
    cols[job.status].push(job);
  }
  return cols;
}

export default function Board({ initialJobs }: { initialJobs: Job[] }) {
  const [columns, setColumns] = useState<Columns>(() => group(initialJobs));
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const sourceContainer = useRef<JobStatus | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function findContainer(id: string): JobStatus | undefined {
    if ((JOB_STATUSES as string[]).includes(id)) return id as JobStatus;
    return JOB_STATUSES.find((s) => columns[s].some((j) => j.id === id));
  }

  function handleDragStart(e: DragStartEvent) {
    const id = String(e.active.id);
    const container = findContainer(id);
    sourceContainer.current = container ?? null;
    const job = container
      ? columns[container].find((j) => j.id === id) ?? null
      : null;
    setActiveJob(job);
  }

  function handleDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const from = findContainer(activeId);
    const to = findContainer(overId);
    if (!from || !to || from === to) return;

    setColumns((prev) => {
      const fromItems = prev[from];
      const toItems = prev[to];
      const moving = fromItems.find((j) => j.id === activeId);
      if (!moving) return prev;
      let overIndex = toItems.findIndex((j) => j.id === overId);
      if (overIndex === -1) overIndex = toItems.length;
      return {
        ...prev,
        [from]: fromItems.filter((j) => j.id !== activeId),
        [to]: [
          ...toItems.slice(0, overIndex),
          { ...moving, status: to },
          ...toItems.slice(overIndex),
        ],
      };
    });
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveJob(null);
    const source = sourceContainer.current;
    sourceContainer.current = null;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const dest = findContainer(activeId);
    if (!dest) return;

    let next = columns;
    const overContainer = findContainer(overId);
    if (overContainer === dest) {
      const items = columns[dest];
      const oldIndex = items.findIndex((j) => j.id === activeId);
      const newIndex = items.findIndex((j) => j.id === overId);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        next = { ...columns, [dest]: arrayMove(items, oldIndex, newIndex) };
        setColumns(next);
      }
    }

    const affected = new Set<JobStatus>([dest]);
    if (source) affected.add(source);
    const updates: { id: string; status: JobStatus; sort_order: number }[] = [];
    for (const s of affected) {
      next[s].forEach((j, i) =>
        updates.push({ id: j.id, status: s, sort_order: i }),
      );
    }
    if (updates.length) persistOrder(updates).catch(console.error);
  }

  function handleJobCreated(job: Job) {
    setColumns((prev) => ({
      ...prev,
      [job.status]: [...prev[job.status], job],
    }));
  }

  function handleJobUpdated(updated: Job) {
    setColumns((prev) => {
      const col = prev[updated.status];
      return {
        ...prev,
        [updated.status]: col.map((j) => (j.id === updated.id ? updated : j)),
      };
    });
    setSelectedJob(updated);
  }

  function handleJobDeleted(id: string) {
    setColumns((prev) => {
      const next = { ...prev } as Columns;
      for (const s of JOB_STATUSES) {
        next[s] = next[s].filter((j) => j.id !== id);
      }
      return next;
    });
  }

  const totalJobs = JOB_STATUSES.reduce((n, s) => n + columns[s].length, 0);

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 pb-20 pt-8 sm:px-6 sm:pb-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[22px] font-semibold tracking-[-0.4px]">
          Pipeline
        </h1>
        <button
          onClick={() => setAddModalOpen(true)}
          className="rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-on-primary transition-colors hover:bg-primary-hover"
        >
          + Add job
        </button>
      </div>

      {/* Empty state */}
      {totalJobs === 0 && (
        <div className="mb-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-hairline-strong py-16 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink-subtle">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
          </div>
          <p className="text-[15px] font-medium text-ink">Start tracking your search</p>
          <p className="mt-1 max-w-xs text-[13px] text-ink-subtle">
            Add your first job — paste a description, get a tailored cover letter, resume bullets, and interview prep in seconds.
          </p>
          <button
            onClick={() => setAddModalOpen(true)}
            className="mt-5 rounded-lg bg-primary px-4 py-2 text-[14px] font-medium text-on-primary transition-colors hover:bg-primary-hover"
          >
            + Add your first job
          </button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {JOB_STATUSES.map((status) => (
            <Column
              key={status}
              status={status}
              jobs={columns[status]}
              onOpenJob={setSelectedJob}
            />
          ))}
        </div>

        <DragOverlay>
          {activeJob ? (
            <div className="rounded-lg border border-hairline-strong bg-surface-2 p-3 shadow-lg">
              <JobCardBody job={activeJob} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <AddJobModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onCreated={handleJobCreated}
      />

      <CardDrawer
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
        onJobUpdated={handleJobUpdated}
        onJobDeleted={handleJobDeleted}
      />
    </div>
  );
}
