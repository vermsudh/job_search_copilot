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
import { createJob, persistOrder } from "@/lib/jobs";
import Column from "./Column";
import { JobCardBody } from "./JobCard";

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
    const job = container?.length
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
    // Reorder within the destination column.
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

    // Persist source + destination columns with reindexed sort_order.
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

  async function quickAdd() {
    const order = columns.wishlist.length;
    const job = await createJob({
      title: "New role",
      company: "",
      url: null,
      description: "",
      status: "wishlist",
      sort_order: order,
    });
    setColumns((prev) => ({ ...prev, wishlist: [...prev.wishlist, job] }));
  }

  function openJob(job: Job) {
    // Card detail drawer arrives in the next step.
    console.log("open", job.id);
  }

  return (
    <div className="mx-auto w-full max-w-[1280px] px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[22px] font-semibold tracking-[-0.4px]">Pipeline</h1>
        <button
          onClick={quickAdd}
          className="rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-on-primary transition-colors hover:bg-primary-hover"
        >
          Add job
        </button>
      </div>

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
              onOpenJob={openJob}
            />
          ))}
        </div>

        <DragOverlay>
          {activeJob ? (
            <div className="rounded-lg border border-hairline-strong bg-surface-2 p-3">
              <JobCardBody job={activeJob} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
