import { LoaderCircle } from "lucide-react";

export function PageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-[280px] items-center justify-center">
      <div className="flex items-center gap-3 rounded-full border border-cyan-300/15 bg-cyan-400/5 px-5 py-3 text-sm text-cyan-100">
        <LoaderCircle className="h-4 w-4 animate-spin" />
        {label}
      </div>
    </div>
  );
}
