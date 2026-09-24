"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { PriorityBadge } from "@/components/PriorityBadge";
import { StatusBadge } from "@/components/StatusBadge";
import {
  addComment,
  assignIssue,
  deleteComment,
  getCurrentUser,
  getIssue,
  getMaintenanceUsers,
  rejectIssue,
  removeSupport,
  resolveIssue,
  setIssuePriority,
  startMaintenanceWork,
  supportIssue,
  uploadImage,
  verifyIssue,
} from "@/lib/api";
import { readToken } from "@/lib/auth";
import type { User } from "@/types/auth";
import type { IssueDetail, IssuePriority } from "@/types/issue";

export default function IssueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [issue, setIssue] = useState<IssueDetail | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [maintenanceUsers, setMaintenanceUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Community action states
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Workflow action modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTechId, setSelectedTechId] = useState("");
  const [assignMessage, setAssignMessage] = useState("");
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionNote, setResolutionNote] = useState("");
  const [resolutionFile, setResolutionFile] = useState<File | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    const token = readToken();
    if (token) {
      getCurrentUser(token).then((u) => {
        setCurrentUser(u);
        if (u.role === "ADMIN" || u.role === "AO") {
          getMaintenanceUsers().then(setMaintenanceUsers).catch(console.error);
        }
      }).catch(() => {});
    }

    getIssue(id)
      .then(setIssue)
      .catch((err) => setError(err.message || "Failed to load issue."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Support toggle
  async function handleToggleSupport() {
    if (!currentUser) {
      window.location.href = "/login";
      return;
    }
    if (!issue) return;

    try {
      if (issue.user_has_supported) {
        const res = await removeSupport(issue.id);
        setIssue((prev) => prev ? { ...prev, support_count: res.support_count, user_has_supported: false } : null);
      } else {
        const res = await supportIssue(issue.id);
        setIssue((prev) => prev ? { ...prev, support_count: res.support_count, user_has_supported: true } : null);
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Add Comment
  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || !issue) return;
    setSubmittingComment(true);
    try {
      const newComment = await addComment(issue.id, commentText.trim());
      setIssue((prev) => prev ? { ...prev, comments: [...prev.comments, newComment] } : null);
      setCommentText("");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to add comment.");
    } finally {
      setSubmittingComment(false);
    }
  }

  // Delete Comment
  async function handleDeleteComment(commentId: string) {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    try {
      await deleteComment(id, commentId);
      setIssue((prev) => prev ? { ...prev, comments: prev.comments.filter((c) => c.id !== commentId) } : null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete comment.");
    }
  }

  // Workflow Handlers
  async function handleVerify() {
    setActionLoading(true);
    try {
      const updated = await verifyIssue(id);
      setIssue(updated);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to verify issue.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject(e: React.FormEvent) {
    e.preventDefault();
    if (!rejectReason.trim()) return;
    setActionLoading(true);
    try {
      const updated = await rejectIssue(id, rejectReason.trim());
      setIssue(updated);
      setShowRejectModal(false);
      setRejectReason("");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to reject issue.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTechId) return;
    setActionLoading(true);
    try {
      const updated = await assignIssue(id, selectedTechId, assignMessage.trim() || undefined);
      setIssue(updated);
      setShowAssignModal(false);
      setSelectedTechId("");
      setAssignMessage("");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to assign issue.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePriorityChange(newPriority: IssuePriority) {
    try {
      const updated = await setIssuePriority(id, newPriority);
      setIssue(updated);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update priority.");
    }
  }

  async function handleStartWork() {
    setActionLoading(true);
    try {
      await startMaintenanceWork(id);
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to start work.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleResolve(e: React.FormEvent) {
    e.preventDefault();
    if (!resolutionNote.trim()) return;
    setActionLoading(true);
    try {
      let resolutionImgUrl: string | undefined = undefined;
      if (resolutionFile) {
        const uploadRes = await uploadImage(resolutionFile);
        resolutionImgUrl = uploadRes.url;
      }
      const updated = await resolveIssue(id, resolutionNote.trim(), resolutionImgUrl);
      setIssue(updated);
      setShowResolveModal(false);
      setResolutionNote("");
      setResolutionFile(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to resolve issue.");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <div className="flex-1 max-w-5xl w-full mx-auto p-8 animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-1/3" />
          <div className="h-64 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <div className="flex-1 max-w-xl w-full mx-auto p-8 text-center">
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
            <h2 className="font-bold text-lg">Issue Not Found</h2>
            <p className="text-sm mt-1">{error || "The requested issue does not exist."}</p>
            <Link href="/issues" className="mt-4 inline-block font-semibold text-emerald-800 hover:underline text-sm">
              ← Return to issues feed
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isAdminOrAO = currentUser?.role === "ADMIN" || currentUser?.role === "AO";
  const isAssignedMaintenance =
    currentUser?.role === "MAINTENANCE" &&
    issue.assignments.some((a) => a.assigned_to === currentUser.id && a.status === "ACTIVE");

  const reportImg = issue.images.find((img) => img.image_type === "REPORT")?.image_url;
  const resolutionImg = issue.images.find((img) => img.image_type === "RESOLUTION")?.image_url;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <Link href="/issues" className="text-sm font-semibold text-emerald-800 hover:underline">
            ← Back to All Issues
          </Link>
          <span className="text-xs text-slate-400">ID: {issue.id}</span>
        </div>

        {/* Issue Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={issue.status} />
              <PriorityBadge priority={issue.priority} />
              {issue.is_overdue && (
                <span className="rounded bg-red-600 px-2 py-0.5 text-xs font-black uppercase tracking-wider text-white">
                  Overdue
                </span>
              )}
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md">
                {issue.category?.name}
              </span>
              <span className="text-xs text-slate-600 font-medium">📍 {issue.location?.name}</span>
            </div>

            {/* Support Button */}
            <button
              onClick={handleToggleSupport}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-xs transition-all ${
                issue.user_has_supported
                  ? "bg-emerald-700 text-white hover:bg-emerald-800"
                  : "bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200"
              }`}
            >
              <span>▲</span>
              <span>{issue.support_count}</span>
              <span>{issue.user_has_supported ? "Supported" : "Support"}</span>
            </button>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{issue.title}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500 border-b border-slate-100 pb-4">
            <span>Reported by: <strong className="text-slate-800">{issue.reporter.name}</strong> ({issue.reporter.role})</span>
            <span>•</span>
            <span>Created: {new Date(issue.created_at).toLocaleString()}</span>
            {issue.resolved_at && (
              <>
                <span>•</span>
                <span className="text-emerald-700 font-semibold">
                  Resolved: {new Date(issue.resolved_at).toLocaleString()}
                </span>
              </>
            )}
          </div>

          <p className="mt-4 text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
            {issue.description}
          </p>

          {/* Report Image */}
          {reportImg && (
            <div className="mt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Report Photo Evidence</h4>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 max-h-96 w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={reportImg} alt={issue.title} className="h-full w-full object-contain" />
              </div>
            </div>
          )}

          {/* Resolution Section if Resolved */}
          {issue.status === "RESOLVED" && (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/70 p-5">
              <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                <span>✅</span> Issue Resolved
              </h4>
              {issue.updates
                .filter((u) => u.new_status === "RESOLVED")
                .slice(-1)
                .map((u) => (
                  <p key={u.id} className="mt-1 text-sm text-emerald-900 font-medium">
                    &ldquo;{u.message}&rdquo;
                  </p>
                ))}
              {resolutionImg && (
                <div className="mt-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block mb-1.5">
                    Resolution Photo
                  </span>
                  <div className="overflow-hidden rounded-lg border border-emerald-200 max-h-72 w-full bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={resolutionImg} alt="Resolution" className="h-full w-full object-contain" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Rejection Section if Rejected */}
          {issue.status === "REJECTED" && (
            <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-5">
              <h4 className="text-sm font-bold text-rose-950 flex items-center gap-2">
                <span>❌</span> Issue Rejected
              </h4>
              {issue.updates
                .filter((u) => u.new_status === "REJECTED")
                .slice(-1)
                .map((u) => (
                  <p key={u.id} className="mt-1 text-sm text-rose-900 font-medium">
                    Reason: {u.message}
                  </p>
                ))}
            </div>
          )}
        </div>

        {/* Role-Based Action Bar */}
        {(isAdminOrAO || isAssignedMaintenance) && issue.status !== "RESOLVED" && issue.status !== "REJECTED" && (
          <div className="bg-emerald-950 text-white rounded-2xl p-6 shadow-md mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3">
              Workflow Management Controls ({currentUser?.role})
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              {/* Admin/AO Actions */}
              {isAdminOrAO && (
                <>
                  {issue.status === "OPEN" && (
                    <button
                      onClick={handleVerify}
                      disabled={actionLoading}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold hover:bg-emerald-500 transition-colors"
                    >
                      ✓ Verify Issue
                    </button>
                  )}

                  {(issue.status === "OPEN" || issue.status === "VERIFIED") && (
                    <button
                      onClick={() => setShowRejectModal(true)}
                      disabled={actionLoading}
                      className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold hover:bg-rose-500 transition-colors"
                    >
                      ✕ Reject Issue
                    </button>
                  )}

                  <button
                    onClick={() => setShowAssignModal(true)}
                    disabled={actionLoading}
                    className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-bold hover:bg-purple-500 transition-colors"
                  >
                    👤 {issue.assignments.length > 0 ? "Reassign Maintenance" : "Assign to Maintenance"}
                  </button>

                  <div className="flex items-center gap-2 bg-emerald-900/60 px-3 py-1.5 rounded-xl border border-emerald-800">
                    <span className="text-xs text-emerald-300 font-medium">Priority:</span>
                    <select
                      value={issue.priority}
                      onChange={(e) => handlePriorityChange(e.target.value as IssuePriority)}
                      className="bg-emerald-950 text-white text-xs font-bold rounded px-2 py-1 border border-emerald-700 focus:outline-none"
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="CRITICAL">CRITICAL</option>
                    </select>
                  </div>
                </>
              )}

              {/* Maintenance Actions */}
              {isAssignedMaintenance && (
                <>
                  {issue.status === "ASSIGNED" && (
                    <button
                      onClick={handleStartWork}
                      disabled={actionLoading}
                      className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold hover:bg-sky-500 transition-colors"
                    >
                      ▶ Start Work (In Progress)
                    </button>
                  )}

                  {issue.status === "IN_PROGRESS" && (
                    <button
                      onClick={() => setShowResolveModal(true)}
                      disabled={actionLoading}
                      className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold hover:bg-emerald-400 transition-colors"
                    >
                      ✓ Mark as Resolved
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Progress Timeline */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span>⏱</span> Resolution Timeline
            </h3>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {issue.updates.map((update) => (
                <div key={update.id} className="relative">
                  <div className="absolute -left-[27px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-700 shadow-xs" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      {update.new_status}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(update.created_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <p className="mt-1 text-xs text-slate-600">{update.message}</p>
                    <span className="text-[10px] text-slate-400 mt-0.5">By {update.user.name}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Active Assignment Info */}
            {issue.assignments.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-600">
                <span className="font-bold text-slate-900 block mb-1">Current Assignment:</span>
                <div>Technician: <strong>{issue.assignments[0].assignee.name}</strong></div>
                <div>Status: <span className="font-semibold text-purple-700">{issue.assignments[0].status}</span></div>
              </div>
            )}
          </div>

          {/* Right Column: Community Comments */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span>💬</span> Comments & Discussion ({issue.comments.length})
              </span>
            </h3>

            {/* Comment Form */}
            {currentUser ? (
              <form onSubmit={handleAddComment} className="mb-6">
                <textarea
                  rows={2}
                  required
                  placeholder="Add details, updates, or helpful information..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingComment || !commentText.trim()}
                    className="rounded-lg bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                  >
                    {submittingComment ? "Posting..." : "Post Comment"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mb-6 rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-center text-xs text-slate-600">
                <Link href="/login" className="font-bold text-emerald-800 hover:underline">
                  Log in
                </Link>{" "}
                to join the discussion and comment on this issue.
              </div>
            )}

            {/* Comments List */}
            {issue.comments.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No comments yet. Be the first to comment!</p>
            ) : (
              <div className="space-y-4">
                {issue.comments.map((comment) => {
                  const isAuthor = currentUser?.id === comment.user_id;
                  const canDelete = isAuthor || isAdminOrAO;

                  return (
                    <div key={comment.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{comment.user.name}</span>
                          <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                            {comment.user.role}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                          <span>
                            {new Date(comment.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {canDelete && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-rose-600 hover:underline font-semibold ml-2"
                              title={isAdminOrAO && !isAuthor ? "Moderate comment" : "Delete comment"}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-slate-700 leading-normal whitespace-pre-wrap">{comment.comment}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal: Reject Issue */}
        {showRejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-lg font-bold text-slate-900">Reject Campus Issue</h3>
              <p className="text-xs text-slate-500 mt-1">
                Please provide a transparent reason for rejection. This will be recorded in the audit log and notified to the reporter.
              </p>
              <form onSubmit={handleReject} className="mt-4">
                <textarea
                  required
                  rows={3}
                  minLength={3}
                  placeholder="e.g. Duplicate report of Issue #12, Not a campus facility defect..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-rose-600 focus:outline-none focus:ring-1 focus:ring-rose-600"
                />
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRejectModal(false)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700"
                  >
                    {actionLoading ? "Rejecting..." : "Confirm Rejection"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Assign Technician */}
        {showAssignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-lg font-bold text-slate-900">Assign Maintenance Technician</h3>
              <form onSubmit={handleAssign} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Technician</label>
                  <select
                    required
                    value={selectedTechId}
                    onChange={(e) => setSelectedTechId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
                  >
                    <option value="">-- Choose technician --</option>
                    {maintenanceUsers.map((tech) => (
                      <option key={tech.id} value={tech.id}>
                        {tech.name} ({tech.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Instructions / Note (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Inspect power capacitor, urgent repair..."
                    value={assignMessage}
                    onChange={(e) => setAssignMessage(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
                  />
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading || !selectedTechId}
                    className="rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700"
                  >
                    {actionLoading ? "Assigning..." : "Assign Technician"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Resolve Issue */}
        {showResolveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-lg font-bold text-slate-900">Complete & Resolve Issue</h3>
              <form onSubmit={handleResolve} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Resolution Note <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    minLength={3}
                    placeholder="Describe what work was done (e.g. Replaced faulty breaker and tested load)..."
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Resolution Photo (Recommended)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setResolutionFile(e.target.files?.[0] || null)}
                    className="text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-emerald-50 file:text-emerald-800"
                  />
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowResolveModal(false)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                  >
                    {actionLoading ? "Resolving..." : "Confirm Resolved"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
