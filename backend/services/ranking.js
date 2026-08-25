/*
=========================================================
FASHION AI DISCOVERY
DAY 3 — AI RANKING ENGINE
=========================================================

Purpose:
- Hybrid product ranking
- Explainable ranking
- Metadata-aware scoring
- Budget awareness
- Deterministic ranking
- Research/ablation ready

=========================================================
*/

"use strict";

/*
=========================================================
CONFIGURATION
=========================================================
*/

const RANKING_VERSION = "day3-hybrid-v1";

const WEIGHTS = {
  semantic: 0.30,
  lexical: 0.20,
  category: 0.10,
  style: 0.10,
  occasion: 0.08,
  color: 0.06,
  material: 0.05,
  tags: 0.04,
  budget: 0.04,
  gender: 0.03
};

/*
=========================================================
NORMALIZATION
=========================================================
*/

function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9₹\s-]/g, " ")
    .replace(/\s+/g, " ");
}

function tokenize(value) {
  return normalizeText(value)
    .split(/\s+/)
    .filter(Boolean);
}

function safeArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (
    typeof value === "string" &&
    value.trim()
  ) {
    return [value];
  }

  return [];
}

/*
=========================================================
STOP WORDS
=========================================================
*/

const STOP_WORDS = new Set([
  "i",
  "am",
  "me",
  "my",
  "want",
  "need",
  "looking",
  "for",
  "a",
  "an",
  "the",
  "with",
  "and",
  "or",
  "to",
  "wear",
  "wearing",
  "something",
  "please",
  "show",
  "find",
  "give",
  "under",
  "below",
  "around",
  "in",
  "on",
  "of",
  "is",
  "are",
  "for"
]);

function meaningfulTokens(value) {
  return tokenize(value)
    .filter(
      (token) =>
        !STOP_WORDS.has(token) &&
        token.length > 1
    );
}

/*
=========================================================
SYNONYMS
=========================================================
*/

const SYNONYMS = {
  tshirt: [
    "t-shirt",
    "tee",
    "shirt"
  ],

  tee: [
    "tshirt",
    "t-shirt",
    "shirt"
  ],

  trousers: [
    "pants",
    "bottoms"
  ],

  pants: [
    "trousers",
    "bottoms"
  ],

  sneaker: [
    "sneakers",
    "shoes",
    "footwear"
  ],

  sneakers: [
    "sneaker",
    "shoes",
    "footwear"
  ],

  shoe: [
    "shoes",
    "sneakers",
    "footwear"
  ],

  shoes: [
    "shoe",
    "sneakers",
    "footwear"
  ],

  casual: [
    "everyday",
    "relaxed"
  ],

  classy: [
    "elegant",
    "classic",
    "formal"
  ],

  elegant: [
    "classy",
    "luxury",
    "formal"
  ],

  comfortable: [
    "comfort",
    "relaxed"
  ],

  comfy: [
    "comfortable",
    "comfort",
    "relaxed"
  ],

  summer: [
    "warm",
    "lightweight",
    "breathable"
  ],

  college: [
    "campus",
    "student",
    "everyday"
  ],

  party: [
    "evening",
    "celebration"
  ],

  wedding: [
    "formal",
    "elegant",
    "evening"
  ]
};

function expandTokens(tokens) {
  const expanded = new Set(tokens);

  for (const token of tokens) {
    const synonyms =
      SYNONYMS[token] || [];

    for (const synonym of synonyms) {
      expanded.add(
        normalizeText(synonym)
      );
    }
  }

  return [...expanded];
}

/*
=========================================================
BUDGET EXTRACTION
=========================================================
*/

function extractBudget(query) {
  const text =
    normalizeText(query);

  const patterns = [
    /under\s+₹?\s*(\d+)/i,
    /below\s+₹?\s*(\d+)/i,
    /less\s+than\s+₹?\s*(\d+)/i,
    /within\s+₹?\s*(\d+)/i,
    /budget\s+₹?\s*(\d+)/i,
    /₹\s*(\d+)/i
  ];

  for (const pattern of patterns) {
    const match =
      text.match(pattern);

    if (match) {
      const value =
        Number(match[1]);

      if (
        Number.isFinite(value) &&
        value > 0
      ) {
        return value;
      }
    }
  }

  return null;
}

