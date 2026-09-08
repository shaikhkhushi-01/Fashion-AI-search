import {
  getSemanticScoreMap
} from "./semanticSearch.js";

function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value) {
  return normalizeText(value)
    .split(/\s+/)
    .filter(Boolean);
}

function uniqueTokens(tokens) {
  return [
    ...new Set(
      tokens.filter(Boolean)
    )
  ];
}

const SYNONYMS = {
  dress: [
    "dress",
    "gown",
    "frock"
  ],
  shirt: [
    "shirt",
    "top",
    "blouse"
  ],
  tshirt: [
    "tshirt",
    "t-shirt",
    "tee"
  ],
  jeans: [
    "jeans",
    "denim"
  ],
  pants: [
    "pants",
    "trousers",
    "bottoms"
  ],
  shoes: [
    "shoes",
    "footwear",
    "sneakers",
    "heels",
    "flats"
  ],
  casual: [
    "casual",
    "everyday",
    "daily"
  ],
  formal: [
    "formal",
    "office",
    "workwear",
    "professional"
  ],
  party: [
    "party",
    "celebration",
    "festive"
  ],
  summer: [
    "summer",
    "hot",
    "warm"
  ],
  winter: [
    "winter",
    "cold",
    "warmwear"
  ],
  black: [
    "black",
    "dark"
  ],
  white: [
    "white",
    "ivory",
    "cream"
  ],
  red: [
    "red",
    "maroon",
    "burgundy"
  ],
  blue: [
    "blue",
    "navy"
  ],
  green: [
    "green",
    "olive"
  ],
  cotton: [
    "cotton"
  ],
  silk: [
    "silk"
  ],
  oversized: [
    "oversized",
    "loose",
    "baggy"
  ],
  slim: [
    "slim",
    "fitted",
    "skinny"
  ]
};

function expandTerms(tokens) {
  const expanded = new Set(
    tokens
  );

  for (
    const token of tokens
  ) {
    const synonyms =
      SYNONYMS[token];

    if (!synonyms) {
      continue;
    }

    for (
      const synonym of synonyms
    ) {
      expanded.add(
        synonym
      );
    }
  }

  return [
    ...expanded
  ];
}

function productToText(product) {
  const values = [
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
  ];

  return normalizeText(
    values
      .flat()
      .filter(Boolean)
      .join(" ")
  );
}

function asArray(value) {
  if (
    Array.isArray(value)
  ) {
    return value
      .map(
        item =>
          String(item ?? "")
            .trim()
      )
      .filter(Boolean);
  }

  if (
    typeof value === "string" &&
    value.trim()
  ) {
    return value
      .split(",")
      .map(
        item =>
          item.trim()
      )
      .filter(Boolean);
  }

  return [];
}

function parseNumber(value) {
  const number =
    Number(
      String(value ?? "")
        .replace(/[^\d.]/g, "")
    );

  return Number.isFinite(number)
    ? number
    : null;
}

function extractBudget(query) {
  const text =
    normalizeText(
      query
    );

  const patterns = [
    /under\s+(\d+(?:\.\d+)?)/,
    /below\s+(\d+(?:\.\d+)?)/,
    /less\s+than\s+(\d+(?:\.\d+)?)/,
    /upto\s+(\d+(?:\.\d+)?)/,
    /up\s+to\s+(\d+(?:\.\d+)?)/,
    /within\s+(\d+(?:\.\d+)?)/
  ];

  for (
    const pattern of patterns
  ) {
    const match =
      text.match(
        pattern
      );

    if (match) {
      return {
        max:
          Number(
            match[1]
          )
      };
    }
  }

  return {
    max: null
  };
}

function keywordScore(
  queryTokens,
  product
) {
  const productText =
    productToText(
      product
    );

  if (
    !productText ||
    !queryTokens.length
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
      matched += 1;
    }
  }

  return Math.min(
    1,
    matched /
      queryTokens.length
  );
}

function fieldMatch(
  tokens,
  value
) {
  const values =
    asArray(
      value
    ).map(
      item =>
        normalizeText(
          item
        )
    );

  if (
    !tokens.length ||
    !values.length
  ) {
    return 0;
  }

  let matched = 0;

  for (
    const token of tokens
  ) {
    if (
      values.some(
        value =>
          value.includes(
            token
          ) ||
          token.includes(
            value
          )
      )
    ) {
      matched += 1;
    }
  }

  return Math.min(
    1,
    matched /
      tokens.length
  );
}

function attributeScore(
  queryTokens,
  product
) {
  const fields = [
    product?.category,
    product?.color,
    product?.style,
    product?.occasion,
    product?.material,
    product?.fit,
    product?.pattern,
    product?.fabric,
    product?.gender
  ];

  const scores =
    fields.map(
      field =>
        fieldMatch(
          queryTokens,
          field
        )
    );

  return Math.max(
    0,
    ...scores
  );
}

