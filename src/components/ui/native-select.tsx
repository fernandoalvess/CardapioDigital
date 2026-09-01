import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";

export function NativeSelect({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={`h-12 w-full appearance-none rounded-xl border border-zinc-200 bg-white px-4 pr-10 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-zinc-50 ${className}`}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
      />
    </div>
  );
}
