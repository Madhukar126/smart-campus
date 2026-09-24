"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { PriorityBadge } from "@/components/PriorityBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { getCurrentUser, getMaintenanceAssignedIssues, startMaintenanceWork } from "@/lib/api";
import { readToken } from "@/lib/auth";
import type { IssueSummary } from "@/types/issue";

export default function MaintenanceDashboardPage() {
  const router = useRouter();
  const [issues, setIssues] = useState<IssueSummary[]>([]);
  const [loading, setLoading] = useState(true);

  function loadAssigned() {
    setLoading(true);
    getMaintenanceAssignedIssues()
      .then(setIssues)
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const token = readToken();
    if (!token) {
      router.push("/login");
      return;
    }
    getCurrentUser(token).then((u) => {
      if (u.role !== "MAINTENANCE" && u.role !== "ADMIN" && u.role !== "AO") {
        router.push("/dashboard");
        return;
      }
      loadAssigned();
    }).catch(() => router.push("/login"));
  }, [router]);

  async function handleStartWork(issueId: string) {
    try {
      await startMaintenanceWork(issueId);
      loadAssigned();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to start work");
    }
  }

  const assignedCount = issues.filter((i) => i.status === "ASSIGNED").length;
  const inProgressCount = issues.filter((i) => i.status === "IN_PROGRESS").length;
  const completedCount = issues.filter((i) => i.status === "RESOLVED").length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Maintenance Workbench</h1>
            <p className="text-sm text-slate-600 mt-1">Review assigned campus repairs, record progress, and provide resolution evidence.</p>
          </div>
          <Link
            href="/maintenance/assigned"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs"
          >
            View All Assigned Tasks →
          </Link>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-purple-200 bg-purple-50/40 p-5 shadow-xs">
            <span className="text-xs font-bold text-purple-900 uppercase tracking-wider">Awaiting Start</span>
            <div className="text-3xl font-black text-purple-950 mt-1">{assignedCount}</div>
            <p className="text-xs text-purple-800 mt-1">Assigned tasks ready to be acknowledged</p>
          </div>
          <div className="bg-white rounded-2xl border border-sky-200 bg-sky-50/40 p-5 shadow-xs">
            <span className="text-xs font-bold text-sky-900 uppercase tracking-wider">In Progress</span>
            <div className="text-3xl font-black text-sky-950 mt-1">{inProgressCount}</div>
            <p className="text-xs text-sky-800 mt-1">Active repair work currently underway</p>
          </div>
          <div className="bg-white rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-xs">
            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Completed</span>
            <div className="text-3xl font-black text-emerald-950 mt-1">{completedCount}</div>
            <p className="text-xs text-emerald-800 mt-1">Successfully resolved complaints</p>
          </div>
        </div>

        {/* Active Work Queue */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span>🔧</span> Active Tasks Queue
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : issues.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No issues currently assigned to you.</div>
          ) : (
            <div className="space-y-3">
              {issues.map((issue) => (
                <div
                  key={issue.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 hover:border-emerald-300 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <StatusBadge status={issue.status} />
                      <PriorityBadge priority={issue.priority} />
                      <span className="text-xs text-emerald-800 font-semibold">{issue.category.name}</span>
                      <span className="text-xs text-slate-500">📍 {issue.location.name}</span>
                      {issue.is_overdue && (
                        <span className="rounded bg-red-600 px-1.5 py-0.2 text-[10px] font-black text-white">
                          OVERDUE
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/issues/${issue.id}`}
                      className="font-bold text-slate-900 hover:text-emerald-700 text-sm block"
                    >
                      {issue.title}
                    </Link>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{issue.description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {issue.status === "ASSIGNED" && (
                      <button
                        onClick={() => handleStartWork(issue.id)}
                        className="rounded-lg bg-sky-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-sky-700 shadow-xs"
                      >
                        Start Work
                      </button>
                    )}
                    <Link
                      href={`/issues/${issue.id}`}
                      className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      {issue.status === "IN_PROGRESS" ? "Resolve Issue →" : "View Details →"}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
