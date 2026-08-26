/*
=========================================================
FASHION AI DISCOVERY
DAY 5 — HYBRID RETRIEVAL ENGINE
=========================================================

Hybrid Retrieval combines:

1. Semantic similarity
2. Keyword relevance
3. Category matching
4. Colour matching
5. Style matching
6. Occasion matching
7. Material matching
8. Budget compatibility

Final score:

semantic      45%
keyword       20%
attributes    20%
budget        10%
metadata       5%

=========================================================
*/

"use strict";

/*
=========================================================
TEXT NORMALIZATION
=========================================================
*/

function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s₹.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/*
=========================================================
TOKENIZATION
=========================================================
*/

function tokenize(value) {
  const text = normalizeText(value);

  if (!text) {
    return [];
  }

  return text
    .split(" ")
    .map((word) => word.trim())
    .filter(Boolean);
}

/*
=========================================================
UNIQUE TOKENS
=========================================================
*/

function uniqueTokens(tokens) {
  return [...new Set(tokens)];
}

/*
=========================================================
SYNONYMS
=========================================================
*/

const SYNONYMS = {
  tshirt: [
    "tshirt",
    "t-shirt",
    "tee",
    "top"
  ],

  tShirt: [
    "tshirt",
    "t-shirt",
    "tee",
    "top"
  ],

  shirt: [
    "shirt",
    "button",
    "formal shirt"
  ],

  jeans: [
    "jeans",
    "denim"
  ],

  trousers: [
    "trousers",
    "pants",
    "formal pants"
  ],

  dress: [
    "dress",
    "gown",
    "frock"
  ],

  kurta: [
    "kurta",
    "kurti",
    "ethnic"
  ],

  saree: [
    "saree",
    "sari"
  ],

  casual: [
    "casual",
    "everyday",
    "relaxed"
  ],

  formal: [
    "formal",
    "office",
    "professional",
    "workwear"
  ],

  party: [
    "party",
    "celebration",
    "event"
  ],

  college: [
    "college",
    "campus",
    "student",
    "university"
  ],

  wedding: [
    "wedding",
    "marriage",
    "bridal",
    "ceremony"
  ],

  black: [
    "black",
    "jet black",
    "dark black"
  ],

  white: [
    "white",
    "off white",
    "cream"
  ],

  blue: [
    "blue",
    "navy",
    "denim blue"
  ],

  red: [
    "red",
    "maroon",
    "burgundy"
  ],

  oversized: [
    "oversized",
    "baggy",
    "loose fit",
    "relaxed fit"
  ],

  slim: [
    "slim",
    "slim fit",
    "fitted"
  ],

  cotton: [
    "cotton",
    "pure cotton"
  ],

  denim: [
    "denim",
    "jeans"
  ]
};

/*
=========================================================
EXPAND QUERY TERMS
=========================================================
*/

function expandTerms(tokens) {
  const expanded = new Set(tokens);

  for (const token of tokens) {

    const normalized =
      normalizeText(token);

    for (const key of Object.keys(SYNONYMS)) {

      const group =
        SYNONYMS[key];

      if (
        group.some(
          (word) =>
            normalizeText(word) ===
            normalized
        )
      ) {

        group.forEach(
          (word) =>
            expanded.add(
              normalizeText(word)
            )
        );
      }
    }
  }

  return [...expanded];
}

/*
=========================================================
PRODUCT TEXT
=========================================================
*/

function productToText(product) {

  const fields = [
    product.name,
    product.brand,
    product.category,
    product.description,
    product.color,
    product.style,
    product.occasion,
    product.material,
    product.gender,
    product.fit,
    product.pattern,
    product.fabric,
    product.tags
  ];

  return fields
    .flatMap((value) => {

      if (Array.isArray(value)) {
        return value;
      }

      return [value];
    })
    .filter(Boolean)
    .join(" ");
}

/*
=========================================================
ARRAY NORMALIZER
=========================================================
*/

function asArray(value) {

  if (Array.isArray(value)) {
    return value;
  }

  if (
    typeof value === "string" &&
    value.trim()
  ) {

    return value
      .split(",")
      .map(
        (item) =>
          item.trim()
      )
      .filter(Boolean);
  }

  return [];
}

/*
=========================================================
NUMBER PARSER
=========================================================
*/

