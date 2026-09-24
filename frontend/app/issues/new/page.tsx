"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { createIssue, getCategories, getLocations, getSimilarIssues, supportIssue, uploadImage } from "@/lib/api";
import { readToken } from "@/lib/auth";
import type { Category, Location, SimilarIssue } from "@/types/issue";

export default function NewIssuePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [locationId, setLocationId] = useState("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [similarIssues, setSimilarIssues] = useState<SimilarIssue[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = readToken();
    if (!token) {
      router.push("/login");
      return;
    }

    getCategories().then((cats) => {
      setCategories(cats);
      if (cats.length > 0) setCategoryId(cats[0].id);
    });

    getLocations().then((locs) => {
      setLocations(locs);
      if (locs.length > 0) setLocationId(locs[0].id);
    });
  }, [router]);

  // Live similar issues search
  useEffect(() => {
    if (!categoryId && !locationId && title.length < 3) {
      setSimilarIssues([]);
      return;
    }

    const timer = setTimeout(() => {
      setLoadingSimilar(true);
      getSimilarIssues({
        category_id: categoryId || undefined,
        location_id: locationId || undefined,
        q: title.length >= 3 ? title : undefined,
      })
        .then(setSimilarIssues)
        .catch(console.error)
        .finally(() => setLoadingSimilar(false));
    }, 400);

    return () => clearTimeout(timer);
  }, [categoryId, locationId, title]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  }

  async function handleSupportExisting(issueId: string) {
    try {
      await supportIssue(issueId);
      router.push(`/issues/${issueId}`);
    } catch {
      router.push(`/issues/${issueId}`);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (title.trim().length < 5) {
      setError("Title must be at least 5 characters long.");
      return;
    }
    if (description.trim().length < 10) {
      setError("Description must be at least 10 characters long.");
      return;
    }
    if (!categoryId) {
      setError("Please select a valid category.");
      return;
    }
    if (!locationId) {
      setError("Please select a campus location.");
      return;
    }

    setSubmitting(true);
    try {
      let uploadedUrl: string | undefined = undefined;
      if (selectedFile) {
        const uploadRes = await uploadImage(selectedFile);
        uploadedUrl = uploadRes.url;
      }

      const created = await createIssue({
        title: title.trim(),
        description: description.trim(),
        category_id: categoryId,
        location_id: locationId,
        image_url: uploadedUrl,
      });

      router.push(`/issues/${created.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create issue.";
      setError(msg);
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <Link href="/issues" className="text-sm font-semibold text-emerald-800 hover:underline">
            ← Back to All Issues
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
            Report a Campus Problem
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Provide details and photo evidence to help campus administration prioritize and resolve the issue.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 font-medium">
            ⚠️ {error}
          </div>
        )}

        {/* Similar Issue Lookup Suggestion Box */}
        {similarIssues.length > 0 && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/80 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <span className="text-lg">💡</span>
              <span>Potential Existing Issues Found</span>
              {loadingSimilar && <span className="text-xs font-normal text-amber-700 animate-pulse">(checking...)</span>}
            </div>
            <p className="text-xs text-amber-800 mt-1">
              Before filing a new report, check if this problem has already been reported. Supporting an existing issue gives it higher visibility!
            </p>

            <div className="mt-3 space-y-2">
              {similarIssues.map((sim) => (
                <div
                  key={sim.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-amber-200/80 bg-white p-3 text-xs shadow-xs"
                >
                  <div className="flex-1">
                    <span className="font-bold text-slate-900 text-sm">{sim.title}</span>
                    <div className="flex items-center gap-2 mt-1 text-slate-500">
                      <span>📍 {sim.location_name}</span>
                      <span>•</span>
                      <span className="font-semibold text-amber-800">{sim.status}</span>
                      <span>•</span>
                      <span>▲ {sim.support_count} supporters</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/issues/${sim.id}`}
                      target="_blank"
                      className="rounded px-2.5 py-1 text-slate-700 hover:bg-slate-100 font-medium border border-slate-200"
                    >
                      View
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleSupportExisting(sim.id)}
                      className="rounded bg-emerald-700 px-3 py-1 font-bold text-white hover:bg-emerald-800 shadow-xs"
                    >
                      Support Instead
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-1.5">
              Issue Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              minLength={5}
              maxLength={200}
              placeholder="e.g. Broken bench near bus stop, Water leakage in Main Block washroom..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
            <span className="text-xs text-slate-400 mt-1 block">5 to 200 characters</span>
          </div>

          {/* Category & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1.5">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1.5">
                Campus Location <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-1.5">
              Detailed Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              minLength={10}
              placeholder="Describe the exact location, what happened, and any safety hazards..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
            <span className="text-xs text-slate-400 mt-1 block">Minimum 10 characters</span>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-1.5">
              Report Photo (Optional but recommended)
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={handleFileChange}
                className="text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-800 hover:file:bg-emerald-100"
              />
              {previewUrl && (
                <div className="relative h-24 w-32 overflow-hidden rounded-xl border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="absolute top-1 right-1 rounded-full bg-slate-900/70 p-1 text-white text-xs hover:bg-slate-900"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
            <span className="text-xs text-slate-400 mt-1 block">Supported formats: JPG, PNG, WEBP (Max 5MB)</span>
          </div>

          {/* Submit buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link
              href="/issues"
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-emerald-700 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Submitting Report..." : "Submit Issue Report"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
