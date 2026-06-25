import { cn } from "@/lib/utils";

const base =
  "rounded-xl border px-3 py-2 font-medium text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40";
const active = "border-transparent bg-primary text-primary-foreground";
const idle = "border-border bg-card hover:bg-muted";

/** Shared selectable-chip classes for the booking flow's pickers. */
export function chipClass(isActive: boolean, className?: string) {
  return cn(base, isActive ? active : idle, className);
}