function parseNumber(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const number =
    Number(
      String(value)
        .replace(/[₹,\s]/g, "")
        .replace(/[^\d.]/g, "")
    );

  return Number.isFinite(number)
    ? number
    : null;
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

    /under\s*(?:rs|inr|₹)?\s*(\d+(?:\.\d+)?)/i,

    /below\s*(?:rs|inr|₹)?\s*(\d+(?:\.\d+)?)/i,

    /less\s*than\s*(?:rs|inr|₹)?\s*(\d+(?:\.\d+)?)/i,

    /within\s*(?:rs|inr|₹)?\s*(\d+(?:\.\d+)?)/i,

    /upto\s*(?:rs|inr|₹)?\s*(\d+(?:\.\d+)?)/i,

    /up\s*to\s*(?:rs|inr|₹)?\s*(\d+(?:\.\d+)?)/i,

    /budget\s*(?:of)?\s*(?:rs|inr|₹)?\s*(\d+(?:\.\d+)?)/i,

    /₹\s*(\d+(?:\.\d+)?)/
  ];

  for (const pattern of patterns) {

    const match =
      text.match(pattern);

    if (match) {

      const budget =
        Number(match[1]);

      if (
        Number.isFinite(budget) &&
        budget > 0
      ) {
        return budget;
      }
    }
  }

  return null;
}

/*
=========================================================
KEYWORD SCORE
=========================================================
*/

function keywordScore(
  queryTokens,
  product
) {

  if (!queryTokens.length) {
    return 0;
  }

  const productTokens =
    uniqueTokens(
      tokenize(
        productToText(product)
      )
    );

  if (!productTokens.length) {
    return 0;
  }

  const expandedQuery =
    expandTerms(
      queryTokens
    );

  let matches = 0;

  for (
    const queryToken of expandedQuery
  ) {

    if (
      productTokens.includes(
        queryToken
      )
    ) {

      matches++;
      continue;
    }

    const partial =
      productTokens.some(
        (productToken) =>
          productToken.includes(
            queryToken
          ) ||
          queryToken.includes(
            productToken
          )
      );

    if (partial) {
      matches++;
    }
  }

  return Math.min(
    1,
    matches /
      Math.max(
        1,
        expandedQuery.length * 0.55
      )
  );
}

/*
=========================================================
FIELD MATCH SCORE
=========================================================
*/

function fieldMatch(
  query,
  values
) {

  const queryTokens =
    expandTerms(
      tokenize(query)
    );

  const fieldValues =
    asArray(values)
      .flatMap(
        (value) =>
          tokenize(value)
      );

  if (
    !queryTokens.length ||
    !fieldValues.length
  ) {
    return 0;
  }

  let matched = 0;

  for (
    const token of queryTokens
  ) {

    const exists =
      fieldValues.some(
        (value) =>
          value === token ||
          value.includes(token) ||
          token.includes(value)
      );

    if (exists) {
      matched++;
    }
  }

  return Math.min(
    1,
    matched /
      Math.max(
        1,
        queryTokens.length * 0.7
      )
  );
}

/*
=========================================================
ATTRIBUTE SCORE
=========================================================
*/

function attributeScore(
  query,
  product
) {

  const scores = [

    fieldMatch(
      query,
      product.category
    ),

    fieldMatch(
      query,
      product.color
    ),

    fieldMatch(
      query,
      product.style
    ),

    fieldMatch(
      query,
      product.occasion
    ),

    fieldMatch(
      query,
      product.material
    ),

    fieldMatch(
      query,
      product.fit
    ),

    fieldMatch(
      query,
      product.pattern
    )
  ];

  const valid =
    scores.filter(
      (score) =>
        score > 0
    );

  if (!valid.length) {
    return 0;
  }

  return Math.min(
    1,
    valid.reduce(
      (sum, score) =>
        sum + score,
      0
    ) / valid.length
  );
}

/*
=========================================================
BUDGET SCORE
=========================================================
*/

function budgetScore(
  budget,
  product
) {

  if (!budget) {
    return 0.5;
  }

  const price =
    parseNumber(
      product.price
    );

  if (
    price === null ||
    price <= 0
  ) {
    return 0.25;
  }

  if (price <= budget) {
    return 1;
  }

  const difference =
    (price - budget) /
    budget;

  if (difference <= 0.10) {
    return 0.75;
  }

  if (difference <= 0.25) {
    return 0.45;
  }

  if (difference <= 0.50) {
    return 0.20;
  }

  return 0;
}

/*
=========================================================
METADATA SCORE
=========================================================
*/

function metadataScore(
  product
) {

  let score = 0;

  if (product.name) {
    score += 0.25;
  }

  if (product.category) {
    score += 0.20;
  }

  if (product.description) {
    score += 0.20;
  }

  if (product.brand) {
    score += 0.15;
  }

  if (product.price !== undefined) {
    score += 0.10;
  }

  if (
    product.color ||
    product.style ||
    product.occasion
  ) {
    score += 0.10;
  }

  return Math.min(
    1,
    score
  );
}

/*
=========================================================
SEMANTIC SCORE
=========================================================

Day 4 semantic retrieval may provide
a pre-computed similarity.

Supported fields:

semanticScore
similarity
score
embeddingScore

If none exists, we use a conservative
keyword-derived fallback.
=========================================================
*/

