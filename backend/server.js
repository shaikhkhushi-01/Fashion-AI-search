/*
=========================================================
FASHION AI DISCOVERY
DAY 6 — PERSONALIZATION ENGINE
=========================================================
*/

import express from "express";
import cors from "cors";
import { pipeline } from "@huggingface/transformers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json({ limit: "1mb" }));

/*
=========================================================
CONFIG
=========================================================
*/

const PORT = process.env.PORT || 10000;

const PRODUCTS_PATH = path.join(
  __dirname,
  "products.json"
);

/*
=========================================================
LOAD PRODUCTS
=========================================================
*/

let products = [];

try {
  products = JSON.parse(
    fs.readFileSync(
      PRODUCTS_PATH,
      "utf-8"
    )
  );

  console.log(
    `Loaded ${products.length} products.`
  );
} catch (error) {
  console.error(
    "Unable to load products.json:",
    error
  );

  process.exit(1);
}

/*
=========================================================
AI MODEL
=========================================================
*/

let embeddingModel = null;
let aiReady = false;

console.log(
  "Starting Fashion AI Discovery..."
);

async function loadAIModel() {
  try {
    console.log(
      "Preparing AI semantic search model..."
    );

    embeddingModel = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );

    aiReady = true;

    console.log(
      "AI embedding model loaded."
    );
  } catch (error) {
    console.error(
      "AI model loading failed:",
      error
    );

    aiReady = false;
  }
}

/*
=========================================================
TEXT NORMALIZATION
=========================================================
*/

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .trim();
}

/*
=========================================================
PRODUCT TEXT
=========================================================
*/

function productText(product) {
  return [
    product.brand,
    product.name,
    product.category,
    product.gender,
    product.color,
    ...(product.material || []),
    ...(product.style || []),
    ...(product.occasion || []),
    ...(product.tags || []),
    product.description,
  ]
    .filter(Boolean)
    .join(" ");
}

/*
=========================================================
COSINE SIMILARITY
=========================================================
*/

function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (
    normA === 0 ||
    normB === 0
  ) {
    return 0;
  }

  return (
    dot /
    (Math.sqrt(normA) *
      Math.sqrt(normB))
  );
}

/*
=========================================================
EMBEDDINGS
=========================================================
*/

const productEmbeddings = new Map();

async function createEmbedding(text) {
  if (!embeddingModel) {
    return null;
  }

  const output =
    await embeddingModel(
      text,
      {
        pooling: "mean",
        normalize: true,
      }
    );

  return Array.from(
    output.data
  );
}

async function indexProducts() {
  if (!embeddingModel) {
    return;
  }

  console.log(
    `Creating AI embeddings for ${products.length} products...`
  );

  for (const product of products) {
    try {
      const embedding =
        await createEmbedding(
          productText(product)
        );

      productEmbeddings.set(
        product.id,
        embedding
      );
    } catch (error) {
      console.error(
        `Embedding failed for product ${product.id}:`,
        error
      );
    }
  }

  console.log(
    `AI indexed products: ${productEmbeddings.size}`
  );
}

/*
=========================================================
PREFERENCE HELPERS
=========================================================
*/

function cleanArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) =>
      normalizeText(item)
    )
    .filter(Boolean);
}

function cleanPreferences(preferences = {}) {
  return {
    gender:
      normalizeText(
        preferences.gender
      ),

    favoriteColors:
      cleanArray(
        preferences.favoriteColors
      ),

    favoriteStyles:
      cleanArray(
        preferences.favoriteStyles
      ),

    favoriteCategories:
      cleanArray(
        preferences.favoriteCategories
      ),

    favoriteMaterials:
      cleanArray(
        preferences.favoriteMaterials
      ),

    occasions:
      cleanArray(
        preferences.occasions
      ),

    budget:
      Number.isFinite(
        Number(preferences.budget)
      )
        ? Number(preferences.budget)
        : null,
  };
}

/*
=========================================================
PERSONALIZATION SCORE
=========================================================
*/

