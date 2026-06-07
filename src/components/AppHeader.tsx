import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import SignOutButton from "@/components/SignOutButton";
import NavLinks from "@/components/NavLinks";

export default function AppHeader({ email }: { email?: string | null }) {
  return (
    <>
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-hairline bg-canvas px-4 sm:px-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-md bg-primary" />
            <span className="text-sm font-semibold">Job Search Copilot</span>
          </Link>
          <NavLinks />
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {email && (
            <span className="hidden text-[13px] text-ink-subtle lg:inline">
              {email}
            </span>
          )}
          <ThemeToggle />
          <SignOutButton />
        </div>
      </header>

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-20 sm:hidden">
        <NavLinks mobile />
      </div>
    </>
  );
}