function getSemanticScore(
  product,
  query
) {

  const possibleScores = [

    product.semanticScore,

    product.semantic_similarity,

    product.similarity,

    product.embeddingScore,

    product.vectorScore
  ];

  for (
    const value of possibleScores
  ) {

    const number =
      Number(value);

    if (
      Number.isFinite(number)
    ) {

      if (number > 1) {
        return Math.min(
          1,
          number / 100
        );
      }

      return Math.max(
        0,
        Math.min(
          1,
          number
        )
      );
    }
  }

  /*
  Fallback for older products.
  We deliberately keep this lower than
  a real embedding similarity.
  */

  return (
    keywordScore(
      tokenize(query),
      product
    ) * 0.75
  );
}

/*
=========================================================
HYBRID SCORE
=========================================================
*/

function calculateHybridScore(
  query,
  product
) {

  const queryTokens =
    tokenize(query);

  const budget =
    extractBudget(query);

  const semantic =
    getSemanticScore(
      product,
      query
    );

  const keyword =
    keywordScore(
      queryTokens,
      product
    );

  const attributes =
    attributeScore(
      query,
      product
    );

  const budgetFit =
    budgetScore(
      budget,
      product
    );

  const metadata =
    metadataScore(
      product
    );

  /*
  =======================================================
  WEIGHTED HYBRID RETRIEVAL
  =======================================================
  */

  const finalScore =

    semantic * 0.45 +

    keyword * 0.20 +

    attributes * 0.20 +

    budgetFit * 0.10 +

    metadata * 0.05;

  return {

    finalScore:
      Math.max(
        0,
        Math.min(
          1,
          finalScore
        )
      ),

    semanticScore:
      semantic,

    keywordScore:
      keyword,

    attributeScore:
      attributes,

    budgetScore:
      budgetFit,

    metadataScore:
      metadata,

    detectedBudget:
      budget
  };
}

/*
=========================================================
MATCH REASONS
=========================================================
*/

function generateReasons(
  query,
  product,
  scores
) {

  const reasons = [];

  if (
    scores.semanticScore >=
    0.65
  ) {

    reasons.push(
      "Strong semantic match"
    );
  }

  if (
    scores.keywordScore >=
    0.60
  ) {

    reasons.push(
      "Relevant search terms matched"
    );
  }

  if (
    scores.attributeScore >=
    0.60
  ) {

    reasons.push(
      "Fashion attributes match your request"
    );
  }

  if (
    scores.budgetScore >=
    0.90
  ) {

    reasons.push(
      "Within your stated budget"
    );
  } else if (
    scores.budgetScore >=
    0.70
  ) {

    reasons.push(
      "Close to your stated budget"
    );
  }

  if (
    product.category
  ) {

    reasons.push(
      `${product.category} category match`
    );
  }

  return [
    ...new Set(
      reasons
    )
  ].slice(0, 4);
}

/*
=========================================================
HYBRID RETRIEVE
=========================================================
*/

function hybridRetrieve(
  products,
  query,
  options = {}
) {

  if (
    !Array.isArray(products)
  ) {
    return [];
  }

  const cleanQuery =
    String(query ?? "")
      .trim();

  if (!cleanQuery) {
    return [];
  }

  const limit =
    Math.max(
      1,
      Number(
        options.limit || 20
      )
    );

  const minScore =
    Number.isFinite(
      Number(
        options.minScore
      )
    )
      ? Number(
          options.minScore
        )
      : 0.08;

  const ranked =
    products
      .map(
        (product) => {

          const scores =
            calculateHybridScore(
              cleanQuery,
              product
            );

          return {

            ...product,

            matchScore:
              Math.round(
                scores.finalScore *
                100
              ),

            hybridScore:
              Number(
                scores.finalScore.toFixed(
                  4
                )
              ),

            scoreBreakdown: {

              semantic:
                Number(
                  scores.semanticScore.toFixed(
                    4
                  )
                ),

              keyword:
                Number(
                  scores.keywordScore.toFixed(
                    4
                  )
                ),

              attributes:
                Number(
                  scores.attributeScore.toFixed(
                    4
                  )
                ),

              budget:
                Number(
                  scores.budgetScore.toFixed(
                    4
                  )
                ),

              metadata:
                Number(
                  scores.metadataScore.toFixed(
                    4
                  )
                )
            },

            detectedBudget:
              scores.detectedBudget,

            reasons:
              generateReasons(
                cleanQuery,
                product,
                scores
              )
          };
        }
      )
      .filter(
        (product) =>
          product.hybridScore >=
          minScore
      )
      .sort(
        (a, b) =>
          b.hybridScore -
          a.hybridScore
      )
      .slice(
        0,
        limit
      );

  return ranked;
}

/*
=========================================================
SEARCH PRODUCTS
=========================================================
*/

function searchProducts(
  products,
  query,
  options = {}
) {

  return hybridRetrieve(
    products,
    query,
    options
  );
}

/*
=========================================================
EXPORTED API
=========================================================
*/

export {

  normalizeText,

  tokenize,

  extractBudget,

  keywordScore,

  attributeScore,

  budgetScore,

  calculateHybridScore,

  hybridRetrieve,

  searchProducts
};
