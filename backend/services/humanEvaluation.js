function normalizeJudgment(value) {
  const numeric=Number(value);
  if(Number.isFinite(numeric)) return Math.max(0,Math.min(4,Math.round(numeric)));
  const labels={irrelevant:0,weak:1,relevant:2,good:3,perfect:4};
  return labels[String(value??"").trim().toLowerCase()]??0;
}
function buildAgreementMatrix(judgments,categoryCount=5) {
  return judgments.map(values=>{
    const row=Array(categoryCount).fill(0);
    for(const value of values) row[normalizeJudgment(value)]+=1;
    return row;
  });
}
function fleissKappa(matrix) {
  if(!Array.isArray(matrix)||!matrix.length) return 0;
  const n=matrix[0]?.reduce((s,c)=>s+c,0)||0;
  if(!n) return 0;
  const itemAgreement=matrix.map(row=>{
    const total=row.reduce((s,c)=>s+c,0);
    return total>1?(row.reduce((s,c)=>s+c*c,0)-total)/(total*(total-1)):0;
  });
  const pBar=itemAgreement.reduce((s,v)=>s+v,0)/itemAgreement.length;
  const categoryTotals=Array.from({length:matrix[0].length},(_,i)=>matrix.reduce((s,row)=>s+(row[i]||0),0));
  const totalRatings=matrix.reduce((s,row)=>s+row.reduce((x,c)=>x+c,0),0);
  const pE=categoryTotals.reduce((s,total)=>s+(total/totalRatings)**2,0);
  return pE===1?1:(pBar-pE)/(1-pE);
}
function summarizeHumanLabels(records=[]) {
  const byQuery=new Map();
  for(const record of records){
    const key=String(record.queryId??record.query??""); if(!key) continue;
    if(!byQuery.has(key)) byQuery.set(key,[]);
    byQuery.get(key).push(normalizeJudgment(record.relevance));
  }
  const groups=[...byQuery.values()], matrix=buildAgreementMatrix(groups);
  const means=groups.map(v=>v.length?v.reduce((s,n)=>s+n,0)/v.length:0);
  return {queryCount:groups.length,annotationCount:records.length,annotatorsPerQuery:groups.length?Math.max(...groups.map(v=>v.length)):0,meanRelevance:means.length?means.reduce((s,v)=>s+v,0)/means.length:0,fleissKappa:fleissKappa(matrix),agreementMatrix:matrix};
}
export {normalizeJudgment,buildAgreementMatrix,fleissKappa,summarizeHumanLabels};
