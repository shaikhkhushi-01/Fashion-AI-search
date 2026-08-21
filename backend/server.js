import express from "express";
import cors from "cors";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { pipeline } from "@huggingface/transformers";

/*
=========================================================
FASHION AI DISCOVERY
DAY 2 — AI SEMANTIC SEARCH + HYBRID RANKING
=========================================================
*/

const app = express();

const PORT = process.env.PORT || 3000;

const MODEL_NAME = "Xenova/all-MiniLM-L6-v2";

/*
=========================================================
MIDDLEWARE
=========================================================
*/

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json({ limit: "1mb" }));

/*
=========================================================
PATH
=========================================================
*/

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const productsPath = path.join(
  __dirname,
  "..",
  "data",
  "products.json"
);

/*
=========================================================
AI STATE
=========================================================
*/

let extractor = null;

let products = [];

let productEmbeddings = [];

let modelReady = false;

/*
=========================================================
NORMALIZATION
=========================================================
*/

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function arrayValue(value) {
  if (Array.isArray(value)) {
    return value
      .map(normalize)
      .filter(Boolean);
  }

  if (
    value === undefined ||
    value === null
  ) {
    return [];
  }

  return [normalize(value)].filter(Boolean);
}

function tokenize(value) {
  return normalize(value)
    .split(/\s+/)
    .filter(
      (word) =>
        word.length > 1
    );
}

/*
=========================================================
PRODUCT SEARCH TEXT
=========================================================
*/

function productToText(product) {
  const occasions =
    arrayValue(product.occasion);

  const styles =
    arrayValue(product.style);

  const tags =
    arrayValue(product.tags);

  const materials =
    arrayValue(product.material);

  return [
    `Name: ${product.name || ""}`,
    `Brand: ${product.brand || ""}`,
    `Category: ${product.category || ""}`,
    `Gender: ${product.gender || ""}`,
    `Color: ${product.color || ""}`,
    `Material: ${materials.join(", ")}`,
    `Occasion: ${occasions.join(", ")}`,
    `Style: ${styles.join(", ")}`,
    `Tags: ${tags.join(", ")}`,
    `Description: ${product.description || ""}`,
  ]
    .join(". ")
    .replace(/\s+/g, " ")
    .trim();
}

/*
=========================================================
KEYWORD BASELINE
=========================================================
*/

function keywordScore(
  query,
  product
) {
  const words = tokenize(query);

  const searchable = normalize(
    [
      product.name,
      product.brand,
      product.category,
      product.gender,
      product.color,
      product.description,
      ...arrayValue(product.material),
      ...arrayValue(product.occasion),
      ...arrayValue(product.style),
      ...arrayValue(product.tags),
    ].join(" ")
  );

  const name =
    normalize(product.name);

  const category =
    normalize(product.category);

  const brand =
    normalize(product.brand);

  const tags =
    arrayValue(product.tags);

  const styles =
    arrayValue(product.style);

  const occasions =
    arrayValue(product.occasion);

  let score = 0;

  for (const word of words) {

    if (searchable.includes(word)) {
      score += 1;
    }

    if (name.includes(word)) {
      score += 4;
    }

    if (category.includes(word)) {
      score += 3;
    }

    if (brand.includes(word)) {
      score += 2;
    }

    if (
      tags.some(
        (tag) =>
          tag.includes(word)
      )
    ) {
      score += 2;
    }

    if (
      styles.some(
        (style) =>
          style.includes(word)
      )
    ) {
      score += 2;
    }

    if (
      occasions.some(
        (occasion) =>
          occasion.includes(word)
      )
    ) {
      score += 2;
    }
  }

  return score;
}

/*
=========================================================
TENSOR
=========================================================
*/

function tensorToArray(tensor) {
  return Array.from(
    tensor.data
  );
}

/*
=========================================================
COSINE SIMILARITY
=========================================================
*/

