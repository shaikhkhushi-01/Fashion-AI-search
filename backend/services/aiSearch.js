/*
=========================================================
FASHION AI DISCOVERY
DAY 2 — AI / NLP SEMANTIC SEARCH ENGINE
=========================================================
*/

import {
  pipeline
} from "@huggingface/transformers";

/*
=========================================================
MODEL
=========================================================
*/

const MODEL_NAME =
  "Xenova/all-MiniLM-L6-v2";

let embeddingPipeline = null;

let productEmbeddings = [];

let productsCache = [];

/*
=========================================================
LOAD EMBEDDING MODEL
=========================================================
*/

async function getEmbeddingPipeline() {

  if (!embeddingPipeline) {

    console.log(
      "Loading semantic embedding model..."
    );

    embeddingPipeline =
      await pipeline(
        "feature-extraction",
        MODEL_NAME
      );

    console.log(
      "Semantic embedding model loaded."
    );
  }

  return embeddingPipeline;
}

/*
=========================================================
TEXT NORMALIZATION
=========================================================
*/

function normalizeText(value) {

  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s₹]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/*
=========================================================
SAFE ARRAY
=========================================================
*/

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
PRODUCT → SEARCH DOCUMENT
=========================================================
*/

function productToText(product) {

  const fields = [

    product.brand,

    product.name,

    product.category,

    product.gender,

    product.color,

    ...safeArray(product.material),

    ...safeArray(product.style),

    ...safeArray(product.occasion),

    ...safeArray(product.tags),

    product.description
  ];

  return normalizeText(
    fields
      .filter(Boolean)
      .join(" ")
  );
}

/*
=========================================================
MEAN POOLING
=========================================================
*/

function meanPool(tokens) {

  if (
    !Array.isArray(tokens) ||
    !tokens.length
  ) {
    return [];
  }

  const dimension =
    tokens[0].length;

  const vector =
    new Array(dimension)
      .fill(0);

  for (
    const token of tokens
  ) {

    for (
      let i = 0;
      i < dimension;
      i++
    ) {

      vector[i] +=
        Number(token[i]) || 0;
    }
  }

  for (
    let i = 0;
    i < dimension;
    i++
  ) {

    vector[i] /=
      tokens.length;
  }

  return vector;
}

/*
=========================================================
NORMALIZE VECTOR
=========================================================
*/

function normalizeVector(vector) {

  const magnitude =
    Math.sqrt(
      vector.reduce(
        (sum, value) =>
          sum + value * value,
        0
      )
    );

  if (
    !Number.isFinite(magnitude) ||
    magnitude === 0
  ) {
    return vector;
  }

  return vector.map(
    value =>
      value / magnitude
  );
}

/*
=========================================================
CREATE EMBEDDING
=========================================================
*/

async function createEmbedding(text) {

  const extractor =
    await getEmbeddingPipeline();

  const output =
    await extractor(
      text,
      {
        pooling: "mean",
        normalize: true
      }
    );

  /*
  Transformers.js returns
  a tensor-like object.
  */

  if (
    output &&
    typeof output.tolist ===
      "function"
  ) {

    const values =
      output.tolist();

    if (
      Array.isArray(values)
    ) {

      /*
      Typical shape:
      [[0.1, 0.2, ...]]
      */

      if (
        Array.isArray(values[0]) &&
        typeof values[0][0] ===
          "number"
      ) {

        return normalizeVector(
          values[0]
        );
      }

      /*
      Fallback for token-level
      output.
      */

      if (
        Array.isArray(values[0]) &&
        Array.isArray(values[0][0])
      ) {

        return normalizeVector(
          meanPool(values[0])
        );
      }
    }
  }

  /*
  Final fallback.
  */

  return [];
}

/*
=========================================================
COSINE SIMILARITY
=========================================================
*/

function cosineSimilarity(
  vectorA,
  vectorB
) {

  if (
    !vectorA?.length ||
    !vectorB?.length
  ) {
    return 0;
  }

  const length =
    Math.min(
      vectorA.length,
      vectorB.length
    );

  let dot = 0;

  let magnitudeA = 0;

  let magnitudeB = 0;

  for (
    let i = 0;
    i < length;
    i++
  ) {

    const a =
      Number(vectorA[i]) || 0;

    const b =
      Number(vectorB[i]) || 0;

    dot += a * b;

    magnitudeA +=
      a * a;

    magnitudeB +=
      b * b;
  }

  if (
    magnitudeA === 0 ||
    magnitudeB === 0
  ) {
    return 0;
  }

  return (
    dot /
    (
      Math.sqrt(magnitudeA) *
      Math.sqrt(magnitudeB)
    )
  );
}

