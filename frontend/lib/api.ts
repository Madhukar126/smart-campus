import type { LoginResponse, User, UserRole } from "@/types/auth";
import type {
  Category,
  Comment,
  IssueDetail,
  IssueListResponse,
  IssuePriority,
  IssueStatus,
  IssueSummary,
  Location,
  SimilarIssue,
} from "@/types/issue";
import type { NotificationItem, NotificationResponse } from "@/types/notification";
import type { FullAnalyticsResponse } from "@/types/analytics";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const defaultHeaders: Record<string, string> = {};
  if (!isFormData) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...defaultHeaders, ...options.headers },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const detail = Array.isArray(payload.detail)
      ? payload.detail.map((item: { msg?: string }) => item.msg).join(", ")
      : payload.detail;
    throw new Error(detail || "Something went wrong. Please try again.");
  }
  return response.json() as Promise<T>;
}

function authHeader(token?: string | null): Record<string, string> {
  if (!token && typeof window !== "undefined") {
    token = localStorage.getItem("campus360_access_token");
  }
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Auth
export function registerAccount(payload: {
  name: string;
  email: string;
  password: string;
  role: Extract<UserRole, "STUDENT" | "STAFF">;
}) {
  return request<User>("/auth/register", { method: "POST", body: JSON.stringify(payload) });
}

export function loginAccount(email: string, password: string) {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function getCurrentUser(token?: string | null) {
  return request<User>("/auth/me", { headers: authHeader(token) });
}

// Categories & Locations
export function getCategories(all = false) {
  return request<Category[]>(`/categories?all=${all}`);
}

export function createCategory(payload: { name: string; description?: string }) {
  return request<Category>("/categories", {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify(payload),
  });
}

export function updateCategory(id: string, payload: { name?: string; description?: string; is_active?: boolean }) {
  return request<Category>(`/categories/${id}`, {
    method: "PATCH",
    headers: authHeader(),
    body: JSON.stringify(payload),
  });
}

export function deactivateCategory(id: string) {
  return request<Category>(`/categories/${id}`, {
    method: "DELETE",
    headers: authHeader(),
  });
}

export function getLocations(all = false) {
  return request<Location[]>(`/locations?all=${all}`);
}

export function createLocation(payload: { name: string; description?: string }) {
  return request<Location>("/locations", {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify(payload),
  });
}

export function updateLocation(id: string, payload: { name?: string; description?: string; is_active?: boolean }) {
  return request<Location>(`/locations/${id}`, {
    method: "PATCH",
    headers: authHeader(),
    body: JSON.stringify(payload),
  });
}

export function deactivateLocation(id: string) {
  return request<Location>(`/locations/${id}`, {
    method: "DELETE",
    headers: authHeader(),
  });
}

// Issues
export function getIssues(params: {
  status?: string;
  category_id?: string;
  location_id?: string;
  priority?: string;
  search?: string;
  sort_by?: string;
  page?: number;
  page_size?: number;
}) {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.category_id) query.set("category_id", params.category_id);
  if (params.location_id) query.set("location_id", params.location_id);
  if (params.priority) query.set("priority", params.priority);
  if (params.search) query.set("search", params.search);
  if (params.sort_by) query.set("sort_by", params.sort_by);
  if (params.page) query.set("page", params.page.toString());
  if (params.page_size) query.set("page_size", params.page_size.toString());

  return request<IssueListResponse>(`/issues?${query.toString()}`, {
    headers: authHeader(),
  });
}

export function getMyIssues() {
  return request<IssueSummary[]>("/issues/my", {
    headers: authHeader(),
  });
}

export function getSimilarIssues(params: { category_id?: string; location_id?: string; q?: string }) {
  const query = new URLSearchParams();
  if (params.category_id) query.set("category_id", params.category_id);
  if (params.location_id) query.set("location_id", params.location_id);
  if (params.q) query.set("q", params.q);

  return request<SimilarIssue[]>(`/issues/similar?${query.toString()}`);
}

export function getIssue(id: string) {
  return request<IssueDetail>(`/issues/${id}`, {
    headers: authHeader(),
  });
}

export function createIssue(payload: {
  title: string;
  description: string;
  category_id: string;
  location_id: string;
  image_url?: string;
}) {
  return request<IssueDetail>("/issues", {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify(payload),
  });
}

export async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return request<{ url: string }>("/issues/upload", {
    method: "POST",
    headers: authHeader(),
    body: formData,
  });
}