function cosineSimilarity(a, b) {

  let dot = 0;

  let magnitudeA = 0;

  let magnitudeB = 0;

  const length =
    Math.min(
      a.length,
      b.length
    );

  for (
    let i = 0;
    i < length;
    i++
  ) {
    dot += a[i] * b[i];

    magnitudeA +=
      a[i] * a[i];

    magnitudeB +=
      b[i] * b[i];
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
EMBEDDING
=========================================================
*/

async function createEmbedding(text) {

  if (!extractor) {
    throw new Error(
      "AI embedding model is not ready."
    );
  }

  const output =
    await extractor(
      text,
      {
        pooling: "mean",
        normalize: true,
      }
    );

  return tensorToArray(
    output
  );
}

/*
=========================================================
LOAD PRODUCTS
=========================================================
*/

async function loadProducts() {

  console.log(
    "Loading Fashion AI Discovery products..."
  );

  const file =
    await fs.readFile(
      productsPath,
      "utf8"
    );

  const parsed =
    JSON.parse(file);

  if (
    !Array.isArray(parsed)
  ) {
    throw new Error(
      "products.json must contain an array."
    );
  }

  products = parsed;

  console.log(
    `Loaded ${products.length} products.`
  );
}

/*
=========================================================
LOAD AI MODEL
=========================================================
*/

async function loadModel() {

  console.log(
    "Loading AI embedding model..."
  );

  console.log(
    `Model: ${MODEL_NAME}`
  );

  extractor =
    await pipeline(
      "feature-extraction",
      MODEL_NAME
    );

  console.log(
    "AI embedding model loaded."
  );
}

/*
=========================================================
BUILD PRODUCT INDEX
=========================================================
*/

async function buildProductIndex() {

  console.log(
    "Creating AI embeddings for products..."
  );

  productEmbeddings = [];

  for (
    const product of products
  ) {

    console.log(
      `Embedding: ${product.name}`
    );

    const embedding =
      await createEmbedding(
        productToText(product)
      );

    productEmbeddings.push({
      productId:
        product.id,
      embedding,
    });
  }

  console.log(
    `AI product index ready: ${productEmbeddings.length}`
  );
}

/*
=========================================================
BUDGET EXTRACTION
=========================================================
*/

function extractBudget(query) {

  const text =
    normalize(query)
      .replace(/,/g, "");

  const patterns = [

    /under\s*(?:₹|rs|inr)?\s*(\d+)/i,

    /below\s*(?:₹|rs|inr)?\s*(\d+)/i,

    /less than\s*(?:₹|rs|inr)?\s*(\d+)/i,

    /upto\s*(?:₹|rs|inr)?\s*(\d+)/i,

    /up to\s*(?:₹|rs|inr)?\s*(\d+)/i,

    /budget\s*(?:of|is)?\s*(?:₹|rs|inr)?\s*(\d+)/i,

    /(?:₹|rs|inr)\s*(\d+)/i,
  ];

  for (
    const pattern of patterns
  ) {

    const match =
      text.match(pattern);

    if (match) {

      const amount =
        Number(match[1]);

      if (
        Number.isFinite(amount) &&
        amount > 0
      ) {
        return amount;
      }
    }
  }

  return null;
}

/*
=========================================================
ATTRIBUTE HELPERS
=========================================================
*/

function attributeMatch(
  values,
  requested
) {

  if (!requested) {
    return 0;
  }

  const productValues =
    arrayValue(values);

  const request =
    normalize(requested);

  if (!request) {
    return 0;
  }

  if (
    productValues.includes(
      request
    )
  ) {
    return 1;
  }

  if (
    productValues.some(
      (value) =>
        value.includes(request) ||
        request.includes(value)
    )
  ) {
    return 0.75;
  }

  return 0;
}

/*
=========================================================
INFER COMFORT
=========================================================
*/

function inferComfort(
  product
) {

  const text =
    normalize(
      [
        product.description,
        product.style,
        product.tags,
      ].flat().join(" ")
    );

  if (
    text.includes("very high") ||
    text.includes("very-high")
  ) {
    return 1;
  }

  if (
    text.includes("comfortable") ||
    text.includes("soft") ||
    text.includes("breathable") ||
    text.includes("relaxed")
  ) {
    return 0.9;
  }

  if (
    text.includes("lightweight")
  ) {
    return 0.8;
  }

  return 0.5;
}

/*
=========================================================
INFER COVERAGE
=========================================================
*/

function inferCoverage(
  product
) {

  const text =
    normalize(
      [
        product.name,
        product.category,
        product.description,
        product.tags,
      ].flat().join(" ")
    );

  if (
    text.includes("abaya") ||
    text.includes("full coverage") ||
    text.includes("gown")
  ) {
    return 1;
  }

  if (
    text.includes("dress") ||
    text.includes("kurta") ||
    text.includes("kurti")
  ) {
    return 0.8;
  }

  return 0.5;
}

/*
=========================================================
SEMANTIC SEARCH
=========================================================
*/

async function semanticSearch(
  query,
  limit = 8
) {

  const queryEmbedding =
    await createEmbedding(
      query
    );

  const budget =
    extractBudget(query);

  const ranked =
    productEmbeddings
      .map((item) => {

        const product =
          products.find(
            (p) =>
              String(p.id) ===
              String(item.productId)
          );

        if (!product) {
          return null;
        }

        const semanticSimilarity =
          cosineSimilarity(
            queryEmbedding,
            item.embedding
          );

        const semanticScore =
          Math.max(
            0,
            Math.min(
              100,
              Math.round(
                semanticSimilarity *
                100
              )
            )
          );

        const keywords =
          keywordScore(
            query,
            product
          );

        const keywordNormalized =
          Math.min(
            100,
            keywords * 8
          );

        let budgetScore = 50;

        if (budget !== null) {

          const price =
            Number(product.price);

          if (
            Number.isFinite(price)
          ) {

            if (
              price <= budget
            ) {
              budgetScore = 100;
            } else {

              const difference =
                price - budget;

              const penalty =
                Math.min(
                  100,
                  (difference /
                    budget) *
                    100
                );

              budgetScore =
                Math.max(
                  0,
                  100 - penalty
                );
            }
          }
        }

        let finalScore;

        if (budget !== null) {

          finalScore =
            semanticScore * 0.65 +
            keywordNormalized * 0.20 +
            budgetScore * 0.15;

        } else {

          finalScore =
            semanticScore * 0.75 +
            keywordNormalized * 0.25;
        }

        const reasons = [];

        if (
          semanticScore >= 70
        ) {
          reasons.push(
            "strong semantic match"
          );
        }

        if (
          keywords >= 2
        ) {
          reasons.push(
            "matches important fashion attributes"
          );
        }

        if (
          budget !== null &&
          Number(product.price) <= budget
        ) {
          reasons.push(
            "within your stated budget"
          );
        }

        if (
          reasons.length === 0
        ) {
          reasons.push(
            "matches the overall intent of your search"
          );
        }

        return {

          ...product,

          score:
            Number(
              (
                finalScore /
                100
              ).toFixed(4)
            ),

          matchScore:
            Math.round(
              finalScore
            ),

          semanticScore,

          keywordScore:
            keywords,

          budgetScore:
            Math.round(
              budgetScore
            ),

          reasons,
        };
      })
      .filter(Boolean)
      .sort(
        (a, b) =>
          b.score - a.score
      )
      .slice(0, limit);

  return {
    results: ranked,
    budget,
  };
}

/*
=========================================================
AI STYLIST QUERY
=========================================================
*/

function buildStylistQuery(
  preferences
) {

  const parts = [];

  if (
    preferences.description
  ) {
    parts.push(
      preferences.description
    );
  }

  if (
    preferences.occasion
  ) {
    parts.push(
      `occasion ${preferences.occasion}`
    );
  }

  if (
    preferences.style
  ) {
    parts.push(
      `style ${preferences.style}`
    );
  }

  if (
    preferences.color
  ) {
    parts.push(
      `color ${preferences.color}`
    );
  }

  if (
    preferences.comfort
  ) {
    parts.push(
      `comfort ${preferences.comfort}`
    );
  }

  if (
    preferences.coverage
  ) {
    parts.push(
      `coverage ${preferences.coverage}`
    );
  }

  return parts
    .join(". ")
    .replace(/\s+/g, " ")
    .trim();
}

/*
=========================================================
AI STYLIST RANKING
=========================================================
*/

async function rankStylistProducts(
  preferences
) {

  const query =
    buildStylistQuery(
      preferences
    );

  const queryEmbedding =
    await createEmbedding(
      query
    );

  const ranked =
    productEmbeddings
      .map((item) => {

        const product =
          products.find(
            (p) =>
              String(p.id) ===
              String(item.productId)
          );

        if (!product) {
          return null;
        }

        const semanticSimilarity =
          cosineSimilarity(
            queryEmbedding,
            item.embedding
          );

        const semanticScore =
          Math.max(
            0,
            Math.min(
              100,
              semanticSimilarity * 100
            )
          );

        const occasionScore =
          attributeMatch(
            product.occasion,
            preferences.occasion
          ) * 100;

        const styleScore =
          attributeMatch(
            product.style,
            preferences.style
          ) * 100;

        const colorScore =
          attributeMatch(
            product.color,
            preferences.color
          ) * 100;

        const comfortBase =
          inferComfort(product);

        let comfortScore =
          comfortBase * 100;

        if (
          preferences.comfort
        ) {

          const requested =
            normalize(
              preferences.comfort
            );

          if (
            requested === "very-high" &&
            comfortBase >= 0.9
          ) {
            comfortScore = 100;
          } else if (
            requested === "high" &&
            comfortBase >= 0.8
          ) {
            comfortScore = 100;
          } else if (
            requested === "medium" &&
            comfortBase >= 0.5
          ) {
            comfortScore = 80;
          } else if (
            requested === "low"
          ) {
            comfortScore = 60;
          } else {
            comfortScore *= 0.5;
          }
        }

        const coverageBase =
          inferCoverage(product);

        let coverageScore =
          coverageBase * 100;

        if (
          preferences.coverage
        ) {

          const requestedCoverage =
            normalize(
              preferences.coverage
            );

          if (
            requestedCoverage ===
              "full" &&
            coverageBase >= 0.8
          ) {
            coverageScore = 100;
          } else {
            coverageScore *= 0.5;
          }
        }

        const keyword =
          keywordScore(
            query,
            product
          );

        const keywordNormalized =
          Math.min(
            100,
            keyword * 10
          );

        const finalScore =
          semanticScore * 0.40 +
          occasionScore * 0.15 +
          styleScore * 0.15 +
          comfortScore * 0.10 +
          colorScore * 0.05 +
          coverageScore * 0.05 +
          keywordNormalized * 0.10;

        const reasons = [];

        if (
          occasionScore >= 75
        ) {
          reasons.push(
            `fits your ${preferences.occasion} occasion`
          );
        }

        if (
          styleScore >= 75
        ) {
          reasons.push(
            `matches your ${preferences.style} style`
          );
        }

        if (
          colorScore >= 75
        ) {
          reasons.push(
            `matches your ${preferences.color} colour preference`
          );
        }

        if (
          comfortScore >= 80 &&
          preferences.comfort
        ) {
          reasons.push(
            `supports your ${preferences.comfort} comfort preference`
          );
        }

        if (
          coverageScore >= 80 &&
          preferences.coverage
        ) {
          reasons.push(
            "matches your coverage preference"
          );
        }

        if (
          reasons.length === 0
        ) {
          reasons.push(
            "strong overall semantic match"
          );
        }

        return {

          ...product,

          score:
            Number(
              (
                finalScore /
                100
              ).toFixed(4)
            ),

          matchScore:
            Math.max(
              0,
              Math.min(
                100,
                Math.round(
                  finalScore
                )
              )
            ),

          matchBreakdown: {
            semantic:
              Math.round(
                semanticScore
              ),
            occasion:
              Math.round(
                occasionScore
              ),
            style:
              Math.round(
                styleScore
              ),
            comfort:
              Math.round(
                comfortScore
              ),
            color:
              Math.round(
                colorScore
              ),
            coverage:
              Math.round(
                coverageScore
              ),
            keyword:
              Math.round(
                keywordNormalized
              ),
          },

          reasons,
        };
      })
      .filter(Boolean)
      .sort(
        (a, b) =>
          b.matchScore -
          a.matchScore
      );

  return ranked;
}

/*
=========================================================
HEALTH
=========================================================
*/

app.get(
  "/api/health",
  (req, res) => {

    res.json({

      status:
        modelReady
          ? "online"
          : "loading",

      service:
        "Fashion AI Discovery",

      version:
        "2.0.0",

      ai: {
        enabled:
          modelReady,

        model:
          MODEL_NAME,

        type:
          "semantic-embedding-search",
      },

      products:
        products.length,

      indexedProducts:
        productEmbeddings.length,

      endpoints: [
        "GET /api/health",
        "GET /api/products",
        "POST /api/search",
        "POST /api/stylist",
      ],
    });
  }
);

/*
=========================================================
PRODUCTS
=========================================================
*/

app.get(
  "/api/products",
  (req, res) => {

    res.json({
      success: true,
      count: products.length,
      products,
    });
  }
);

/*
=========================================================
SEARCH
=========================================================
*/

app.post(
  "/api/search",
  async (req, res) => {

    try {

      const query =
        typeof req.body?.query ===
        "string"
          ? req.body.query.trim()
          : "";

      if (!query) {
        return res.status(400).json({
          success: false,
          error:
            "Search query is required.",
        });
      }

      if (
        !modelReady ||
        !extractor
      ) {
        return res.status(503).json({
          success: false,
          error:
            "AI model is still loading.",
        });
      }

      const search =
        await semanticSearch(
          query,
          8
        );

      res.json({

        success: true,

        query,

        retrievalMethod:
          "AI semantic embeddings + hybrid ranking",

        embeddingModel:
          MODEL_NAME,

        budget:
          search.budget,

        resultCount:
          search.results.length,

        results:
          search.results,
      });

    } catch (error) {

      console.error(
        "Search error:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          "AI semantic search failed.",
      });
    }
  }
);

/*
=========================================================
AI STYLIST
=========================================================
*/

app.post(
  "/api/stylist",
  async (req, res) => {

    try {

      const preferences =
        req.body || {};

      const hasPreference =
        Boolean(
          preferences.description ||
          preferences.occasion ||
          preferences.style ||
          preferences.color ||
          preferences.comfort ||
          preferences.coverage
        );

      if (!hasPreference) {
        return res.status(400).json({
          success: false,
          error:
            "Please provide at least one styling preference.",
        });
      }

      if (
        !modelReady ||
        !extractor
      ) {
        return res.status(503).json({
          success: false,
          error:
            "AI stylist is still loading.",
        });
      }

      const ranked =
        await rankStylistProducts(
          preferences
        );

      const recommendations =
        ranked.slice(0, 6);

      res.json({

        success: true,

        engine:
          "Fashion AI Discovery Stylist",

        retrievalMethod:
          "Semantic + structured attribute + keyword ranking",

        model:
          MODEL_NAME,

        query:
          buildStylistQuery(
            preferences
          ),

        preferences,

        resultCount:
          recommendations.length,

        recommendations,
      });

    } catch (error) {

      console.error(
        "AI Stylist error:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          "AI Stylist recommendation failed.",
      });
    }
  }
);

/*
=========================================================
START
=========================================================
*/

async function startServer() {

  try {

    console.log(
      "Starting Fashion AI Discovery..."
    );

    await loadProducts();

    await loadModel();

    await buildProductIndex();

    modelReady = true;

    app.listen(
      PORT,
      () => {

        console.log(
          `Fashion AI Discovery running on port ${PORT}`
        );

        console.log(
          `AI indexed products: ${productEmbeddings.length}`
        );
      }
    );

  } catch (error) {

    console.error(
      "Backend startup failed:",
      error
    );

    process.exit(1);
  }
}

startServer();
