// Invariants for team generation, partner pairing and batting order.
import { readFileSync } from "node:fs";
import ts from "typescript";

const src = readFileSync(new URL("../src/lib/teams.ts", import.meta.url), "utf8")
  .replace(/import type .*?;\n/gs, "");
const js = ts.transpileModule(src, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { generateTeams, battingOrder, buildUnits, describeBalance } = await import(
  "data:text/javascript;base64," + Buffer.from(js).toString("base64")
);

const mk = (name, gender, partner = null) => ({
  id: name, player_id: name, name, gender, partner_name: partner,
  created_at: "", week_id: "w",
});

const fails = [];
const note = (m) => fails.push(m);

// ---------------------------------------------------------------- pairing ---
{
  // mutual pair stays together, every time
  for (let i = 0; i < 500; i++) {
    const roster = [
      mk("Ann", "girl", "Bob"), mk("Bob", "guy", "Ann"),
      mk("Cid", "guy"), mk("Dee", "girl"), mk("Eve", "girl"), mk("Fay", "girl"),
      mk("Gus", "guy"), mk("Hal", "guy"),
    ];
    const [a, b] = generateTeams(roster);
    const names = (t) => t.players.map((p) => p.name);
    const together = (names(a).includes("Ann") && names(a).includes("Bob"))
                  || (names(b).includes("Ann") && names(b).includes("Bob"));
    if (!together) { note("mutual pair split"); break; }
  }

  // one-sided request is ignored (Ann names Bob, Bob names nobody)
  const units = buildUnits([mk("Ann","girl","Bob"), mk("Bob","guy"), mk("Cid","guy")]);
  if (units.some((u) => u.players.length > 1)) note("one-sided request formed a pair");

  // mismatched request ignored (Ann->Bob, Bob->Cid)
  const u2 = buildUnits([mk("Ann","girl","Bob"), mk("Bob","guy","Cid"), mk("Cid","guy","Bob")]);
  const pairNames = u2.filter(u=>u.players.length>1).map(u=>u.players.map(p=>p.name).sort().join("+"));
  if (pairNames.length !== 1 || pairNames[0] !== "Bob+Cid") note("chain pairing wrong: "+JSON.stringify(pairNames));

  // partner named but absent this week -> dealt as single
  const u3 = buildUnits([mk("Ann","girl","Zed"), mk("Bob","guy")]);
  if (u3.some(u=>u.players.length>1)) note("paired with an absent partner");

  // self-partner ignored
  const u4 = buildUnits([mk("Ann","girl","ann"), mk("Bob","guy")]);
  if (u4.some(u=>u.players.length>1)) note("self-pair formed");

  // case/whitespace insensitive matching
  const u5 = buildUnits([mk("Ann","girl","  bob  "), mk("Bob","guy","ANN")]);
  if (!u5.some(u=>u.players.length===2)) note("case-insensitive pair not matched");
}

// --------------------------------------------------------------- integrity --
for (let trial = 0; trial < 8000; trial++) {
  const guys = Math.floor(Math.random() * 14);
  const girls = Math.floor(Math.random() * 14);
  if (guys + girls < 2) continue;
  const roster = [
    ...Array.from({ length: guys }, (_, i) => mk(`G${i}`, "guy")),
    ...Array.from({ length: girls }, (_, i) => mk(`L${i}`, "girl")),
  ];
  // randomly form some mutual couples
  const nPairs = Math.floor(Math.random() * Math.min(guys, girls, 4));
  for (let i = 0; i < nPairs; i++) {
    const g = roster.find(p=>p.name===`G${i}`), l = roster.find(p=>p.name===`L${i}`);
    if (g && l) { g.partner_name = l.name; l.partner_name = g.name; }
  }

  const res = generateTeams(roster);
  if (!res) { note(`null for ${guys}/${girls}`); continue; }
  const [a, b] = res;
  const all = [...a.players, ...b.players];

  if (new Set(all.map(p=>p.id)).size !== roster.length) note(`player lost/duped ${guys}/${girls}`);
  if (!a.players.length || !b.players.length) note(`empty team ${guys}/${girls}`);
  if (!a.players.some(p=>p.id===a.captain.id)) note("captain A off-team");
  if (!b.players.some(p=>p.id===b.captain.id)) note("captain B off-team");

  // couples together
  for (let i = 0; i < nPairs; i++) {
    const inA = a.players.some(p=>p.name===`G${i}`);
    const mateInA = a.players.some(p=>p.name===`L${i}`);
    if (inA !== mateInA) { note(`couple ${i} split (${guys}/${girls}, ${nPairs} pairs)`); break; }
  }

  // batting order must contain exactly the team, once each
  for (const t of [a, b]) {
    if (t.battingOrder.length !== t.players.length) note("batting order length");
    if (new Set(t.battingOrder.map(p=>p.id)).size !== t.players.length) note("batting order dupes");
  }

  // with no couples, the old balance guarantee must still hold exactly
  if (nPairs === 0) {
    const bal = describeBalance(res, roster);
    if (bal.sizeGap > 1) note(`size skew ${guys}/${girls}: ${a.players.length}v${b.players.length}`);
    if (bal.guyGap > 1)  note(`guy skew ${guys}/${girls}`);
    if (bal.girlGap > 1) note(`girl skew ${guys}/${girls}`);
  }
}

// --------------------------------------------------------- batting order ----
{
  const runs = (order) => {
    let worst = 1, cur = 1;
    for (let i = 1; i < order.length; i++) {
      cur = order[i].gender === order[i-1].gender ? cur + 1 : 1;
      worst = Math.max(worst, cur);
    }
    return worst;
  };
  for (const [g, l] of [[5,5],[6,4],[7,3],[8,2],[9,1],[10,0],[3,7],[1,9],[2,2],[1,1]]) {
    const roster = [
      ...Array.from({length:g},(_,i)=>mk(`G${i}`,"guy")),
      ...Array.from({length:l},(_,i)=>mk(`L${i}`,"girl")),
    ];
    const order = battingOrder(roster);
    if (order.length !== g + l) { note(`order length ${g}/${l}`); continue; }
    const maj = Math.max(g,l), min = Math.min(g,l);
    // best achievable longest run of the majority gender
    const best = min === 0 ? maj : Math.ceil(maj / (min + 1));
    const got = min === 0 ? runs(order) : Math.max(...[runs(order)]);
    if (got > best) note(`order ${g}g/${l}l: longest run ${got}, best possible ${best}`);
  }
  // equal counts must alternate perfectly
  const even = battingOrder([...Array.from({length:5},(_,i)=>mk(`G${i}`,"guy")),
                             ...Array.from({length:5},(_,i)=>mk(`L${i}`,"girl"))]);
  for (let i=1;i<even.length;i++) if (even[i].gender===even[i-1].gender) { note("5/5 did not alternate"); break; }
}

console.log(fails.length
  ? "FAIL:\n" + [...new Set(fails)].slice(0,12).join("\n")
  : "ALL CHECKS PASSED (pairing, integrity, balance, batting order)");
process.exit(fails.length ? 1 : 0);
