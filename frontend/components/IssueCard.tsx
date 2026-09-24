"use client";

import Link from "next/link";
import { useState } from "react";
import { PriorityBadge } from "./PriorityBadge";
import { StatusBadge } from "./StatusBadge";
import { supportIssue, removeSupport } from "@/lib/api";
import type { IssueSummary } from "@/types/issue";

interface IssueCardProps {
  issue: IssueSummary;
  isLoggedIn?: boolean;
}

export function IssueCard({ issue: initialIssue, isLoggedIn }: IssueCardProps) {
  const [issue, setIssue] = useState<IssueSummary>(initialIssue);
  const [supporting, setSupporting] = useState(false);

  async function handleToggleSupport(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      window.location.href = "/login";
      return;
    }
    setSupporting(true);
    try {
      if (issue.user_has_supported) {
        const res = await removeSupport(issue.id);
        setIssue((prev) => ({
          ...prev,
          support_count: res.support_count,
          user_has_supported: false,
        }));
      } else {
        const res = await supportIssue(issue.id);
        setIssue((prev) => ({
          ...prev,
          support_count: res.support_count,
          user_has_supported: true,
        }));
      }
    } catch (err) {
      console.error("Failed to toggle support", err);
    } finally {
      setSupporting(false);
    }
  }

  const formattedDate = new Date(issue.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link
      href={`/issues/${issue.id}`}
      className="group flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-500/40 hover:shadow-md"
    >
      <div>
        {/* Image preview if available */}
        {issue.report_image_url && (
          <div className="relative mb-4 h-48 w-full overflow-hidden rounded-lg bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={issue.report_image_url}
              alt={issue.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {issue.is_overdue && (
              <span className="absolute top-2 right-2 rounded bg-red-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
                Overdue
              </span>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 mb-2.5">
          <StatusBadge status={issue.status} />
          <PriorityBadge priority={issue.priority} />
          {!issue.report_image_url && issue.is_overdue && (
            <span className="rounded bg-red-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
              Overdue
            </span>
          )}
          <span className="text-xs font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
            {issue.category?.name || "General"}
          </span>
          <span className="text-xs text-slate-500">📍 {issue.location?.name || "Campus"}</span>
        </div>

        <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-2">
          {issue.title}
        </h3>

        <p className="mt-2 text-sm text-slate-600 line-clamp-2">{issue.description}</p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <span>Reported {formattedDate}</span>
        </div>

        <button
          onClick={handleToggleSupport}
          disabled={supporting}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
            issue.user_has_supported
              ? "bg-emerald-700 text-white hover:bg-emerald-800"
              : "bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
          }`}
          title={issue.user_has_supported ? "Remove support" : "Support this issue"}
        >
          <span>▲</span>
          <span>{issue.support_count}</span>
          <span className="hidden sm:inline">{issue.user_has_supported ? "Supported" : "Support"}</span>
        </button>
      </div>
    </Link>
  );
}
