import { getSemanticScoreMap } from "./semanticSearch.js";
import { extractIntent, expandQueryTerms, normalizeText } from "./aiIntent.js";
import { selectBestOutfit, buildStylePlan } from "./aiOutfit.js";

const CANDIDATE_LIMIT = 120;
const QUERY_CACHE_SIZE = 80;
const queryCache = new Map();

function arrayValue(value) {
  if (Array.isArray(value)) return value.map(item => normalizeText(item)).filter(Boolean);
  if (typeof value === "string" && value.trim()) return value.split(",").map(item => normalizeText(item)).filter(Boolean);
  return [];
}

function productText(product) {
  return normalizeText([
    product?.name,
    product?.brand,
    product?.category,
    product?.gender,
    product?.color,
    product?.material,
    product?.style,
    product?.occasion,
    product?.fit,
    product?.pattern,
    product?.fabric,
    product?.description,
    product?.tags
  ].flat().filter(Boolean).join(" "));
}

function exactMatch(value, target) {
  if (!target) return 0;
  const normalizedTarget = normalizeText(target);
  return arrayValue(value).some(item => item === normalizedTarget || item.includes(normalizedTarget) || normalizedTarget.includes(item)) ? 1 : 0;
}

function anyMatch(value, targets) {
  if (!targets?.length) return 0;
  return Math.max(...targets.map(target => exactMatch(value, target)));
}

function keywordScore(queryTerms, product) {
  const text = productText(product);
  if (!text || !queryTerms.length) return 0;
  const matched = queryTerms.filter(token => text.includes(token)).length;
  return Math.min(1, matched / queryTerms.length);
}

function constraintScore(product, intent) {
  const scores = [];
  if (intent.category) scores.push(exactMatch(product.category, intent.category));
  if (intent.color) scores.push(exactMatch(product.color, intent.color));
  if (intent.style.length) scores.push(anyMatch(product.style, intent.style));
  if (intent.occasion.length) scores.push(anyMatch(product.occasion, intent.occasion));
  if (intent.material) scores.push(exactMatch(product.material, intent.material));
  if (intent.gender) scores.push(exactMatch(product.gender, intent.gender));
  return scores.length ? scores.reduce((sum, value) => sum + value, 0) / scores.length : 0;
}

function budgetScore(product, budget) {
  if (budget == null) return 0.5;
  const price = Number(product?.price);
  if (!Number.isFinite(price)) return 0;
  if (price <= budget) return 1;
  return Math.max(0, 1 - ((price - budget) / Math.max(budget, 1)) * 2);
}

function compatibilityScore(product, intent) {
  if (!intent.outfit) return 0.5;
  const category = normalizeText(product?.category);
  const usable = /shirt|top|dress|trouser|pant|jean|skirt|sneaker|shoe|hoodie|blazer|jacket/.test(category);
  let score = usable ? 1 : 0;
  if (intent.style.length && anyMatch(product.style, intent.style)) score += 0.7;
  if (intent.occasion.length && anyMatch(product.occasion, intent.occasion)) score += 0.7;
  return Math.min(1, score / 2.4);
}

function candidateScore(product, queryTerms, intent) {
  return keywordScore(queryTerms, product) * 0.45 + constraintScore(product, intent) * 0.35 + budgetScore(product, intent.budget) * 0.1 + compatibilityScore(product, intent) * 0.1;
}

function cacheGet(key) {
  const value = queryCache.get(key);
  if (!value) return null;
  queryCache.delete(key);
  queryCache.set(key, value);
  return value;
}

function cacheSet(key, value) {
  queryCache.set(key, value);
  while (queryCache.size > QUERY_CACHE_SIZE) queryCache.delete(queryCache.keys().next().value);
}

