/**
 * Fashion AI Research Method
 * Attribute-Gated Multimodal Ranker (AGMR) — project-specific research prototype.
 *
 * This module does NOT claim a novel published algorithm. It provides a reproducible
 * trainable ranking formulation that can be fitted once human relevance labels exist.
 */
export const AGMR_FEATURES = [
  "lexical", "semantic", "attribute", "budget", "visual", "style", "occasion"
];

const sigmoid = x => 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, x))));

export function agmrScore(features, weights) {
  const w = weights || { bias: -1.2, lexical: 0.9, semantic: 0.8, attribute: 1.1, budget: 0.7, visual: 1.0, style: 0.5, occasion: 0.4 };
  const z = (w.bias || 0) + AGMR_FEATURES.reduce((sum, key) => sum + (Number(features?.[key]) || 0) * (Number(w[key]) || 0), 0);
  return sigmoid(z);
}

export function trainAGMR(rows, options = {}) {
  const epochs = Number(options.epochs || 120);
  const lr = Number(options.learningRate || 0.05);
  const l2 = Number(options.l2 || 0.001);
  const weights = { bias: -1, ...Object.fromEntries(AGMR_FEATURES.map(k => [k, 0])) };

  const samples = (rows || []).filter(r => r && (r.label === 0 || r.label === 1));
  if (!samples.length) return { weights, samples: 0, trained: false };

  for (let epoch = 0; epoch < epochs; epoch++) {
    const grad = { bias: 0, ...Object.fromEntries(AGMR_FEATURES.map(k => [k, 0])) };
    for (const row of samples) {
      const prediction = agmrScore(row.features, weights);
      const error = prediction - Number(row.label);
      grad.bias += error;
      for (const key of AGMR_FEATURES) grad[key] += error * (Number(row.features?.[key]) || 0);
    }
    for (const key of Object.keys(weights)) {
      const reg = key === "bias" ? 0 : l2 * weights[key];
      weights[key] -= lr * ((grad[key] / samples.length) + reg);
    }
  }
  return { weights, samples: samples.length, trained: true };
}

export function rankWithAGMR(items, weights) {
  return (items || []).map(item => ({ ...item, agmrScore: agmrScore(item.features || item, weights) }))
    .sort((a, b) => b.agmrScore - a.agmrScore);
}
