import type { Gender } from "@/lib/types";
import { GENDER_LABELS } from "@/lib/types";

const STYLES: Record<Gender, string> = {
  guy: "bg-sky-100 text-sky-700 ring-sky-200",
  girl: "bg-pink-100 text-pink-700 ring-pink-200",
};

export function GenderBadge({ gender }: { gender: Gender }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STYLES[gender]}`}
    >
      {GENDER_LABELS[gender]}
    </span>
  );
}
