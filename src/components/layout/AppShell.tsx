"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  CircleUserRound,
  Home,
  Plus,
} from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { cn } from "@/lib/utils/cn";

const desktopNav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/timeline", label: "Dreams", icon: BookOpen },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/settings", label: "Profile", icon: CircleUserRound },
];

const mobileNav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/timeline", label: "Dreams", icon: BookOpen },
  { href: "/dream/new", label: "Add", icon: Plus, primary: true },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/settings", label: "Profile", icon: CircleUserRound },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth =
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/forgot-password") ||
    pathname?.startsWith("/reset-password");

  if (isAuth) {
    return <div className="dream-bg min-h-dvh">{children}</div>;
  }

  return (
    <div className="dream-bg relative min-h-dvh">
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl">
        <aside
          data-app-chrome
          className="sticky top-0 hidden h-dvh w-52 shrink-0 flex-col border-r border-white/10 px-3 py-8 lg:flex"
        >
          <div className="mb-8 px-2">
            <BrandLogo height={44} />
          </div>
          <nav className="flex flex-1 flex-col gap-0.5">
            {desktopNav.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname?.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm",
                    active
                      ? "bg-white/5 text-[var(--accent)]"
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
            className="btn-gold mt-4 flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm"
          >
            <Plus className="h-4 w-4" />
            New dream
          </Link>
        </aside>

        <div className="flex min-h-dvh flex-1 flex-col pb-[calc(5.25rem+env(safe-area-inset-bottom))] lg:pb-0">
          <header
            data-app-chrome
            className="sticky top-0 z-30 flex items-center justify-center px-4 pb-3 pt-[max(0.85rem,env(safe-area-inset-top))] lg:hidden"
          >
            <BrandLogo height={48} />
          </header>

          <main className="mx-auto flex w-full min-h-0 flex-1 flex-col px-4 py-2 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>

        <nav
          data-app-chrome
          className="fixed inset-x-0 bottom-0 z-40 lg:hidden"
        >
          <div className="glass border-t border-white/10">
            <ul className="mx-auto flex max-w-lg items-end justify-between px-3 pb-[max(0.45rem,env(safe-area-inset-bottom))] pt-2">
              {mobileNav.map((item) => {
                const active = item.primary
                  ? pathname?.startsWith("/dream/new")
                  : item.href === "/"
                    ? pathname === "/"
                    : pathname?.startsWith(item.href);
                const Icon = item.icon;
                if (item.primary) {
                  return (
                    <li
                      key="primary-add"
                      className="relative -mt-5 flex flex-1 justify-center"
                    >
                      <Link
                        href={item.href}
                        className={cn(
                          "btn-gold glow-accent-soft flex h-14 w-14 items-center justify-center rounded-full",
                          active && "ring-2 ring-[var(--accent)]/50",
                        )}
                        aria-label="New dream"
                      >
                        <Icon className="h-6 w-6" strokeWidth={2.25} />
                      </Link>
                    </li>
                  );
                }
                return (
                  <li key={`${item.href}-${item.label}`} className="flex-1">
                    <Link
                      href={item.href}
                      className={cn(
                        "flex min-h-12 flex-col items-center justify-center gap-0.5 text-xs",
                        active
                          ? "text-[var(--accent)]"
                          : "text-[var(--text-muted)]",
                      )}
                    >
                      <Icon className="h-5 w-5" strokeWidth={1.6} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      </div>
    </div>
  );
}
