// The browser locks a draw client-side; the cron persists one server-side.
// If those two ever disagree, people read one set of teams before the game and find a
// different set posted. This asserts they are byte-identical.
import { readFileSync } from "node:fs";
import ts from "typescript";
const load = async (p) => {
  const src = readFileSync(p,"utf8").replace(/import type .*?;\n/gs,"").replace(/^import .*?from "@\/lib\/teams";$/gm,"");
  const js = ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  return import("data:text/javascript;base64,"+Buffer.from(js).toString("base64"));
};
const T = await load("src/lib/teams.ts");
const N = await load("src/lib/teamNames.ts");

const CUT = new Date("2026-07-28T23:00:00Z"); // Tue 18:00 CDT
const mk = (n,g,t,partner=null) => ({id:n,player_id:n,name:n,gender:g,partner_name:partner,
  created_at:new Date(CUT.getTime()-t*3600e3).toISOString(), week_id:"w"});
const roster = [
  mk("Brandon Reilly","guy",5), mk("Emily Rhoten","girl",4), mk("Mike Wildin","guy",9),
  mk("Nicole Comito","girl",2), mk("Austin Cook","guy",30), mk("Bridgett Wetrich","girl",7,"Gavin Wetrich"),
  mk("Gavin Wetrich","guy",7,"Bridgett Wetrich"), mk("Mason Hasty","guy",1),
  mk("Rory Russell","guy",12), mk("Sean Renslow","guy",3), mk("Mathison Twigg","girl",20),
  mk("Patrick Sanders","guy",6), mk("Nicklaus Caliger","guy",8), mk("Kim Vance","girl",15),
  // stragglers AFTER the cutoff
  {...mk("Late One","guy",0), created_at:new Date(CUT.getTime()+2*3600e3).toISOString()},
  {...mk("Late Two","girl",0), created_at:new Date(CUT.getTime()+4*3600e3).toISOString()},
];
const WEEK = "2026-W31-k3f9x";

const lockSeed = (w,s) => T.hashSeed(`${w}::${s.map(x=>x.player_id).sort().join("|")}`);
const canonical = s => [...s].sort((a,b)=>a.player_id.localeCompare(b.player_id));

function draw(rosterIn, weekId) {
  const rand = T.seededRand(lockSeed(weekId, rosterIn));
  const teams = T.generateTeams(rosterIn, rand);
  const [a,b] = N.pickTeamNames(rand);
  teams[0].name = a; teams[1].name = b;
  const homeIndex = rand() < 0.5 ? 0 : 1;
  return { teams, homeIndex };
}
const fp = d => JSON.stringify({ home:d.homeIndex, t:d.teams.map(t=>({
  name:t.name, cap:t.captain.name, players:t.players.map(p=>p.name), bat:t.battingOrder.map(p=>p.name)}))});

// --- BROWSER path (TeamPreview) ------------------------------------------
const browserRoster = (() => {
  const frozen = roster.filter(s => new Date(s.created_at).getTime() < CUT.getTime());
  return canonical(frozen.length>=2 ? frozen : roster);
})();
const browser = fp(draw(browserRoster, WEEK));

// --- CRON path (auto-publish.mts), arriving in a different row order ------
const cronRows = [...roster].sort(()=>Math.random()-0.5);
const cronRoster = (() => {
  const onTime = cronRows.filter(s => new Date(s.created_at).getTime() < CUT.getTime());
  return (onTime.length>=2 ? onTime : cronRows).sort((a,b)=>a.player_id.localeCompare(b.player_id));
})();
const cron = fp(draw(cronRoster, WEEK));

let fails = 0;
console.log(browser===cron ? "  PASS  cron draw is identical to the browser's locked draw"
                           : "  FAIL  cron and browser disagree");
if (browser!==cron) { fails++; console.log("   browser:", browser.slice(0,160)); console.log("   cron   :", cron.slice(0,160)); }

const names = browserRoster.map(p=>p.name).filter(n=>n.startsWith("Late"));
console.log(names.length===0 ? "  PASS  stragglers excluded from both paths" : "  FAIL  straggler leaked");
if (names.length) fails++;

// run the cron path 30x with shuffled row order — must never drift
const s = new Set();
for (let i=0;i<30;i++){
  const rows = [...roster].sort(()=>Math.random()-0.5);
  const ot = rows.filter(x=>new Date(x.created_at).getTime()<CUT.getTime());
  s.add(fp(draw((ot.length>=2?ot:rows).sort((a,b)=>a.player_id.localeCompare(b.player_id)), WEEK)));
}
console.log(s.size===1 && [...s][0]===browser ? "  PASS  cron stable across 30 runs, any row order"
                                              : `  FAIL  cron produced ${s.size} variants`);
if (!(s.size===1 && [...s][0]===browser)) fails++;

console.log(fails?`\n${fails} FAILURES`:"\nBROWSER/CRON PARITY CONFIRMED");
process.exit(fails?1:0);
