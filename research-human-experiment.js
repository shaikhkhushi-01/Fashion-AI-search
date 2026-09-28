import { trainAGMR, rankWithAGMR } from "./research-method.js";

const norm=s=>String(s||"").toLowerCase();
const words=s=>norm(s).split(/[^a-z0-9₹]+/).filter(w=>w.length>2);
const has=(q,v)=>norm(q).includes(norm(v));

function budget(q){
  const m=norm(q).match(/(?:under|below|less than|upto|up to|max(?:imum)?|within)\s*(?:₹|rs\.?|inr\s*)?([0-9]+(?:\.[0-9]+)?)(k|thousand)?/);
  if(!m)return null; let n=Number(m[1]); if(m[2]==="k"||m[2]==="thousand")n*=1000; return n;
}
function features(q,p){
  const qWords=words(q), text=[p.name,p.category,p.color,p.gender,p.material,p.style,p.occasion,...(p.tags||[]),p.description].join(" ");
  const lexical=qWords.length?qWords.filter(w=>norm(text).includes(w)).length/qWords.length:0;
  const color=p.color&&has(q,p.color)?1:0;
  const category=p.category&&has(q,p.category.replace(/s$/,""))?1:0;
  const b=budget(q), budgetFit=b==null?0:(Number(p.price)<=b?1:0);
  const style=p.style&&has(q,p.style)?1:0;
  const occasion=p.occasion&&has(q,p.occasion)?1:0;
  return {lexical,semantic:0,attribute:(color+category)/2,budget:budgetFit,visual:0,style,occasion};
}
function key(r){return r.query_id+"::"+r.product_id}
function meanLabels(a,b){
  const ma=new Map((a.rows||[]).map(r=>[key(r),Number(r.label)]));
  const mb=new Map((b.rows||[]).map(r=>[key(r),Number(r.label)]));
  return [...ma.keys()].filter(k=>mb.has(k)).map(k=>({key:k,label:(ma.get(k)+mb.get(k))/2}));
}
function metric(groups,k=5){
  let p=0,n=0,nd=0,mrr=0;
  for(const g of groups){const rows=g.slice(0,k);if(!rows.length)continue;n++;
    const rel=rows.map(x=>x.label>0?1:0);p+=rel.reduce((a,v)=>a+v,0)/k;
    const dcg=rows.reduce((s,x,i)=>s+(2**x.label-1)/Math.log2(i+2),0);
    const ideal=[...rows].sort((a,b)=>b.label-a.label);
    const idcg=ideal.reduce((s,x,i)=>s+(2**x.label-1)/Math.log2(i+2),0);
    nd+=idcg?dcg/idcg:0; const first=rel.indexOf(1);mrr+=first<0?0:1/(first+1);
  }
  return n?{queries:n,precisionAt5:p/n,ndcgAt5:nd/n,mrr:mrr/n}:{queries:0,precisionAt5:0,ndcgAt5:0,mrr:0};
}
export function buildHumanAGMRStudy(a,b,catalogue){
  const common=meanLabels(a,b);
  const byQuery=new Map();
  for(const r of common){const [qid,pid]=r.key.split("::");const p=catalogue.find(x=>String(x.id)===String(pid));if(!p)continue;
    const q=Number(qid);const query=(a.rows||[]).find(x=>Number(x.query_id)===q)?.query;
    if(query==null)continue;const row={id:pid,label:r.label,features:features(query,p),query_id:q};if(!byQuery.has(q))byQuery.set(q,[]);byQuery.get(q).push(row);
  }
  const queries=[...byQuery.keys()].sort((x,y)=>x-y), split=Math.max(1,Math.floor(queries.length*.8));
  const trainQ=new Set(queries.slice(0,split)),testQ=new Set(queries.slice(split));
  const trainRows=queries.filter(q=>trainQ.has(q)).flatMap(q=>byQuery.get(q));
  const trained=trainAGMR(trainRows);
  const testGroups=queries.filter(q=>testQ.has(q)).map(q=>byQuery.get(q).map(r=>({...r,features:r.features})));
  const agmr=metric(testGroups.map(g=>rankWithAGMR(g,trained.weights)));
  const lexical=metric(testGroups.map(g=>[...g].sort((x,y)=>y.features.lexical-x.features.lexical)));
  return {annotatedPairs:common.length,queries:queries.length,trainQueries:trainQ.size,testQueries:testQ.size,weights:trained.weights,agmr,lexicalBaseline:lexical,protocol:"80/20 query-disjoint split; labels are the mean of two independent annotators; no fabricated labels."};
}