async function discover(products, query, options = {}) {
  const cleanQuery = String(query ?? "").trim();
  const intent = extractIntent(cleanQuery);
  if (!Array.isArray(products) || !products.length || !cleanQuery) return { results: [], intent, outfitPlan: null, stylePlan: null, semanticAvailable: false };

  const cacheKey = `${products.length}::${normalizeText(cleanQuery)}::${intent.budget ?? ""}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const queryTerms = expandQueryTerms(cleanQuery);

  // Explicit attributes are treated as retrieval constraints, not just soft
  // ranking signals. This prevents semantic similarity from returning a
  // visually/semantically related but wrong category or colour.
  const hasExplicitConstraints =
    Boolean(intent.category || intent.color || intent.material || intent.gender ||
      intent.style.length || intent.occasion.length);

  const strictCandidates = hasExplicitConstraints
    ? products.filter(product => {
        if (intent.category && !exactMatch(product.category, intent.category)) return false;
        if (intent.color && !exactMatch(product.color, intent.color)) return false;
        if (intent.material && !exactMatch(product.material, intent.material)) return false;
        if (intent.gender && !exactMatch(product.gender, intent.gender) &&
            !exactMatch(product.gender, "unisex")) return false;
        if (intent.style.length && !anyMatch(product.style, intent.style)) return false;
        if (intent.occasion.length && !anyMatch(product.occasion, intent.occasion)) return false;
        return true;
      })
    : products;

  // If the complete constraint intersection is empty, progressively relax
  // style/occasion before falling back to the full catalogue.
  let retrievalPool = strictCandidates;
  if (!retrievalPool.length && hasExplicitConstraints) {
    retrievalPool = products.filter(product => {
      if (intent.category && !exactMatch(product.category, intent.category)) return false;
      if (intent.color && !exactMatch(product.color, intent.color)) return false;
      if (intent.material && !exactMatch(product.material, intent.material)) return false;
      if (intent.gender && !exactMatch(product.gender, intent.gender) &&
          !exactMatch(product.gender, "unisex")) return false;
      return true;
    });
  }
  if (!retrievalPool.length) retrievalPool = products;

  let candidates = retrievalPool
    .map(product => ({ product, score: candidateScore(product, queryTerms, intent) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(CANDIDATE_LIMIT, retrievalPool.length))
    .map(item => item.product);

  if (intent.budget != null) {
    const withinBudget = candidates.filter(product => Number(product.price) <= intent.budget);
    if (withinBudget.length) candidates = withinBudget;
  }

  let semanticScores = new Map();
  let semanticAvailable = false;

  try {
    semanticScores = await getSemanticScoreMap(candidates, cleanQuery);
    semanticAvailable = semanticScores.size > 0;
  } catch (error) {
    console.error("Semantic discovery error:", error);
  }

  const ranked = candidates.map(product => {
    const rawSemantic = Number(semanticScores.get(String(product.id)) ?? 0);
    const semantic = semanticAvailable
      ? Math.max(0, Math.min(1, (rawSemantic + 1) / 2))
      : 0;
    const keyword = keywordScore(queryTerms, product);
    const constraints = constraintScore(product, intent);
    const budget = budgetScore(product, intent.budget);
    const compatibility = compatibilityScore(product, intent);
    let score = semanticAvailable
      ? semantic * 0.20 + keyword * 0.20 + constraints * 0.45 + budget * 0.10 + compatibility * 0.05
      : keyword * 0.25 + constraints * 0.55 + budget * 0.15 + compatibility * 0.05;

    // Exact intent matches receive a strong, deterministic boost after
    // semantic retrieval. This keeps "black shirt" from drifting into
    // black trousers just because their descriptions are semantically close.
    if (intent.category && exactMatch(product.category, intent.category)) score += 0.12;
    if (intent.color && exactMatch(product.color, intent.color)) score += 0.10;
    if (intent.material && exactMatch(product.material, intent.material)) score += 0.07;
    if (intent.gender && (exactMatch(product.gender, intent.gender) || exactMatch(product.gender, "unisex"))) score += 0.05;
    if (intent.style.length && anyMatch(product.style, intent.style)) score += 0.08;
    if (intent.occasion.length && anyMatch(product.occasion, intent.occasion)) score += 0.08;
    if (intent.budget != null && Number(product.price) <= intent.budget) score += 0.07;

    score = Math.max(0, Math.min(1, score));
    return {
      ...product,
      score: Number(score.toFixed(6)),
      relevance: Number(score.toFixed(6)),
      aiMatch: Math.round(score * 100),
      semanticScore: Number(semantic.toFixed(6)),
      components: {
        semantic: Number(semantic.toFixed(6)),
        keyword: Number(keyword.toFixed(6)),
        constraints: Number(constraints.toFixed(6)),
        budget: Number(budget.toFixed(6)),
        compatibility: Number(compatibility.toFixed(6))
      },
      reasons: []
    };
  }).sort((a, b) => b.score - a.score);

  ranked.forEach(product => {
    const reasons = [];
    if (intent.category && exactMatch(product.category, intent.category)) reasons.push(`Matches ${intent.category}`);
    if (intent.color && exactMatch(product.color, intent.color)) reasons.push(`${intent.color} colour match`);
    if (intent.style.length && anyMatch(product.style, intent.style)) reasons.push(`${intent.style.join(" / ")} style`);
    if (intent.occasion.length && anyMatch(product.occasion, intent.occasion)) reasons.push(`Works for ${intent.occasion.join(" / ")}`);
    if (intent.budget != null && Number(product.price) <= intent.budget) reasons.push(`Within ₹${Math.round(intent.budget).toLocaleString("en-IN")}`);
    if (product.components.semantic >= 0.62) reasons.push("Strong semantic match");
    if (intent.outfit) reasons.push("Useful for a complete look");
    product.reasons = reasons.slice(0, 4).length ? reasons.slice(0, 4) : ["Relevant to your search intent"];
  });

  const limit = Math.max(1, Math.min(Number(options.limit) || 12, 100));
  const outfitPlan = selectBestOutfit(ranked, intent);
  const stylePlan = buildStylePlan(ranked[0], ranked, intent);
  const results = ranked.slice(0, limit);
  const payload = { results, intent, outfitPlan, stylePlan, semanticAvailable };

  cacheSet(cacheKey, payload);
  return payload;
}

export { discover };
