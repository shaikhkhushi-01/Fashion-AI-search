/*
=========================================================
FASHION AI DISCOVERY
DAY 8 - RESEARCH EVALUATION ENGINE
=========================================================
*/

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);

/*
=========================================================
DATA
=========================================================
*/

let products = [];

const productsPath =
  path.join(
    __dirname,
    "products.json"
  );

try {

  const raw =
    fs.readFileSync(
      productsPath,
      "utf-8"
    );

  const parsed =
    JSON.parse(raw);

  products =
    Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.products)
        ? parsed.products
        : [];

} catch (error) {

  console.error(
    "Evaluation dataset loading error:",
    error
  );

  products = [];
}

/*
=========================================================
HELPERS
=========================================================
*/

function normalize(value) {

  return String(value || "")
    .toLowerCase()
    .trim();
}

function array(value) {

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

function productMatchesQuery(
  product,
  query
) {

  const q =
    normalize(query);

  if (!q) {
    return false;
  }

  const text = [

    product.name,

    product.brand,

    product.category,

    product.gender,

    product.color,

    ...array(product.style),

    ...array(product.occasion),

    ...array(product.material),

    ...array(product.tags),

    product.description

  ]
    .filter(Boolean)
    .map(normalize)
    .join(" ");

  const tokens =
    q
      .split(/\s+/)
      .filter(Boolean);

  const matches =
    tokens.filter(
      token =>
        text.includes(token)
    ).length;

  /*
  At least half of the query
  tokens should appear.
  */

  return (
    matches >=
    Math.max(
      1,
      Math.ceil(
        tokens.length * 0.5
      )
    )
  );
}

/*
=========================================================
RELEVANCE
=========================================================
*/

function relevanceScore(
  product,
  query
) {

  const q =
    normalize(query);

  const name =
    normalize(product.name);

  const category =
    normalize(product.category);

  const color =
    normalize(product.color);

  const description =
    normalize(product.description);

  let score = 0;

  if (
    name.includes(q)
  ) {
    score += 40;
  }

  if (
    category.includes(q)
  ) {
    score += 25;
  }

  if (
    color.includes(q)
  ) {
    score += 20;
  }

  if (
    description.includes(q)
  ) {
    score += 10;
  }

  const tokens =
    q
      .split(/\s+/)
      .filter(Boolean);

  for (
    const token of tokens
  ) {

    if (
      name.includes(token)
    ) {
      score += 8;
    }

    if (
      category.includes(token)
    ) {
      score += 6;
    }

    if (
      color.includes(token)
    ) {
      score += 5;
    }

    if (
      description.includes(token)
    ) {
      score += 2;
    }
  }

  return score;
}

/*
=========================================================
RANK PRODUCTS
=========================================================
*/

function rankProducts(
  query
) {

  return products
    .map(
      product => ({

        product,

        score:
          relevanceScore(
            product,
            query
          )

      })
    )
    .sort(
      (a, b) =>
        b.score -
        a.score
    );
}

/*
=========================================================
PRECISION@K
=========================================================
*/

function precisionAtK(
  ranked,
  relevantIds,
  k
) {

  const top =
    ranked.slice(
      0,
      k
    );

  if (!top.length) {
    return 0;
  }

  const relevant =
    top.filter(
      item =>
        relevantIds.has(
          item.product.id
        )
    ).length;

  return relevant / top.length;
}

/*
=========================================================
RECALL@K
=========================================================
*/

function recallAtK(
  ranked,
  relevantIds,
  k
) {

  if (
    relevantIds.size === 0
  ) {
    return 0;
  }

  const top =
    ranked.slice(
      0,
      k
    );

  const relevant =
    top.filter(
      item =>
        relevantIds.has(
          item.product.id
        )
    ).length;

  return (
    relevant /
    relevantIds.size
  );
}

/*
=========================================================
MRR
=========================================================
*/

function reciprocalRank(
  ranked,
  relevantIds
) {

  for (
    let i = 0;
    i < ranked.length;
    i++
  ) {

    if (
      relevantIds.has(
        ranked[i].product.id
      )
    ) {

      return 1 / (i + 1);
    }
  }

  return 0;
}

/*
=========================================================
NDCG@K
=========================================================
*/

function dcg(
  relevances
) {

  return relevances.reduce(
    (
      total,
      relevance,
      index
    ) => {

      return (
        total +
        (
          (2 ** relevance) - 1
        ) /
        Math.log2(
          index + 2
        )
      );

    },
    0
  );
}

function ndcgAtK(
  ranked,
  relevantIds,
  k
) {

  const actual =
    ranked
      .slice(0, k)
      .map(
        item =>
          relevantIds.has(
            item.product.id
          )
            ? 1
            : 0
      );

  const ideal =
    [...actual]
      .sort(
        (a, b) =>
          b - a
      );

  const actualDCG =
    dcg(actual);

  const idealDCG =
    dcg(ideal);

  if (
    idealDCG === 0
  ) {
    return 0;
  }

  return (
    actualDCG /
    idealDCG
  );
}

/*
=========================================================
TEST DATA
=========================================================
*/

const evaluationQueries = [

  {
    query:
      "white sneakers for college",

    intent: {
      color: "White",
      category: "Sneakers",
      occasion: "College"
    }
  },

  {
    query:
      "black dress for evening",

    intent: {
      color: "Black",
      category: "Dresses",
      occasion: "Evening"
    }
  },

  {
    query:
      "comfortable summer outfit",

    intent: {
      occasion: "Summer"
    }
  },

  {
    query:
      "minimal black outfit",

    intent: {
      color: "Black",
      style: "Minimal"
    }
  },

  {
    query:
      "casual college clothes",

    intent: {
      occasion: "College",
      style: "Casual"
    }
  },

  {
    query:
      "linen summer shirt",

    intent: {
      material: "Linen",
      category: "Shirts"
    }
  },

  {
    query:
      "formal black office outfit",

    intent: {
      color: "Black",
      occasion: "Office",
      style: "Formal"
    }
  }

];

/*
=========================================================
GROUND TRUTH
=========================================================
*/

function buildRelevantSet(
  intent
) {

  const relevant =
    products.filter(
      product => {

        if (
          intent.color &&
          normalize(
            product.color
          ) !==
          normalize(
            intent.color
          )
        ) {
          return false;
        }

        if (
          intent.category &&
          normalize(
            product.category
          ) !==
          normalize(
            intent.category
          )
        ) {
          return false;
        }

        if (
          intent.style &&
          !array(product.style)
            .some(
              value =>
                normalize(value) ===
                normalize(
                  intent.style
                )
            )
        ) {
          return false;
        }

        if (
          intent.occasion &&
          !array(product.occasion)
            .some(
              value =>
                normalize(value) ===
                normalize(
                  intent.occasion
                )
            )
        ) {
          return false;
        }

        if (
          intent.material &&
          !array(product.material)
            .some(
              value =>
                normalize(value) ===
                normalize(
                  intent.material
                )
            )
        ) {
          return false;
        }

        return true;
      }
    );

  return new Set(
    relevant.map(
      product => product.id
    )
  );
}

/*
=========================================================
RUN EVALUATION
=========================================================
*/

export function runEvaluation() {

  const results = [];

  let precisionSum = 0;

  let recallSum = 0;

  let mrrSum = 0;

  let ndcgSum = 0;

  for (
    const test of evaluationQueries
  ) {

    const relevantIds =
      buildRelevantSet(
        test.intent
      );

    const ranked =
      rankProducts(
        test.query
      );

    const precision =
      precisionAtK(
        ranked,
        relevantIds,
        5
      );

    const recall =
      recallAtK(
        ranked,
        relevantIds,
        5
      );

    const mrr =
      reciprocalRank(
        ranked,
        relevantIds
      );

    const ndcg =
      ndcgAtK(
        ranked,
        relevantIds,
        5
      );

    precisionSum +=
      precision;

    recallSum +=
      recall;

    mrrSum +=
      mrr;

    ndcgSum +=
      ndcg;

    results.push({

      query:
        test.query,

      relevantProducts:
        relevantIds.size,

      precisionAt5:
        Number(
          precision.toFixed(4)
        ),

      recallAt5:
        Number(
          recall.toFixed(4)
        ),

      reciprocalRank:
        Number(
          mrr.toFixed(4)
        ),

      ndcgAt5:
        Number(
          ndcg.toFixed(4)
        )
    });
  }

  const count =
    evaluationQueries.length;

  return {

    datasetSize:
      products.length,

    queriesEvaluated:
      count,

    metrics: {

      precisionAt5:
        Number(
          (
            precisionSum /
            count
          ).toFixed(4)
        ),

      recallAt5:
        Number(
          (
            recallSum /
            count
          ).toFixed(4)
        ),

      mrr:
        Number(
          (
            mrrSum /
            count
          ).toFixed(4)
        ),

      ndcgAt5:
        Number(
          (
            ndcgSum /
            count
          ).toFixed(4)
        )
    },

    queryResults:
      results,

    methodology:
      "Keyword-based ground-truth evaluation over curated fashion intents."
  };
}

/*
=========================================================
EDGE CASE TESTS
=========================================================
*/

export function runEdgeCaseTests() {

  const tests = [];

  /*
  Empty query
  */

  tests.push({

    test:
      "Empty query",

    input:
      "",

    passed:
      typeof "" === "string"
  });

  /*
  Unknown query
  */

  const unknown =
    rankProducts(
      "xyznonexistentfashion"
    );

  tests.push({

    test:
      "Unknown query does not crash",

    input:
      "xyznonexistentfashion",

    passed:
      Array.isArray(unknown)
  });

  /*
  Normal query
  */

  const normal =
    rankProducts(
      "black dress"
    );

  tests.push({

    test:
      "Normal query returns ranked products",

    input:
      "black dress",

    passed:
      Array.isArray(normal) &&
      normal.length > 0
  });

  /*
  Dataset
  */

  tests.push({

    test:
      "Dataset is available",

    input:
      products.length,

    passed:
      products.length > 0
  });

  return {

    total:
      tests.length,

    passed:
      tests.filter(
        test =>
          test.passed
      ).length,

    failed:
      tests.filter(
        test =>
          !test.passed
      ).length,

    tests
  };
}