/*
=========================================================
TOKENIZE
=========================================================
*/

function tokenize(text) {

  return normalizeText(text)
    .split(" ")
    .filter(
      token =>
        token.length >= 2
    );
}

/*
=========================================================
SYNONYMS
=========================================================
*/

const SYNONYMS = {

  shirt: [
    "shirts",
    "top",
    "tops"
  ],

  tshirt: [
    "tshirt",
    "tee",
    "tees"
  ],

  trouser: [
    "trousers",
    "pants"
  ],

  pant: [
    "pants",
    "trousers"
  ],

  sneaker: [
    "sneakers",
    "shoe",
    "shoes"
  ],

  shoe: [
    "shoes",
    "sneakers"
  ],

  dress: [
    "dresses",
    "gown"
  ],

  casual: [
    "everyday",
    "relaxed"
  ],

  comfortable: [
    "comfort",
    "relaxed",
    "soft"
  ],

  summer: [
    "warm",
    "lightweight",
    "breathable"
  ],

  party: [
    "evening",
    "night"
  ],

  formal: [
    "office",
    "professional"
  ],

  college: [
    "campus",
    "student"
  ],

  black: [
    "dark"
  ],

  white: [
    "cream",
    "light"
  ],

  oversized: [
    "loose",
    "relaxed"
  ],

  minimal: [
    "clean",
    "simple"
  ]
};

/*
=========================================================
EXPAND QUERY
=========================================================
*/

function expandQuery(query) {

  const tokens =
    tokenize(query);

  const expanded =
    new Set(tokens);

  for (
    const token of tokens
  ) {

    const related =
      SYNONYMS[token];

    if (
      Array.isArray(related)
    ) {

      related.forEach(
        word =>
          expanded.add(
            word
          )
      );
    }
  }

  return [
    ...expanded
  ];
}

/*
=========================================================
ATTRIBUTE EXTRACTION
=========================================================
*/

function extractAttributes(
  query
) {

  const normalized =
    normalizeText(query);

  const attributes = {

    colors: [],

    categories: [],

    styles: [],

    occasions: [],

    budget: null
  };

  const colors = [
    "black",
    "white",
    "blue",
    "grey",
    "gray",
    "cream",
    "red",
    "green",
    "brown",
    "pink",
    "beige",
    "navy"
  ];

  const categories = [
    "shirt",
    "shirts",
    "tshirt",
    "tshirt",
    "dress",
    "dresses",
    "trousers",
    "pants",
    "jeans",
    "sneakers",
    "shoes",
    "hoodie",
    "hoodies",
    "blazer",
    "blazers",
    "jacket",
    "jackets"
  ];

  const styles = [
    "minimal",
    "casual",
    "formal",
    "classic",
    "oversized",
    "relaxed",
    "streetwear",
    "sporty",
    "elegant",
    "luxury",
    "modern"
  ];

  const occasions = [
    "college",
    "office",
    "summer",
    "travel",
    "everyday",
    "casual",
    "date",
    "party",
    "wedding",
    "evening",
    "formal"
  ];

  attributes.colors =
    colors.filter(
      value =>
        normalized.includes(value)
    );

  attributes.categories =
    categories.filter(
      value =>
        normalized.includes(value)
    );

  attributes.styles =
    styles.filter(
      value =>
        normalized.includes(value)
    );

  attributes.occasions =
    occasions.filter(
      value =>
        normalized.includes(value)
    );

  /*
  Budget extraction:
  under 2500
  below 3000
  less than 5000
  ₹2500
  2500 rs
  */

  const budgetPatterns = [

    /under\s*₹?\s*(\d+)/i,

    /below\s*₹?\s*(\d+)/i,

    /less\s*than\s*₹?\s*(\d+)/i,

    /within\s*₹?\s*(\d+)/i,

    /₹\s*(\d+)/i,

    /(\d+)\s*(?:rs|inr)/i
  ];

  for (
    const pattern of
      budgetPatterns
  ) {

    const match =
      normalized.match(
        pattern
      );

    if (match) {

      attributes.budget =
        Number(match[1]);

      break;
    }
  }

  return attributes;
}

