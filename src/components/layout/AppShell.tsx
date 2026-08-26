"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CircleUserRound,
  Home,
  Images,
  Plus,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const desktopNav = [
  { href: "/", label: "Dream", icon: Home },
  { href: "/timeline", label: "Timeline", icon: Images },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/people", label: "People", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

const mobileNav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/timeline", label: "Timeline", icon: Images },
  { href: "/dream/new", label: "Add", icon: Plus, primary: true },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/settings", label: "Profile", icon: CircleUserRound },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth = pathname?.startsWith("/login");

  if (isAuth) {
    return <>{children}</>;
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-white/5 px-4 py-8 md:flex">
        <Link href="/" className="mb-10 px-3">
          <span className="font-display text-2xl tracking-tight text-[var(--text)]">
            Dreamline
          </span>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Your dream journal
          </p>
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {desktopNav.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                  active
                    ? "bg-white/5 text-[var(--accent)]"
                    : "text-[var(--text-muted)] hover:bg-white/[0.03] hover:text-[var(--text)]",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/dream/new"
          className="mt-4 flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-medium text-[#1a1612] transition hover:brightness-110"
        >
          <Plus className="h-4 w-4" />
          Add Dream
        </Link>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col pb-24 md:pb-0">
        <header className="flex items-center justify-between px-5 pt-6 md:hidden">
          <Link href="/" className="font-display text-xl">
            Dreamline
          </Link>
          <Link
            href="/dream/new"
            className="rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-[#1a1612]"
          >
            + Add
          </Link>
        </header>
        <main className="flex-1 px-5 py-6 md:px-10 md:py-10">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/5 bg-[#0c0d10]/95 backdrop-blur md:hidden">
        <ul className="mx-auto flex max-w-lg items-end justify-between px-2 pb-safe pt-2">
          {mobileNav.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(item.href);
            const Icon = item.icon;
            if (item.primary) {
              return (
                <li key={item.href} className="-mt-5">
                  <Link
                    href={item.href}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-[#1a1612] shadow-lg shadow-black/40"
                    aria-label="Add Dream"
                  >
                    <Icon className="h-6 w-6" />
                  </Link>
                </li>
              );
            }
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1 px-2 py-2 text-[10px]",
                    active ? "text-[var(--accent)]" : "text-[var(--text-muted)]",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
