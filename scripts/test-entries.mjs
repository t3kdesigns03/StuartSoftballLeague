// The public list must never render a nameless row, and partners must nest.
import { readFileSync } from "node:fs";
import ts from "typescript";
const load = async (p, strip=[]) => {
  let src = readFileSync(p,"utf8").replace(/import type .*?;\n/gs,"");
  for (const r of strip) src = src.replace(r, "");
  const js = ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  return import("data:text/javascript;base64,"+Buffer.from(js).toString("base64"));
};
const T = await load("src/lib/teams.ts");
// signupEntries imports buildUnits from "@/lib/teams" — inline it instead.
let src = readFileSync("src/lib/signupEntries.ts","utf8")
  .replace(/import type .*?;\n/gs,"")
  .replace(/^import \{ buildUnits \}.*$/m, "");
src = `const buildUnits = globalThis.__buildUnits;\n` + src;
globalThis.__buildUnits = T.buildUnits;
const js = ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const E = await import("data:text/javascript;base64,"+Buffer.from(js).toString("base64"));

const mk = (id,name,gender,partner=null) => ({id,player_id:id,name,gender,partner_name:partner,created_at:"2026-07-28T10:00:00Z",week_id:"w"});
let fails=0; const t=(ok,msg)=>{console.log(`  ${ok?"PASS":"FAIL"}  ${msg}`); if(!ok)fails++;};

// --- 1. every shape of "no real name" is dropped --------------------------
const junk = [
  mk("a","Real Player","guy"),
  mk("b","","guy"),
  mk("c","   ","girl"),
  mk("d",null,"guy"),
  mk("e",undefined,"girl"),
  mk("f","\t\n ","guy"),
  mk("g","Another Real","girl"),
];
const je = E.buildSignupEntries(junk);
t(je.length===2, `nameless rows dropped (${je.length} entries from ${junk.length} rows)`);
t(je.every(x=>x.player.name && x.player.name.trim()), "every rendered entry has a real name");
t(E.countPlayers(je)===2, "player count reflects only real players");

// --- 2. numbering cannot skip --------------------------------------------
let n=0; const nums=[];
for (const e of je) { nums.push(++n); if (e.kind==="pair") nums.push(++n); }
t(JSON.stringify(nums)===JSON.stringify([1,2]), `numbering is contiguous: ${nums}`);

// --- 3. mutual pair becomes ONE nested entry, not two rows ---------------
const couple = [
  mk("p1","Bridgett Wetrich","girl","Gavin Wetrich"),
  mk("p2","Gavin Wetrich","guy","Bridgett Wetrich"),
  mk("p3","Solo Sam","guy"),
];
const ce = E.buildSignupEntries(couple);
t(ce.length===2, `couple collapses to one entry + solo (${ce.length})`);
t(ce.some(x=>x.kind==="pair"), "couple detected as a pair");
t(E.countPlayers(ce)===3, "a pair still counts as two players");
const pair = ce.find(x=>x.kind==="pair");
t(pair && pair.player.id!==pair.partner.id, "pair holds two distinct people");

// --- 4. one-sided request -> pending child, partner NOT shown as a player -
const oneSided = [ mk("q1","Alex Hope","guy","Jamie Absent"), mk("q2","Casey Solo","girl") ];
const oe = E.buildSignupEntries(oneSided);
const pending = oe.find(x=>x.kind==="pending");
t(!!pending, "one-sided request becomes a pending entry");
t(pending?.waitingFor==="Jamie Absent", "pending names who we're waiting on");
t(E.countPlayers(oe)===2, "the absent partner is NOT counted as a player");

// --- 5. named someone present who didn't name back = still pending -------
const unrequited = [ mk("r1","Alex","guy","Casey"), mk("r2","Casey","girl") ];
const ue = E.buildSignupEntries(unrequited);
t(ue.filter(x=>x.kind==="pair").length===0, "unreciprocated link is not a pair");
t(E.countPlayers(ue)===2, "both still counted as players");

// --- 6. list pairing agrees with what the DRAW will do -------------------
const roster = [...couple, mk("p4","Extra One","girl"), mk("p5","Extra Two","guy")];
const drawPairs = T.buildUnits(roster).filter(u=>u.players.length>1)
  .map(u=>u.players.map(p=>p.name).sort().join("+")).sort();
const listPairs = E.buildSignupEntries(roster).filter(x=>x.kind==="pair")
  .map(x=>[x.player.name,x.partner.name].sort().join("+")).sort();
t(JSON.stringify(drawPairs)===JSON.stringify(listPairs),
  `list and draw agree on pairs: ${JSON.stringify(listPairs)}`);

// --- 7. nobody appears twice ---------------------------------------------
const shown = [];
for (const e of E.buildSignupEntries(roster)) {
  shown.push(e.player.id); if (e.kind==="pair") shown.push(e.partner.id);
}
t(new Set(shown).size===shown.length, "no player rendered twice");
t(shown.length===roster.length, "every real player is rendered exactly once");

console.log(fails?`\n${fails} FAILURES`:"\nALL SIGNUP LIST CHECKS PASSED");
process.exit(fails?1:0);
