/*
=========================================================
FASHION AI DISCOVERY
DAY 1 - AI SEARCH FOUNDATION
=========================================================
*/

import {
  loadCatalog
} from "./catalog.js";

/*
=========================================================
TEXT NORMALIZATION
=========================================================
*/

function normalizeText(value) {

  return String(value ?? "")
    .toLowerCase()
    .replace(/[^\w\s₹]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/*
=========================================================
TOKENIZATION
=========================================================
*/

function tokenize(text) {

  return normalizeText(text)
    .split(" ")
    .filter(
      (token) =>
        token.length > 1
    );
}

/*
=========================================================
QUERY UNDERSTANDING
=========================================================
*/

function extractBudget(query) {

  const normalized =
    normalizeText(query);

  const matches =
    normalized.match(
      /(?:under|below|less than|max|budget)\s*(?:₹|rs|inr)?\s*(\d+(?:,\d{3})*)/
    );

  if (!matches) {
    return null;
  }

  return Number(
    matches[1].replace(/,/g, "")
  );
}

function extractSignals(query) {

  const normalized =
    normalizeText(query);

  const signals = {
    colors: [
      "black",
      "white",
      "blue",
      "grey",
      "gray",
      "cream",
      "red",
      "green",
      "pink",
      "beige",
      "brown"
    ],

    styles: [
      "minimal",
      "casual",
      "formal",
      "oversized",
      "relaxed",
      "classic",
      "streetwear",
      "elegant",
      "sporty",
      "modern",
      "luxury"
    ],

    occasions: [
      "college",
      "office",
      "wedding",
      "party",
      "date",
      "travel",
      "summer",
      "everyday",
      "evening",
      "formal"
    ],

    categories: [
      "shirt",
      "shirts",
      "dress",
      "dresses",
      "jeans",
      "trousers",
      "sneakers",
      "hoodie",
      "hoodies",
      "blazer",
      "blazers"
    ],

    materials: [
      "cotton",
      "linen",
      "denim",
      "satin",
      "leather",
      "mesh",
      "wool"
    ]
  };

  const result = {
    colors: [],
    styles: [],
    occasions: [],
    categories: [],
    materials: [],
    budget:
      extractBudget(query)
  };

  for (
    const color of
    signals.colors
  ) {

    if (
      normalized.includes(color)
    ) {
      result.colors.push(
        color
      );
    }
  }

  for (
    const style of
    signals.styles
  ) {

    if (
      normalized.includes(style)
    ) {
      result.styles.push(
        style
      );
    }
  }

  for (
    const occasion of
    signals.occasions
  ) {

    if (
      normalized.includes(
        occasion
      )
    ) {
      result.occasions.push(
        occasion
      );
    }
  }

  for (
    const category of
    signals.categories
  ) {

    if (
      normalized.includes(
        category
      )
    ) {
      result.categories.push(
        category
      );
    }
  }

  for (
    const material of
    signals.materials
  ) {

    if (
      normalized.includes(
        material
      )
    ) {
      result.materials.push(
        material
      );
    }
  }

  return result;
}

/*
=========================================================
PRODUCT SEARCH TEXT
=========================================================
*/

function productSearchText(
  product
) {

  return normalizeText(
    [
      product.brand,
      product.name,
      product.category,
      product.gender,
      product.color,
      ...(product.material || []),
      ...(product.style || []),
      ...(product.occasion || []),
      ...(product.tags || []),
      product.description
    ].join(" ")
  );
}

/*
=========================================================
TOKEN OVERLAP
=========================================================
*/

function calculateTokenScore(
  queryTokens,
  product
) {

  const text =
    productSearchText(
      product
    );

  const productTokens =
    new Set(
      tokenize(text)
    );

  if (
    queryTokens.length === 0
  ) {
    return 0;
  }

  let matches = 0;

  for (
    const token of
    queryTokens
  ) {

    if (
      productTokens.has(token)
    ) {
      matches++;
      continue;
    }

    /*
    Small fuzzy matching.
    Example:
    sneaker -> sneakers
    dress -> dresses
    */
    for (
      const productToken of
      productTokens
    ) {

      if (
        productToken.startsWith(
          token
        ) ||
        token.startsWith(
          productToken
        )
      ) {

        matches += 0.7;

        break;
      }
    }
  }

  return (
    matches /
    queryTokens.length
  );
}

/*
=========================================================
STRUCTURED SIGNAL SCORE
=========================================================
*/

function containsAny(
  values,
  targets
) {

  const normalizedValues =
    values.map(
      normalizeText
    );

  return targets.some(
    (target) =>
      normalizedValues.some(
        (value) =>
          value.includes(
            normalizeText(
              target
            )
          )
      )
  );
}

function calculateSignalScore(
  product,
  signals
) {

  let score = 0;

  let possible = 0;

  if (
    signals.colors.length
  ) {

    possible++;

    if (
      signals.colors.some(
        (color) =>
          normalizeText(
            product.color
          ).includes(color)
      )
    ) {
      score++;
    }
  }

  if (
    signals.styles.length
  ) {

    possible++;

    if (
      containsAny(
        product.style || [],
        signals.styles
      )
    ) {
      score++;
    }
  }

  if (
    signals.occasions.length
  ) {

    possible++;

    if (
      containsAny(
        product.occasion || [],
        signals.occasions
      )
    ) {
      score++;
    }
  }

  if (
    signals.categories.length
  ) {

    possible++;

    const category =
      normalizeText(
        product.category
      );

    if (
      signals.categories.some(
        (value) =>
          category.includes(
            value.replace(
              /s$/,
              ""
            )
          )
      )
    ) {
      score++;
    }
  }

  if (
    signals.materials.length
  ) {

    possible++;

    if (
      containsAny(
        product.material || [],
        signals.materials
      )
    ) {
      score++;
    }
  }

  if (
    possible === 0
  ) {
    return 0;
  }

  return (
    score /
    possible
  );
}

/*
=========================================================
BUDGET SCORE
=========================================================
*/

function calculateBudgetScore(
  product,
  budget
) {

  if (
    !Number.isFinite(budget)
  ) {
    return 0.5;
  }

  if (
    product.price <= budget
  ) {
    return 1;
  }

  const difference =
    product.price -
    budget;

  /*
  Gradually penalise
  products above budget.
  */

  return Math.max(
    0,
    1 -
      difference /
        Math.max(
          budget,
          1
        )
  );
}

/*
=========================================================
FINAL SCORE
=========================================================
*/

function scoreProduct(
  product,
  query
) {

  const queryTokens =
    tokenize(query);

  const signals =
    extractSignals(
      query
    );

  const lexical =
    calculateTokenScore(
      queryTokens,
      product
    );

  const structured =
    calculateSignalScore(
      product,
      signals
    );

  const budget =
    calculateBudgetScore(
      product,
      signals.budget
    );

  /*
  Day 1 baseline ranking.

  Day 2:
  semantic embeddings.

  Day 3:
  learning/ranking improvements.
  */

  const finalScore =
    (
      lexical * 0.45 +
      structured * 0.40 +
      budget * 0.15
    );

  return {
    score:
      Math.round(
        finalScore * 100
      ),

    lexical,
    structured,
    budget,
    signals
  };
}

/*
=========================================================
EXPLANATION
=========================================================
*/

function generateReasons(
  product,
  ranking
) {

  const reasons = [];

  const signals =
    ranking.signals;

  if (
    signals.colors.some(
      (color) =>
        normalizeText(
          product.color
        ).includes(color)
    )
  ) {

    reasons.push(
      `Matches requested colour: ${product.color}`
    );
  }

  if (
    containsAny(
      product.style || [],
      signals.styles
    )
  ) {

    reasons.push(
      "Matches the requested style"
    );
  }

  if (
    containsAny(
      product.occasion || [],
      signals.occasions
    )
  ) {

    reasons.push(
      "Suitable for the requested occasion"
    );
  }

  if (
    signals.budget &&
    product.price <=
      signals.budget
  ) {

    reasons.push(
      "Within the requested budget"
    );
  }

  if (
    !reasons.length &&
    ranking.lexical > 0
  ) {

    reasons.push(
      "Relevant product description and attributes matched the query"
    );
  }

  if (!reasons.length) {

    reasons.push(
      "Recommended by the Fashion AI baseline ranking model"
    );
  }

  return reasons;
}

/*
=========================================================
MAIN SEARCH
=========================================================
*/

export function searchProducts(
  query,
  {
    limit = 20
  } = {}
) {

  const cleanQuery =
    String(query ?? "")
      .trim();

  if (!cleanQuery) {

    return {
      query: "",
      results: [],
      budget: null,
      signals: {}
    };
  }

  const products =
    loadCatalog();

  const ranked =
    products.map(
      (product) => {

        const ranking =
          scoreProduct(
            product,
            cleanQuery
          );

        return {
          ...product,

          matchScore:
            ranking.score,

          score:
            ranking.score,

          reasons:
            generateReasons(
              product,
              ranking
            ),

          ranking: {
            lexical:
              Number(
                ranking.lexical
                  .toFixed(4)
              ),

            structured:
              Number(
                ranking.structured
                  .toFixed(4)
              ),

            budget:
              Number(
                ranking.budget
                  .toFixed(4)
              )
          }
        };
      }
    );

  ranked.sort(
    (a, b) =>
      b.matchScore -
      a.matchScore
  );

  const signals =
    extractSignals(
      cleanQuery
    );

  return {
    query:
      cleanQuery,

    budget:
      signals.budget,

    signals,

    total:
      ranked.length,

    results:
      ranked.slice(
        0,
        Math.max(
          1,
          Number(limit) || 20
        )
      )
  };
}

/*
=========================================================
EXPORT QUERY UNDERSTANDING
=========================================================
*/

export function understandQuery(
  query
) {

  return extractSignals(
    query
  );
}
