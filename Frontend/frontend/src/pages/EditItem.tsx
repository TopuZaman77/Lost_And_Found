import { useAuth } from "@/_core/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { PageLoader } from "@/components/PageLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ITEM_CATEGORIES, type ItemCategory } from "@shared/lostFound";
import { ArrowLeft, Camera, LoaderCircle, Save, UploadCloud } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link, useLocation, useRoute } from "wouter";

type EditState = { title: string; description: string; category: ItemCategory; date: string; location: string; holdingLocation: string; contactDetails: string };
const emptyState: EditState = { title: "", description: "", category: "Other", date: "", location: "", holdingLocation: "", contactDetails: "" };

export default function EditItem() {
  const [, params] = useRoute("/items/:id/edit");
  const itemId = Number(params?.id);
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const detail = trpc.items.detail.useQuery({ id: itemId }, { enabled: Number.isInteger(itemId) && itemId > 0 });
  const updateItem = trpc.items.update.useMutation();
  const upload = trpc.media.uploadItemImage.useMutation();
  const [form, setForm] = useState<EditState>(emptyState);
  const [image, setImage] = useState<{ key: string | null; url: string | null; preview: string | null }>({ key: null, url: null, preview: null });

  useEffect(() => {
    const item = detail.data?.item;
    if (!item) return;
    setForm({ title: item.title, description: item.description, category: item.category, date: new Date(item.eventDate).toISOString().split("T")[0], location: item.location, holdingLocation: item.holdingLocation ?? "", contactDetails: item.contactDetails });
    setImage({ key: item.imageKey, url: item.imageUrl, preview: item.imageUrl });
  }, [detail.data?.item]);

  const handleImage = async (file?: File) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return toast.error("Choose a JPG, PNG, or WebP image.");
    if (file.size > 5 * 1024 * 1024) return toast.error("The image must be smaller than 5 MB.");
    const preview = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); });
    try { const result = await upload.mutateAsync({ fileName: file.name, mimeType: file.type as "image/jpeg" | "image/png" | "image/webp", base64: preview }); setImage({ key: result.key, url: result.url, preview }); toast.success("Replacement photo uploaded."); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to upload the photo."); }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await updateItem.mutateAsync({ id: itemId, title: form.title, description: form.description, category: form.category, eventDate: new Date(`${form.date}T12:00:00`).getTime(), location: form.location, holdingLocation: detail.data?.item.reportType === "found" ? form.holdingLocation : null, contactDetails: form.contactDetails, imageKey: image.key, imageUrl: image.url });
      toast.success("Item report updated."); navigate(`/items/${itemId}`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to update the report."); }
  };

  if (detail.isLoading) return <AppShell><PageLoader label="Loading report editor" /></AppShell>;
  if (!detail.data || !user || !detail.data.canManage || (detail.data.item.status !== "Lost" && user.role !== "admin")) return <AppShell><div className="container py-24"><div className="mx-auto max-w-xl rounded-[2rem] border border-rose-400/20 bg-rose-400/5 p-8 text-center"><h1 className="text-3xl font-black text-white">Editing is not available</h1><p className="mt-3 text-slate-400">Only the reporter may edit an open report; staff can manage any listing.</p><Button asChild className="mt-6"><Link href={`/items/${itemId}`}>Back to report</Link></Button></div></div></AppShell>;
  const item = detail.data.item;

  return <AppShell><section className="border-b border-white/5 bg-[radial-gradient(circle_at_15%_0%,rgba(14,165,233,.16),transparent_30%),linear-gradient(180deg,#06131f,#03070d)] py-14"><div className="container"><Button asChild variant="ghost" className="-ml-3 text-slate-400"><Link href={`/items/${itemId}`}><ArrowLeft className="mr-2 h-4 w-4" />Back to report</Link></Button><p className="mt-8 text-sm font-black uppercase tracking-[0.22em] text-cyan-300">Edit {item.reportType} report</p><h1 className="mt-3 text-4xl font-black text-white sm:text-6xl">Keep the details accurate.</h1></div></section><section className="container py-12"><form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_340px]"><div className="rounded-[2rem] border border-white/8 bg-slate-950/70 p-6 sm:p-8"><div className="grid gap-6 sm:grid-cols-2"><div className="sm:col-span-2"><Label htmlFor="edit-title">Title</Label><Input id="edit-title" required minLength={3} maxLength={160} value={form.title} onChange={e => setForm(current => ({ ...current, title: e.target.value }))} className="mt-2 border-white/10 bg-white/[0.03]" /></div><div className="sm:col-span-2"><Label htmlFor="edit-description">Description</Label><Textarea id="edit-description" required minLength={12} maxLength={4000} value={form.description} onChange={e => setForm(current => ({ ...current, description: e.target.value }))} className="mt-2 min-h-36 border-white/10 bg-white/[0.03]" /></div><div><Label>Category</Label><Select value={form.category} onValueChange={value => setForm(current => ({ ...current, category: value as ItemCategory }))}><SelectTrigger className="mt-2 border-white/10 bg-white/[0.03]"><SelectValue /></SelectTrigger><SelectContent>{ITEM_CATEGORIES.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select></div><div><Label htmlFor="edit-date">Event date</Label><Input id="edit-date" type="date" required max={new Date().toISOString().split("T")[0]} value={form.date} onChange={e => setForm(current => ({ ...current, date: e.target.value }))} className="mt-2 border-white/10 bg-white/[0.03]" /></div><div className="sm:col-span-2"><Label htmlFor="edit-location">Location</Label><Input id="edit-location" required minLength={3} value={form.location} onChange={e => setForm(current => ({ ...current, location: e.target.value }))} className="mt-2 border-white/10 bg-white/[0.03]" /></div>{item.reportType === "found" ? <div className="sm:col-span-2"><Label htmlFor="edit-holding">Holding location</Label><Input id="edit-holding" required minLength={3} value={form.holdingLocation} onChange={e => setForm(current => ({ ...current, holdingLocation: e.target.value }))} className="mt-2 border-white/10 bg-white/[0.03]" /></div> : null}<div className="sm:col-span-2"><Label htmlFor="edit-contact">Contact details</Label><Input id="edit-contact" required minLength={4} value={form.contactDetails} onChange={e => setForm(current => ({ ...current, contactDetails: e.target.value }))} className="mt-2 border-white/10 bg-white/[0.03]" /></div></div></div><aside className="space-y-5"><div className="rounded-[2rem] border border-white/8 bg-slate-950/70 p-6"><div className="flex items-center gap-2"><Camera className="h-5 w-5 text-cyan-300" /><p className="font-bold text-white">Report photo</p></div><label className="mt-4 flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border border-dashed border-cyan-300/20 bg-cyan-300/[0.035]">{image.preview ? <img src={image.preview} alt="Report preview" className="h-full w-full object-cover" /> : <><UploadCloud className="h-8 w-8 text-cyan-300" /><span className="mt-2 text-sm font-bold text-white">Choose a photo</span></>}<input type="file" className="sr-only" accept="image/jpeg,image/png,image/webp" onChange={event => void handleImage(event.target.files?.[0])} /></label></div><Button type="submit" disabled={updateItem.isPending || upload.isPending} size="lg" className="h-13 w-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 font-bold text-white">{updateItem.isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save changes</Button></aside></form></section></AppShell>;
}
