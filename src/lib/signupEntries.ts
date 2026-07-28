import { buildUnits } from "@/lib/teams";
import type { Signup } from "@/lib/types";

/**
 * A row in the public signup list.
 *
 *  - `solo`    — one player, no partner request
 *  - `pair`    — two players who named each other; they will be on the same team
 *  - `pending` — one player who named a partner who has not checked in yet
 *                (or named someone who did not name them back)
 */
export type SignupEntry =
  | { kind: "solo"; player: Signup }
  | { kind: "pair"; player: Signup; partner: Signup }
  | { kind: "pending"; player: Signup; waitingFor: string };

const key = (name: string) => name.trim().toLowerCase();

/** A row is only renderable if it has an actual name to show. */
export function hasRealName(signup: Signup): boolean {
  return typeof signup.name === "string" && signup.name.trim().length > 0;
}

/**
 * Turn the raw week's check-ins into the rows the list should render.
 *
 * Two things this guarantees:
 *
 * 1. **No empty rows.** Anything without a real name is dropped here rather
 *    than rendered as a blank numbered slot. The list numbers off the returned
 *    entries, so positions can never skip.
 * 2. **Partners are nested, not duplicated.** A confirmed couple becomes one
 *    `pair` entry instead of two unrelated rows, and a one-sided request shows
 *    as a `pending` child under the person who asked — rather than implying the
 *    partner is already playing.
 *
 * Pairing itself is still decided by `buildUnits`, the same function team
 * generation uses, so what the list shows and what the draw does cannot drift.
 */
export function buildSignupEntries(signups: readonly Signup[]): SignupEntry[] {
  const real = signups.filter(hasRealName);

  const pairedWith = new Map<string, Signup>();
  for (const unit of buildUnits(real)) {
    if (unit.players.length !== 2) continue;
    const [a, b] = unit.players;
    pairedWith.set(a.id, b);
    pairedWith.set(b.id, a);
  }

  const checkedIn = new Set(real.map((s) => key(s.name)));
  const consumed = new Set<string>();
  const entries: SignupEntry[] = [];

  for (const player of real) {
    if (consumed.has(player.id)) continue;

    const partner = pairedWith.get(player.id);
    if (partner) {
      consumed.add(player.id);
      consumed.add(partner.id);
      entries.push({ kind: "pair", player, partner });
      continue;
    }

    const requested = player.partner_name?.trim();
    if (requested && !checkedIn.has(key(requested))) {
      // Named someone who has not checked in yet.
      consumed.add(player.id);
      entries.push({ kind: "pending", player, waitingFor: requested });
      continue;
    }
    if (requested && checkedIn.has(key(requested))) {
      // Named someone who is here but did not name them back. Still one-sided,
      // so the draw treats them as a single — say so rather than implying a
      // confirmed pair.
      consumed.add(player.id);
      entries.push({ kind: "pending", player, waitingFor: requested });
      continue;
    }

    consumed.add(player.id);
    entries.push({ kind: "solo", player });
  }

  return entries;
}

/** How many actual players the entries represent (a pair counts as two). */
export function countPlayers(entries: readonly SignupEntry[]): number {
  return entries.reduce((n, e) => n + (e.kind === "pair" ? 2 : 1), 0);
}
