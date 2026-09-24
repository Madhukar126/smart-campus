export interface NotificationItem {
  id: string;
  user_id: string;
  issue_id?: string | null;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationResponse {
  items: NotificationItem[];
  unread_count: number;
}
