"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { PriorityBadge } from "@/components/PriorityBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { getAdminDashboard, getCurrentUser } from "@/lib/api";
import { readToken } from "@/lib/auth";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<{
    summary: {
      total_issues: number;
      open_issues: number;
      verified_issues: number;
      assigned_issues: number;
      in_progress_issues: number;
      resolved_issues: number;
      rejected_issues: number;
      high_priority_issues: number;
      critical_issues: number;
      overdue_issues: number;
    };
    overdue_issues: Array<{
      id: string;
      title: string;
      category: string;
      location: string;
      priority: string;
      status: string;
      created_at: string;
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = readToken();
    if (!token) {
      router.push("/login");
      return;
    }

    getCurrentUser(token)
      .then((user) => {
        if (user.role !== "ADMIN" && user.role !== "AO" && user.role !== "PRINCIPAL") {
          router.push("/dashboard");
          return;
        }
        return getAdminDashboard().then(setData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <div className="flex-1 max-w-7xl w-full mx-auto p-8 animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-1/4" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 bg-slate-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const s = data?.summary;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Administrative Operations</h1>
            <p className="text-sm text-slate-600 mt-1">Campus oversight, issue triage, assignment, and escalation monitoring.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/categories"
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs"
            >
              ⚙ Categories
            </Link>
            <Link
              href="/admin/locations"
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs"
            >
              📍 Locations
            </Link>
            <Link
              href="/admin/analytics"
              className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 shadow-xs"
            >
              📊 Full Analytics
            </Link>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Reports</span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{s?.total_issues || 0}</div>
          </div>
          <div className="bg-white rounded-xl border border-amber-200 bg-amber-50/40 p-4 shadow-xs">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Open / Triage</span>
            <div className="text-2xl sm:text-3xl font-black text-amber-900 mt-1">{s?.open_issues || 0}</div>
          </div>
          <div className="bg-white rounded-xl border border-blue-200 bg-blue-50/40 p-4 shadow-xs">
            <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider">Verified</span>
            <div className="text-2xl sm:text-3xl font-black text-blue-900 mt-1">{s?.verified_issues || 0}</div>
          </div>
          <div className="bg-white rounded-xl border border-purple-200 bg-purple-50/40 p-4 shadow-xs">
            <span className="text-xs font-semibold text-purple-800 uppercase tracking-wider">Assigned</span>
            <div className="text-2xl sm:text-3xl font-black text-purple-900 mt-1">{s?.assigned_issues || 0}</div>
          </div>
          <div className="bg-white rounded-xl border border-sky-200 bg-sky-50/40 p-4 shadow-xs">
            <span className="text-xs font-semibold text-sky-800 uppercase tracking-wider">In Progress</span>
            <div className="text-2xl sm:text-3xl font-black text-sky-900 mt-1">{s?.in_progress_issues || 0}</div>
          </div>
          <div className="bg-white rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-xs">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Resolved</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-900 mt-1">{s?.resolved_issues || 0}</div>
          </div>
          <div className="bg-white rounded-xl border border-rose-200 bg-rose-50/40 p-4 shadow-xs">
            <span className="text-xs font-semibold text-rose-800 uppercase tracking-wider">Rejected</span>
            <div className="text-2xl sm:text-3xl font-black text-rose-900 mt-1">{s?.rejected_issues || 0}</div>
          </div>
          <div className="bg-white rounded-xl border border-orange-200 bg-orange-50/40 p-4 shadow-xs">
            <span className="text-xs font-semibold text-orange-800 uppercase tracking-wider">High Priority</span>
            <div className="text-2xl sm:text-3xl font-black text-orange-900 mt-1">{s?.high_priority_issues || 0}</div>
          </div>
          <div className="bg-white rounded-xl border border-red-300 bg-red-50/60 p-4 shadow-xs">
            <span className="text-xs font-semibold text-red-800 uppercase tracking-wider">Critical</span>
            <div className="text-2xl sm:text-3xl font-black text-red-900 mt-1">{s?.critical_issues || 0}</div>
          </div>
          <div className="bg-white rounded-xl border border-red-400 bg-red-100/60 p-4 shadow-xs">
            <span className="text-xs font-black text-red-900 uppercase tracking-wider flex items-center gap-1">
              <span>⚠️</span> Overdue
            </span>
            <div className="text-2xl sm:text-3xl font-black text-red-950 mt-1">{s?.overdue_issues || 0}</div>
          </div>
        </div>

        {/* Overdue Issues Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>🚨</span> Escalated & Overdue Issues ({data?.overdue_issues.length || 0})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Issues that have exceeded the resolution threshold policy based on their priority level.
              </p>
            </div>
            <Link href="/issues?status=OPEN" className="text-xs font-semibold text-emerald-800 hover:underline">
              View All Active Issues →
            </Link>
          </div>

          {!data?.overdue_issues || data.overdue_issues.length === 0 ? (
            <div className="rounded-xl bg-emerald-50/50 border border-emerald-100 p-6 text-center text-xs font-medium text-emerald-800">
              🎉 Excellent! No overdue complaints currently on campus.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5">Title</th>
                    <th className="px-4 py-2.5">Category</th>
                    <th className="px-4 py-2.5">Location</th>
                    <th className="px-4 py-2.5">Priority</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5 text-right">Triage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.overdue_issues.map((iss) => (
                    <tr key={iss.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-semibold text-slate-900 max-w-xs truncate">
                        <Link href={`/issues/${iss.id}`} className="hover:text-emerald-700">
                          {iss.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-xs">{iss.category}</td>
                      <td className="px-4 py-3 text-xs">📍 {iss.location}</td>
                      <td className="px-4 py-3">
                        <PriorityBadge priority={iss.priority} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={iss.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/issues/${iss.id}`}
                          className="rounded-lg bg-red-50 border border-red-200 px-3 py-1 text-xs font-bold text-red-800 hover:bg-red-100"
                        >
                          Resolve / Assign →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
