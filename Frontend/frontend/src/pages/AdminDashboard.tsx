import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { PageLoader } from "@/components/PageLoader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardCheck, PackageSearch, RotateCcw, ShieldCheck, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

const adminItemQuery = { search: "", reportType: "all" as const, category: "all" as const, status: "all" as const, page: 1, pageSize: 8, sort: "newest" as const };

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();
  const overview = trpc.admin.overview.useQuery(undefined, { enabled: user?.role === "admin" });
  const pendingClaims = trpc.admin.claims.useQuery({ status: "pending", page: 1, pageSize: 5 }, { enabled: user?.role === "admin" });
  const itemList = trpc.items.list.useQuery(adminItemQuery, { enabled: user?.role === "admin" });
  const deleteItem = trpc.items.delete.useMutation();
  const queryError = overview.error || pendingClaims.error || itemList.error;

  const remove = async (id: number) => {
    if (!window.confirm("Delete this item report and all related records?")) return;
    try { await deleteItem.mutateAsync({ id }); await Promise.all([utils.items.list.invalidate(), utils.admin.overview.invalidate()]); toast.success("Listing deleted."); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to delete the listing."); }
  };

  if (loading) return <DashboardLayout><PageLoader /></DashboardLayout>;
  if (user?.role !== "admin") return <DashboardLayout><div className="mx-auto mt-10 max-w-xl rounded-[2rem] border border-rose-400/20 bg-rose-400/5 p-8 text-center"><AlertTriangle className="mx-auto h-10 w-10 text-rose-300" /><h1 className="mt-5 text-3xl font-black text-white">Staff access only</h1><p className="mt-3 text-slate-400">This dashboard is restricted by a server-enforced admin role.</p><Button asChild className="mt-6"><Link href="/">Return to website</Link></Button></div></DashboardLayout>;

  const metrics = [
    { label: "Registered users", value: overview.data?.totalUsers ?? "—", icon: Users, color: "text-cyan-300 bg-cyan-300/10" },
    { label: "Lost", value: overview.data?.lost ?? "—", icon: PackageSearch, color: "text-amber-300 bg-amber-300/10" },
    { label: "Claimed", value: overview.data?.claimed ?? "—", icon: ClipboardCheck, color: "text-violet-300 bg-violet-300/10" },
    { label: "Verified", value: overview.data?.verified ?? "—", icon: ShieldCheck, color: "text-cyan-300 bg-cyan-300/10" },
    { label: "Returned", value: overview.data?.returned ?? "—", icon: RotateCcw, color: "text-emerald-300 bg-emerald-300/10" },
  ];

  return <DashboardLayout><div className="mx-auto max-w-7xl py-2">{queryError ? <div className="mb-5 rounded-3xl border border-rose-400/20 bg-rose-400/5 p-5 text-sm text-rose-100">Unable to load part of the staff dashboard: {queryError.message}</div> : null}<div className="rounded-[2rem] border border-white/8 bg-[radial-gradient(circle_at_85%_10%,rgba(139,92,246,.15),transparent_30%),linear-gradient(135deg,#0b0b20,#050810)] p-7 sm:p-9"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-sm font-black uppercase tracking-[0.22em] text-violet-300">Authorized DIU staff</p><h1 className="mt-3 text-4xl font-black tracking-tight text-white">Recovery operations.</h1><p className="mt-3 max-w-2xl text-slate-400">Review private ownership evidence, manage every listing, and complete verified returns.</p></div><Button asChild className="rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 font-bold text-white"><Link href="/admin/claims">Open claim queue <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div></div>
    {overview.isLoading ? <PageLoader label="Loading staff metrics" /> : <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{metrics.map(metric => <div key={metric.label} className="rounded-[1.5rem] border border-white/8 bg-slate-950/70 p-5"><div className={`inline-flex rounded-2xl p-2.5 ${metric.color}`}><metric.icon className="h-5 w-5" /></div><p className="mt-5 text-3xl font-black text-white">{metric.value}</p><p className="mt-1 text-sm text-slate-500">{metric.label}</p></div>)}</div>}
    <div className="mt-7 grid gap-6 xl:grid-cols-[.95fr_1.35fr]">
      <section className="rounded-[2rem] border border-white/8 bg-slate-950/70 p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">Verification queue</p><h2 className="mt-2 text-2xl font-black text-white">Pending claims</h2></div><span className="rounded-full bg-amber-400/15 px-3 py-1 text-sm font-bold text-amber-200">{overview.data?.pendingClaims ?? 0}</span></div><div className="mt-5 space-y-3">{pendingClaims.data?.rows.length ? pendingClaims.data.rows.map(entry => <div key={entry.claim.id} className="rounded-2xl border border-white/7 bg-white/[0.025] p-4"><p className="text-sm font-bold text-white">{entry.item.title}</p><p className="mt-1 text-xs text-slate-500">Claimant: {entry.claimantName || "DIU member"}</p><p className="mt-2 line-clamp-2 text-sm text-slate-400">{entry.claim.proofDescription}</p></div>) : <div className="rounded-2xl border border-dashed border-white/10 py-10 text-center text-sm text-slate-500"><CheckCircle2 className="mx-auto mb-3 h-7 w-7 text-emerald-300/60" />No pending claims</div>}</div><Button asChild variant="outline" className="mt-5 w-full border-white/10 bg-white/[0.03]"><Link href="/admin/claims">Review all claims</Link></Button></section>
      <section className="rounded-[2rem] border border-white/8 bg-slate-950/70 p-6"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Listing management</p><h2 className="mt-2 text-2xl font-black text-white">Latest reports</h2></div>{itemList.isLoading ? <PageLoader label="Loading listings" /> : <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead className="border-b border-white/8 text-xs uppercase tracking-wider text-slate-500"><tr><th className="pb-3 pr-4">Item</th><th className="pb-3 pr-4">Type</th><th className="pb-3 pr-4">Status</th><th className="pb-3 text-right">Actions</th></tr></thead><tbody>{itemList.data?.items.map(item => <tr key={item.id} className="border-b border-white/5"><td className="py-4 pr-4"><p className="font-bold text-white">{item.title}</p><p className="mt-1 text-xs text-slate-500">{item.category} · {item.location}</p></td><td className="py-4 pr-4 capitalize text-slate-300">{item.reportType}</td><td className="py-4 pr-4"><StatusBadge status={item.status} /></td><td className="py-4 text-right"><Button asChild size="sm" variant="ghost" className="text-cyan-200"><Link href={`/items/${item.id}`}>View</Link></Button><Button size="icon" variant="ghost" disabled={deleteItem.isPending} onClick={() => void remove(item.id)} className="text-rose-300 hover:bg-rose-400/10 hover:text-rose-200"><Trash2 className="h-4 w-4" /></Button></td></tr>)}</tbody></table></div>}</section>
    </div>
  </div></DashboardLayout>;
}