/*
=========================================================
LEXICAL MATCH SCORE
=========================================================
*/

function lexicalScore(
  query,
  product
) {

  const queryTokens =
    expandQuery(query);

  const productText =
    productToText(product);

  if (
    !queryTokens.length ||
    !productText
  ) {
    return 0;
  }

  let matched = 0;

  for (
    const token of queryTokens
  ) {

    if (
      productText.includes(
        token
      )
    ) {

      matched++;
    }
  }

  return (
    matched /
    queryTokens.length
  );
}

/*
=========================================================
ATTRIBUTE SCORE
=========================================================
*/

function attributeScore(
  attributes,
  product
) {

  let score = 0;

  let total = 0;

  /*
  COLOR
  */

  if (
    attributes.colors.length
  ) {

    total++;

    const productColor =
      normalizeText(
        product.color
      );

    if (
      attributes.colors.some(
        color =>
          productColor
            .includes(color)
      )
    ) {

      score++;
    }
  }

  /*
  CATEGORY
  */

  if (
    attributes.categories.length
  ) {

    total++;

    const category =
      normalizeText(
        product.category
      );

    const name =
      normalizeText(
        product.name
      );

    if (
      attributes.categories.some(
        categoryQuery =>
          category.includes(
            categoryQuery
          ) ||
          name.includes(
            categoryQuery
          )
      )
    ) {

      score++;
    }
  }

  /*
  STYLE
  */

  if (
    attributes.styles.length
  ) {

    total++;

    const productStyles =
      safeArray(
        product.style
      )
        .map(
          normalizeText
        );

    if (
      attributes.styles.some(
        style =>
          productStyles.some(
            productStyle =>
              productStyle
                .includes(style)
          )
      )
    ) {

      score++;
    }
  }

  /*
  OCCASION
  */

  if (
    attributes.occasions.length
  ) {

    total++;

    const productOccasions =
      safeArray(
        product.occasion
      )
        .map(
          normalizeText
        );

    if (
      attributes.occasions.some(
        occasion =>
          productOccasions.some(
            productOccasion =>
              productOccasion
                .includes(
                  occasion
                )
          )
      )
    ) {

      score++;
    }
  }

  if (!total) {
    return 0;
  }

  return score / total;
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

  if (
    !budget ||
    !Number.isFinite(
      Number(product.price)
    )
  ) {
    return 0;
  }

  const price =
    Number(product.price);

  if (
    price <= budget
  ) {

    return 1;
  }

  /*
  Penalise products
  above requested budget.
  */

  const difference =
    price - budget;

  const ratio =
    difference /
    Math.max(
      budget,
      1
    );

  return Math.max(
    0,
    1 - ratio * 2
  );
}

/*
=========================================================
MATCH REASONS
=========================================================
*/

function buildReasons(
  product,
  attributes,
  semantic,
  lexical
) {

  const reasons = [];

  if (
    attributes.colors.length &&
    attributes.colors.some(
      color =>
        normalizeText(
          product.color
        ).includes(color)
    )
  ) {

    reasons.push(
      `Matches your ${attributes.colors[0]} colour preference`
    );
  }

  if (
    attributes.categories.length &&
    attributes.categories.some(
      category =>
        normalizeText(
          product.category
        ).includes(category) ||
        normalizeText(
          product.name
        ).includes(category)
    )
  ) {

    reasons.push(
      "Matches the requested clothing category"
    );
  }

  if (
    attributes.styles.length
  ) {

    const styles =
      safeArray(
        product.style
      )
        .map(
          normalizeText
        );

    if (
      attributes.styles.some(
        style =>
          styles.some(
            item =>
              item.includes(style)
          )
      )
    ) {

      reasons.push(
        `Fits your ${attributes.styles[0]} style`
      );
    }
  }

  if (
    attributes.occasions.length
  ) {

    const occasions =
      safeArray(
        product.occasion
      )
        .map(
          normalizeText
        );

    if (
      attributes.occasions.some(
        occasion =>
          occasions.some(
            item =>
              item.includes(
                occasion
              )
          )
      )
    ) {

      reasons.push(
        `Suitable for ${attributes.occasions[0]}`
      );
    }
  }

  if (
    attributes.budget &&
    Number(product.price) <=
      attributes.budget
  ) {

    reasons.push(
      "Within your requested budget"
    );
  }

  if (
    semantic >= 0.55
  ) {

    reasons.push(
      "Semantically similar to your request"
    );
  }

  if (
    lexical >= 0.35
  ) {

    reasons.push(
      "Matches important search terms"
    );
  }

  return [
    ...new Set(reasons)
  ].slice(0, 5);
}

