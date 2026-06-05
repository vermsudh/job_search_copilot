import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import SignOutButton from "@/components/SignOutButton";

export default function AppHeader({ email }: { email?: string | null }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-hairline bg-canvas px-6">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-md bg-primary" />
          <span className="text-sm font-semibold">Job Search Copilot</span>
        </Link>
        <nav className="hidden items-center gap-1 sm:flex">
          <Link
            href="/"
            className="rounded-md px-2.5 py-1.5 text-[13px] text-ink-subtle transition-colors hover:text-ink"
          >
            Board
          </Link>
          <Link
            href="/settings"
            className="rounded-md px-2.5 py-1.5 text-[13px] text-ink-subtle transition-colors hover:text-ink"
          >
            Settings
          </Link>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        {email && (
          <span className="hidden text-[13px] text-ink-subtle sm:inline">
            {email}
          </span>
        )}
        <ThemeToggle />
        <SignOutButton />
      </div>
    </header>
  );
}
