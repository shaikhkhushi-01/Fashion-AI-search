#!/usr/bin/env node
/**
 * Reproducible research runner.
 * Never fabricates human labels or DeepFashion2 metrics.
 */
import fs from "node:fs";
import { validateHumanStudy } from "./research-validation.js";
import { buildHumanAGMRStudy } from "./research-experiment.js";

const exists=p=>fs.existsSync(p);
const read=p=>JSON.parse(fs.readFileSync(p,"utf8"));
const a=process.argv[2], b=process.argv[3];

console.log("\nFASHION AI RESEARCH RUNNER\n==========================");

if(!a || !b){
  console.log("\nHuman study: BLOCKED");
  console.log("Required: independent A/B exports from annotation.html.");
  console.log("Expected: 50 queries × 5 candidates = 250 labels per annotator.");
  console.log("Run: node research-run-all.js human_eval_A.json human_eval_B.json");
}else{
  if(!exists(a)||!exists(b)) throw new Error("Both annotation JSON files must exist.");
  const A=read(a),B=read(b),agreement=validateHumanStudy(A,B);
  console.log("\nAgreement\n"+JSON.stringify(agreement,null,2));
  if(!agreement.complete) throw new Error("Human study incomplete; AGMR experiment blocked.");
  const catalogue=read("data/products.json");
  const result=buildHumanAGMRStudy(A.rows||[],B.rows||[],catalogue);
  console.log("\nHeld-out AGMR\n"+JSON.stringify(result,null,2));
}

const dfPath=process.argv[4];
console.log("\nDeepFashion2");
if(dfPath){
  console.log("Local dataset:",dfPath);
  console.log("Index command: python data/deepfashion2_adapter.py",dfPath,"--output deepfashion2_manifest.json");
  console.log("Metrics remain blocked until an actual benchmark/query protocol is run.");
}else{
  console.log("BLOCKED — DeepFashion2 is not bundled. Supply a lawful local dataset path.");
}
