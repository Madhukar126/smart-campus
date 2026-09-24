"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { PriorityBadge } from "@/components/PriorityBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { getMyIssues } from "@/lib/api";
import { readToken } from "@/lib/auth";
import type { IssueSummary } from "@/types/issue";

export default function MyIssuesPage() {
  const router = useRouter();
  const [issues, setIssues] = useState<IssueSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = readToken();
    if (!token) {
      router.push("/login");
      return;
    }

    getMyIssues()
      .then(setIssues)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">My Reported Issues</h1>
            <p className="text-sm text-slate-600 mt-1">Track the status, updates, and resolution of your submitted complaints.</p>
          </div>
          <Link
            href="/issues/new"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-800 transition-colors shrink-0"
          >
            <span>+</span> Report New Issue
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white rounded-xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : issues.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-12 text-center">
            <span className="text-4xl">📝</span>
            <h3 className="mt-3 text-lg font-bold text-slate-800">No issues reported yet</h3>
            <p className="mt-1 text-sm text-slate-500">
              Notice something broken or needing attention on campus? Submit your first report!
            </p>
            <Link
              href="/issues/new"
              className="mt-4 inline-block rounded-xl bg-emerald-700 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-800"
            >
              Report an Issue
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Issue Details</th>
                    <th className="px-6 py-3.5">Category & Location</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Priority</th>
                    <th className="px-6 py-3.5">Supporters</th>
                    <th className="px-6 py-3.5">Date</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {issues.map((issue) => (
                    <tr key={issue.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 max-w-xs">
                        <Link href={`/issues/${issue.id}`} className="font-bold text-slate-900 hover:text-emerald-700 block truncate">
                          {issue.title}
                        </Link>
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{issue.description}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs">
                        <span className="font-semibold text-emerald-800">{issue.category.name}</span>
                        <div className="text-slate-400 mt-0.5">📍 {issue.location.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={issue.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <PriorityBadge priority={issue.priority} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-700">
                        ▲ {issue.support_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400">
                        {new Date(issue.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link
                          href={`/issues/${issue.id}`}
                          className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors"
                        >
                          View Details →
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
