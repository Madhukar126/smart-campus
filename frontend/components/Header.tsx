"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearToken, readToken } from "@/lib/auth";
import { getCurrentUser, getNotifications } from "@/lib/api";
import type { User } from "@/types/auth";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = readToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    getCurrentUser(token)
      .then((u) => {
        setUser(u);
        return getNotifications().then((n) => setUnreadCount(n.unread_count)).catch(() => {});
      })
      .catch(() => {
        clearToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [pathname]);

  function handleLogout() {
    clearToken();
    setUser(null);
    router.push("/login");
  }

  // Navigation Links based on role
  const getNavLinks = () => {
    if (!user) {
      return [
        { label: "Home", href: "/" },
        { label: "Issues", href: "/issues" },
      ];
    }

    switch (user.role) {
      case "ADMIN":
      case "AO":
        return [
          { label: "Admin Dashboard", href: "/admin" },
          { label: "Issues", href: "/issues" },
          { label: "Categories", href: "/admin/categories" },
          { label: "Locations", href: "/admin/locations" },
          { label: "Analytics", href: "/admin/analytics" },
        ];
      case "MAINTENANCE":
        return [
          { label: "Dashboard", href: "/maintenance" },
          { label: "Assigned Issues", href: "/maintenance/assigned" },
          { label: "All Issues", href: "/issues" },
        ];
      case "PRINCIPAL":
        return [
          { label: "Dashboard", href: "/dashboard" },
          { label: "Analytics", href: "/admin/analytics" },
          { label: "All Issues", href: "/issues" },
        ];
      case "STUDENT":
      case "STAFF":
      default:
        return [
          { label: "Dashboard", href: "/dashboard" },
          { label: "Report Issue", href: "/issues/new" },
          { label: "All Issues", href: "/issues" },
          { label: "My Issues", href: "/my-issues" },
        ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <header className="sticky top-0 z-40 border-b border-emerald-950/10 bg-white/95 backdrop-blur shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3.5">
        <div className="flex items-center gap-6">
          <Link className="flex items-center gap-2.5 font-bold text-emerald-950" href="/">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-800 text-white font-black text-lg shadow-sm">
              C
            </span>
            <span className="text-xl tracking-tight font-extrabold text-emerald-950">Campus360</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            {navLinks.map((link) => {
              const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    active
                      ? "bg-emerald-50 text-emerald-900 font-semibold"
                      : "text-slate-600 hover:text-emerald-900 hover:bg-slate-50"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-8 w-20 bg-slate-100 animate-pulse rounded-lg" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/notifications"
                className="relative p-2 rounded-lg text-slate-600 hover:text-emerald-900 hover:bg-slate-100 transition-colors"
                title="Notifications"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-900">{user.name}</span>
                <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
                  {user.role}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                className="text-sm font-semibold rounded-lg px-3.5 py-1.5 text-emerald-900 hover:bg-emerald-50 transition-colors"
                href="/login"
              >
                Log in
              </Link>
              <Link
                className="text-sm font-semibold rounded-lg bg-emerald-700 px-4 py-1.5 text-white hover:bg-emerald-800 transition-colors shadow-sm"
                href="/register"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
