/*
=========================================================
FASHION AI DISCOVERY
DAY 4 — AI STYLIST + PERSONALIZED RECOMMENDATIONS
=========================================================
*/

import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pipeline } from "@huggingface/transformers";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = process.env.PORT || 10000;

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
PRODUCT DATA
=========================================================
*/

const possibleProductFiles = [
  path.join(__dirname, "products.json"),
  path.join(__dirname, "../products.json"),
  path.join(__dirname, "../data/products.json"),
];

let PRODUCTS = [];

function loadProducts() {
  for (const file of possibleProductFiles) {
    if (fs.existsSync(file)) {
      try {
        const raw = fs.readFileSync(file, "utf8");
        const parsed = JSON.parse(raw);

        PRODUCTS = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed.products)
          ? parsed.products
          : [];

        console.log(`Loaded ${PRODUCTS.length} products.`);
        return;
      } catch (error) {
        console.error("Product JSON error:", error.message);
      }
    }
  }

  console.error("products.json not found.");
}

loadProducts();

/*
=========================================================
AI MODEL
=========================================================
*/

const MODEL_NAME = "Xenova/all-MiniLM-L6-v2";

let embedder = null;
let productEmbeddings = [];

async function loadAIModel() {
  try {
    console.log("Preparing AI semantic search model...");
    console.log(`Creating AI embeddings for ${PRODUCTS.length} products...`);

    embedder = await pipeline(
      "feature-extraction",
      MODEL_NAME
    );

    console.log("AI embedding model loaded.");

    productEmbeddings = [];

    for (const product of PRODUCTS) {
      const text = productToText(product);

      const embedding = await embedText(text);

      productEmbeddings.push({
        product,
        embedding,
      });
    }

    console.log("AI product index ready.");
    console.log(`AI indexed products: ${productEmbeddings.length}`);
  } catch (error) {
    console.error("AI model initialization failed:", error);
  }
}

/*
=========================================================
TEXT NORMALIZATION
=========================================================
*/

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .trim();
}

function arrayValue(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === undefined || value === null || value === "") {
    return [];
  }

  return [value];
}

/*
=========================================================
PRODUCT → SEARCHABLE TEXT
=========================================================
*/

function productToText(product) {
  const values = [
    product.name,
    product.brand,
    product.category,
    product.description,
    product.color,
    product.price,
    ...arrayValue(product.style),
    ...arrayValue(product.material),
    ...arrayValue(product.occasion),
    ...arrayValue(product.fit),
    ...arrayValue(product.gender),
  ];

  return values
    .filter(Boolean)
    .join(" ");
}

/*
=========================================================
EMBEDDING
=========================================================
*/

async function embedText(text) {
  if (!embedder) {
    throw new Error("AI model is not ready.");
  }

  const output = await embedder(
    String(text || ""),
    {
      pooling: "mean",
      normalize: true,
    }
  );

  return Array.from(output.data);
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
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  if (!magnitudeA || !magnitudeB) {
    return 0;
  }

  return (
    dot /
    (Math.sqrt(magnitudeA) *
      Math.sqrt(magnitudeB))
  );
}

/*
=========================================================
BUDGET EXTRACTION
=========================================================
*/

function extractBudget(query) {
  const text = normalize(query);

  const matches = [
    ...text.matchAll(
      /(?:under|below|less than|within|max|upto|up to|budget)\s*(?:₹|rs\.?|inr)?\s*([\d,]+)/gi
    ),
  ];

  if (!matches.length) {
    return null;
  }

  const number = Number(
    matches[matches.length - 1][1].replace(/,/g, "")
  );

  return Number.isFinite(number) ? number : null;
}

/*
=========================================================
DIRECT PREFERENCE MATCH
=========================================================
*/

function containsValue(product, field, target) {
  if (!target) {
    return false;
  }

  const wanted = normalize(target);

  const values = arrayValue(product[field]);

  return values.some((value) => {
    return normalize(value).includes(wanted);
  });
}

/*
=========================================================
PERSONALIZATION SCORE
=========================================================
*/

function personalizationScore(product, preferences) {
  let score = 0;
  let matched = 0;

  const fields = [
    ["occasion", 18],
    ["style", 18],
    ["comfort", 12],
    ["color", 12],
    ["coverage", 10],
  ];

  for (const [field, weight] of fields) {
    const value = preferences[field];

    if (!value) {
      continue;
    }

    if (containsValue(product, field, value)) {
      score += weight;
      matched += 1;
      continue;
    }

    const productText = normalize(productToText(product));

    if (productText.includes(normalize(value))) {
      score += weight * 0.55;
      matched += 1;
    }
  }

  return {
    score,
    matched,
  };
}

/*
=========================================================
RECOMMENDATION REASONS
=========================================================
*/

function generateReasons(product, preferences, semanticScore) {
  const reasons = [];

  if (
    preferences.occasion &&
    containsValue(
      product,
      "occasion",
      preferences.occasion
    )
  ) {
    reasons.push(
      `Matches your ${preferences.occasion} occasion`
    );
  }

  if (
    preferences.style &&
    containsValue(
      product,
      "style",
      preferences.style
    )
  ) {
    reasons.push(
      `Fits your ${preferences.style} style preference`
    );
  }

  if (
    preferences.color &&
    normalize(product.color).includes(
      normalize(preferences.color)
    )
  ) {
    reasons.push(
      `Matches your preferred ${preferences.color} colour`
    );
  }

  if (
    preferences.comfort &&
    containsValue(
      product,
      "comfort",
      preferences.comfort
    )
  ) {
    reasons.push(
      `Aligned with your comfort preference`
    );
  }

  if (
    semanticScore >= 0.65
  ) {
    reasons.push(
      "Strong semantic match to your description"
    );
  }

  if (!reasons.length) {
    reasons.push(
      "Selected based on overall fashion compatibility"
    );
  }

  return reasons.slice(0, 4);
}

