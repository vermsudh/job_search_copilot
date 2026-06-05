import { createClient } from "@/lib/supabase/client";
import type { Job, JobStatus, KitData } from "./types";

export async function fetchJobs(): Promise<Job[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Job[];
}

export type NewJobInput = {
  title: string;
  company: string;
  url: string | null;
  description: string;
  status: JobStatus;
  sort_order: number;
};

export async function createJob(input: NewJobInput): Promise<Job> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("jobs")
    .insert({ ...input, user_id: user.id })
    .select("*")
    .single();
  if (error) throw error;
  return data as Job;
}

export async function updateJob(
  id: string,
  patch: Partial<
    Pick<
      Job,
      "title" | "company" | "url" | "description" | "status" | "sort_order"
    >
  > & { kit?: KitData | null },
): Promise<Job> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("jobs")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Job;
}

export async function deleteJob(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("jobs").delete().eq("id", id);
  if (error) throw error;
}

// Persist new (status, sort_order) for a batch of cards after a drag.
export async function persistOrder(
  updates: { id: string; status: JobStatus; sort_order: number }[],
): Promise<void> {
  const supabase = createClient();
  await Promise.all(
    updates.map((u) =>
      supabase
        .from("jobs")
        .update({ status: u.status, sort_order: u.sort_order })
        .eq("id", u.id),
    ),
  );
}
