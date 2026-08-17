import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Compass } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <AppShell>
      <section className="container flex min-h-[68vh] items-center justify-center py-20">
        <div className="max-w-xl text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2rem] border border-cyan-300/15 bg-cyan-300/5 text-cyan-300 shadow-[0_0_60px_rgba(34,211,238,.12)]"><Compass className="h-9 w-9" /></div>
          <p className="mt-7 text-sm font-black uppercase tracking-[0.24em] text-cyan-300">Error 404</p>
          <h1 className="mt-3 text-5xl font-black tracking-tight text-white">This page is lost.</h1>
          <p className="mt-4 leading-7 text-slate-400">The item board is still right where you left it.</p>
          <Button asChild size="lg" className="mt-7 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-8 font-bold text-white"><Link href="/">Return home</Link></Button>
        </div>
      </section>
    </AppShell>
  );
}