/*
=========================================================
PRODUCT TEXT
=========================================================
*/

function productText(product) {
  return [
    product.name,
    product.brand,
    product.category,
    product.gender,
    product.color,
    ...safeArray(product.material),
    ...safeArray(product.style),
    ...safeArray(product.occasion),
    ...safeArray(product.tags),
    product.description
  ]
    .filter(Boolean)
    .join(" ");
}

/*
=========================================================
LEXICAL SCORE
=========================================================
*/

function lexicalScore(
  queryTokens,
  product
) {
  if (!queryTokens.length) {
    return 0;
  }

  const productTokens =
    new Set(
      meaningfulTokens(
        productText(product)
      )
    );

  let matches = 0;

  for (const token of queryTokens) {
    if (productTokens.has(token)) {
      matches++;
      continue;
    }

    const synonyms =
      SYNONYMS[token] || [];

    if (
      synonyms.some(
        (synonym) =>
          productTokens.has(
            normalizeText(synonym)
          )
      )
    ) {
      matches++;
    }
  }

  return Math.min(
    1,
    matches /
      queryTokens.length
  );
}

/*
=========================================================
FIELD MATCH
=========================================================
*/

function fieldMatch(
  queryTokens,
  values
) {
  const normalizedValues =
    safeArray(values)
      .map(normalizeText)
      .filter(Boolean);

  if (
    !queryTokens.length ||
    !normalizedValues.length
  ) {
    return 0;
  }

  let matches = 0;

  for (const token of queryTokens) {
    const matched =
      normalizedValues.some(
        (value) => {
          if (
            value === token ||
            value.includes(token) ||
            token.includes(value)
          ) {
            return true;
          }

          const synonyms =
            SYNONYMS[token] || [];

          return synonyms.some(
            (synonym) =>
              value.includes(
                normalizeText(synonym)
              )
          );
        }
      );

    if (matched) {
      matches++;
    }
  }

  return Math.min(
    1,
    matches /
      queryTokens.length
  );
}

/*
=========================================================
CATEGORY SCORE
=========================================================
*/

function categoryScore(
  queryTokens,
  product
) {
  const category =
    normalizeText(
      product.category
    );

  const name =
    normalizeText(
      product.name
    );

  if (!category && !name) {
    return 0;
  }

  let score = 0;

  for (const token of queryTokens) {

    if (
      category.includes(token)
    ) {
      score = Math.max(
        score,
        1
      );
    }

    if (
      name.includes(token)
    ) {
      score = Math.max(
        score,
        0.8
      );
    }

    const synonyms =
      SYNONYMS[token] || [];

    for (const synonym of synonyms) {
      const normalized =
        normalizeText(synonym);

      if (
        category.includes(
          normalized
        )
      ) {
        score = Math.max(
          score,
          0.9
        );
      }
    }
  }

  return score;
}

/*
=========================================================
SEMANTIC SCORE
=========================================================
*/

function semanticScore(product) {
  const score =
    Number(
      product.semanticScore ??
      product.similarity ??
      product.embeddingScore ??
      0
    );

  if (
    !Number.isFinite(score)
  ) {
    return 0;
  }

  /*
    Supports both:
    0 → 1
    0 → 100
  */

  if (score > 1) {
    return Math.min(
      1,
      score / 100
    );
  }

  return Math.max(
    0,
    Math.min(1, score)
  );
}

/*
=========================================================
BUDGET SCORE
=========================================================
*/

