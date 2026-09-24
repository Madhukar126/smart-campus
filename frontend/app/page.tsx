import Link from "next/link";
import { Header } from "@/components/Header";

const steps = [
  ["01", "Report", "Share the issue, location, description, and a clear photo."],
  ["02", "Track", "Follow verification, assignment, and maintenance progress."],
  ["03", "Resolve", "See completion evidence and receive the final update."],
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <section className="relative overflow-hidden bg-ink px-6 py-24 text-white">
          <div className="absolute -right-28 -top-28 h-96 w-96 rounded-full bg-leaf/20 blur-3xl" />
          <div className="relative mx-auto max-w-6xl">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-emerald-300">A better campus, together</p>
            <h1 className="mt-5 max-w-4xl text-5xl font-bold tracking-tight sm:text-7xl">Report. Track. <span className="text-emerald-300">Resolve.</span></h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-emerald-50/80">Campus360 gives every campus issue a clear owner, visible progress, and accountable resolution.</p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link className="rounded-xl bg-leaf px-6 py-3 font-bold text-white hover:bg-emerald-500" href="/register">Report an issue</Link>
              <Link className="rounded-xl border border-white/25 px-6 py-3 font-bold hover:bg-white/10" href="/issues">Browse Issues Feed</Link>
              <Link className="rounded-xl border border-emerald-400/40 bg-emerald-950/60 px-6 py-3 font-bold text-emerald-200 hover:bg-emerald-900/60" href="/login">Sign in</Link>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map(([number, title, description]) => (
              <article key={number} className="rounded-2xl border border-emerald-950/10 p-7 shadow-sm">
                <span className="text-sm font-bold text-leaf">{number}</span>
                <h2 className="mt-4 text-2xl font-bold text-ink">{title}</h2>
                <p className="mt-3 leading-7 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

