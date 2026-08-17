import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { trpc } from "@/lib/trpc";
import {
  Bell,
  ChevronDown,
  CircleUserRound,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  PlusCircle,
  Search,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";

const primaryLinks = [
  { href: "/", label: "Home" },
  { href: "/browse", label: "Browse items" },
];

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="DIU Lost and Found home">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 via-sky-500 to-blue-700 text-slate-950 shadow-[0_0_26px_rgba(34,211,238,0.35)]">
        <ShieldCheck className="h-5 w-5" />
      </span>
      <span className="leading-none">
        <span className="block text-sm font-black tracking-[0.16em] text-white">DIU FOUNDHUB</span>
        <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300/80">Lost & Found</span>
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const unread = trpc.notifications.unreadCount.useQuery(undefined, { enabled: isAuthenticated });

  const navLinks = (
    <>
      {primaryLinks.map(link => (
        <Link
          key={link.href}
          href={link.href}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            location === link.href ? "bg-cyan-300/10 text-cyan-200" : "text-slate-300 hover:bg-white/5 hover:text-white"
          }`}
        >
          {link.label}
        </Link>
      ))}
    </>
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-white/8 bg-slate-950/75 backdrop-blur-xl">
        <div className="container flex h-18 items-center justify-between gap-4">
          <Brand />
          <nav className="hidden items-center gap-1 lg:flex">{navLinks}</nav>
          <div className="hidden items-center gap-2 lg:flex">
            <Button asChild variant="outline" className="border-rose-400/25 bg-rose-400/5 text-rose-100 hover:bg-rose-400/10">
              <Link href="/report/lost"><PlusCircle className="mr-2 h-4 w-4" />Report lost</Link>
            </Button>
            <Button asChild className="bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.22)] hover:from-emerald-300 hover:to-cyan-300">
              <Link href="/report/found"><Search className="mr-2 h-4 w-4" />Report found</Link>
            </Button>
            {isAuthenticated ? (
              <>
                <Button asChild size="icon" variant="ghost" className="relative text-slate-200 hover:bg-cyan-300/10 hover:text-cyan-100">
                  <Link href="/notifications" aria-label="Notifications">
                    <Bell className="h-5 w-5" />
                    {(unread.data ?? 0) > 0 ? (
                      <span className="absolute right-1 top-1 min-w-4 rounded-full bg-fuchsia-500 px-1 text-center text-[10px] font-bold leading-4 text-white">
                        {Math.min(unread.data ?? 0, 99)}
                      </span>
                    ) : null}
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2 text-slate-200 hover:bg-white/5 hover:text-white">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 text-sm font-black text-white">
                        {(user?.name || "D").charAt(0).toUpperCase()}
                      </span>
                      <span className="max-w-28 truncate">{user?.name || "DIU member"}</span>
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 border-white/10 bg-slate-950 text-slate-100">
                    <DropdownMenuLabel>{user?.email || "Authenticated account"}</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem asChild><Link href="/profile"><CircleUserRound className="mr-2 h-4 w-4" />My profile</Link></DropdownMenuItem>
                    {user?.role === "admin" ? (
                      <DropdownMenuItem asChild><Link href="/admin"><LayoutDashboard className="mr-2 h-4 w-4" />Staff dashboard</Link></DropdownMenuItem>
                    ) : null}
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem onClick={() => void logout()} className="text-rose-300 focus:bg-rose-400/10 focus:text-rose-200">
                      <LogOut className="mr-2 h-4 w-4" />Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" className="text-white hover:bg-white/5"><Link href="/login"><LogIn className="mr-2 h-4 w-4" />Login</Link></Button>
                <Button asChild className="bg-gradient-to-r from-violet-500 to-cyan-400 font-bold text-white shadow-[0_0_24px_rgba(34,211,238,.18)]"><Link href="/register"><UserPlus className="mr-2 h-4 w-4" />Register</Link></Button>
              </>
            )}
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="ghost" className="lg:hidden" aria-label="Open navigation"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="right" className="border-white/10 bg-slate-950 text-slate-100">
              <SheetTitle className="sr-only">Lost and Found website navigation</SheetTitle>
              <SheetDescription className="sr-only">Navigate the Lost and Found website, authentication pages, reports, profile, and notifications.</SheetDescription>
              <div className="mt-6"><Brand /></div>
              <nav className="mt-10 flex flex-col gap-2">{navLinks}</nav>
              <div className="mt-6 grid gap-3">
                <Button asChild variant="outline" className="border-rose-400/25 bg-rose-400/5 text-rose-100"><Link href="/report/lost">Report lost item</Link></Button>
                <Button asChild className="bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950"><Link href="/report/found">Report found item</Link></Button>
                {isAuthenticated ? (
                  <>
                    <Button asChild variant="ghost" className="justify-start"><Link href="/notifications"><Bell className="mr-2 h-4 w-4" />Notifications ({unread.data ?? 0})</Link></Button>
                    <Button asChild variant="ghost" className="justify-start"><Link href="/profile"><CircleUserRound className="mr-2 h-4 w-4" />My profile</Link></Button>
                    {user?.role === "admin" ? <Button asChild variant="ghost" className="justify-start"><Link href="/admin"><LayoutDashboard className="mr-2 h-4 w-4" />Staff dashboard</Link></Button> : null}
                    <Button onClick={() => void logout()} variant="ghost" className="justify-start text-rose-300"><LogOut className="mr-2 h-4 w-4" />Sign out</Button>
                  </>
                ) : <><Button asChild variant="outline" className="border-white/10 bg-white/[0.03]"><Link href="/login"><LogIn className="mr-2 h-4 w-4" />Login</Link></Button><Button asChild className="bg-gradient-to-r from-violet-500 to-cyan-400 font-bold text-white"><Link href="/register"><UserPlus className="mr-2 h-4 w-4" />Register</Link></Button></>}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-white/8 bg-slate-950/80">
        <div className="container grid gap-8 py-10 md:grid-cols-[1.3fr_1fr_1fr]">
          <div><Brand /><p className="mt-4 max-w-md text-sm leading-6 text-slate-400">A secure academic project helping Daffodil International University students and staff reunite with their belongings.</p></div>
          <div><p className="text-sm font-bold text-white">Quick access</p><div className="mt-3 grid gap-2 text-sm text-slate-400"><Link href="/browse">Browse listings</Link><Link href="/report/lost">Report lost item</Link><Link href="/report/found">Report found item</Link>{!isAuthenticated ? <><Link href="/login">Login</Link><Link href="/register">Register</Link></> : null}</div></div>
          <div><p className="text-sm font-bold text-white">Safety first</p><p className="mt-3 text-sm leading-6 text-slate-400">Never share sensitive proof publicly. Ownership details are restricted to the claimant and authorized DIU staff.</p></div>
        </div>
        <div className="border-t border-white/5 py-4 text-center text-xs text-slate-500">Lost and Found · Student project by Toufiquzzaman</div>
      </footer>
    </div>
  );
}
