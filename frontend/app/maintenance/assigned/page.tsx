"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { PriorityBadge } from "@/components/PriorityBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { getCurrentUser, getMaintenanceAssignedIssues } from "@/lib/api";
import { readToken } from "@/lib/auth";
import type { IssueSummary } from "@/types/issue";

export default function MaintenanceAssignedPage() {
  const router = useRouter();
  const [issues, setIssues] = useState<IssueSummary[]>([]);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);

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
      getMaintenanceAssignedIssues()
        .then(setIssues)
        .catch(console.error)
        .finally(() => setLoading(false));
    }).catch(() => router.push("/login"));
  }, [router]);

  const filteredIssues = issues.filter((i) => {
    if (filterStatus === "ALL") return true;
    return i.status === filterStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <Link href="/maintenance" className="text-xs font-semibold text-emerald-800 hover:underline">
              ← Back to Maintenance Workbench
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              All Assigned Campus Issues
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Complete task history assigned to your maintenance technician profile.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Filter:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold"
            >
              <option value="ALL">All Statuses ({issues.length})</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="h-64 bg-white rounded-2xl border border-slate-200 animate-pulse" />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-6 py-3.5">Issue Title</th>
                    <th className="px-6 py-3.5">Location</th>
                    <th className="px-6 py-3.5">Priority</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Assigned Date</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredIssues.map((issue) => (
                    <tr key={issue.id} className="hover:bg-slate-50/80">
                      <td className="px-6 py-4 max-w-xs">
                        <Link href={`/issues/${issue.id}`} className="font-bold text-slate-900 hover:text-emerald-700 block truncate">
                          {issue.title}
                        </Link>
                        <span className="text-xs text-emerald-800 font-semibold">{issue.category.name}</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium">📍 {issue.location.name}</td>
                      <td className="px-6 py-4">
                        <PriorityBadge priority={issue.priority} />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={issue.status} />
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {new Date(issue.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/issues/${issue.id}`}
                          className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
                        >
                          Work Details →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
