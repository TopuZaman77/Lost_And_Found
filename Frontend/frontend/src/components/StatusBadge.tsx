import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ItemStatus } from "@shared/lostFound";

const statusStyles: Record<ItemStatus, string> = {
  Lost: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  Claimed: "border-violet-400/30 bg-violet-400/10 text-violet-200",
  Verified: "border-cyan-400/30 bg-cyan-400/10 text-cyan-100",
  Returned: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
};

export function StatusBadge({ status, className }: { status: ItemStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn("rounded-full px-3 py-1 font-semibold", statusStyles[status], className)}>
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current shadow-[0_0_8px_currentColor]" />
      {status}
    </Badge>
  );
}
