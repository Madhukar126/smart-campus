import type { ReactNode } from "react";

export function AuthCard({ eyebrow, title, subtitle, children }: { eyebrow: string; title: string; subtitle: string; children: ReactNode }) {
  return (
    <main className="grid min-h-[calc(100vh-73px)] place-items-center bg-mist px-6 py-12">
      <section className="w-full max-w-md rounded-3xl border border-emerald-950/10 bg-white p-8 shadow-soft">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-leaf">{eyebrow}</p>
        <h1 className="text-3xl font-bold tracking-tight text-ink">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p>
        <div className="mt-7">{children}</div>
      </section>
    </main>
  );
}

