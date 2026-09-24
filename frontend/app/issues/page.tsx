"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { IssueCard } from "@/components/IssueCard";
import { getCategories, getIssues, getLocations } from "@/lib/api";
import { readToken } from "@/lib/auth";
import type { Category, IssueSummary, Location } from "@/types/issue";

export default function IssuesPage() {
  const [issues, setIssues] = useState<IssueSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(Boolean(readToken()));
    getCategories().then(setCategories).catch(console.error);
    getLocations().then(setLocations).catch(console.error);
  }, []);

  const fetchIssues = useCallback(() => {
    setLoading(true);
    getIssues({
      status: statusFilter || undefined,
      category_id: categoryFilter || undefined,
      location_id: locationFilter || undefined,
      priority: priorityFilter || undefined,
      search: search || undefined,
      sort_by: sortBy,
      page,
      page_size: 9,
    })
      .then((res) => {
        setIssues(res.items);
        setTotal(res.total);
        setPages(res.pages);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [statusFilter, categoryFilter, locationFilter, priorityFilter, search, sortBy, page]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  function handleFilterReset() {
    setSearch("");
    setStatusFilter("");
    setCategoryFilter("");
    setLocationFilter("");
    setPriorityFilter("");
    setSortBy("newest");
    setPage(1);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Campus Issues Feed</h1>
            <p className="text-sm text-slate-600 mt-1">
              Browse, search, and support transparent infrastructure and facility reports across campus.
            </p>
          </div>
          {isLoggedIn && (
            <Link
              href="/issues/new"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-800 transition-colors shrink-0"
            >
              <span>+</span> Report New Issue
            </Link>
          )}
        </div>

        {/* Search & Filters Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-8 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Search</label>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search title, description..."
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                <option value="">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="VERIFIED">Verified</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Location</label>
              <select
                value={locationFilter}
                onChange={(e) => {
                  setLocationFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                <option value="">All Locations</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="most_supported">Most Supported</option>
              </select>
            </div>
          </div>

          {(search || statusFilter || categoryFilter || locationFilter || priorityFilter || sortBy !== "newest") && (
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs text-slate-500">
              <span>Showing results for active filters ({total} found)</span>
              <button
                onClick={handleFilterReset}
                className="text-emerald-700 font-semibold hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Content Feed */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 rounded-xl bg-white border border-slate-200 animate-pulse p-5" />
            ))}
          </div>
        ) : issues.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-12 text-center">
            <span className="text-4xl">🔍</span>
            <h3 className="mt-3 text-lg font-bold text-slate-800">No issues found</h3>
            <p className="mt-1 text-sm text-slate-500">
              Try adjusting your filter options or search keyword.
            </p>
            <button
              onClick={handleFilterReset}
              className="mt-4 rounded-lg bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {issues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} isLoggedIn={isLoggedIn} />
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {pages > 1 && (
          <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-4">
            <span className="text-sm text-slate-500">
              Page {page} of {pages} ({total} issues)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium disabled:opacity-40 hover:bg-white transition-colors"
              >
                Previous
              </button>
              <button
                disabled={page >= pages}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium disabled:opacity-40 hover:bg-white transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
