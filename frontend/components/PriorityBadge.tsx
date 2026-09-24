import React from "react";
import type { IssuePriority } from "@/types/issue";

interface PriorityBadgeProps {
  priority: IssuePriority | string;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  let style = "bg-slate-100 text-slate-700 border-slate-200";

  switch (priority) {
    case "CRITICAL":
      style = "bg-red-100 text-red-800 border-red-300 font-bold";
      break;
    case "HIGH":
      style = "bg-orange-50 text-orange-800 border-orange-300 font-semibold";
      break;
    case "MEDIUM":
      style = "bg-yellow-50 text-yellow-800 border-yellow-300";
      break;
    case "LOW":
      style = "bg-emerald-50 text-emerald-800 border-emerald-300";
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs border uppercase tracking-wider ${style}`}
    >
      {priority === "CRITICAL" && <span className="mr-1 text-red-600">⚡</span>}
      {priority}
    </span>
  );
}