function budgetScore(
  product,
  budget
) {
  if (
    !budget ||
    !Number.isFinite(
      Number(product.price)
    )
  ) {
    return 0.5;
  }

  const price =
    Number(product.price);

  if (price <= budget) {
    /*
      Cheaper products are slightly
      preferred but not aggressively.
    */

    const ratio =
      price / budget;

    return Math.min(
      1,
      0.7 +
        (1 - ratio) * 0.3
    );
  }

  /*
    Penalise products above budget.
  */

  const excess =
    (price - budget) /
    budget;

  return Math.max(
    0,
    0.7 -
      excess
  );
}

/*
=========================================================
AVAILABILITY SCORE
=========================================================
*/

function availabilityScore(
  product
) {
  const value =
    normalizeText(
      product.availability
    );

  if (
    value.includes(
      "in stock"
    )
  ) {
    return 1;
  }

  if (
    value.includes(
      "available"
    )
  ) {
    return 1;
  }

  if (
    value.includes(
      "out of stock"
    )
  ) {
    return 0;
  }

  return 0.5;
}

/*
=========================================================
FINAL SCORE
=========================================================
*/

function calculateRankingScore(
  query,
  product,
  options = {}
) {
  const tokens =
    expandTokens(
      meaningfulTokens(query)
    );

  const budget =
    options.budget ??
    extractBudget(query);

  const semantic =
    semanticScore(product);

  const lexical =
    lexicalScore(
      tokens,
      product
    );

  const category =
    categoryScore(
      tokens,
      product
    );

  const style =
    fieldMatch(
      tokens,
      product.style
    );

  const occasion =
    fieldMatch(
      tokens,
      product.occasion
    );

  const color =
    fieldMatch(
      tokens,
      product.color
    );

  const material =
    fieldMatch(
      tokens,
      product.material
    );

  const tags =
    fieldMatch(
      tokens,
      product.tags
    );

  const gender =
    fieldMatch(
      tokens,
      product.gender
    );

  const budgetFit =
    budgetScore(
      product,
      budget
    );

  /*
    Main hybrid score
  */

  const baseScore =
    semantic *
      WEIGHTS.semantic +

    lexical *
      WEIGHTS.lexical +

    category *
      WEIGHTS.category +

    style *
      WEIGHTS.style +

    occasion *
      WEIGHTS.occasion +

    color *
      WEIGHTS.color +

    material *
      WEIGHTS.material +

    tags *
      WEIGHTS.tags +

    budgetFit *
      WEIGHTS.budget +

    gender *
      WEIGHTS.gender;

  /*
    Availability adjustment.
  */

  const availability =
    availabilityScore(
      product
    );

  const finalScore =
    baseScore *
    (0.92 +
      0.08 * availability);

  return {
    score: Math.max(
      0,
      Math.min(
        1,
        finalScore
      )
    ),

    components: {
      semantic,
      lexical,
      category,
      style,
      occasion,
      color,
      material,
      tags,
      budget: budgetFit,
      gender,
      availability
    },

    budget
  };
}

/*
=========================================================
EXPLANATION GENERATOR
=========================================================
*/

function generateReasons(
  product,
  ranking
) {
  const reasons = [];

  const c =
    ranking.components;

  if (c.semantic >= 0.65) {
    reasons.push(
      "Strong semantic match with your request."
    );
  }

  if (c.category >= 0.8) {
    reasons.push(
      `Matches the requested category: ${product.category}.`
    );
  }

  if (c.style >= 0.5) {
    reasons.push(
      `Style aligns with ${safeArray(product.style).slice(0, 2).join(" and ")}.`
    );
  }

  if (c.occasion >= 0.5) {
    reasons.push(
      `Suitable for ${safeArray(product.occasion).slice(0, 2).join(" and ")}.`
    );
  }

  if (c.color >= 0.5) {
    reasons.push(
      `Colour matches your request.`
    );
  }

  if (c.material >= 0.5) {
    reasons.push(
      `Material is relevant to your request.`
    );
  }

  if (
    ranking.budget &&
    c.budget >= 0.7
  ) {
    reasons.push(
      `Fits your ₹${ranking.budget.toLocaleString("en-IN")} budget preference.`
    );
  }

  if (
    c.lexical >= 0.5
  ) {
    reasons.push(
      "Several important query terms match this product."
    );
  }

  if (!reasons.length) {
    reasons.push(
      "Recommended based on overall product relevance."
    );
  }

  return reasons.slice(0, 4);
}

