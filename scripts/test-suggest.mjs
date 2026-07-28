// Partner suggestions must be helpful without ever auto-linking anyone.
import { readFileSync } from "node:fs";
import ts from "typescript";
const src = readFileSync("src/lib/partnerSuggest.ts","utf8").replace(/import type .*?;\n/gs,"");
const js = ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const S = await import("data:text/javascript;base64,"+Buffer.from(js).toString("base64"));

const mk = (name,gender,partner=null) => ({id:name,player_id:name,name,gender,partner_name:partner,created_at:"",week_id:"w"});
let fails=0; const t=(ok,m)=>{console.log(`  ${ok?"PASS":"FAIL"}  ${m}`); if(!ok)fails++;};
const names = r => r.map(x=>x.name);

// --- surname extraction ---------------------------------------------------
t(S.surnameOf("Gavin Wetrich")==="wetrich", "surname from two-part name");
t(S.surnameOf("Mary Anne Van Dyke")==="dyke", "surname from long name");
t(S.surnameOf("Cher")==="", "single-word name yields no surname");
t(S.surnameOf("Bob Smith Jr.")==="smith", "generational suffix ignored");
t(S.surnameOf("  gavin   WETRICH  ")==="wetrich", "surname is case/space insensitive");

// --- someone already named you (strongest) --------------------------------
{
  const roster = [mk("Bridgett Wetrich","girl","Gavin Wetrich"), mk("Random Person","guy")];
  const r = S.suggestPartners("Gavin Wetrich", roster);
  t(r.length===1 && r[0].reason==="waiting" && r[0].name==="Bridgett Wetrich",
    `reciprocal request surfaces first: ${JSON.stringify(names(r))}`);
}

// --- shared surname is a hint ---------------------------------------------
{
  const roster = [mk("Gavin Wetrich","guy"), mk("Nicole Comito","girl")];
  const r = S.suggestPartners("Bridgett Wetrich", roster);
  t(r.length===1 && r[0].reason==="surname" && r[0].name==="Gavin Wetrich",
    `shared surname suggested: ${JSON.stringify(names(r))}`);
}

// --- waiting outranks surname ---------------------------------------------
{
  const roster = [mk("Gavin Wetrich","guy"), mk("Casey Jones","girl","Bridgett Wetrich")];
  const r = S.suggestPartners("Bridgett Wetrich", roster);
  t(r[0].reason==="waiting" && r[0].name==="Casey Jones", "a waiting request outranks a surname match");
}

// --- never suggests yourself ----------------------------------------------
{
  const roster = [mk("Bridgett Wetrich","girl"), mk("  bridgett   wetrich ","girl")];
  const r = S.suggestPartners("Bridgett Wetrich", roster);
  t(r.length===0, `never suggests you (got ${JSON.stringify(names(r))})`);
}

// --- doesn't poach someone already spoken for -----------------------------
{
  const roster = [mk("Gavin Wetrich","guy","Someone Else")];
  const r = S.suggestPartners("Bridgett Wetrich", roster);
  t(r.length===0, "won't suggest a person who named a third party");
}

// --- single-word names produce nothing ------------------------------------
{
  const roster = [mk("Madonna","girl"), mk("Cher","girl")];
  t(S.suggestPartners("Cher", roster).length===0, "no surname, no suggestion");
}

// --- nameless / junk rows never suggested ---------------------------------
{
  const roster = [mk("","guy"), mk("   ","girl"), mk("Gavin Wetrich","guy")];
  const r = S.suggestPartners("Bridgett Wetrich", roster);
  t(r.length===1 && r[0].name==="Gavin Wetrich", "junk rows are skipped");
}

// --- capped, and stable -----------------------------------------------------
{
  const roster = Array.from({length:9},(_,i)=>mk(`Person${i} Wetrich`,"guy"));
  t(S.suggestPartners("Bridgett Wetrich", roster).length===3, "capped at 3 suggestions");
}

// --- typing a partial name doesn't explode ---------------------------------
{
  const roster = [mk("Gavin Wetrich","guy")];
  t(S.suggestPartners("B", roster).length===0, "too-short input suggests nothing");
  t(S.suggestPartners("", roster).length===0, "empty input suggests nothing");
}

console.log(fails?`\n${fails} FAILURES`:"\nALL PARTNER SUGGESTION CHECKS PASSED");
process.exit(fails?1:0);
