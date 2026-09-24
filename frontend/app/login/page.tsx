"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthCard } from "@/components/AuthCard";
import { Header } from "@/components/Header";
import { loginAccount } from "@/lib/api";
import { saveToken } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await loginAccount(email, password);
      saveToken(result.access_token);
      router.push("/dashboard");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to log in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <><Header /><AuthCard eyebrow="Welcome back" title="Log in to Campus360" subtitle="Use your campus account to continue.">
      <form className="space-y-5" onSubmit={submit}>
        <div><label className="label" htmlFor="email">Email address</label><input className="field" id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></div>
        <div><label className="label" htmlFor="password">Password</label><input className="field" id="password" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} /></div>
        {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
        <button className="primary-button" disabled={loading}>{loading ? "Logging in…" : "Log in"}</button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">New to Campus360? <Link className="font-bold text-forest" href="/register">Create an account</Link></p>
    </AuthCard></>
  );
}

