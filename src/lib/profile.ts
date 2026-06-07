import { createClient } from "@/lib/supabase/client";
import type { Profile } from "./types";

export async function getProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (data as Profile) ?? null;
}

export async function saveProfile(
  patch: Partial<Pick<Profile, "full_name" | "resume_text">>,
): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("profiles")
    .upsert({ user_id: user.id, ...patch }, { onConflict: "user_id" });

  if (error) throw new Error(error.message);
}
