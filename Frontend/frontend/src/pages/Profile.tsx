import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { PageLoader } from "@/components/PageLoader";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, ClipboardList, ExternalLink, LoaderCircle, Save, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

const blankProfile = { name: "", email: "", studentId: "", department: "", phone: "", affiliation: "student" as "student" | "staff", contactInfo: "" };

export default function Profile() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const profile = trpc.profile.me.useQuery(undefined, { enabled: Boolean(user) });
  const reports = trpc.items.mine.useQuery(undefined, { enabled: Boolean(user) });
  const claims = trpc.claims.mine.useQuery(undefined, { enabled: Boolean(user) });
  const saveProfile = trpc.profile.upsert.useMutation();
  const [form, setForm] = useState(blankProfile);
  const queryError = profile.error || reports.error || claims.error;

  useEffect(() => {
    if (!profile.data) return;
    setForm({
      name: profile.data.user.name ?? "",
      email: profile.data.user.email ?? "",
      studentId: profile.data.profile?.studentId ?? profile.data.credential?.studentId ?? "",
      department: profile.data.profile?.department ?? "",
      phone: profile.data.profile?.phone ?? "",
      affiliation: profile.data.profile?.affiliation ?? "student",
      contactInfo: profile.data.profile?.contactInfo ?? profile.data.user.email ?? "",
    });
  }, [profile.data]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await saveProfile.mutateAsync(form);
      await Promise.all([utils.profile.me.invalidate(), utils.auth.me.invalidate()]);
      toast.success("DIU profile saved.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save the profile."); }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl py-2">
        {queryError ? <div className="mb-5 rounded-3xl border border-rose-400/20 bg-rose-400/5 p-5 text-sm text-rose-100">Unable to load part of your dashboard: {queryError.message}</div> : null}
        <div className="rounded-[2rem] border border-white/8 bg-[radial-gradient(circle_at_85%_10%,rgba(34,211,238,.14),transparent_30%),linear-gradient(135deg,#07131e,#050810)] p-7 sm:p-9">
          <div className="flex flex-wrap items-start justify-between gap-5"><div><p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300">Member dashboard</p><h1 className="mt-3 text-4xl font-black tracking-tight text-white">Welcome, {user?.name?.split(" ")[0] || "DIU member"}.</h1><p className="mt-3 max-w-2xl text-slate-400">Manage your university identity, personal reports, and private ownership-claim history.</p></div><Badge className={user?.role === "admin" ? "bg-violet-500 text-white" : "bg-cyan-400 text-slate-950"}>{user?.role === "admin" ? "DIU staff admin" : "DIU user"}</Badge></div>
        </div>

        <Tabs defaultValue="profile" className="mt-7">
          <TabsList className="h-auto rounded-2xl border border-white/8 bg-slate-950/70 p-1.5"><TabsTrigger value="profile" className="rounded-xl px-5 py-2.5"><UserRound className="mr-2 h-4 w-4" />Profile</TabsTrigger><TabsTrigger value="reports" className="rounded-xl px-5 py-2.5"><ClipboardList className="mr-2 h-4 w-4" />My reports</TabsTrigger><TabsTrigger value="claims" className="rounded-xl px-5 py-2.5"><ShieldCheck className="mr-2 h-4 w-4" />My claims</TabsTrigger></TabsList>
          <TabsContent value="profile" className="mt-6">
            {profile.isLoading ? <PageLoader label="Loading profile" /> : <form onSubmit={save} className="grid gap-6 rounded-[2rem] border border-white/8 bg-slate-950/70 p-6 sm:grid-cols-2 sm:p-8"><div className="sm:col-span-2"><div className="flex items-center gap-3"><CheckCircle2 className={`h-6 w-6 ${profile.data?.profile ? "text-emerald-300" : "text-amber-300"}`} /><div><h2 className="text-xl font-black text-white">DIU identity profile</h2><p className="text-sm text-slate-500">Required before submitting reports or claims.</p></div></div></div>
              <div><Label htmlFor="profile-name">Full name</Label><Input id="profile-name" required minLength={2} value={form.name} onChange={e => setForm(current => ({ ...current, name: e.target.value }))} className="mt-2 border-white/10 bg-white/[0.03]" /></div>
              <div><Label htmlFor="profile-email">Email</Label><Input id="profile-email" type="email" value={form.email} onChange={e => setForm(current => ({ ...current, email: e.target.value }))} className="mt-2 border-white/10 bg-white/[0.03]" /></div>
              <div><Label htmlFor="student-id">Student or staff ID</Label><Input id="student-id" required minLength={3} maxLength={32} value={form.studentId} onChange={e => setForm(current => ({ ...current, studentId: e.target.value }))} placeholder="e.g. 221-15-1234" className="mt-2 border-white/10 bg-white/[0.03]" /></div>
              <div><Label htmlFor="department">Department</Label><Input id="department" required minLength={2} value={form.department} onChange={e => setForm(current => ({ ...current, department: e.target.value }))} placeholder="e.g. Computer Science and Engineering" className="mt-2 border-white/10 bg-white/[0.03]" /></div>
              <div><Label htmlFor="phone">Contact number</Label><Input id="phone" required minLength={6} value={form.phone} onChange={e => setForm(current => ({ ...current, phone: e.target.value }))} className="mt-2 border-white/10 bg-white/[0.03]" /></div>
              <div><Label>Affiliation</Label><Select value={form.affiliation} onValueChange={value => setForm(current => ({ ...current, affiliation: value as "student" | "staff" }))}><SelectTrigger className="mt-2 border-white/10 bg-white/[0.03]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="student">Student</SelectItem><SelectItem value="staff">Staff</SelectItem></SelectContent></Select></div>
              <div className="sm:col-span-2"><Label htmlFor="contact-info">Preferred report contact</Label><Input id="contact-info" required minLength={4} value={form.contactInfo} onChange={e => setForm(current => ({ ...current, contactInfo: e.target.value }))} placeholder="DIU email or phone shown on your reports" className="mt-2 border-white/10 bg-white/[0.03]" /></div>
              <div className="sm:col-span-2"><Button type="submit" disabled={saveProfile.isPending} className="rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-7 font-bold text-white">{saveProfile.isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save profile</Button></div>
            </form>}
          </TabsContent>
          <TabsContent value="reports" className="mt-6">
            {reports.isLoading ? <PageLoader label="Loading your reports" /> : reports.data?.length ? <div className="grid gap-4 lg:grid-cols-2">{reports.data.map(item => <article key={item.id} className="rounded-[1.5rem] border border-white/8 bg-slate-950/70 p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-cyan-300">{item.reportType} report · {item.category}</p><h2 className="mt-2 text-xl font-bold text-white">{item.title}</h2></div><StatusBadge status={item.status} /></div><p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-400">{item.description}</p><Button asChild size="sm" variant="outline" className="mt-5 border-white/10 bg-white/[0.03]"><Link href={`/items/${item.id}`}>View report <ExternalLink className="ml-2 h-3.5 w-3.5" /></Link></Button></article>)}</div> : <div className="rounded-[2rem] border border-dashed border-white/10 py-16 text-center"><ClipboardList className="mx-auto h-9 w-9 text-cyan-300/50" /><h2 className="mt-4 font-bold text-white">No reports yet</h2><Button asChild className="mt-5 bg-gradient-to-r from-rose-500 to-violet-500"><Link href="/report/lost">Create your first report</Link></Button></div>}
          </TabsContent>
          <TabsContent value="claims" className="mt-6">
            {claims.isLoading ? <PageLoader label="Loading claim history" /> : claims.data?.length ? <div className="space-y-4">{claims.data.map(entry => <article key={entry.claim.id} className="rounded-[1.5rem] border border-white/8 bg-slate-950/70 p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-violet-300">Ownership claim #{entry.claim.id}</p><h2 className="mt-2 text-xl font-bold text-white">{entry.itemTitle}</h2><p className="mt-2 text-sm text-slate-400">Submitted {new Date(entry.claim.createdAt).toLocaleString()}</p></div><div className="text-right"><Badge className={entry.claim.status === "approved" ? "bg-emerald-400 text-slate-950" : entry.claim.status === "rejected" ? "bg-rose-500 text-white" : "bg-amber-400 text-slate-950"}>{entry.claim.status}</Badge><div className="mt-2"><StatusBadge status={entry.itemStatus} /></div></div></div>{entry.claim.reviewNote ? <div className="mt-4 rounded-2xl border border-white/7 bg-white/[0.025] p-4 text-sm text-slate-300"><span className="font-bold text-white">Staff note: </span>{entry.claim.reviewNote}</div> : null}<Button asChild size="sm" variant="outline" className="mt-5 border-white/10 bg-white/[0.03]"><Link href={`/items/${entry.claim.itemId}`}>Open item <ExternalLink className="ml-2 h-3.5 w-3.5" /></Link></Button></article>)}</div> : <div className="rounded-[2rem] border border-dashed border-white/10 py-16 text-center"><ShieldCheck className="mx-auto h-9 w-9 text-violet-300/50" /><h2 className="mt-4 font-bold text-white">No ownership claims</h2><p className="mt-2 text-sm text-slate-400">Claims you submit on found items will appear here.</p></div>}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
