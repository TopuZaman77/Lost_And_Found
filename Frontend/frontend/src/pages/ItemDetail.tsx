import { useAuth } from "@/_core/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { PageLoader } from "@/components/PageLoader";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusTimeline } from "@/components/StatusTimeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getLoginPath } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, Contact, ImageIcon, LoaderCircle, LockKeyhole, MapPin, PackageCheck, Pencil, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link, useLocation, useRoute } from "wouter";

export default function ItemDetail() {
  const [, params] = useRoute("/items/:id");
  const itemId = Number(params?.id);
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const detail = trpc.items.detail.useQuery({ id: itemId }, { enabled: Number.isInteger(itemId) && itemId > 0 });
  const claim = trpc.claims.submit.useMutation();
  const markReturned = trpc.admin.markReturned.useMutation();
  const deleteItem = trpc.items.delete.useMutation();
  const [identifiers, setIdentifiers] = useState("");
  const [proof, setProof] = useState("");
  const [returnNote, setReturnNote] = useState("");

  if (detail.isLoading) return <AppShell><PageLoader label="Loading item report" /></AppShell>;
  if (detail.error || !detail.data) return <AppShell><div className="container py-24"><div className="rounded-3xl border border-rose-400/20 bg-rose-400/5 p-8 text-rose-100">{detail.error?.message || "Item report not found."}</div></div></AppShell>;
  const { item, reporterName, history, ownClaim, canManage } = detail.data;
  const acceptsClaims = item.reportType === "found" && (item.status === "Lost" || item.status === "Claimed");

  const submitClaim = async () => {
    try {
      await claim.mutateAsync({ itemId: item.id, uniqueIdentifiers: identifiers, proofDescription: proof });
      toast.success("Ownership claim submitted for staff review.");
      setIdentifiers(""); setProof("");
      await detail.refetch();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to submit the claim."); }
  };

  const completeReturn = async () => {
    try {
      await markReturned.mutateAsync({ itemId: item.id, note: returnNote });
      toast.success("Item marked as Returned.");
      setReturnNote("");
      await detail.refetch();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to update the item."); }
  };

  const remove = async () => {
    if (!window.confirm("Delete this report and all related claims? This cannot be undone.")) return;
    try { await deleteItem.mutateAsync({ id: item.id }); await utils.items.list.invalidate(); toast.success("Report deleted."); navigate("/browse"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to delete the report."); }
  };

  return (
    <AppShell>
      <section className="border-b border-white/5 bg-[radial-gradient(circle_at_80%_0%,rgba(14,165,233,.17),transparent_30%),linear-gradient(180deg,#06131f,#03070d)] py-10">
        <div className="container"><Button asChild variant="ghost" className="-ml-3 text-slate-400 hover:text-white"><Link href="/browse"><ArrowLeft className="mr-2 h-4 w-4" />Back to item board</Link></Button></div>
      </section>
      <section className="container py-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,.9fr)]">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-[2rem] border border-white/8 bg-gradient-to-br from-cyan-950 via-slate-950 to-blue-950">
              <div className="relative aspect-[16/10]">
                {item.imageUrl ? <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><div className="rounded-3xl border border-cyan-300/15 bg-cyan-300/5 p-8 text-cyan-300/50"><ImageIcon className="h-14 w-14" /></div></div>}
                <div className="absolute left-5 top-5"><Badge className={item.reportType === "lost" ? "bg-rose-500 text-white" : "bg-emerald-400 text-slate-950"}>{item.reportType === "lost" ? "Lost report" : "Found report"}</Badge></div>
              </div>
            </div>
            <div className="rounded-[2rem] border border-white/8 bg-slate-950/70 p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">{item.category} · Report #{item.id.toString().padStart(4, "0")}</p><h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">{item.title}</h1></div><StatusBadge status={item.status} /></div>
              <p className="mt-6 whitespace-pre-wrap text-base leading-8 text-slate-300">{item.description}</p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/7 bg-white/[0.025] p-4"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500"><MapPin className="h-4 w-4 text-cyan-300" />Location</p><p className="mt-2 font-semibold text-white">{item.location}</p></div>
                <div className="rounded-2xl border border-white/7 bg-white/[0.025] p-4"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500"><CalendarDays className="h-4 w-4 text-violet-300" />Date {item.reportType === "lost" ? "lost" : "found"}</p><p className="mt-2 font-semibold text-white">{new Date(item.eventDate).toLocaleDateString(undefined, { dateStyle: "long" })}</p></div>
                {item.holdingLocation ? <div className="rounded-2xl border border-white/7 bg-white/[0.025] p-4"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500"><PackageCheck className="h-4 w-4 text-emerald-300" />Holding location</p><p className="mt-2 font-semibold text-white">{item.holdingLocation}</p></div> : null}
                <div className="rounded-2xl border border-white/7 bg-white/[0.025] p-4"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500"><Contact className="h-4 w-4 text-amber-300" />Reporter contact</p><p className="mt-2 break-words font-semibold text-white">{item.contactDetails}</p></div>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-cyan-300/12 bg-slate-950/75 p-6"><div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-cyan-300" /><div><p className="font-bold text-white">Recovery status</p><p className="text-xs text-slate-500">Reporter: {reporterName || "DIU member"}</p></div></div><div className="mt-7"><StatusTimeline status={item.status} /></div></div>

            {acceptsClaims && item.reporterId !== user?.id ? (
              <div className="rounded-[2rem] border border-violet-300/15 bg-gradient-to-br from-violet-500/10 to-cyan-500/5 p-6"><LockKeyhole className="h-7 w-7 text-violet-300" /><h2 className="mt-4 text-xl font-black text-white">Is this yours?</h2><p className="mt-2 text-sm leading-6 text-slate-400">Submit details only the rightful owner would know. They remain private from public listings.</p>
                {ownClaim ? <div className="mt-5 rounded-2xl border border-white/8 bg-white/[0.04] p-4"><p className="text-sm font-bold text-white">Claim already submitted</p><p className="mt-1 text-sm capitalize text-slate-400">Review status: {ownClaim.status}</p></div> : isAuthenticated ? (
                  <Dialog><DialogTrigger asChild><Button className="mt-6 w-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 font-bold text-white">Start ownership claim</Button></DialogTrigger><DialogContent className="border-white/10 bg-slate-950 text-slate-100"><DialogHeader><DialogTitle>Prove ownership privately</DialogTitle><DialogDescription>DIU staff will compare these details with the physical item.</DialogDescription></DialogHeader><div className="mt-3 space-y-5"><div><Label htmlFor="identifiers">Unique identifiers</Label><Textarea id="identifiers" value={identifiers} onChange={e => setIdentifiers(e.target.value)} placeholder="Serial number ending, a mark, exact contents, lock-screen detail, or another non-public feature…" className="mt-2 min-h-28 border-white/10 bg-white/[0.03]" /></div><div><Label htmlFor="proof">Proof description</Label><Textarea id="proof" value={proof} onChange={e => setProof(e.target.value)} placeholder="Explain when you owned it, where it was lost, and what evidence you can present." className="mt-2 min-h-28 border-white/10 bg-white/[0.03]" /></div><Button disabled={claim.isPending || identifiers.trim().length < 6 || proof.trim().length < 12} onClick={() => void submitClaim()} className="w-full bg-gradient-to-r from-violet-500 to-cyan-400 font-bold text-white">{claim.isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}Submit claim</Button></div></DialogContent></Dialog>
                ) : <Button asChild className="mt-6 w-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 font-bold text-white"><Link href={getLoginPath(`/items/${item.id}`)}>Sign in to claim</Link></Button>}
              </div>
            ) : null}

            {user?.role === "admin" && item.status === "Verified" ? <div className="rounded-[2rem] border border-emerald-300/15 bg-emerald-400/5 p-6"><CheckCircle2 className="h-7 w-7 text-emerald-300" /><h2 className="mt-4 text-xl font-black text-white">Complete the handover</h2><p className="mt-2 text-sm leading-6 text-slate-400">Only confirm after the verified owner physically receives the item.</p><Dialog><DialogTrigger asChild><Button className="mt-5 w-full bg-gradient-to-r from-emerald-400 to-cyan-400 font-bold text-slate-950">Mark as Returned</Button></DialogTrigger><DialogContent className="border-white/10 bg-slate-950 text-slate-100"><DialogHeader><DialogTitle>Confirm item return</DialogTitle><DialogDescription>This advances the exact status from Verified to Returned.</DialogDescription></DialogHeader><Label htmlFor="return-note">Handover note</Label><Textarea id="return-note" value={returnNote} onChange={e => setReturnNote(e.target.value)} placeholder="Record where and how the item was handed over." className="border-white/10 bg-white/[0.03]" /><Button disabled={markReturned.isPending || returnNote.trim().length < 4} onClick={() => void completeReturn()} className="bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950">Confirm return</Button></DialogContent></Dialog></div> : null}

            {canManage ? <div className="rounded-[2rem] border border-white/8 bg-slate-950/70 p-6"><p className="font-bold text-white">Report controls</p><p className="mt-2 text-sm text-slate-500">Available to the reporter and authorized staff.</p>{item.status === "Lost" || user?.role === "admin" ? <Button asChild variant="outline" className="mt-5 w-full border-cyan-300/20 bg-cyan-300/5 text-cyan-100"><Link href={`/items/${item.id}/edit`}><Pencil className="mr-2 h-4 w-4" />Edit report</Link></Button> : null}<Button onClick={() => void remove()} disabled={deleteItem.isPending} variant="outline" className="mt-3 w-full border-rose-400/25 bg-rose-400/5 text-rose-200 hover:bg-rose-400/10"><Trash2 className="mr-2 h-4 w-4" />Delete report</Button></div> : null}
          </aside>
        </div>

        <div className="mt-8 rounded-[2rem] border border-white/8 bg-slate-950/70 p-6 sm:p-8"><div className="flex items-center gap-3"><Clock3 className="h-5 w-5 text-cyan-300" /><h2 className="text-xl font-black text-white">Status history</h2></div><div className="mt-6 space-y-4">{history.map(entry => <div key={entry.id} className="flex gap-4"><div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,.6)]" /><div><p className="font-bold text-white">{entry.toStatus}</p><p className="mt-1 text-sm text-slate-400">{entry.note || "Status updated."}</p><p className="mt-1 text-xs text-slate-600">{new Date(entry.createdAt).toLocaleString()}</p></div></div>)}</div></div>
      </section>
    </AppShell>
  );
}
