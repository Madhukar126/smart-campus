from pydantic import BaseModel


class MetricCount(BaseModel):
    name: str
    count: int


class DateMetricCount(BaseModel):
    date: str
    count: int


class MaintenancePerformance(BaseModel):
    maintenance_id: str
    maintenance_name: str
    completed_count: int
    active_count: int


class AnalyticsSummary(BaseModel):
    total_issues: int
    open_issues: int
    verified_issues: int
    assigned_issues: int
    in_progress_issues: int
    resolved_issues: int
    rejected_issues: int
    high_priority_issues: int
    critical_issues: int
    overdue_issues: int
    avg_resolution_hours: float


class FullAnalyticsResponse(BaseModel):
    summary: AnalyticsSummary
    by_status: list[MetricCount]
    by_category: list[MetricCount]
    by_location: list[MetricCount]
    by_priority: list[MetricCount]
    reports_over_time: list[DateMetricCount]
    resolved_vs_unresolved: list[MetricCount]
    maintenance_performance: list[MaintenancePerformance]
