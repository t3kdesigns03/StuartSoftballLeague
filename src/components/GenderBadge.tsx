import type { Gender } from "@/lib/types";
import { GENDER_LABELS } from "@/lib/types";

const STYLES: Record<Gender, string> = {
  guy: "bg-neon-cyan/10 text-neon-cyan ring-neon-cyan/40 shadow-[0_0_14px_-4px_rgba(0,240,255,0.9)]",
  girl: "bg-neon-magenta/10 text-neon-magenta ring-neon-magenta/40 shadow-[0_0_14px_-4px_rgba(255,0,170,0.9)]",
};

export function GenderBadge({ gender }: { gender: Gender }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[0.68rem] font-bold tracking-[0.12em] uppercase ring-1 ring-inset ${STYLES[gender]}`}
    >
      {GENDER_LABELS[gender]}
    </span>
  );
}
