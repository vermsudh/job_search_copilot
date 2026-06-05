import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/components/AppHeader";
import Board from "@/components/board/Board";
import type { Job } from "@/lib/types";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data } = await supabase
    .from("jobs")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader email={user.email} />
      <main className="flex-1">
        <Board initialJobs={(data ?? []) as Job[]} />
      </main>
    </div>
  );
}
