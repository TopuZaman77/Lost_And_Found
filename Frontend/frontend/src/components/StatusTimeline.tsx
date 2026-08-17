import { Check, Circle } from "lucide-react";
import { STATUS_STEPS, type ItemStatus } from "@shared/lostFound";
import { cn } from "@/lib/utils";

export function StatusTimeline({ status }: { status: ItemStatus }) {
  const activeIndex = STATUS_STEPS.findIndex(step => step.status === status);
  return (
    <div className="grid gap-3 md:grid-cols-4" aria-label={`Item status: ${status}`}>
      {STATUS_STEPS.map((step, index) => {
        const complete = index <= activeIndex;
        const current = index === activeIndex;
        return (
          <div key={step.status} className="relative flex gap-3 md:block">
            {index < STATUS_STEPS.length - 1 ? (
              <div
                className={cn(
                  "absolute left-4 top-8 h-[calc(100%+0.75rem)] w-px md:left-[calc(50%+1rem)] md:top-4 md:h-px md:w-[calc(100%-2rem)]",
                  index < activeIndex ? "bg-cyan-400" : "bg-white/10",
                )}
              />
            ) : null}
            <div
              className={cn(
                "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border md:mx-auto",
                complete
                  ? "border-cyan-300 bg-cyan-400 text-slate-950 shadow-[0_0_22px_rgba(34,211,238,0.45)]"
                  : "border-white/15 bg-white/5 text-white/35",
              )}
            >
              {complete && !current ? <Check className="h-4 w-4" /> : <Circle className="h-3 w-3 fill-current" />}
            </div>
            <div className="pb-1 md:mt-3 md:text-center">
              <p className={cn("text-sm font-bold", complete ? "text-white" : "text-white/40")}>{step.label}</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">{step.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
