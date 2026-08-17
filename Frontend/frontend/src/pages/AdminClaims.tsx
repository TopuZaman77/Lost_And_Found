import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { PageLoader } from "@/components/PageLoader";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, Check, ChevronLeft, ChevronRight, Fingerprint, LoaderCircle, LockKeyhole, ShieldCheck, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

type FilterStatus = "all" | "pending" | "approved" | "rejected";

export default function AdminClaims() {
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();
  const [status, setStatus] = useState<FilterStatus>("pending");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [decision, setDecision] = useState<"approved" | "rejected">("approved");
  const [reviewNote, setReviewNote] = useState("");
  const queryInput = useMemo(() => ({ status, page, pageSize: 12 }), [status, page]);
  const queue = trpc.admin.claims.useQuery(queryInput, { enabled: user?.role === "admin" });
  const review = trpc.admin.reviewClaim.useMutation();
  const selected = queue.data?.rows.find(row => row.claim.id === selectedId);

  const submitReview = async () => {
    if (!selectedId) return;
    try {
      await review.mutateAsync({ claimId: selectedId, decision, reviewNote });
      toast.success(decision === "approved" ? "Ownership verified." : "Claim rejected.");
      setSelectedId(null); setReviewNote("");
      await Promise.all([utils.admin.claims.invalidate(), utils.admin.overview.invalidate(), utils.items.invalidate(), utils.notifications.invalidate()]);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to review the claim."); }
  };

  if (loading) return <DashboardLayout><PageLoader /></DashboardLayout>;
  if (user?.role !== "admin") return <DashboardLayout><div className="mx-auto mt-10 max-w-xl rounded-[2rem] border border-rose-400/20 bg-rose-400/5 p-8 text-center"><AlertTriangle className="mx-auto h-10 w-10 text-rose-300" /><h1 className="mt-5 text-3xl font-black text-white">Staff access only</h1><p className="mt-3 text-slate-400">Private claim evidence is restricted to authorized administrators.</p><Button asChild className="mt-6"><Link href="/">Return to website</Link></Button></div></DashboardLayout>;

  return <DashboardLayout><div className="mx-auto max-w-7xl py-2"><div className="rounded-[2rem] border border-white/8 bg-[radial-gradient(circle_at_85%_10%,rgba(34,211,238,.14),transparent_30%),linear-gradient(135deg,#07131e,#050810)] p-7 sm:p-9"><p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300">Staff verification</p><h1 className="mt-3 text-4xl font-black tracking-tight text-white">Ownership claim queue.</h1><p className="mt-3 max-w-2xl text-slate-400">Compare private identifiers with the physical item before recording a decision.</p></div>
    <div className="mt-7 flex flex-wrap items-center justify-between gap-4"><Select value={status} onValueChange={value => { setStatus(value as FilterStatus); setPage(1); }}><SelectTrigger className="w-52 border-white/10 bg-slate-950/70"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">Pending claims</SelectItem><SelectItem value="approved">Approved claims</SelectItem><SelectItem value="rejected">Rejected claims</SelectItem><SelectItem value="all">All decisions</SelectItem></SelectContent></Select><p className="text-sm text-slate-500">{queue.data?.total ?? 0} claim{queue.data?.total === 1 ? "" : "s"}</p></div>
    {queue.isLoading ? <PageLoader label="Loading claim queue" /> : queue.error ? <div className="mt-6 rounded-3xl border border-rose-400/20 bg-rose-400/5 p-6 text-rose-100">Unable to load the claim queue: {queue.error.message}</div> : queue.data?.rows.length ? <div className="mt-6 grid gap-5 xl:grid-cols-2">{queue.data.rows.map(entry => <article key={entry.claim.id} className="rounded-[1.75rem] border border-white/8 bg-slate-950/70 p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">Claim #{entry.claim.id} · {entry.item.category}</p><h2 className="mt-2 text-2xl font-black text-white">{entry.item.title}</h2><p className="mt-2 text-sm text-slate-500">Claimant: {entry.claimantName || "DIU member"} · {entry.claimantEmail || "No email"}</p></div><div className="text-right"><Badge className={entry.claim.status === "approved" ? "bg-emerald-400 text-slate-950" : entry.claim.status === "rejected" ? "bg-rose-500 text-white" : "bg-amber-400 text-slate-950"}>{entry.claim.status}</Badge><div className="mt-2"><StatusBadge status={entry.item.status} /></div></div></div>
      <div className="mt-5 grid gap-3"><div className="rounded-2xl border border-violet-300/10 bg-violet-400/[0.045] p-4"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-300"><Fingerprint className="h-4 w-4" />Unique identifiers</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">{entry.claim.uniqueIdentifiers}</p></div><div className="rounded-2xl border border-cyan-300/10 bg-cyan-400/[0.04] p-4"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-300"><LockKeyhole className="h-4 w-4" />Proof description</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">{entry.claim.proofDescription}</p></div></div>
      {entry.claim.reviewNote ? <div className="mt-4 rounded-2xl border border-white/7 bg-white/[0.025] p-4 text-sm text-slate-400"><span className="font-bold text-white">Review note: </span>{entry.claim.reviewNote}</div> : null}
      <div className="mt-5 flex flex-wrap gap-2"><Button asChild size="sm" variant="outline" className="border-white/10 bg-white/[0.03]"><Link href={`/items/${entry.item.id}`}>Open item</Link></Button>{entry.claim.status === "pending" ? <><Button size="sm" onClick={() => { setSelectedId(entry.claim.id); setDecision("approved"); setReviewNote(""); }} className="bg-gradient-to-r from-emerald-400 to-cyan-400 font-bold text-slate-950"><Check className="mr-2 h-4 w-4" />Approve</Button><Button size="sm" onClick={() => { setSelectedId(entry.claim.id); setDecision("rejected"); setReviewNote(""); }} variant="outline" className="border-rose-400/25 bg-rose-400/5 text-rose-200"><X className="mr-2 h-4 w-4" />Reject</Button></> : null}</div>
    </article>)}</div> : <div className="mt-6 rounded-[2rem] border border-dashed border-white/10 py-20 text-center"><ShieldCheck className="mx-auto h-10 w-10 text-emerald-300/50" /><h2 className="mt-5 text-xl font-bold text-white">No claims in this view</h2><p className="mt-2 text-sm text-slate-500">Change the filter or wait for a new ownership claim.</p></div>}
    <div className="mt-8 flex justify-center gap-3"><Button variant="outline" disabled={page <= 1} onClick={() => setPage(value => Math.max(1, value - 1))} className="border-white/10 bg-white/[0.03]"><ChevronLeft className="mr-2 h-4 w-4" />Previous</Button><Button variant="outline" disabled={page >= (queue.data?.totalPages ?? 1)} onClick={() => setPage(value => value + 1)} className="border-white/10 bg-white/[0.03]">Next<ChevronRight className="ml-2 h-4 w-4" /></Button></div>
    <Dialog open={selectedId !== null} onOpenChange={open => { if (!open) setSelectedId(null); }}><DialogContent className="border-white/10 bg-slate-950 text-slate-100"><DialogHeader><DialogTitle>{decision === "approved" ? "Approve and verify ownership" : "Reject ownership claim"}</DialogTitle><DialogDescription>{decision === "approved" ? `This will advance “${selected?.item.title ?? "the item"}” from Claimed to Verified.` : "If no other claim is pending, the item returns to Lost status and accepts new claims."}</DialogDescription></DialogHeader><div className={`rounded-2xl border p-4 ${decision === "approved" ? "border-emerald-300/15 bg-emerald-400/5" : "border-rose-300/15 bg-rose-400/5"}`}><p className="text-sm font-bold text-white">Claimant: {selected?.claimantName || "DIU member"}</p><p className="mt-1 text-sm text-slate-400">A decision notification and email delivery record will be created automatically.</p></div><div><Label htmlFor="review-note">Staff review note</Label><Textarea id="review-note" value={reviewNote} onChange={event => setReviewNote(event.target.value)} placeholder={decision === "approved" ? "Record the identifiers checked and return instructions." : "Explain why the proof did not establish ownership."} className="mt-2 min-h-28 border-white/10 bg-white/[0.03]" /></div><Button disabled={review.isPending || reviewNote.trim().length < 4} onClick={() => void submitReview()} className={decision === "approved" ? "bg-gradient-to-r from-emerald-400 to-cyan-400 font-bold text-slate-950" : "bg-gradient-to-r from-rose-500 to-fuchsia-500 font-bold text-white"}>{review.isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : decision === "approved" ? <Check className="mr-2 h-4 w-4" /> : <X className="mr-2 h-4 w-4" />}Confirm {decision === "approved" ? "approval" : "rejection"}</Button></DialogContent></Dialog>
  </div></DashboardLayout>;
}
