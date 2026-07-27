// Stress test for generateTeams: verifies balance invariants over random rosters.
import { readFileSync } from "node:fs";
import ts from "typescript";

const src = readFileSync(new URL("../src/lib/teams.ts", import.meta.url), "utf8")
  .replace(/import type .*?;\n/gs, "");
const js = ts.transpileModule(src, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { generateTeams } = await import(
  "data:text/javascript;base64," + Buffer.from(js).toString("base64")
);

const mk = (n, g, i) => ({ id: `${g}${i}`, name: n, gender: g, created_at: "", week_id: "w" });

let fails = [];
for (let trial = 0; trial < 20000; trial++) {
  const guys = Math.floor(Math.random() * 16);
  const girls = Math.floor(Math.random() * 16);
  if (guys + girls < 2) continue;
  const roster = [
    ...Array.from({ length: guys }, (_, i) => mk(`G${i}`, "guy", i)),
    ...Array.from({ length: girls }, (_, i) => mk(`L${i}`, "girl", i)),
  ];
  const res = generateTeams(roster);
  if (!res) { fails.push(`null for ${guys}/${girls}`); continue; }
  const [a, b] = res;
  const ids = new Set([...a.players, ...b.players].map(p => p.id));

  // every player placed exactly once
  if (ids.size !== roster.length || a.players.length + b.players.length !== roster.length)
    fails.push(`player loss/dupe ${guys}/${girls}`);
  // total size balanced within 1
  if (Math.abs(a.players.length - b.players.length) > 1)
    fails.push(`size skew ${guys}/${girls}: ${a.players.length}v${b.players.length}`);
  // gender balanced within 1
  const gA = a.players.filter(p => p.gender === "guy").length;
  const gB = b.players.filter(p => p.gender === "guy").length;
  const lA = a.players.filter(p => p.gender === "girl").length;
  const lB = b.players.filter(p => p.gender === "girl").length;
  if (Math.abs(gA - gB) > 1) fails.push(`guy skew ${guys}/${girls}: ${gA}v${gB}`);
  if (Math.abs(lA - lB) > 1) fails.push(`girl skew ${guys}/${girls}: ${lA}v${lB}`);
  // captains valid and on their own team
  if (!a.players.some(p => p.id === a.captain.id)) fails.push("captain A off-team");
  if (!b.players.some(p => p.id === b.captain.id)) fails.push("captain B off-team");
  // neither team empty
  if (!a.players.length || !b.players.length) fails.push(`empty team ${guys}/${girls}`);
}

// randomness check: captain should vary, and extra player shouldn't always land on A
const roster9 = Array.from({ length: 9 }, (_, i) => mk(`G${i}`, "guy", i));
const caps = new Set(), sizesA = new Set();
for (let i = 0; i < 500; i++) {
  const [a] = generateTeams(roster9);
  caps.add(a.captain.id); sizesA.add(a.players.length);
}
if (caps.size < 5) fails.push(`captain not random: only ${caps.size} distinct`);
if (sizesA.size < 2) fails.push(`extra player always same side: ${[...sizesA]}`);

// edge cases
for (const [g, l] of [[2,0],[0,2],[1,1],[1,0],[0,1],[0,0]]) {
  const roster = [
    ...Array.from({ length: g }, (_, i) => mk(`G${i}`, "guy", i)),
    ...Array.from({ length: l }, (_, i) => mk(`L${i}`, "girl", i)),
  ];
  const res = generateTeams(roster);
  const expectNull = g + l < 2;
  if (expectNull && res) fails.push(`expected null for ${g}/${l}`);
  if (!expectNull && (!res || !res[0].players.length || !res[1].players.length))
    fails.push(`bad split for ${g}/${l}`);
}

console.log(fails.length ? "FAIL:\n" + [...new Set(fails)].slice(0,10).join("\n") : "ALL CHECKS PASSED (20k random rosters + edge cases)");