/*
=========================================================
PERSONALIZED PRODUCT RANKING
=========================================================
*/

async function personalizedRecommendations(
  query,
  preferences
) {
  if (!productEmbeddings.length) {
    return [];
  }

  const queryEmbedding = await embedText(query);

  const budget = extractBudget(query);

  const scored = productEmbeddings.map(
    ({ product, embedding }) => {
      const semanticSimilarity =
        cosineSimilarity(
          queryEmbedding,
          embedding
        );

      const personalization =
        personalizationScore(
          product,
          preferences
        );

      let finalScore =
        semanticSimilarity * 70 +
        personalization.score;

      /*
      ================================================
      BUDGET BONUS / PENALTY
      ================================================
      */

      const price = Number(product.price);

      if (
        budget &&
        Number.isFinite(price)
      ) {
        if (price <= budget) {
          finalScore += 10;
        } else {
          finalScore -= 20;
        }
      }

      finalScore = Math.max(
        0,
        Math.min(
          100,
          finalScore
        )
      );

      const reasons =
        generateReasons(
          product,
          preferences,
          semanticSimilarity
        );

      return {
        ...product,

        matchScore: Math.round(
          finalScore
        ),

        semanticScore:
          Number(
            semanticSimilarity.toFixed(4)
          ),

        personalizationScore:
          Math.round(
            personalization.score
          ),

        reasons,
      };
    }
  );

  scored.sort(
    (a, b) =>
      b.matchScore -
      a.matchScore
  );

  return scored.slice(0, 8);
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
      service: "Fashion AI Discovery",
      version: "4.0.0",
      ai: {
        enabled: Boolean(embedder),
        model: MODEL_NAME,
        type:
          "semantic + personalized recommendation",
      },
      products: PRODUCTS.length,
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
      count: PRODUCTS.length,
      products: PRODUCTS,
    });
  }
);

/*
=========================================================
NORMAL AI SEARCH
=========================================================
*/

app.post(
  "/api/search",
  async (req, res) => {
    try {
      const query =
        String(
          req.body?.query || ""
        ).trim();

      if (!query) {
        return res.status(400).json({
          error: "Search query is required.",
        });
      }

      if (!embedder) {
        return res.status(503).json({
          error:
            "AI model is still loading. Please try again.",
        });
      }

      const results =
        await personalizedRecommendations(
          query,
          {}
        );

      res.json({
        success: true,
        query,
        budget:
          extractBudget(query),
        count: results.length,
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
AI STYLIST QUERY BUILDER
=========================================================
*/

function buildStylistQuery(preferences) {
  const parts = [];

  if (preferences.occasion) {
    parts.push(
      `occasion ${preferences.occasion}`
    );
  }

  if (preferences.style) {
    parts.push(
      `style ${preferences.style}`
    );
  }

  if (preferences.comfort) {
    parts.push(
      `comfort ${preferences.comfort}`
    );
  }

  if (preferences.color) {
    parts.push(
      `colour ${preferences.color}`
    );
  }

  if (preferences.coverage) {
    parts.push(
      `coverage ${preferences.coverage}`
    );
  }

  if (preferences.description) {
    parts.push(
      preferences.description
    );
  }

  return parts.join(" ");
}

/*
=========================================================
AI STYLIST
=========================================================
*/

app.post(
  "/api/stylist",
  async (req, res) => {
    try {
      const preferences = {
        occasion:
          String(
            req.body?.occasion || ""
          ).trim(),

        style:
          String(
            req.body?.style || ""
          ).trim(),

        comfort:
          String(
            req.body?.comfort || ""
          ).trim(),

        color:
          String(
            req.body?.color || ""
          ).trim(),

        coverage:
          String(
            req.body?.coverage || ""
          ).trim(),

        description:
          String(
            req.body?.description || ""
          ).trim(),
      };

      const hasInput =
        Object.values(
          preferences
        ).some(Boolean);

      if (!hasInput) {
        return res.status(400).json({
          error:
            "Please provide at least one styling preference.",
        });
      }

      if (!embedder) {
        return res.status(503).json({
          error:
            "AI model is still loading. Please try again.",
        });
      }

      const query =
        buildStylistQuery(
          preferences
        );

      const recommendations =
        await personalizedRecommendations(
          query,
          preferences
        );

      res.json({
        success: true,

        mode:
          "AI_PERSONAL_STYLIST",

        query,

        preferences,

        budget:
          extractBudget(query),

        count:
          recommendations.length,

        recommendations,
      });
    } catch (error) {
      console.error(
        "AI Stylist error:",
        error
      );

      res.status(500).json({
        error:
          "AI Stylist could not generate recommendations.",
      });
    }
  }
);

/*
=========================================================
ROOT
=========================================================
*/

app.get(
  "/",
  (req, res) => {
    res.json({
      service:
        "Fashion AI Discovery",

      status:
        "online",

      message:
        "AI fashion discovery backend is running.",

      frontend:
        "Use the GitHub Pages frontend.",

      endpoints: [
        "/api/health",
        "/api/products",
        "/api/search",
        "/api/stylist",
      ],
    });
  }
);

/*
=========================================================
START SERVER
=========================================================
*/

async function startServer() {
  await loadAIModel();

  app.listen(
    PORT,
    "0.0.0.0",
    () => {
      console.log(
        `Fashion AI Discovery running on port ${PORT}`
      );

      console.log(
        `AI indexed products: ${productEmbeddings.length}`
      );
    }
  );
}

startServer();
