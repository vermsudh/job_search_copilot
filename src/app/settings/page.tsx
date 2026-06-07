import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/components/AppHeader";
import SettingsForm from "./SettingsForm";
import type { Profile } from "@/lib/types";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const profile = data as Profile | null;

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader email={user.email} />
      <main className="mx-auto w-full max-w-2xl px-4 pb-20 pt-10 sm:px-6 sm:pb-10">
        <div className="mb-8">
          <p className="text-[13px] font-medium tracking-[0.4px] text-ink-subtle">
            SETTINGS
          </p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.6px]">
            Your profile
          </h1>
          <p className="mt-2 text-[14px] text-ink-muted">
            Your resume is used to tailor every Generate Kit — cover letters,
            rewritten bullets, and interview prep are personalised to you.
          </p>
        </div>
        <SettingsForm initialProfile={profile} />
      </main>
    </div>
  );
}
