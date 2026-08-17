import { AppShell } from "@/components/AppShell";
import { ItemCard } from "@/components/ItemCard";
import { PageLoader } from "@/components/PageLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ITEM_CATEGORIES, ITEM_STATUSES } from "@shared/lostFound";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";

export default function Browse() {
  const [search, setSearch] = useState("");
  const [reportType, setReportType] = useState<"all" | "lost" | "found">("all");
  const [category, setCategory] = useState<"all" | (typeof ITEM_CATEGORIES)[number]>("all");
  const [status, setStatus] = useState<"all" | (typeof ITEM_STATUSES)[number]>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const queryInput = useMemo(
    () => ({
      search,
      reportType,
      category,
      status,
      dateFrom: dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : undefined,
      dateTo: dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : undefined,
      page,
      pageSize: 9,
      sort: "newest" as const,
    }),
    [search, reportType, category, status, dateFrom, dateTo, page],
  );
  const listings = trpc.items.list.useQuery(queryInput);

  const resetPage = <T,>(setter: (value: T) => void, value: T) => {
    setter(value);
    setPage(1);
  };

  return (
    <AppShell>
      <section className="border-b border-white/5 bg-[radial-gradient(circle_at_15%_0%,rgba(6,182,212,0.18),transparent_30%),linear-gradient(180deg,#04111b_0%,#03070d_100%)] py-16">
        <div className="container"><p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300">Campus item board</p><h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-6xl">Search every report.</h1><p className="mt-5 max-w-2xl leading-7 text-slate-400">Filter by report type, category, date, and exact recovery status. Sensitive ownership proof never appears in public listings.</p></div>
      </section>
      <section className="container py-10">
        <div className="rounded-[1.75rem] border border-white/8 bg-slate-950/70 p-5 shadow-[0_28px_80px_rgba(0,0,0,0.24)]">
          <div className="relative"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-300" /><Input value={search} onChange={event => resetPage(setSearch, event.target.value)} placeholder="Search title, description, or campus location…" className="h-13 border-white/10 bg-white/[0.035] pl-12 text-base text-white placeholder:text-slate-500" /></div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            <Select value={reportType} onValueChange={value => resetPage(setReportType, value as typeof reportType)}><SelectTrigger className="border-white/10 bg-white/[0.03]"><SelectValue placeholder="Report type" /></SelectTrigger><SelectContent><SelectItem value="all">All report types</SelectItem><SelectItem value="lost">Lost reports</SelectItem><SelectItem value="found">Found reports</SelectItem></SelectContent></Select>
            <Select value={category} onValueChange={value => resetPage(setCategory, value as typeof category)}><SelectTrigger className="border-white/10 bg-white/[0.03]"><SelectValue placeholder="Category" /></SelectTrigger><SelectContent><SelectItem value="all">All categories</SelectItem>{ITEM_CATEGORIES.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select>
            <Select value={status} onValueChange={value => resetPage(setStatus, value as typeof status)}><SelectTrigger className="border-white/10 bg-white/[0.03]"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{ITEM_STATUSES.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select>
            <Input type="date" value={dateFrom} onChange={event => resetPage(setDateFrom, event.target.value)} aria-label="Date from" className="border-white/10 bg-white/[0.03]" />
            <Input type="date" value={dateTo} onChange={event => resetPage(setDateTo, event.target.value)} aria-label="Date to" className="border-white/10 bg-white/[0.03]" />
          </div>
        </div>

        <div className="mt-10 flex items-end justify-between gap-4"><div><p className="flex items-center gap-2 text-sm font-bold text-cyan-200"><SlidersHorizontal className="h-4 w-4" />Filtered results</p><p className="mt-1 text-2xl font-black text-white">{listings.data?.total ?? 0} report{listings.data?.total === 1 ? "" : "s"}</p></div><p className="text-sm text-slate-500">Page {listings.data?.page ?? page} of {listings.data?.totalPages ?? 1}</p></div>
        {listings.isLoading ? <PageLoader label="Searching campus reports" /> : listings.error ? <div className="mt-8 rounded-2xl border border-rose-400/20 bg-rose-400/8 p-6 text-rose-100">{listings.error.message}</div> : listings.data?.items.length ? <div className="mt-7 grid gap-6 md:grid-cols-2 xl:grid-cols-3">{listings.data.items.map(item => <ItemCard key={item.id} item={item} />)}</div> : <div className="mt-8 rounded-[2rem] border border-dashed border-white/10 bg-white/[0.025] py-20 text-center"><Search className="mx-auto h-9 w-9 text-cyan-300/60" /><h2 className="mt-5 text-xl font-bold text-white">No matching reports</h2><p className="mt-2 text-sm text-slate-400">Try another keyword or broaden the filters.</p></div>}
        <div className="mt-10 flex items-center justify-center gap-3"><Button variant="outline" disabled={page <= 1} onClick={() => setPage(value => Math.max(1, value - 1))} className="border-white/10 bg-white/[0.03]"><ChevronLeft className="mr-2 h-4 w-4" />Previous</Button><Button variant="outline" disabled={page >= (listings.data?.totalPages ?? 1)} onClick={() => setPage(value => value + 1)} className="border-white/10 bg-white/[0.03]">Next<ChevronRight className="ml-2 h-4 w-4" /></Button></div>
      </section>
    </AppShell>
  );
}
