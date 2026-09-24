export type UserRole = "STUDENT" | "STAFF" | "AO" | "PRINCIPAL" | "ADMIN" | "MAINTENANCE";

export type IssueStatus = "OPEN" | "VERIFIED" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";

export type IssuePriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ImageType = "REPORT" | "RESOLUTION";

export interface UserSummary {
  id: string;
  name: string;
  role: UserRole;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface Location {
  id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface IssueImage {
  id: string;
  issue_id: string;
  image_url: string;
  image_type: ImageType;
  uploaded_by: string;
  uploader?: UserSummary | null;
  created_at: string;
}

export interface Assignment {
  id: string;
  issue_id: string;
  assigned_to: string;
  assigned_by: string;
  assignee: UserSummary;
  assigner: UserSummary;
  assigned_at: string;
  status: string;
}

export interface IssueUpdate {
  id: string;
  issue_id: string;
  user_id: string;
  user: UserSummary;
  old_status?: string | null;
  new_status: string;
  message: string;
  created_at: string;
}

export interface Comment {
  id: string;
  issue_id: string;
  user_id: string;
  user: UserSummary;
  comment: string;
  created_at: string;
  updated_at: string;
}

export interface IssueSummary {
  id: string;
  title: string;
  description: string;
  category_id: string;
  location_id: string;
  category: Category;
  location: Location;
  reporter: UserSummary;
  status: IssueStatus;
  priority: IssuePriority;
  is_overdue: boolean;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
  report_image_url?: string | null;
  support_count: number;
  user_has_supported: boolean;
}

export interface IssueDetail extends IssueSummary {
  images: IssueImage[];
  assignments: Assignment[];
  updates: IssueUpdate[];
  comments: Comment[];
}

export interface IssueListResponse {
  items: IssueSummary[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface SimilarIssue {
  id: string;
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  category_id: string;
  location_id: string;
  category_name: string;
  location_name: string;
  created_at: string;
  support_count: number;
}
