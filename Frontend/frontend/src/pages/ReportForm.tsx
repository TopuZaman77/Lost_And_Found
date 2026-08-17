import { useAuth } from "@/_core/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getLoginPath } from "@/const";
import { trpc } from "@/lib/trpc";
import { ITEM_CATEGORIES, type ItemCategory, type ReportType } from "@shared/lostFound";
import { ArrowLeft, Camera, CheckCircle2, LoaderCircle, LogIn, MapPin, UploadCloud } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";

type FormState = { title: string; description: string; category: ItemCategory; date: string; location: string; holdingLocation: string; contactDetails: string };
const initialForm: FormState = { title: "", description: "", category: "Electronics", date: "", location: "", holdingLocation: "", contactDetails: "" };

export default function ReportForm({ reportType }: { reportType: ReportType }) {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [form, setForm] = useState<FormState>(initialForm);
  const [image, setImage] = useState<{ key: string; url: string; preview: string } | null>(null);
  const profile = trpc.profile.me.useQuery(undefined, { enabled: isAuthenticated });
  const upload = trpc.media.uploadItemImage.useMutation();
  const createReport = trpc.items.create.useMutation();
  const isLost = reportType === "lost";

  useEffect(() => {
    if (profile.data?.profile?.contactInfo && !form.contactDetails) {
      setForm(current => ({ ...current, contactDetails: profile.data?.profile?.contactInfo ?? "" }));
    }
  }, [profile.data?.profile?.contactInfo, form.contactDetails]);

  const update = (field: keyof FormState, value: string) => setForm(current => ({ ...current, [field]: value }));
  const handleImage = async (file?: File) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return toast.error("Choose a JPG, PNG, or WebP image.");
    if (file.size > 5 * 1024 * 1024) return toast.error("The image must be smaller than 5 MB.");
    const preview = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); });
    try {
      const uploaded = await upload.mutateAsync({ fileName: file.name, mimeType: file.type as "image/jpeg" | "image/png" | "image/webp", base64: preview });
      setImage({ ...uploaded, preview });
      toast.success("Photo uploaded securely.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to upload the image."); }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.date) return toast.error("Choose the date the item was lost or found.");
    try {
      const result = await createReport.mutateAsync({
        reportType,
        title: form.title,
        description: form.description,
        category: form.category,
        eventDate: new Date(`${form.date}T12:00:00`).getTime(),
        location: form.location,
        holdingLocation: isLost ? null : form.holdingLocation,
        contactDetails: form.contactDetails,
        imageKey: image?.key ?? null,
        imageUrl: image?.url ?? null,
      });
      toast.success(`${isLost ? "Lost" : "Found"} item report published.`);
      navigate(`/items/${result.id}`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to publish the report."); }
  };

  if (loading) return <AppShell><div className="container py-20"><div className="flex justify-center"><LoaderCircle className="h-6 w-6 animate-spin text-cyan-300" /></div></div></AppShell>;
  if (!isAuthenticated) return <AppShell><div className="container py-24"><div className="mx-auto max-w-xl rounded-[2rem] border border-cyan-300/15 bg-slate-950/80 p-8 text-center"><LogIn className="mx-auto h-10 w-10 text-cyan-300" /><h1 className="mt-5 text-3xl font-black text-white">Sign in to publish a report</h1><p className="mt-3 text-slate-400">Password login protects report ownership and the verification process.</p><Button asChild size="lg" className="mt-7 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-8"><Link href={getLoginPath(`/report/${reportType}`)}>Continue securely</Link></Button></div></div></AppShell>;
  if (!profile.isLoading && !profile.data?.profile) return <AppShell><div className="relative isolate overflow-hidden"><div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_20%,rgba(34,211,238,.12),transparent_28rem),linear-gradient(180deg,#06131f,#03070d)]" /><div className="container py-24"><div className="mx-auto max-w-xl rounded-[2rem] border border-cyan-300/15 bg-slate-950/75 p-8 text-center shadow-[0_0_70px_rgba(34,211,238,.08)]"><CheckCircle2 className="mx-auto h-10 w-10 text-cyan-300" /><h1 className="mt-5 text-3xl font-black text-white">Complete your DIU profile first</h1><p className="mt-3 text-slate-400">Your student ID, department, and contact information are required before reporting an item.</p><Button asChild size="lg" className="mt-7 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 font-bold text-white"><Link href="/profile">Complete profile</Link></Button></div></div></div></AppShell>;

  return (
    <AppShell>
      <section className={`border-b border-white/5 py-14 ${isLost ? "bg-[radial-gradient(circle_at_15%_0%,rgba(244,63,94,.18),transparent_30%),linear-gradient(180deg,#11060b,#03070d)]" : "bg-[radial-gradient(circle_at_15%_0%,rgba(16,185,129,.18),transparent_30%),linear-gradient(180deg,#03120e,#03070d)]"}`}><div className="container"><Button asChild variant="ghost" className="-ml-3 text-slate-400 hover:text-white"><Link href="/browse"><ArrowLeft className="mr-2 h-4 w-4" />Back to listings</Link></Button><p className={`mt-8 text-sm font-black uppercase tracking-[0.22em] ${isLost ? "text-rose-300" : "text-emerald-300"}`}>{isLost ? "Lost item report" : "Found item report"}</p><h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-6xl">{isLost ? "Help the campus identify it." : "Help it find its way home."}</h1><p className="mt-4 max-w-2xl leading-7 text-slate-400">Provide accurate details without sharing private ownership identifiers publicly.</p></div></section>
      <section className="container py-12"><form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="rounded-[2rem] border border-white/8 bg-slate-950/70 p-6 sm:p-8"><h2 className="text-2xl font-black text-white">Item information</h2><div className="mt-7 grid gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2"><Label htmlFor="title">Report title</Label><Input id="title" required minLength={3} maxLength={160} value={form.title} onChange={e => update("title", e.target.value)} placeholder={isLost ? "e.g. Black wallet near AB4" : "e.g. Found a black wallet"} className="mt-2 border-white/10 bg-white/[0.03]" /></div>
          <div className="sm:col-span-2"><Label htmlFor="description">Description</Label><Textarea id="description" required minLength={12} maxLength={4000} value={form.description} onChange={e => update("description", e.target.value)} placeholder="Describe color, brand, size, and visible features. Keep secret identifiers for the private claim form." className="mt-2 min-h-32 border-white/10 bg-white/[0.03]" /></div>
          <div><Label>Category</Label><Select value={form.category} onValueChange={value => update("category", value)}><SelectTrigger className="mt-2 border-white/10 bg-white/[0.03]"><SelectValue /></SelectTrigger><SelectContent>{ITEM_CATEGORIES.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select></div>
          <div><Label htmlFor="date">Date {isLost ? "lost" : "found"}</Label><Input id="date" type="date" required max={new Date().toISOString().split("T")[0]} value={form.date} onChange={e => update("date", e.target.value)} className="mt-2 border-white/10 bg-white/[0.03]" /></div>
          <div className="sm:col-span-2"><Label htmlFor="location">Location {isLost ? "lost" : "found"}</Label><div className="relative mt-2"><MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300" /><Input id="location" required minLength={3} maxLength={220} value={form.location} onChange={e => update("location", e.target.value)} placeholder="Building, floor, room, gate, or campus area" className="border-white/10 bg-white/[0.03] pl-10" /></div></div>
          {!isLost ? <div className="sm:col-span-2"><Label htmlFor="holding">Current holding location</Label><Input id="holding" required minLength={3} maxLength={220} value={form.holdingLocation} onChange={e => update("holdingLocation", e.target.value)} placeholder="e.g. Student Affairs front desk" className="mt-2 border-white/10 bg-white/[0.03]" /></div> : null}
          <div className="sm:col-span-2"><Label htmlFor="contact">Contact details</Label><Input id="contact" required minLength={4} maxLength={320} value={form.contactDetails} onChange={e => update("contactDetails", e.target.value)} placeholder="DIU email or preferred contact number" className="mt-2 border-white/10 bg-white/[0.03]" /></div>
        </div></div>
        <aside className="space-y-5"><div className="rounded-[2rem] border border-white/8 bg-slate-950/70 p-6"><div className="flex items-center gap-3"><Camera className="h-5 w-5 text-cyan-300" /><h2 className="font-bold text-white">Item photo</h2></div><label className="mt-5 flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border border-dashed border-cyan-300/20 bg-cyan-300/[0.035] text-center transition hover:bg-cyan-300/[0.06]">{image ? <img src={image.preview} alt="Item upload preview" className="h-full w-full object-cover" /> : <><UploadCloud className="h-9 w-9 text-cyan-300" /><span className="mt-3 text-sm font-bold text-white">Upload photo</span><span className="mt-1 text-xs text-slate-500">JPG, PNG, or WebP · max 5 MB</span></>}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={event => void handleImage(event.target.files?.[0])} /></label>{upload.isPending ? <p className="mt-3 flex items-center justify-center gap-2 text-xs text-cyan-200"><LoaderCircle className="h-3.5 w-3.5 animate-spin" />Uploading securely…</p> : null}</div>
          <div className="rounded-[2rem] border border-violet-300/12 bg-violet-400/5 p-6"><p className="font-bold text-white">Before publishing</p><ul className="mt-4 space-y-3 text-sm leading-6 text-slate-400"><li>Use a location another DIU member can recognize.</li><li>Do not publish PINs, serial numbers, or secret marks.</li><li>Staff will review private proof before return.</li></ul></div>
          <Button type="submit" disabled={createReport.isPending || upload.isPending} size="lg" className={`h-13 w-full rounded-full font-bold ${isLost ? "bg-gradient-to-r from-rose-500 to-fuchsia-500" : "bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950"}`}>{createReport.isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}Publish {isLost ? "lost" : "found"} report</Button>
        </aside>
      </form></section>
    </AppShell>
  );
}
