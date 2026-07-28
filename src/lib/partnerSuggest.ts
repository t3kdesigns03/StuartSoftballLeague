import type { Signup } from "@/lib/types";

/**
 * Suggest — never assume — who someone's other half might be.
 *
 * Pairing stays mutual-consent only: nothing here links anybody. These are
 * one-tap shortcuts so people don't have to type a name, and they can always be
 * ignored. A shared surname is a *hint*, not a marriage certificate — siblings,
 * cousins, and a parent playing with their adult kid all share one.
 */

export type PartnerSuggestion = {
  /** The name to put in the partner field. */
  name: string;
  /**
   * `waiting`  — this person already named you. Strongest possible signal:
   *              accepting completes the pair immediately.
   * `surname`  — shares your last name and is checked in this week.
   */
  reason: "waiting" | "surname";
};

const norm = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

/** Common generational suffixes, ignored when comparing surnames. */
const SUFFIXES = new Set(["jr", "jr.", "sr", "sr.", "ii", "iii", "iv", "v"]);

/**
 * Last meaningful word of a name. Returns "" for single-word names, which
 * deliberately produces no surname suggestions.
 */
export function surnameOf(fullName: string): string {
  const parts = norm(fullName)
    .split(" ")
    .filter((p) => p.length > 0 && !SUFFIXES.has(p));
  return parts.length >= 2 ? parts[parts.length - 1] : "";
}

/**
 * Who might this person be checking in with?
 *
 * Ordered strongest first, capped at a handful so the form never turns into a
 * wall of chips.
 */
export function suggestPartners(
  myName: string,
  signups: readonly Signup[],
  limit = 3,
): PartnerSuggestion[] {
  const me = norm(myName);
  if (me.length < 2) return [];

  const mySurname = surnameOf(myName);
  const seen = new Set<string>();
  const waiting: PartnerSuggestion[] = [];
  const surname: PartnerSuggestion[] = [];

  for (const other of signups) {
    if (!other.name || !other.name.trim()) continue;
    const theirName = norm(other.name);
    if (theirName === me) continue; // that's you
    if (seen.has(theirName)) continue;

    // Strongest: they already named you, so accepting completes the pair.
    if (other.partner_name && norm(other.partner_name) === me) {
      seen.add(theirName);
      waiting.push({ name: other.name.trim(), reason: "waiting" });
      continue;
    }

    // Weaker: shares your surname and is playing this week.
    if (
      mySurname &&
      surnameOf(other.name) === mySurname &&
      // Don't suggest someone already spoken for by a third party.
      !(other.partner_name && norm(other.partner_name) !== me)
    ) {
      seen.add(theirName);
      surname.push({ name: other.name.trim(), reason: "surname" });
    }
  }

  return [...waiting, ...surname].slice(0, limit);
}
