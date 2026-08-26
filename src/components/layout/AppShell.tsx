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
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl">
      <aside className="sticky top-0 hidden h-dvh w-48 shrink-0 flex-col border-r border-white/[0.06] px-3 py-8 lg:flex">
        <Link href="/" className="mb-8 px-2 font-display text-xl">
          Dreamline
        </Link>
        <nav className="flex flex-1 flex-col gap-0.5">
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
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm",
                  active
                    ? "text-[var(--text)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text)]",
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
          className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-4 text-sm font-medium text-[#1a1612]"
        >
          <Plus className="h-4 w-4" />
          Add Dream
        </Link>
      </aside>

      <div className="flex min-h-dvh flex-1 flex-col pb-[calc(4.75rem+env(safe-area-inset-bottom))] lg:pb-0">
        <header className="sticky top-0 z-30 flex items-center bg-[var(--bg)]/90 px-4 pb-2.5 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-sm lg:hidden">
          <Link href="/" className="font-display text-lg">
            Dreamline
          </Link>
        </header>

        <main className="mx-auto w-full flex-1 px-4 py-4 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.06] bg-[var(--bg)] lg:hidden">
        <ul className="mx-auto flex max-w-lg items-center justify-between px-2 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1">
          {mobileNav.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(item.href);
            const Icon = item.icon;
            if (item.primary) {
              return (
                <li key={item.href} className="flex flex-1 justify-center">
                  <Link
                    href={item.href}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent)] text-[#1a1612]"
                    aria-label="Add Dream"
                  >
                    <Icon className="h-5 w-5" />
                  </Link>
                </li>
              );
            }
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-label={item.label}
                  className={cn(
                    "flex min-h-11 items-center justify-center",
                    active ? "text-[var(--text)]" : "text-[var(--text-muted)]",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
