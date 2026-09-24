import React from "react";
import type { IssueStatus } from "@/types/issue";

interface StatusBadgeProps {
  status: IssueStatus | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  let style = "bg-slate-100 text-slate-700 border-slate-200";

  switch (status) {
    case "OPEN":
      style = "bg-amber-50 text-amber-800 border-amber-300";
      break;
    case "VERIFIED":
      style = "bg-blue-50 text-blue-800 border-blue-300";
      break;
    case "ASSIGNED":
      style = "bg-purple-50 text-purple-800 border-purple-300";
      break;
    case "IN_PROGRESS":
      style = "bg-sky-50 text-sky-800 border-sky-300 animate-pulse";
      break;
    case "RESOLVED":
      style = "bg-emerald-50 text-emerald-800 border-emerald-300";
      break;
    case "REJECTED":
      style = "bg-rose-50 text-rose-800 border-rose-300";
      break;
  }

  const label = status.replace("_", " ");

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