function personalizationScore(
  product,
  preferences
) {
  const prefs =
    cleanPreferences(
      preferences
    );

  let score = 0;
  const reasons = [];

  const productColor =
    normalizeText(
      product.color
    );

  const productGender =
    normalizeText(
      product.gender
    );

  const category =
    normalizeText(
      product.category
    );

  const materials =
    cleanArray(
      product.material
    );

  const styles =
    cleanArray(
      product.style
    );

  const occasions =
    cleanArray(
      product.occasion
    );

  /*
  -----------------------------------------
  GENDER
  -----------------------------------------
  */

  if (
    prefs.gender &&
    productGender &&
    (
      productGender === prefs.gender ||
      productGender === "unisex"
    )
  ) {
    score += 8;

    reasons.push(
      "Matches your preferred gender category."
    );
  }

  /*
  -----------------------------------------
  COLOR
  -----------------------------------------
  */

  if (
    prefs.favoriteColors.includes(
      productColor
    )
  ) {
    score += 15;

    reasons.push(
      `Matches your preferred ${product.color.toLowerCase()} colour.`
    );
  }

  /*
  -----------------------------------------
  STYLE
  -----------------------------------------
  */

  const styleMatches =
    styles.filter((style) =>
      prefs.favoriteStyles.includes(
        style
      )
    );

  if (styleMatches.length) {
    score += Math.min(
      20,
      styleMatches.length * 10
    );

    reasons.push(
      `Matches your preferred ${styleMatches.slice(0, 2).join(" and ")} style.`
    );
  }

  /*
  -----------------------------------------
  CATEGORY
  -----------------------------------------
  */

  if (
    prefs.favoriteCategories.includes(
      category
    )
  ) {
    score += 15;

    reasons.push(
      `Matches your preferred ${product.category.toLowerCase()} category.`
    );
  }

  /*
  -----------------------------------------
  MATERIAL
  -----------------------------------------
  */

  const materialMatches =
    materials.filter((material) =>
      prefs.favoriteMaterials.includes(
        material
      )
    );

  if (materialMatches.length) {
    score += 10;

    reasons.push(
      `Uses your preferred ${materialMatches[0]} material.`
    );
  }

  /*
  -----------------------------------------
  OCCASION
  -----------------------------------------
  */

  const occasionMatches =
    occasions.filter((occasion) =>
      prefs.occasions.includes(
        occasion
      )
    );

  if (occasionMatches.length) {
    score += 12;

    reasons.push(
      `Suitable for your ${occasionMatches[0].toLowerCase()} preference.`
    );
  }

  /*
  -----------------------------------------
  BUDGET
  -----------------------------------------
  */

  if (
    prefs.budget &&
    Number(product.price) <=
      prefs.budget
  ) {
    score += 20;

    reasons.push(
      "Fits within your preferred budget."
    );
  }

  return {
    score,
    reasons,
  };
}

/*
=========================================================
SEARCH
=========================================================
*/

async function semanticSearch(
  query,
  preferences = {}
) {
  const normalizedQuery =
    normalizeText(query);

  if (
    !normalizedQuery
  ) {
    return [];
  }

  let queryEmbedding = null;

  if (aiReady) {
    try {
      queryEmbedding =
        await createEmbedding(
          normalizedQuery
        );
    } catch (error) {
      console.error(
        "Query embedding error:",
        error
      );
    }
  }

  const results =
    products.map(
      (product) => {
        let semanticScore = 0;

        if (
          queryEmbedding &&
          productEmbeddings.has(
            product.id
          )
        ) {
          semanticScore =
            cosineSimilarity(
              queryEmbedding,
              productEmbeddings.get(
                product.id
              )
            );
        }

        const personalization =
          personalizationScore(
            product,
            preferences
          );

        const keywordText =
          normalizeText(
            productText(product)
          );

        const queryWords =
          normalizedQuery
            .split(/\s+/)
            .filter(
              (word) =>
                word.length > 2
            );

        let keywordMatches = 0;

        for (const word of queryWords) {
          if (
            keywordText.includes(
              word
            )
          ) {
            keywordMatches++;
          }
        }

        const keywordScore =
          queryWords.length
            ? keywordMatches /
              queryWords.length
            : 0;

        /*
        -----------------------------------------
        FINAL HYBRID SCORE
        -----------------------------------------
        */

        const finalScore =
          semanticScore * 70 +
          keywordScore * 15 +
          personalization.score;

        return {
          ...product,

          matchScore: Math.round(
            Math.min(
              100,
              finalScore
            )
          ),

          semanticScore:
            Math.round(
              semanticScore * 100
            ),

          personalizationScore:
            Math.round(
              Math.min(
                100,
                personalization.score
              )
            ),

          reasons: [
            ...personalization.reasons,
          ],
        };
      }
    );

  return results
    .sort(
      (a, b) =>
        b.matchScore -
        a.matchScore
    )
    .slice(0, 12);
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
      status: "online",
      service:
        "Fashion AI Discovery",
      version: "6.0.0",

      ai: {
        enabled: aiReady,
        model:
          "Xenova/all-MiniLM-L6-v2",
        type:
          "semantic embedding + personalization",
      },

      products:
        products.length,

      indexedProducts:
        productEmbeddings.size,

      personalization:
        true,

      endpoints: [
        "GET /api/health",
        "GET /api/products",
        "POST /api/search",
        "POST /api/stylist",
        "POST /api/personalize",
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
      products,
      total:
        products.length,
    });
  }
);

