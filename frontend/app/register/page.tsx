"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthCard } from "@/components/AuthCard";
import { Header } from "@/components/Header";
import { registerAccount } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "STUDENT" as "STUDENT" | "STAFF" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await registerAccount(form);
      router.push("/login?registered=1");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <><Header /><AuthCard eyebrow="Join the community" title="Create your account" subtitle="Students and staff can self-register. Administrative roles are created securely by an administrator.">
      <form className="space-y-5" onSubmit={submit}>
        <div><label className="label" htmlFor="name">Full name</label><input className="field" id="name" required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><label className="label" htmlFor="email">Campus email</label><input className="field" id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div><label className="label" htmlFor="role">I am a</label><select className="field" id="role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as "STUDENT" | "STAFF" })}><option value="STUDENT">Student</option><option value="STAFF">Staff member</option></select></div>
        <div><label className="label" htmlFor="password">Password</label><input className="field" id="password" type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /><p className="mt-2 text-xs text-slate-500">Use at least 8 characters.</p></div>
        {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
        <button className="primary-button" disabled={loading}>{loading ? "Creating account…" : "Create account"}</button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">Already registered? <Link className="font-bold text-forest" href="/login">Log in</Link></p>
    </AuthCard></>
  );
}

