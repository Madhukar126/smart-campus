"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { Header } from "@/components/Header";
import { getAdminAnalytics, getCurrentUser } from "@/lib/api";
import { readToken } from "@/lib/auth";
import type { FullAnalyticsResponse } from "@/types/analytics";

const STATUS_COLORS: Record<string, string> = {
  OPEN: "#f59e0b",
  VERIFIED: "#3b82f6",
  ASSIGNED: "#a855f7",
  IN_PROGRESS: "#0284c7",
  RESOLVED: "#10b981",
  REJECTED: "#f43f5e",
};

const PIE_COLORS = ["#047857", "#0284c7", "#f59e0b", "#f43f5e", "#8b5cf6", "#ec4899", "#14b8a6"];

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<FullAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = readToken();
    if (!token) {
      router.push("/login");
      return;
    }
    getCurrentUser(token).then((u) => {
      if (u.role !== "ADMIN" && u.role !== "AO" && u.role !== "PRINCIPAL") {
        router.push("/dashboard");
        return;
      }
      getAdminAnalytics()
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }).catch(() => router.push("/login"));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <div className="flex-1 max-w-7xl w-full mx-auto p-8 animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-1/4" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-slate-200 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-72 bg-slate-200 rounded-2xl" />
            <div className="h-72 bg-slate-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const s = data?.summary;
  const resolutionRate = s?.total_issues ? Math.round((s.resolved_issues / s.total_issues) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <Link href="/admin" className="text-xs font-semibold text-emerald-800 hover:underline">
              ← Back to Admin Operations
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              Campus Intelligence & Analytics
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Empirical data analysis from real complaint resolutions across all campus sectors.
            </p>
          </div>
        </div>

        {/* Top Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Reports</span>
            <div className="text-3xl font-black text-slate-900 mt-1">{s?.total_issues || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Total recorded incidents</p>
          </div>

          <div className="bg-white rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-xs">
            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Resolution Rate</span>
            <div className="text-3xl font-black text-emerald-950 mt-1">{resolutionRate}%</div>
            <p className="text-xs text-emerald-800 mt-1">{s?.resolved_issues || 0} of {s?.total_issues || 0} resolved</p>
          </div>

          <div className="bg-white rounded-2xl border border-sky-200 bg-sky-50/40 p-5 shadow-xs">
            <span className="text-xs font-bold text-sky-900 uppercase tracking-wider">Avg Resolution Time</span>
            <div className="text-3xl font-black text-sky-950 mt-1">{s?.avg_resolution_hours || 0} hrs</div>
            <p className="text-xs text-sky-800 mt-1">Average lifecycle hours</p>
          </div>

          <div className="bg-white rounded-2xl border border-red-200 bg-red-50/50 p-5 shadow-xs">
            <span className="text-xs font-bold text-red-900 uppercase tracking-wider">Overdue Issues</span>
            <div className="text-3xl font-black text-red-950 mt-1">{s?.overdue_issues || 0}</div>
            <p className="text-xs text-red-800 mt-1">Breached resolution SLA</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Status Breakdown Bar Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Issue Distribution by Status</h3>
            <p className="text-xs text-slate-500 mb-4">Volume of issues at each operational stage</p>
            <div className="h-64 w-full">
              {data?.by_status && data.by_status.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.by_status} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "8px" }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {data.by_status.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || "#047857"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">No data</div>
              )}
            </div>
          </div>

          {/* Reports Over Time Line Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Incident Reports Over Time</h3>
            <p className="text-xs text-slate-500 mb-4">Daily reported issue volume over the last 14 days</p>
            <div className="h-64 w-full">
              {data?.reports_over_time && data.reports_over_time.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.reports_over_time} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={2} angle={-25} textAnchor="end" />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "8px" }} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#047857"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: "#047857" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">No data</div>
              )}
            </div>
          </div>

          {/* Issues by Category Horizontal Bar Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Top Issue Categories</h3>
            <p className="text-xs text-slate-500 mb-4">Departmental breakdown of campus reports</p>
            <div className="h-64 w-full">
              {data?.by_category && data.by_category.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={data.by_category.slice(0, 6)}
                    margin={{ top: 10, right: 20, left: 40, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "8px" }} />
                    <Bar dataKey="count" fill="#0284c7" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">No data</div>
              )}
            </div>
          </div>

          {/* Issues by Priority Donut/Pie Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Severity & Priority Distribution</h3>
            <p className="text-xs text-slate-500 mb-4">Ratio of critical, high, medium, and low urgency issues</p>
            <div className="h-64 w-full flex items-center justify-center">
              {data?.by_priority && data.by_priority.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.by_priority}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                      label={({ name, percent }: { name?: string; percent?: number }) => `${name || ""} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {data.by_priority.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "8px" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">No data</div>
              )}
            </div>
          </div>
        </div>

        {/* Maintenance Personnel Performance Table */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Maintenance Team Productivity</h3>
          <p className="text-xs text-slate-500 mb-4">Completed versus active assignments by technician</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Technician Name</th>
                  <th className="px-4 py-3">Active Tasks</th>
                  <th className="px-4 py-3">Completed Tasks</th>
                  <th className="px-4 py-3">Total Handled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.maintenance_performance.map((m) => (
                  <tr key={m.maintenance_id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-semibold text-slate-900">🛠 {m.maintenance_name}</td>
                    <td className="px-4 py-3 text-sky-700 font-bold">{m.active_count}</td>
                    <td className="px-4 py-3 text-emerald-700 font-bold">{m.completed_count}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{m.active_count + m.completed_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
