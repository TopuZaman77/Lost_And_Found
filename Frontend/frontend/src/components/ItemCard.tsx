import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ItemCategory, ItemStatus, ReportType } from "@shared/lostFound";
import { ArrowUpRight, CalendarDays, ImageIcon, MapPin } from "lucide-react";
import { Link } from "wouter";

export type ItemCardData = {
  id: number;
  reportType: ReportType;
  title: string;
  description: string;
  category: ItemCategory;
  eventDate: number;
  location: string;
  imageUrl: string | null;
  status: ItemStatus;
};

export function ItemCard({ item }: { item: ItemCardData }) {
  return (
    <article className="group overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/70 shadow-[0_24px_70px_rgba(0,0,0,0.28)] transition duration-200 hover:-translate-y-1 hover:border-cyan-300/25">
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-cyan-950 via-slate-950 to-blue-950">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="rounded-3xl border border-cyan-300/15 bg-cyan-300/5 p-6 text-cyan-300/55 shadow-[0_0_70px_rgba(14,165,233,0.15)]">
              <ImageIcon className="h-10 w-10" />
            </div>
          </div>
        )}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
          <Badge className={item.reportType === "lost" ? "bg-rose-500 text-white" : "bg-emerald-400 text-slate-950"}>
            {item.reportType === "lost" ? "Lost report" : "Found report"}
          </Badge>
          <StatusBadge status={item.status} className="backdrop-blur-md" />
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">{item.category}</p>
          <span className="text-xs text-slate-500">#{item.id.toString().padStart(4, "0")}</span>
        </div>
        <h3 className="mt-3 line-clamp-1 text-xl font-bold tracking-tight text-white">{item.title}</h3>
        <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-400">{item.description}</p>
        <div className="mt-5 space-y-2.5 text-sm text-slate-300">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-cyan-300" />
            <span className="truncate">{item.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-violet-300" />
            <span>{new Date(item.eventDate).toLocaleDateString()}</span>
          </div>
        </div>
        <Button asChild variant="outline" className="mt-5 w-full border-cyan-300/20 bg-cyan-300/5 text-cyan-50 hover:bg-cyan-300/10">
          <Link href={`/items/${item.id}`}>
            View details <ArrowUpRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
