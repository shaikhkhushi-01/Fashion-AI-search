/**
 * Human relevance evaluation utilities.
 * Labels: 0 irrelevant, 1 partial, 2 high, 3 exact.
 *
 * The functions are intentionally data-driven: no fabricated labels or results.
 */
export const RELEVANCE_SCALE = Object.freeze({
  0: "irrelevant",
  1: "partially_relevant",
  2: "highly_relevant",
  3: "exact_match"
});

export function normalizeHumanRows(rows = []) {
  return rows
    .filter(r => r && Number.isInteger(Number(r.label)) && Number(r.label) >= 0 && Number(r.label) <= 3)
    .map(r => ({ ...r, label: Number(r.label), relevant: Number(r.label) > 0 }));
}

export function binaryPrecisionAtK(rows, k = 5) {
  const top = normalizeHumanRows(rows).slice(0, k);
  return top.length ? top.filter(r => r.relevant).length / top.length : 0;
}

export function dcgAtK(rows, k = 5) {
  return normalizeHumanRows(rows).slice(0, k)
    .reduce((sum, r, i) => sum + ((2 ** r.label - 1) / Math.log2(i + 2)), 0);
}

export function ndcgAtK(rows, k = 5) {
  const actual = dcgAtK(rows, k);
  const ideal = [...normalizeHumanRows(rows)].sort((a, b) => b.label - a.label).slice(0, k);
  const best = dcgAtK(ideal, k);
  return best ? actual / best : 0;
}

export function meanReciprocalRank(groups = []) {
  const values = groups.map(group => {
    const rows = normalizeHumanRows(group);
    const index = rows.findIndex(r => r.relevant);
    return index < 0 ? 0 : 1 / (index + 1);
  });
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

/**
 * Cohen's kappa for two independent annotators on the 0..3 scale.
 * Pass aligned arrays of labels with identical item order.
 */
export function cohensKappa(labelsA = [], labelsB = []) {
  const n = Math.min(labelsA.length, labelsB.length);
  if (!n) return null;
  let observed = 0;
  const pa = [0, 0, 0, 0], pb = [0, 0, 0, 0];
  for (let i = 0; i < n; i++) {
    const a = Number(labelsA[i]), b = Number(labelsB[i]);
    if (a === b) observed++;
    if (a >= 0 && a <= 3) pa[a]++;
    if (b >= 0 && b <= 3) pb[b]++;
  }
  observed /= n;
  const expected = pa.reduce((sum, count, i) => sum + (count / n) * (pb[i] / n), 0);
  return expected === 1 ? 1 : (observed - expected) / (1 - expected);
}

export function summarizeHumanEvaluation(queryGroups = []) {
  const groups = queryGroups.map(normalizeHumanRows).filter(g => g.length);
  const p5 = groups.length ? groups.reduce((s, g) => s + binaryPrecisionAtK(g, 5), 0) / groups.length : 0;
  const ndcg5 = groups.length ? groups.reduce((s, g) => s + ndcgAtK(g, 5), 0) / groups.length : 0;
  return {
    queries: groups.length,
    precisionAt5: Number(p5.toFixed(4)),
    ndcgAt5: Number(ndcg5.toFixed(4)),
    mrr: Number(meanReciprocalRank(groups).toFixed(4))
  };
}
