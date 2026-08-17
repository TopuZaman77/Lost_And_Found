import { useAuth } from "@/_core/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { PageLoader } from "@/components/PageLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getLoginPath, isSafeInternalPath } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, LockKeyhole, Mail, ShieldCheck, Sparkles, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";

export type AuthMode = "login" | "register";

function nextPathFromUrl() {
  const value = new URLSearchParams(window.location.search).get("next") ?? "/";
  return isSafeInternalPath(value) ? value : "/";
}

export default function AuthPage({ mode }: { mode: AuthMode }) {
  const { user, loading, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", studentId: "", email: "", password: "", confirmPassword: "" });
  const register = trpc.localAuth.register.useMutation();
  const login = trpc.localAuth.login.useMutation();
  const nextPath = useMemo(() => nextPathFromUrl(), []);
  const isRegister = mode === "register";
  const pending = register.isPending || login.isPending;

  const update = (field: keyof typeof form, value: string) => setForm(current => ({ ...current, [field]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isRegister && form.password !== form.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    try {
      const result = isRegister
        ? await register.mutateAsync({ name: form.name, studentId: form.studentId, email: form.email, password: form.password })
        : await login.mutateAsync({ email: form.email, password: form.password });
      await utils.auth.me.invalidate();
      toast.success(isRegister ? "Account created securely." : "Welcome back.");
      navigate(result.requiresProfile ? "/profile" : nextPath, { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to continue. Please try again.");
    }
  };

  const title = isRegister ? "Create your FoundHub account." : "Welcome back to DIU FoundHub.";
  const description = isRegister
    ? "Register with your name, student ID, Gmail address, and a strong password. You can complete your department and contact profile next."
    : "Use the Gmail address and password you registered with to access reports, ownership claims, and recovery alerts.";

  if (loading) return <AppShell><PageLoader label="Checking your secure session" /></AppShell>;
  return <AppShell><section className="relative isolate overflow-hidden border-b border-white/5 bg-[#03080e] py-14 sm:py-20"><div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_12%,rgba(34,211,238,.16),transparent_28rem),radial-gradient(circle_at_86%_20%,rgba(139,92,246,.14),transparent_30rem),linear-gradient(135deg,#06151f_0%,#040711_54%,#08051a_100%)]" /><div className="absolute inset-0 -z-10 opacity-25 [background-image:linear-gradient(rgba(34,211,238,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,.08)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:linear-gradient(to_bottom,black,transparent_86%)]" /><div className="container grid items-stretch gap-7 lg:grid-cols-[1.02fr_.98fr]"><div className="rounded-[2rem] border border-white/8 bg-slate-950/70 p-7 shadow-[0_30px_90px_rgba(0,0,0,.35)] backdrop-blur-xl sm:p-10"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/25 to-cyan-400/20 text-cyan-200 shadow-[0_0_35px_rgba(34,211,238,.12)]">{isRegister ? <UserPlus className="h-7 w-7" /> : <KeyRound className="h-7 w-7" />}</div>{isAuthenticated ? <div className="mt-7"><p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-300">Session active</p><h1 className="mt-4 text-4xl font-black tracking-tight text-white">You are already signed in.</h1><p className="mt-4 leading-7 text-slate-400">Continue as {user?.name || "a DIU FoundHub member"} or open your identity profile.</p><div className="mt-8 flex flex-wrap gap-3"><Button asChild size="lg" className="rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-7 font-bold text-white"><Link href="/profile">Open my profile <ArrowRight className="ml-2 h-4 w-4" /></Link></Button><Button asChild size="lg" variant="outline" className="rounded-full border-white/10 bg-white/[0.03]"><Link href="/">Return home</Link></Button></div></div> : <form onSubmit={submit} className="mt-7"><p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300">{isRegister ? "Manual registration" : "Manual sign in"}</p><h1 className="mt-4 max-w-2xl text-4xl font-black tracking-tight text-white sm:text-5xl">{title}</h1><p className="mt-5 max-w-xl text-base leading-7 text-slate-400">{description}</p><div className="mt-8 grid gap-5">{isRegister ? <><div><Label htmlFor="auth-name">Full name</Label><Input id="auth-name" autoComplete="name" required minLength={2} value={form.name} onChange={event => update("name", event.target.value)} placeholder="Your full name" className="mt-2 border-white/10 bg-white/[0.03]" /></div><div><Label htmlFor="auth-student-id">Student ID</Label><Input id="auth-student-id" autoComplete="username" required minLength={3} maxLength={32} value={form.studentId} onChange={event => update("studentId", event.target.value)} placeholder="e.g. 221-15-1234" className="mt-2 border-white/10 bg-white/[0.03]" /></div></> : null}<div><Label htmlFor="auth-email">Gmail address</Label><div className="relative mt-2"><Mail className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-cyan-300/70" /><Input id="auth-email" type="email" autoComplete="email" required value={form.email} onChange={event => update("email", event.target.value)} placeholder="yourname@gmail.com" className="border-white/10 bg-white/[0.03] pl-10" /></div></div><div><Label htmlFor="auth-password">Password</Label><div className="relative mt-2"><Input id="auth-password" type={showPassword ? "text" : "password"} autoComplete={isRegister ? "new-password" : "current-password"} required minLength={isRegister ? 8 : 1} maxLength={72} value={form.password} onChange={event => update("password", event.target.value)} placeholder={isRegister ? "At least 8 characters, with letters and numbers" : "Enter your password"} className="border-white/10 bg-white/[0.03] pr-11" /><button type="button" onClick={() => setShowPassword(value => !value)} className="absolute right-3 top-3 text-slate-400 hover:text-cyan-200" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>{isRegister ? <div><Label htmlFor="auth-confirm-password">Confirm password</Label><Input id="auth-confirm-password" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={8} maxLength={72} value={form.confirmPassword} onChange={event => update("confirmPassword", event.target.value)} placeholder="Re-enter your password" className="mt-2 border-white/10 bg-white/[0.03]" /></div> : null}</div><Button type="submit" disabled={pending} size="lg" className="mt-8 h-13 w-full rounded-full bg-gradient-to-r from-violet-500 via-sky-500 to-cyan-400 font-black text-white shadow-[0_0_35px_rgba(34,211,238,.2)] sm:w-auto sm:px-8">{pending ? "Please wait…" : isRegister ? "Create account" : "Sign in"}<ArrowRight className="ml-2 h-4 w-4" /></Button><div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-slate-500"><span>{isRegister ? "Already registered?" : "New to DIU FoundHub?"}</span><Link href={isRegister ? getLoginPath(nextPath) : "/register"} className="font-bold text-cyan-200 hover:text-cyan-100">{isRegister ? "Sign in instead" : "Create an account"}</Link></div><p className="mt-7 flex items-start gap-2 text-xs leading-5 text-slate-600"><LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300/70" />Your password is protected with a one-way hash and is never displayed or stored as plain text.</p></form>}</div><aside className="relative overflow-hidden rounded-[2rem] border border-cyan-300/10 bg-[linear-gradient(145deg,rgba(8,30,43,.88),rgba(8,8,24,.94))] p-7 sm:p-10"><div className="absolute -right-20 -top-20 h-72 w-72 rounded-full border border-cyan-300/10 shadow-[0_0_100px_rgba(34,211,238,.12)]" /><div className="absolute right-10 top-10 h-36 w-36 rounded-full border border-violet-300/10" /><div className="relative"><p className="text-sm font-black uppercase tracking-[0.22em] text-violet-300">Verified campus access</p><h2 className="mt-4 text-3xl font-black tracking-tight text-white">One identity. Every recovery step.</h2><p className="mt-4 leading-7 text-slate-400">Your account connects reports, private claim evidence, staff decisions, and return history without exposing ownership proof publicly.</p><div className="mt-8 grid gap-3">{[[ShieldCheck, "Password-protected account", "Your credentials create a secure website session."],[UserPlus, "DIU identity onboarding", "Complete department and contact details after registration."],[CheckCircle2, "Staff-verifiable returns", "Authorized staff review private proof before approving a handover."],[Sparkles, "Automatic recovery alerts", "Receive match, claim, and decision notifications in the website."]].map(([Icon, itemTitle, itemDescription]) => <div key={String(itemTitle)} className="flex gap-4 rounded-2xl border border-white/7 bg-white/[0.035] p-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-200"><Icon className="h-5 w-5" /></span><div><p className="font-bold text-white">{String(itemTitle)}</p><p className="mt-1 text-sm leading-6 text-slate-500">{String(itemDescription)}</p></div></div>)}</div></div></aside></div></section></AppShell>;
}