function budgetScore(
  budget,
  product
) {
  if (
    budget?.max == null
  ) {
    return 0.5;
  }

  const price =
    parseNumber(
      product?.price
    );

  if (
    price == null
  ) {
    return 0;
  }

  if (
    price <= budget.max
  ) {
    return 1;
  }

  const difference =
    price -
    budget.max;

  return Math.max(
    0,
    1 -
      difference /
        Math.max(
          budget.max,
          1
        )
  );
}

function metadataScore(
  product
) {
  let score = 0;

  if (
    product?.name
  ) {
    score += 0.2;
  }

  if (
    product?.brand
  ) {
    score += 0.2;
  }

  if (
    product?.category
  ) {
    score += 0.2;
  }

  if (
    product?.description
  ) {
    score += 0.2;
  }

  if (
    product?.image
  ) {
    score += 0.2;
  }

  return score;
}

function getSemanticScore(
  product,
  semanticScores
) {
  const id =
    String(
      product?.id ?? ""
    );

  if (
    semanticScores?.has(id)
  ) {
    return Number(
      semanticScores.get(id)
    );
  }

  const values = [
    product?.semanticScore,
    product?.semantic_similarity,
    product?.similarity,
    product?.embeddingScore,
    product?.vectorScore
  ];

  for (
    const value of values
  ) {
    const number =
      Number(
        value
      );

    if (
      Number.isFinite(number)
    ) {
      return Math.max(
        0,
        Math.min(
          1,
          number
        )
      );
    }
  }

  return 0;
}

function calculateHybridScore(
  product,
  query,
  options = {}
) {
  const tokens =
    expandTerms(
      uniqueTokens(
        tokenize(
          query
        )
      )
    );

  const semantic =
    getSemanticScore(
      product,
      options.semanticScores
    );

  const keyword =
    keywordScore(
      tokens,
      product
    );

  const attributes =
    attributeScore(
      tokens,
      product
    );

  const budget =
    budgetScore(
      options.budget,
      product
    );

  const metadata =
    metadataScore(
      product
    );

  const score =
    semantic * 0.45 +
    keyword * 0.20 +
    attributes * 0.20 +
    budget * 0.10 +
    metadata * 0.05;

  return {
    score:
      Number(
        score.toFixed(6)
      ),
    components: {
      semantic:
        Number(
          semantic.toFixed(6)
        ),
      keyword:
        Number(
          keyword.toFixed(6)
        ),
      attributes:
        Number(
          attributes.toFixed(6)
        ),
      budget:
        Number(
          budget.toFixed(6)
        ),
      metadata:
        Number(
          metadata.toFixed(6)
        )
    }
  };
}

function generateReasons(
  product,
  query,
  components
) {
  const reasons = [];

  if (
    components.semantic >=
    0.55
  ) {
    reasons.push(
      "Strong semantic match"
    );
  }

  if (
    components.keyword >=
    0.5
  ) {
    reasons.push(
      "Matches your search terms"
    );
  }

  if (
    components.attributes >=
    0.5
  ) {
    reasons.push(
      "Matches relevant fashion attributes"
    );
  }

  if (
    components.budget >=
    0.9
  ) {
    reasons.push(
      "Fits your budget"
    );
  }

  if (
    components.metadata >=
    0.8
  ) {
    reasons.push(
      "Rich product information"
    );
  }

  if (
    !reasons.length
  ) {
    reasons.push(
      "Relevant to your search"
    );
  }

  return reasons;
}

async function hybridRetrieve(
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
    String(
      query ?? ""
    ).trim();

  if (!cleanQuery) {
    return [];
  }

  const limit =
    Math.max(
      1,
      Math.min(
        Number(options.limit) || 20,
        100
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
      : 0;

  const budget =
    options.budget ||
    extractBudget(
      cleanQuery
    );

  const semanticScores =
    await getSemanticScoreMap(
      products,
      cleanQuery
    );

  return products
    .map(
      product => {
        const result =
          calculateHybridScore(
            product,
            cleanQuery,
            {
              ...options,
              budget,
              semanticScores
            }
          );

        return {
          ...product,
          score:
            result.score,
          relevance:
            result.score,
          semanticScore:
            result.components.semantic,
          components:
            result.components,
          reasons:
            generateReasons(
              product,
              cleanQuery,
              result.components
            )
        };
      }
    )
    .filter(
      product =>
        product.score >=
        minScore
    )
    .sort(
      (a, b) =>
        b.score -
        a.score
    )
    .slice(
      0,
      limit
    );
}

async function searchProducts(
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
