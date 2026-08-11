// Verify a LOCKED draw is byte-identical for every visitor, and that the
// preview (unseeded) genuinely varies.
import { readFileSync } from "node:fs";
import ts from "typescript";

const load = async (p) => {
  const src = readFileSync(p, "utf8").replace(/import type .*?;\n/gs, "")
    .replace(/import \{ *Rand *\}.*?;\n/gs, "").replace(/^import .*?from "@\/lib\/teams";$/gm, "");
  const js = ts.transpileModule(src, {compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  return import("data:text/javascript;base64," + Buffer.from(js).toString("base64"));
};
const T = await load("src/lib/teams.ts");
const N = await load("src/lib/teamNames.ts");

const mk = (n, g, partner=null) => ({ id:n, player_id:n, name:n, gender:g, partner_name:partner, created_at:"", week_id:"w" });
const roster = [
  mk("Brandon Reilly","guy"), mk("Emily Rhoten","girl"), mk("Mike Wildin","guy"),
  mk("Nicole Comito","girl"), mk("Austin Cook","guy"), mk("Bridgett Wetrich","girl","Gavin Wetrich"),
  mk("Gavin Wetrich","guy","Bridgett Wetrich"), mk("Mason Hasty","guy"), mk("Rory Russell","guy"),
  mk("Sean Renslow","guy"), mk("Mathison Twigg","girl"), mk("Patrick Sanders","guy"),
  mk("Nicklaus Caliger","guy"), mk("Kim Vance","girl"),
];

function lockSeed(weekId, signups) {
  const ids = signups.map(s=>s.player_id).sort().join("|");
  return T.hashSeed(`${weekId}::${ids}`);
}
const canonical = (s) => [...s].sort((a,b)=>a.player_id.localeCompare(b.player_id));
const rosterAtCutoff = (s, cutoff) => {
  const frozen = s.filter(x => new Date(x.created_at).getTime() < cutoff.getTime());
  return canonical(frozen.length >= 2 ? frozen : s);
};
function buildDraw(signups, rand) {
  const teams = T.generateTeams(signups, rand);
  if (!teams) return null;
  const [a,b] = N.pickTeamNames(rand);
  teams[0].name = a; teams[1].name = b;
  return { teams, homeIndex: rand() < 0.5 ? 0 : 1 };
}
const fingerprint = (d) => JSON.stringify({
  home: d.homeIndex,
  t: d.teams.map(t => ({
    name: t.name, cap: t.captain.name,
    players: t.players.map(p=>p.name),
    bat: t.battingOrder.map(p=>p.name),
  })),
});

let fails = 0;
// --- 1. locked draw identical across "visitors" ---------------------------
const week = "2026-W31-abc123";
const prints = new Set();
for (let visitor = 0; visitor < 50; visitor++) {
  // simulate different arrival order — the seed must not care
  const shuffled = canonical([...roster].sort(() => Math.random() - 0.5));
  prints.add(fingerprint(buildDraw(shuffled, T.seededRand(lockSeed(week, shuffled)))));
}
console.log(prints.size === 1 ? "  PASS  50 visitors, 1 identical locked draw"
                              : `  FAIL  50 visitors produced ${prints.size} different draws`);
if (prints.size !== 1) fails++;

// --- 2. different week -> different draw ----------------------------------
const other = fingerprint(buildDraw(canonical(roster), T.seededRand(lockSeed("2026-W32-zzz", roster))));
console.log(other !== [...prints][0] ? "  PASS  different week gives a different draw"
                                     : "  FAIL  week id does not affect the draw");
if (other === [...prints][0]) fails++;

// --- 3. roster change -> different draw -----------------------------------
const plusOne = [...roster, mk("New Player","guy")];
const p3 = fingerprint(buildDraw(canonical(plusOne), T.seededRand(lockSeed(week, plusOne))));
console.log(p3 !== [...prints][0] ? "  PASS  a new check-in changes the locked draw"
                                  : "  FAIL  roster does not affect the draw");
if (p3 === [...prints][0]) fails++;

// --- 4. unseeded preview genuinely varies ---------------------------------
const live = new Set();
for (let i=0;i<60;i++) live.add(fingerprint(buildDraw(roster, Math.random)));
console.log(live.size > 40 ? `  PASS  preview varies (${live.size}/60 distinct)`
                           : `  FAIL  preview too repetitive (${live.size}/60)`);
if (live.size <= 40) fails++;

// --- 5. couples still together in locked draws ----------------------------
let coupleOk = true;
for (let i=0;i<200;i++){
  const d = buildDraw(canonical(roster), T.seededRand(lockSeed("w"+i, roster)));
  const a = d.teams[0].players.map(p=>p.name);
  if (a.includes("Bridgett Wetrich") !== a.includes("Gavin Wetrich")) { coupleOk = false; break; }
}
console.log(coupleOk ? "  PASS  couples stay together in locked draws"
                     : "  FAIL  couple split in a locked draw");
if (!coupleOk) fails++;

// --- 6. home/away always assigned exactly once ----------------------------
let haOk = true;
for (let i=0;i<200;i++){ const d = buildDraw(roster, Math.random); if (d.homeIndex!==0 && d.homeIndex!==1) haOk=false; }
console.log(haOk ? "  PASS  home/away always assigned" : "  FAIL  bad home index");
if (!haOk) fails++;

// --- 7. team names distinct ------------------------------------------------
let nameOk = true;
for (let i=0;i<500;i++){ const [a,b] = N.pickTeamNames(Math.random); if (a===b) { nameOk=false; break; } }
console.log(nameOk ? `  PASS  team names always distinct (${N.TEAM_NAME_COMBINATIONS} combos)`
                   : "  FAIL  duplicate team names generated");
if (!nameOk) fails++;

// --- 8. a straggler after the cutoff must NOT change the locked draw ------
{
  const CUT = new Date("2026-07-28T23:00:00Z"); // Tue 18:00 CDT
  const onTime = roster.map((p,i) => ({...p, created_at: new Date(CUT.getTime() - (i+1)*3600e3).toISOString()}));
  const before = fingerprint(buildDraw(
    rosterAtCutoff(onTime, CUT),
    T.seededRand(lockSeed(week, rosterAtCutoff(onTime, CUT)))));

  // three people wander in at 21:00, 22:30 and midnight local
  const late = [...onTime,
    {...mk("Late One","guy"),   created_at: new Date(CUT.getTime()+3*3600e3).toISOString()},
    {...mk("Late Two","girl"),  created_at: new Date(CUT.getTime()+4.5*3600e3).toISOString()},
    {...mk("Late Three","guy"), created_at: new Date(CUT.getTime()+6*3600e3).toISOString()}];
  const after = fingerprint(buildDraw(
    rosterAtCutoff(late, CUT),
    T.seededRand(lockSeed(week, rosterAtCutoff(late, CUT)))));

  console.log(before === after ? "  PASS  late check-ins do not disturb the locked draw"
                               : "  FAIL  a straggler re-rolled the locked teams");
  if (before !== after) fails++;

  // and the frozen roster really is only the on-time players
  const names = rosterAtCutoff(late, CUT).map(p=>p.name);
  const leaked = names.filter(n => n.startsWith("Late"));
  console.log(leaked.length === 0 ? "  PASS  locked roster excludes late arrivals"
                                  : `  FAIL  late arrivals leaked in: ${leaked}`);
  if (leaked.length) fails++;
}

console.log(fails ? `\n${fails} FAILURES` : "\nALL LOCK/PREVIEW CHECKS PASSED");
process.exit(fails?1:0);