/*
=========================================================
PERSONALIZED SEARCH
=========================================================
*/

app.post(
  "/api/search",
  async (req, res) => {
    try {
      const {
        query,
        preferences = {},
      } = req.body || {};

      if (
        !query ||
        !String(query).trim()
      ) {
        return res.status(400).json({
          error:
            "Search query is required.",
        });
      }

      const results =
        await semanticSearch(
          query,
          preferences
        );

      res.json({
        success: true,

        query,

        personalized:
          Object.keys(
            preferences || {}
          ).length > 0,

        results,
      });
    } catch (error) {
      console.error(
        "Search error:",
        error
      );

      res.status(500).json({
        error:
          "AI search failed.",
      });
    }
  }
);

/*
=========================================================
PERSONALIZE
=========================================================
*/

app.post(
  "/api/personalize",
  async (req, res) => {
    try {
      const preferences =
        cleanPreferences(
          req.body?.preferences ||
            {}
        );

      const ranked =
        products
          .map(
            (product) => {
              const result =
                personalizationScore(
                  product,
                  preferences
                );

              return {
                ...product,

                personalizationScore:
                  Math.min(
                    100,
                    result.score
                  ),

                matchScore:
                  Math.min(
                    100,
                    result.score
                  ),

                reasons:
                  result.reasons,
              };
            }
          )
          .sort(
            (a, b) =>
              b.personalizationScore -
              a.personalizationScore
          )
          .slice(0, 12);

      res.json({
        success: true,

        preferences,

        recommendations:
          ranked,
      });
    } catch (error) {
      console.error(
        "Personalization error:",
        error
      );

      res.status(500).json({
        error:
          "Personalization failed.",
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
      const {
        occasion = "",
        style = "",
        comfort = "",
        color = "",
        coverage = "",
        description = "",
        preferences = {},
      } = req.body || {};

      const query = [
        occasion,
        style,
        comfort,
        color,
        coverage,
        description,
      ]
        .filter(Boolean)
        .join(" ");

      if (!query.trim()) {
        return res.status(400).json({
          error:
            "Please describe your desired look.",
        });
      }

      const results =
        await semanticSearch(
          query,
          preferences
        );

      res.json({
        success: true,

        query,

        personalized:
          true,

        recommendations:
          results.slice(0, 8),
      });
    } catch (error) {
      console.error(
        "Stylist error:",
        error
      );

      res.status(500).json({
        error:
          "AI Stylist failed.",
      });
    }
  }
);

/*
=========================================================
START SERVER
=========================================================
*/

async function startServer() {
  await loadAIModel();

  await indexProducts();

  app.listen(
    PORT,
    "0.0.0.0",
    () => {
      console.log(
        `Fashion AI Discovery running on port ${PORT}`
      );

      console.log(
        `AI indexed products: ${productEmbeddings.size}`
      );
    }
  );
}

startServer();