/*
=========================================================
RANK PRODUCTS
=========================================================
*/

function rankProducts(
  products,
  query,
  options = {}
) {
  if (
    !Array.isArray(products)
  ) {
    return [];
  }

  const ranked =
    products.map(
      (product, index) => {

        const ranking =
          calculateRankingScore(
            query,
            product,
            options
          );

        const reasons =
          generateReasons(
            product,
            ranking
          );

        return {
          ...product,

          matchScore:
            Math.round(
              ranking.score * 100
            ),

          score:
            ranking.score,

          rankingScore:
            ranking.score,

          rankingVersion:
            RANKING_VERSION,

          rankingComponents:
            ranking.components,

          reasons,

          originalIndex:
            index
        };
      }
    );

  ranked.sort(
    (a, b) => {

      if (
        b.rankingScore !==
        a.rankingScore
      ) {
        return (
          b.rankingScore -
          a.rankingScore
        );
      }

      /*
        Stable deterministic tie-breaker.
      */

      return (
        a.originalIndex -
        b.originalIndex
      );
    }
  );

  return ranked.map(
    ({
      originalIndex,
      ...product
    }) => product
  );
}

/*
=========================================================
ABLATION SUPPORT
=========================================================
*/

function rankWithAblation(
  products,
  query,
  disabledSignals = []
) {
  const activeWeights = {
    ...WEIGHTS
  };

  for (
    const signal of disabledSignals
  ) {
    if (
      Object.prototype.hasOwnProperty.call(
        activeWeights,
        signal
      )
    ) {
      activeWeights[signal] = 0;
    }
  }

  const weightSum =
    Object.values(
      activeWeights
    ).reduce(
      (sum, value) =>
        sum + value,
      0
    );

  const normalizedWeights =
    Object.fromEntries(
      Object.entries(
        activeWeights
      ).map(
        ([key, value]) => [
          key,
          weightSum > 0
            ? value / weightSum
            : 0
        ]
      )
    );

  /*
    Temporarily calculate ranking
    with altered weights.
  */

  return products
    .map((product, index) => {

      const tokens =
        expandTokens(
          meaningfulTokens(query)
        );

      const budget =
        extractBudget(query);

      const components = {
        semantic:
          semanticScore(product),

        lexical:
          lexicalScore(
            tokens,
            product
          ),

        category:
          categoryScore(
            tokens,
            product
          ),

        style:
          fieldMatch(
            tokens,
            product.style
          ),

        occasion:
          fieldMatch(
            tokens,
            product.occasion
          ),

        color:
          fieldMatch(
            tokens,
            product.color
          ),

        material:
          fieldMatch(
            tokens,
            product.material
          ),

        tags:
          fieldMatch(
            tokens,
            product.tags
          ),

        budget:
          budgetScore(
            product,
            budget
          ),

        gender:
          fieldMatch(
            tokens,
            product.gender
          )
      };

      let score = 0;

      for (
        const [key, weight]
        of Object.entries(
          normalizedWeights
        )
      ) {
        score +=
          components[key] *
          weight;
      }

      return {
        ...product,

        score,

        matchScore:
          Math.round(
            score * 100
          ),

        rankingComponents:
          components,

        ablation:
          disabledSignals,

        originalIndex:
          index
      };
    })
    .sort(
      (a, b) =>
        b.score -
        a.score ||
        a.originalIndex -
          b.originalIndex
    )
    .map(
      ({
        originalIndex,
        ...product
      }) => product
    );
}

/*
=========================================================
EXPORTS
=========================================================
*/

export {
  RANKING_VERSION,
  WEIGHTS,
  extractBudget,
  calculateRankingScore,
  rankProducts,
  rankWithAblation
};