// Issue Actions & Workflow
export function verifyIssue(id: string, message?: string) {
  return request<IssueDetail>(`/issues/${id}/verify`, {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify({ message }),
  });
}

export function rejectIssue(id: string, reason: string) {
  return request<IssueDetail>(`/issues/${id}/reject`, {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify({ reason }),
  });
}

export function setIssuePriority(id: string, priority: IssuePriority) {
  return request<IssueDetail>(`/issues/${id}/priority`, {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify({ priority }),
  });
}

export function assignIssue(id: string, assigned_to: string, message?: string) {
  return request<IssueDetail>(`/issues/${id}/assign`, {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify({ assigned_to, message }),
  });
}

export function updateIssueStatus(id: string, status: IssueStatus, message: string) {
  return request<IssueDetail>(`/issues/${id}/status`, {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify({ status, message }),
  });
}

export function resolveIssue(id: string, resolution_note: string, image_url?: string) {
  return request<IssueDetail>(`/issues/${id}/resolve`, {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify({ resolution_note, image_url }),
  });
}

export function supportIssue(id: string) {
  return request<{ support_count: number }>(`/issues/${id}/support`, {
    method: "POST",
    headers: authHeader(),
  });
}

export function removeSupport(id: string) {
  return request<{ support_count: number }>(`/issues/${id}/support`, {
    method: "DELETE",
    headers: authHeader(),
  });
}

// Comments
export function addComment(issue_id: string, comment: string) {
  return request<Comment>(`/issues/${issue_id}/comments`, {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify({ comment }),
  });
}

export function editComment(issue_id: string, comment_id: string, comment: string) {
  return request<Comment>(`/issues/${issue_id}/comments/${comment_id}`, {
    method: "PATCH",
    headers: authHeader(),
    body: JSON.stringify({ comment }),
  });
}

export function deleteComment(issue_id: string, comment_id: string) {
  return request<{ message: string }>(`/issues/${issue_id}/comments/${comment_id}`, {
    method: "DELETE",
    headers: authHeader(),
  });
}

// Notifications
export function getNotifications() {
  return request<NotificationResponse>("/notifications", {
    headers: authHeader(),
  });
}

export function markNotificationRead(id: string) {
  return request<NotificationItem>(`/notifications/${id}/read`, {
    method: "PATCH",
    headers: authHeader(),
  });
}

export function markAllNotificationsRead() {
  return request<{ message: string }>("/notifications/mark-all-read", {
    method: "POST",
    headers: authHeader(),
  });
}

// Admin & Maintenance
export function getAdminDashboard() {
  return request<{
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
  }>("/admin/dashboard", {
    headers: authHeader(),
  });
}

export function getAdminAnalytics() {
  return request<FullAnalyticsResponse>("/admin/analytics", {
    headers: authHeader(),
  });
}

export function getMaintenanceUsers() {
  return request<User[]>("/admin/users/maintenance", {
    headers: authHeader(),
  });
}

export function getAuditLogs(page = 1, page_size = 20) {
  return request<{
    items: Array<{
      id: string;
      action: string;
      entity_type: string;
      entity_id: string | null;
      user_name: string;
      details: string | null;
      created_at: string;
    }>;
    total: number;
    page: number;
    page_size: number;
  }>(`/admin/audit-logs?page=${page}&page_size=${page_size}`, {
    headers: authHeader(),
  });
}

export function getMaintenanceAssignedIssues() {
  return request<IssueSummary[]>("/maintenance/assigned", {
    headers: authHeader(),
  });
}

export function startMaintenanceWork(issue_id: string) {
  return request<IssueSummary>(`/maintenance/${issue_id}/start-work`, {
    method: "POST",
    headers: authHeader(),
  });
}
