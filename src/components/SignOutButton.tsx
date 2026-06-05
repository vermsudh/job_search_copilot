"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      className="rounded-lg border border-hairline bg-surface-1 px-3 py-1.5 text-[13px] font-medium text-ink-subtle transition-colors hover:text-ink hover:bg-surface-2"
    >
      Sign out
    </button>
  );
}