/*
=========================================================
BUILD PRODUCT EMBEDDINGS
=========================================================
*/

export async function
initializeSearchEngine(
  products
) {

  if (
    !Array.isArray(products)
  ) {

    throw new Error(
      "Products must be an array."
    );
  }

  productsCache =
    products;

  console.log(
    `Preparing semantic index for ${products.length} products...`
  );

  const embeddings = [];

  for (
    const product of products
  ) {

    const text =
      productToText(
        product
      );

    const embedding =
      await createEmbedding(
        text
      );

    embeddings.push({
      id: product.id,
      embedding
    });

    console.log(
      `Indexed product ${product.id}: ${product.name}`
    );
  }

  productEmbeddings =
    embeddings;

  console.log(
    "Semantic product index ready."
  );

  return true;
}

/*
=========================================================
SEARCH
=========================================================
*/

export async function
searchProducts(
  query,
  limit = 20
) {

  const cleanQuery =
    String(
      query ?? ""
    ).trim();

  if (!cleanQuery) {
    return [];
  }

  if (
    !productsCache.length
  ) {

    throw new Error(
      "Search engine has not been initialized."
    );
  }

  /*
  Query embedding
  */

  const queryEmbedding =
    await createEmbedding(
      cleanQuery
    );

  /*
  NLP attribute extraction
  */

  const attributes =
    extractAttributes(
      cleanQuery
    );

  /*
  Rank products
  */

  const ranked =
    productsCache.map(
      product => {

        const embeddingEntry =
          productEmbeddings.find(
            item =>
              item.id ===
              product.id
          );

        const semantic =
          embeddingEntry
            ? cosineSimilarity(
                queryEmbedding,
                embeddingEntry.embedding
              )
            : 0;

        const lexical =
          lexicalScore(
            cleanQuery,
            product
          );

        const attribute =
          attributeScore(
            attributes,
            product
          );

        const budget =
          budgetScore(
            attributes.budget,
            product
          );

        /*
        Research-oriented
        hybrid ranking.

        Semantic = 55%
        Lexical = 15%
        Attributes = 20%
        Budget = 10%
        */

        const finalScore =
          (
            semantic * 0.55
          ) +
          (
            lexical * 0.15
          ) +
          (
            attribute * 0.20
          ) +
          (
            budget * 0.10
          );

        const reasons =
          buildReasons(
            product,
            attributes,
            semantic,
            lexical
          );

        return {

          ...product,

          semanticScore:
            Number(
              semantic.toFixed(4)
            ),

          lexicalScore:
            Number(
              lexical.toFixed(4)
            ),

          attributeScore:
            Number(
              attribute.toFixed(4)
            ),

          budgetScore:
            Number(
              budget.toFixed(4)
            ),

          score:
            Number(
              finalScore.toFixed(4)
            ),

          matchScore:
            Math.round(
              Math.max(
                0,
                Math.min(
                  100,
                  finalScore *
                    100
                )
              )
            ),

          reasons
        };
      }
    );

  /*
  Sort highest relevance first.
  */

  ranked.sort(
    (a, b) =>
      b.score - a.score
  );

  /*
  Return useful results.
  */

  return ranked
    .slice(
      0,
      Math.max(
        1,
        Math.min(
          Number(limit) || 20,
          50
        )
      )
    );
}

/*
=========================================================
SEARCH METADATA
=========================================================
*/

export function
parseSearchQuery(query) {

  return {
    query:
      String(query ?? "")
        .trim(),

    ...extractAttributes(
      query
    )
  };
}

/*
=========================================================
STATUS
=========================================================
*/

export function
getSearchEngineStatus() {

  return {

    model:
      MODEL_NAME,

    indexedProducts:
      productsCache.length,

    embeddings:
      productEmbeddings.length,

    ready:
      productsCache.length > 0 &&
      productEmbeddings.length ===
        productsCache.length
  };
}
