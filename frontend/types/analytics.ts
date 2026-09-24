export interface MetricCount {
  name: string;
  count: number;
}

export interface DateMetricCount {
  date: string;
  count: number;
}

export interface MaintenancePerformance {
  maintenance_id: string;
  maintenance_name: string;
  completed_count: number;
  active_count: number;
}

export interface AnalyticsSummary {
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
  avg_resolution_hours: number;
}

export interface FullAnalyticsResponse {
  summary: AnalyticsSummary;
  by_status: MetricCount[];
  by_category: MetricCount[];
  by_location: MetricCount[];
  by_priority: MetricCount[];
  reports_over_time: DateMetricCount[];
  resolved_vs_unresolved: MetricCount[];
  maintenance_performance: MaintenancePerformance[];
}
