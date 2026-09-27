import { trainAGMR, rankWithAGMR } from "./research-method.js";

export function evaluateRanking(rankedGroups, relevanceById, k = 5) {
  const groups = rankedGroups || [];
  let p = 0, ndcg = 0, mrr = 0, n = 0;
  for (const group of groups) {
    const rows = (group || []).slice(0, k).map(item => ({ label: Number(relevanceById?.[item.id] ?? 0) }));
    if (!rows.length) continue;
    n++;
    p += rows.filter(x => x.label > 0).length / rows.length;
    const dcg = rows.reduce((s, x, i) => s + (2 ** x.label - 1) / Math.log2(i + 2), 0);
    const ideal = [...rows].sort((a,b) => b.label - a.label);
    const idcg = ideal.reduce((s, x, i) => s + (2 ** x.label - 1) / Math.log2(i + 2), 0);
    ndcg += idcg ? dcg / idcg : 0;
    const first = rows.findIndex(x => x.label > 0);
    mrr += first < 0 ? 0 : 1 / (first + 1);
  }
  return n ? { queries:n, precisionAt5:p/n, ndcgAt5:ndcg/n, mrr:mrr/n } : { queries:0, precisionAt5:0, ndcgAt5:0, mrr:0 };
}

export function runAGMRExperiment({ trainingRows = [], testGroups = [], weights } = {}) {
  const trained = weights ? { weights, samples: trainingRows.length, trained: true } : trainAGMR(trainingRows);
  const ranked = testGroups.map(group => rankWithAGMR(group, trained.weights));
  return { trainingSamples: trained.samples, trained: trained.trained, weights: trained.weights, ranked, note: "Run against human-labelled held-out data; this function does not fabricate labels." };
}
