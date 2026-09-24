"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { createCategory, deactivateCategory, getCategories, getCurrentUser, updateCategory } from "@/lib/api";
import { readToken } from "@/lib/auth";
import type { Category } from "@/types/issue";

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // New Category Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function loadCategories() {
    setLoading(true);
    getCategories(true)
      .then(setCategories)
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const token = readToken();
    if (!token) {
      router.push("/login");
      return;
    }
    getCurrentUser(token).then((u) => {
      if (u.role !== "ADMIN" && u.role !== "AO") {
        router.push("/dashboard");
        return;
      }
      loadCategories();
    }).catch(() => router.push("/login"));
  }, [router]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await createCategory({ name: newName.trim(), description: newDesc.trim() || undefined });
      setShowAddModal(false);
      setNewName("");
      setNewDesc("");
      loadCategories();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create category");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(cat: Category) {
    try {
      if (cat.is_active) {
        await deactivateCategory(cat.id);
      } else {
        await updateCategory(cat.id, { is_active: true });
      }
      loadCategories();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update category status");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <Link href="/admin" className="text-xs font-semibold text-emerald-800 hover:underline">
              ← Back to Admin Operations
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              Issue Categories Management
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Manage departments and issue classification taxonomy across the campus.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-800 transition-colors shrink-0"
          >
            + Add New Category
          </button>
        </div>

        {loading ? (
          <div className="h-64 bg-white rounded-2xl border border-slate-200 animate-pulse" />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-6 py-3.5">Category Name</th>
                    <th className="px-6 py-3.5">Description</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categories.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80">
                      <td className="px-6 py-4 font-bold text-slate-900">{c.name}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">{c.description || "—"}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            c.is_active
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : "bg-slate-100 text-slate-600 border-slate-300"
                          }`}
                        >
                          {c.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleToggleStatus(c)}
                          className={`rounded-lg px-3 py-1 text-xs font-semibold border transition-colors ${
                            c.is_active
                              ? "border-rose-200 text-rose-700 hover:bg-rose-50"
                              : "border-emerald-200 text-emerald-800 hover:bg-emerald-50"
                          }`}
                        >
                          {c.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal: Add Category */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-lg font-bold text-slate-900">Add New Issue Category</h3>
              {error && <div className="mt-2 text-xs font-semibold text-rose-600">⚠️ {error}</div>}
              <form onSubmit={handleCreate} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ELEVATOR, LABORATORY"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-emerald-600 focus:outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Description (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Elevator and lift maintenance issues"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  />
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800"
                  >
                    {saving ? "Creating..." : "Create Category"}
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
