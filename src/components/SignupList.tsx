"use client";

import { GenderBadge } from "@/components/GenderBadge";
import { countByGender } from "@/lib/teams";
import type { Signup } from "@/lib/types";

type Props = {
  signups: Signup[];
  loading: boolean;
  error: string | null;
};

export function SignupList({ signups, loading, error }: Props) {
  const { guys, girls } = countByGender(signups);

  return (
    <section
      aria-labelledby="signups-heading"
      className="border-field-100 shadow-field-900/5 rounded-3xl border bg-white/85 p-5 shadow-lg backdrop-blur sm:p-7"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="signups-heading"
          className="text-field-900 text-xl font-bold sm:text-2xl"
        >
          This week&rsquo;s signups
        </h2>
        <span className="bg-field-100 text-field-800 rounded-full px-3 py-1 text-sm font-bold tabular-nums">
          {signups.length} {signups.length === 1 ? "player" : "players"}
        </span>
      </div>

      {signups.length > 0 && (
        <p className="text-field-700/70 mt-1 text-sm font-medium">
          {guys} {guys === 1 ? "guy" : "guys"} · {girls}{" "}
          {girls === 1 ? "girl" : "girls"}
        </p>
      )}

      <div className="mt-4">
        {error ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        ) : loading ? (
          <ul className="space-y-2" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <li
                key={i}
                className="bg-field-50 h-12 animate-pulse rounded-xl"
              />
            ))}
          </ul>
        ) : signups.length === 0 ? (
          <p className="border-field-200 text-field-700/70 rounded-xl border-2 border-dashed px-4 py-8 text-center text-sm font-medium">
            No one yet — be the first on the field!
          </p>
        ) : (
          <ol className="space-y-2">
            {signups.map((signup, index) => (
              <li
                key={signup.id}
                className="border-field-100 bg-field-50/40 animate-pop-in flex items-center gap-3 rounded-xl border px-3.5 py-2.5"
              >
                <span className="text-field-600/50 w-5 shrink-0 text-sm font-bold tabular-nums">
                  {index + 1}
                </span>
                <span className="text-field-900 min-w-0 flex-1 truncate font-semibold">
                  {signup.name}
                </span>
                <GenderBadge gender={signup.gender} />
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
