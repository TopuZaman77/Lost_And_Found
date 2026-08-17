import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  Fingerprint,
  Radar,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Link } from "wouter";

const baseQuery = {
  search: "",
  reportType: "all" as const,
  category: "all" as const,
  status: "all" as const,
  page: 1,
  pageSize: 1,
  sort: "newest" as const,
};

const processSteps = [
  { icon: Search, number: "01", title: "Report the item", text: "Create a clear lost or found report with the date, location, details, and an optional photo." },
  { icon: Fingerprint, number: "02", title: "Verify ownership", text: "Owners submit private identifiers and proof that authorized DIU staff can review securely." },
  { icon: CheckCircle2, number: "03", title: "Return with confidence", text: "Approved claims move through the exact verification timeline until the handover is complete." },
];

export default function Home() {
  const allItems = trpc.items.list.useQuery(baseQuery);
  const openItems = trpc.items.list.useQuery({ ...baseQuery, status: "Lost" });
  const returnedItems = trpc.items.list.useQuery({ ...baseQuery, status: "Returned" });

  return (
    <AppShell>
      <section className="relative isolate overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_15%_20%,rgba(8,145,178,0.22),transparent_32%),radial-gradient(circle_at_83%_28%,rgba(79,70,229,0.20),transparent_28%),linear-gradient(135deg,#02050a_0%,#061724_50%,#020712_100%)]" />
        <div className="absolute inset-0 -z-10 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent_88%)]" />
        <div className="container grid min-h-[720px] items-center gap-14 py-20 lg:grid-cols-[1.08fr_.92fr] lg:py-24">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">
              <Sparkles className="h-3.5 w-3.5" /> Daffodil International University
            </div>
            <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">
              Lost something?
              <span className="mt-2 block bg-gradient-to-r from-cyan-200 via-sky-400 to-violet-400 bg-clip-text text-transparent">Let the campus help.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Lost and Found gives students and staff one trusted place to report missing belongings, publish found items, prove ownership, and complete verified returns.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-13 rounded-full bg-gradient-to-r from-rose-500 via-fuchsia-500 to-violet-500 px-7 font-bold text-white shadow-[0_14px_40px_rgba(217,70,239,0.25)] hover:brightness-110">
                <Link href="/report/lost">I lost something <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" className="h-13 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 px-7 font-bold text-slate-950 shadow-[0_14px_40px_rgba(34,211,238,0.22)] hover:brightness-110">
                <Link href="/report/found">I found something <Search className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="h-13 rounded-full px-6 text-slate-200 hover:bg-white/5 hover:text-white">
                <Link href="/browse">Browse reports</Link>
              </Button>
            </div>
            <div className="mt-11 grid max-w-2xl grid-cols-3 gap-3">
              {[
                { label: "Total reports", value: allItems.data?.total ?? "—" },
                { label: "Open items", value: openItems.data?.total ?? "—" },
                { label: "Returned", value: returnedItems.data?.total ?? "—" },
              ].map(stat => (
                <div key={stat.label} className="rounded-2xl border border-white/8 bg-white/[0.035] p-4 backdrop-blur-sm">
                  <p className="text-2xl font-black text-white sm:text-3xl">{stat.value}</p>
                  <p className="mt-1 text-xs text-slate-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto hidden w-full max-w-xl lg:block">
            <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/10 shadow-[0_0_110px_rgba(6,182,212,0.16)]" />
            <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-violet-300/15" />
            <div className="relative mx-auto flex aspect-square max-w-[470px] items-center justify-center">
              <div className="relative z-10 flex h-44 w-44 items-center justify-center rounded-[3rem] border border-cyan-200/20 bg-gradient-to-br from-cyan-300/20 via-sky-600/15 to-violet-600/20 shadow-[0_0_90px_rgba(34,211,238,0.22)] backdrop-blur-xl">
                <Radar className="h-20 w-20 text-cyan-200" />
                <span className="absolute inset-4 rounded-[2.2rem] border border-cyan-200/15" />
              </div>
              <div className="absolute left-2 top-20 w-52 rotate-[-6deg] rounded-3xl border border-white/10 bg-slate-950/80 p-5 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center gap-3"><span className="rounded-xl bg-rose-500/15 p-2 text-rose-300"><Search className="h-5 w-5" /></span><div><p className="text-xs text-slate-500">New report</p><p className="font-bold text-white">Lost student ID</p></div></div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full w-2/3 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-400" /></div>
              </div>
              <div className="absolute bottom-16 right-0 w-56 rotate-[5deg] rounded-3xl border border-white/10 bg-slate-950/85 p-5 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center gap-3"><span className="rounded-xl bg-emerald-400/15 p-2 text-emerald-300"><ShieldCheck className="h-5 w-5" /></span><div><p className="text-xs text-slate-500">Ownership</p><p className="font-bold text-white">Verified by staff</p></div></div>
                <p className="mt-4 text-xs leading-5 text-slate-400">Private proof reviewed securely before return.</p>
              </div>
              <div className="absolute right-16 top-5 rounded-2xl border border-cyan-300/15 bg-cyan-300/8 p-4 text-cyan-200 shadow-[0_0_30px_rgba(34,211,238,0.12)]"><BellRing className="h-6 w-6" /></div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-24">
        <div className="container">
          <div className="max-w-2xl"><p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300">A clearer recovery process</p><h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">Three steps from report to return.</h2><p className="mt-5 leading-7 text-slate-400">Every action is recorded in the database and follows a staff-verifiable ownership workflow.</p></div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {processSteps.map((step, index) => (
              <article key={step.number} className="group relative overflow-hidden rounded-[2rem] border border-white/8 bg-gradient-to-br from-white/[0.055] to-transparent p-7">
                <span className="absolute right-6 top-2 text-7xl font-black text-white/[0.035]">{step.number}</span>
                <div className={`inline-flex rounded-2xl p-3 ${index === 0 ? "bg-rose-500/15 text-rose-300" : index === 1 ? "bg-violet-500/15 text-violet-300" : "bg-emerald-400/15 text-emerald-300"}`}><step.icon className="h-6 w-6" /></div>
                <h3 className="mt-6 text-xl font-bold text-white">{step.title}</h3><p className="mt-3 text-sm leading-6 text-slate-400">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/5 bg-cyan-950/10 py-24">
        <div className="container grid items-center gap-12 lg:grid-cols-[.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-cyan-200/12 bg-slate-950/70 p-7 shadow-[0_0_80px_rgba(14,165,233,0.1)]">
            <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Protected workflow</p><p className="mt-2 text-2xl font-black text-white">Evidence stays private</p></div><ShieldCheck className="h-10 w-10 text-cyan-300" /></div>
            <div className="mt-7 grid gap-3">
              {["Password-protected DIU profiles", "Private ownership identifiers", "Staff-only approval and rejection", "Auditable status history and alerts"].map((text, index) => <div key={text} className="flex items-center gap-3 rounded-2xl border border-white/6 bg-white/[0.025] p-4"><span className={`flex h-8 w-8 items-center justify-center rounded-full ${index % 2 ? "bg-violet-500/15 text-violet-300" : "bg-cyan-400/15 text-cyan-300"}`}><CheckCircle2 className="h-4 w-4" /></span><span className="text-sm font-semibold text-slate-200">{text}</span></div>)}
            </div>
          </div>
          <div><p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-300">Built for DIU</p><h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">A campus system people can trust.</h2><p className="mt-6 max-w-2xl text-base leading-8 text-slate-400">Public listings make discovery easy, while sensitive claim proof is visible only to its owner and authorized staff. Every return follows the exact Lost, Claimed, Verified, and Returned progression.</p><Button asChild size="lg" className="mt-8 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-7 font-bold text-white"><Link href="/browse">Explore the item board <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div>
        </div>
      </section>
    </AppShell>
  );
}
