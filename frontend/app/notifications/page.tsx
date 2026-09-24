"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/api";
import { readToken } from "@/lib/auth";
import type { NotificationItem } from "@/types/notification";

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  function loadNotifications() {
    setLoading(true);
    getNotifications()
      .then((res) => {
        setNotifications(res.items);
        setUnreadCount(res.unread_count);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const token = readToken();
    if (!token) {
      router.push("/login");
      return;
    }
    loadNotifications();
  }, [router]);

  async function handleMarkOne(id: string) {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleMarkAll() {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <span>🔔 Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-rose-600 px-2.5 py-0.5 text-xs font-bold text-white">
                  {unreadCount} unread
                </span>
              )}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Live updates on your reported complaints, maintenance assignments, and resolution notes.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAll}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs"
            >
              ✓ Mark all as read
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-white rounded-xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-12 text-center">
            <span className="text-4xl">📭</span>
            <h3 className="mt-3 text-lg font-bold text-slate-800">No notifications</h3>
            <p className="mt-1 text-sm text-slate-500">
              You are all caught up! Updates regarding your issues and assignments will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((item) => (
              <div
                key={item.id}
                className={`flex items-start justify-between gap-4 rounded-xl border p-4 transition-all ${
                  item.is_read
                    ? "bg-white border-slate-200"
                    : "bg-emerald-50/50 border-emerald-300 shadow-xs"
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {!item.is_read && <span className="h-2 w-2 rounded-full bg-emerald-600" />}
                    <h3 className="font-bold text-sm text-slate-900">{item.title}</h3>
                    <span className="text-[11px] text-slate-400">
                      {new Date(item.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.message}</p>
                  {item.issue_id && (
                    <Link
                      href={`/issues/${item.issue_id}`}
                      className="inline-block mt-2 text-xs font-bold text-emerald-800 hover:underline"
                    >
                      View Issue Details →
                    </Link>
                  )}
                </div>

                {!item.is_read && (
                  <button
                    onClick={() => handleMarkOne(item.id)}
                    className="shrink-0 rounded-lg p-1.5 text-xs text-slate-400 hover:text-emerald-800 hover:bg-slate-100"
                    title="Mark as read"
                  >
                    ✓ Read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
