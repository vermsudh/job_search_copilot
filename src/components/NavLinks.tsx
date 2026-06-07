"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Board" },
  { href: "/settings", label: "Settings" },
];

export default function NavLinks({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  if (mobile) {
    return (
      <div className="flex border-t border-hairline bg-canvas">
        {links.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 items-center justify-center py-3 text-[13px] font-medium transition-colors ${
                active ? "text-primary" : "text-ink-subtle hover:text-ink"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <nav className="hidden items-center gap-1 sm:flex">
      {links.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
              active
                ? "bg-surface-2 text-ink"
                : "text-ink-subtle hover:bg-surface-1 hover:text-ink"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
