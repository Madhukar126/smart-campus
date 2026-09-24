"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { PriorityBadge } from "@/components/PriorityBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { getCurrentUser, getMyIssues } from "@/lib/api";
import { clearToken, readToken } from "@/lib/auth";
import type { User } from "@/types/auth";
import type { IssueSummary } from "@/types/issue";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [recentIssues, setRecentIssues] = useState<IssueSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = readToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    getCurrentUser(token)
      .then((u) => {
        setUser(u);
        if (u.role === "STUDENT" || u.role === "STAFF") {
          getMyIssues()
            .then((issues) => setRecentIssues(issues.slice(0, 5)))
            .catch(console.error);
        }
      })
      .catch(() => {
        clearToken();
        router.replace("/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <div className="flex-1 max-w-6xl w-full mx-auto p-8 animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-1/4" />
          <div className="h-48 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-emerald-950 p-6 sm:p-8 text-white shadow-md mb-8">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="inline-block rounded-full bg-emerald-800/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300">
                {user.role} Workspace
              </span>
              <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight">
                Welcome back, {user.name}
              </h1>
              <p className="mt-1 text-sm text-emerald-100/80 max-w-xl">
                Campus360 ensures fast, transparent communication and resolution for all campus facilities.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {(user.role === "STUDENT" || user.role === "STAFF") && (
                <>
                  <Link
                    href="/issues/new"
                    className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-400 transition-colors"
                  >
                    + Report an Issue
                  </Link>
                  <Link
                    href="/my-issues"
                    className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/20 transition-colors"
                  >
                    My Reports
                  </Link>
                </>
              )}

              {(user.role === "ADMIN" || user.role === "AO") && (
                <>
                  <Link
                    href="/admin"
                    className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-400 transition-colors"
                  >
                    Admin Dashboard
                  </Link>
                  <Link
                    href="/admin/analytics"
                    className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/20 transition-colors"
                  >
                    View Analytics
                  </Link>
                </>
              )}

              {user.role === "MAINTENANCE" && (
                <>
                  <Link
                    href="/maintenance"
                    className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-400 transition-colors"
                  >
                    Open Workbench
                  </Link>
                  <Link
                    href="/maintenance/assigned"
                    className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/20 transition-colors"
                  >
                    Assigned Issues
                  </Link>
                </>
              )}

              {user.role === "PRINCIPAL" && (
                <>
                  <Link
                    href="/admin/analytics"
                    className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-400 transition-colors"
                  >
                    Campus Analytics
                  </Link>
                  <Link
                    href="/issues"
                    className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/20 transition-colors"
                  >
                    All Issues
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Quick Access Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mb-8">
          <Link
            href="/issues"
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-800 text-lg">
                📢
              </span>
              <div>
                <h3 className="font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                  Public Issues Feed
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Explore reports submitted across campus</p>
              </div>
            </div>
          </Link>

          <Link
            href="/notifications"
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-800 text-lg">
                🔔
              </span>
              <div>
                <h3 className="font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                  Notifications
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Status updates and triage alerts</p>
              </div>
            </div>
          </Link>

          {(user.role === "ADMIN" || user.role === "AO" || user.role === "PRINCIPAL") ? (
            <Link
              href="/admin/analytics"
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-purple-50 text-purple-800 text-lg">
                  📊
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                    Campus Analytics
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Resolution SLA, categories, and trends</p>
                </div>
              </div>
            </Link>
          ) : (
            <Link
              href="/issues/new"
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-800 text-lg">
                  ✏️
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                    Report Issue
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Submit a problem with photo evidence</p>
                </div>
              </div>
            </Link>
          )}
        </div>

        {/* Recent Reports for Student / Staff */}
        {(user.role === "STUDENT" || user.role === "STAFF") && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">Your Recent Reports</h2>
              <Link href="/my-issues" className="text-xs font-semibold text-emerald-800 hover:underline">
                View all ({recentIssues.length}) →
              </Link>
            </div>

            {recentIssues.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">You haven&apos;t reported any issues yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentIssues.map((iss) => (
                  <div key={iss.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <Link href={`/issues/${iss.id}`} className="font-bold text-slate-900 text-sm hover:text-emerald-700 block truncate">
                        {iss.title}
                      </Link>
                      <span className="text-xs text-slate-400">📍 {iss.location.name} • {iss.category.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <PriorityBadge priority={iss.priority} />
                      <StatusBadge status={iss.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
