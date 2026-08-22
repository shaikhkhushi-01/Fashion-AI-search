/*
=========================================================
FASHION AI DISCOVERY
DAY 5 — PRODUCT INTELLIGENCE ENGINE
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

const MODEL_NAME = "Xenova/all-MiniLM-L6-v2";

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

function arrayValue(value) {
  if (Array.isArray(value)) {
    return value.filter(
      (item) =>
        item !== undefined &&
        item !== null &&
        String(item).trim() !== ""
    );
  }

  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return [];
  }

  return [value];
}

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function loadProducts() {
  for (const file of possibleProductFiles) {
    if (!fs.existsSync(file)) {
      continue;
    }

    try {
      const raw = fs.readFileSync(file, "utf8");
      const parsed = JSON.parse(raw);

      const products = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.products)
        ? parsed.products
        : [];

      PRODUCTS = products
        .map(normalizeProduct)
        .filter(Boolean);

      console.log(
        `Loaded ${PRODUCTS.length} products.`
      );

      return;
    } catch (error) {
      console.error(
        "Product JSON error:",
        error.message
      );
    }
  }

  console.error(
    "products.json not found."
  );
}

/*
=========================================================
PRODUCT NORMALIZATION
=========================================================
*/

function normalizeProduct(product) {
  if (!product || typeof product !== "object") {
    return null;
  }

  const normalized = {
    ...product,

    id: Number(product.id),

    brand:
      String(product.brand || "Unknown")
        .trim(),

    name:
      String(product.name || "Fashion Product")
        .trim(),

    category:
      String(product.category || "Fashion")
        .trim(),

    subcategory:
      String(product.subcategory || "")
        .trim(),

    gender:
      String(product.gender || "Unisex")
        .trim(),

    color:
      String(product.color || "")
        .trim(),

    colorFamily:
      String(product.colorFamily || product.color || "")
        .trim(),

    material:
      arrayValue(product.material),

    style:
      arrayValue(product.style),

    occasion:
      arrayValue(product.occasion),

    season:
      arrayValue(product.season),

    comfort:
      arrayValue(product.comfort),

    tags:
      arrayValue(product.tags),

    aliases:
      arrayValue(product.aliases),

    sizes:
      arrayValue(product.sizes),

    fit:
      String(product.fit || "")
        .trim(),

    coverage:
      String(product.coverage || "")
        .trim(),

    description:
      String(product.description || "")
        .trim(),

    price:
      Number(product.price),

    rating:
      Number(product.rating) || 0,

    popularity:
      Number(product.popularity) || 0,

    availability:
      String(
        product.availability || "In Stock"
      ),
  };

  /*
  -------------------------------------------------------
  DERIVED PRODUCT INTELLIGENCE
  -------------------------------------------------------
  */

  normalized.priceBand =
    getPriceBand(normalized.price);

  normalized.qualityScore =
    calculateQualityScore(normalized);

  normalized.searchText =
    productToText(normalized);

  return normalized;
}

function getPriceBand(price) {
  if (!Number.isFinite(price)) {
    return "unknown";
  }

  if (price < 1500) {
    return "budget";
  }

  if (price < 3000) {
    return "mid-range";
  }

  if (price < 5000) {
    return "premium";
  }

  return "luxury";
}

function calculateQualityScore(product) {
  const rating =
    Math.max(
      0,
      Math.min(
        5,
        Number(product.rating) || 0
      )
    );

  const popularity =
    Math.max(
      0,
      Math.min(
        100,
        Number(product.popularity) || 0
      )
    );

  const metadataFields = [
    product.subcategory,
    product.color,
    product.colorFamily,
    product.fit,
    product.coverage,
    product.description,
    product.priceBand,
  ];

  const metadataCompleteness =
    metadataFields.filter(Boolean).length /
    metadataFields.length;

  const arrays = [
    product.material,
    product.style,
    product.occasion,
    product.season,
    product.comfort,
    product.tags,
    product.aliases,
    product.sizes,
  ];

  const arrayCompleteness =
    arrays.filter(
      (item) => Array.isArray(item) && item.length
    ).length /
    arrays.length;

  const ratingScore =
    (rating / 5) * 40;

  const popularityScore =
    (popularity / 100) * 25;

  const metadataScore =
    metadataCompleteness * 20;

  const arrayScore =
    arrayCompleteness * 15;

  return Math.round(
    ratingScore +
    popularityScore +
    metadataScore +
    arrayScore
  );
}

loadProducts();

/*
=========================================================
AI MODEL
=========================================================
*/

let embedder = null;

let productEmbeddings = [];

async function loadAIModel() {
  try {
    console.log(
      "Preparing AI semantic search model..."
    );

    console.log(
      `Creating AI embeddings for ${PRODUCTS.length} products...`
    );

    embedder = await pipeline(
      "feature-extraction",
      MODEL_NAME
    );

    console.log(
      "AI embedding model loaded."
    );

    productEmbeddings = [];

    for (const product of PRODUCTS) {
      const text =
        productToText(product);

      const embedding =
        await embedText(text);

      productEmbeddings.push({
        product,
        embedding,
      });
    }

    console.log(
      "AI product index ready."
    );

    console.log(
      `AI indexed products: ${productEmbeddings.length}`
    );
  } catch (error) {
    console.error(
      "AI model initialization failed:",
      error
    );
  }
}

/*
=========================================================
PRODUCT → INTELLIGENT SEARCH TEXT
=========================================================
*/

function productToText(product) {
  const values = [
    product.name,
    product.brand,
    product.category,
    product.subcategory,

    product.gender,

    product.color,
    product.colorFamily,

    product.description,

    product.fit,
    product.coverage,

    product.priceBand,

    ...arrayValue(product.material),
    ...arrayValue(product.style),
    ...arrayValue(product.occasion),
    ...arrayValue(product.season),
    ...arrayValue(product.comfort),
    ...arrayValue(product.tags),
    ...arrayValue(product.aliases),
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
    throw new Error(
      "AI model is not ready."
    );
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
  if (
    !a ||
    !b ||
    a.length !== b.length
  ) {
    return 0;
  }

  let dot = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (
    let i = 0;
    i < a.length;
    i++
  ) {
    dot += a[i] * b[i];

    magnitudeA +=
      a[i] * a[i];

    magnitudeB +=
      b[i] * b[i];
  }

  if (
    !magnitudeA ||
    !magnitudeB
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
QUERY INTELLIGENCE
=========================================================
*/

const COLOR_ALIASES = {
  white: ["white", "ivory", "cream", "off white"],
  black: ["black", "jet black"],
  blue: ["blue", "navy", "denim"],
  green: ["green", "olive", "sage"],
  pink: ["pink", "rose"],
  brown: ["brown", "camel", "tan"],
  neutral: [
    "neutral",
    "beige",
    "cream",
    "white",
    "ivory",
    "camel",
  ],
};

const STYLE_ALIASES = {
  casual: [
    "casual",
    "everyday",
    "relaxed",
    "comfortable",
  ],

  formal: [
    "formal",
    "office",
    "professional",
    "business",
  ],

  streetwear: [
    "streetwear",
    "street",
    "oversized",
    "baggy",
    "urban",
  ],

  elegant: [
    "elegant",
    "classy",
    "sophisticated",
    "luxury",
  ],

  sporty: [
    "sporty",
    "sports",
    "gym",
    "workout",
    "athletic",
  ],

  minimal: [
    "minimal",
    "simple",
    "clean",
    "basic",
  ],
};

function extractQuerySignals(query) {
  const text = normalize(query);

  const signals = {
    colors: [],
    styles: [],
    occasions: [],
    categories: [],
    budget: extractBudget(query),
  };

  /*
  -------------------------------------------------------
  COLORS
  -------------------------------------------------------
  */

  for (
    const [canonical, aliases]
    of Object.entries(COLOR_ALIASES)
  ) {
    if (
      aliases.some(
        (alias) =>
          text.includes(
            normalize(alias)
          )
      )
    ) {
      signals.colors.push(
        canonical
      );
    }
  }

  /*
  -------------------------------------------------------
  STYLES
  -------------------------------------------------------
  */

  for (
    const [canonical, aliases]
    of Object.entries(STYLE_ALIASES)
  ) {
    if (
      aliases.some(
        (alias) =>
          text.includes(
            normalize(alias)
          )
      )
    ) {
      signals.styles.push(
        canonical
      );
    }
  }

  /*
  -------------------------------------------------------
  OCCASIONS
  -------------------------------------------------------
  */

  const occasionKeywords = [
    "college",
    "office",
    "formal",
    "wedding",
    "party",
    "date",
    "travel",
    "vacation",
    "summer",
    "winter",
    "brunch",
    "gym",
    "sports",
    "everyday",
  ];

  for (
    const occasion
    of occasionKeywords
  ) {
    if (
      text.includes(occasion)
    ) {
      signals.occasions.push(
        occasion
      );
    }
  }

  /*
  -------------------------------------------------------
  CATEGORIES
  -------------------------------------------------------
  */

  const categoryKeywords = [
    "shirt",
    "dress",
    "trouser",
    "pants",
    "jeans",
    "sneaker",
    "shoes",
    "blazer",
    "hoodie",
    "jacket",
    "skirt",
    "top",
    "t shirt",
    "tee",
    "jumpsuit",
    "shorts",
    "coat",
    "accessories",
    "bag",
  ];

  for (
    const category
    of categoryKeywords
  ) {
    if (
      text.includes(category)
    ) {
      signals.categories.push(
        category
      );
    }
  }

  return signals;
}

/*
=========================================================
BUDGET
=========================================================
*/

function extractBudget(query) {
  const text =
    normalize(query);

  const matches = [
    ...text.matchAll(
      /(?:under|below|less than|within|max|upto|up to|budget)\s*(?:₹|rs\.?|inr)?\s*([\d,]+)/gi
    ),
  ];

  if (!matches.length) {
    return null;
  }

  const number =
    Number(
      matches[
        matches.length - 1
      ][1].replace(/,/g, "")
    );

  return Number.isFinite(number)
    ? number
    : null;
}

/*
=========================================================
MATCH HELPERS
=========================================================
*/

function productContains(
  product,
  fields,
  target
) {
  if (!target) {
    return false;
  }

  const wanted =
    normalize(target);

  return fields.some(
    (field) => {
      const values =
        arrayValue(
          product[field]
        );

      return values.some(
        (value) =>
          normalize(value)
            .includes(wanted)
      );
    }
  );
}

function colorMatch(
  product,
  color
) {
  if (!color) {
    return false;
  }

  const wanted =
    normalize(color);

  const productColors = [
    product.color,
    product.colorFamily,
  ]
    .filter(Boolean)
    .map(normalize);

  if (
    productColors.some(
      (value) =>
        value.includes(wanted) ||
        wanted.includes(value)
    )
  ) {
    return true;
  }

  const aliases =
    COLOR_ALIASES[wanted] || [];

  return aliases.some(
    (alias) =>
      productColors.some(
        (value) =>
          value.includes(
            normalize(alias)
          )
      )
  );
}

/*
=========================================================
STRUCTURED PRODUCT INTELLIGENCE SCORE
=========================================================
*/

function productIntelligenceScore(
  product,
  signals
) {
  let score = 0;
  const matched = [];

  /*
  -------------------------------------------------------
  COLOR
  -------------------------------------------------------
  */

  if (
    signals.colors.length
  ) {
    const match =
      signals.colors.some(
        (color) =>
          colorMatch(
            product,
            color
          )
      );

    if (match) {
      score += 12;
      matched.push(
        "colour"
      );
    }
  }

  /*
  -------------------------------------------------------
  STYLE
  -------------------------------------------------------
  */

  if (
    signals.styles.length
  ) {
    const match =
      signals.styles.some(
        (style) =>
          productContains(
            product,
            [
              "style",
              "tags",
              "aliases",
            ],
            style
          )
      );

    if (match) {
      score += 12;
      matched.push(
        "style"
      );
    }
  }

  /*
  -------------------------------------------------------
  OCCASION
  -------------------------------------------------------
  */

  if (
    signals.occasions.length
  ) {
    const match =
      signals.occasions.some(
        (occasion) =>
          productContains(
            product,
            [
              "occasion",
              "season",
              "tags",
              "aliases",
            ],
            occasion
          )
      );

    if (match) {
      score += 14;
      matched.push(
        "occasion"
      );
    }
  }

  /*
  -------------------------------------------------------
  CATEGORY
  -------------------------------------------------------
  */

  if (
    signals.categories.length
  ) {
    const match =
      signals.categories.some(
        (category) =>
          productContains(
            product,
            [
              "category",
              "subcategory",
              "name",
              "aliases",
            ],
            category
          )
      );

    if (match) {
      score += 14;
      matched.push(
        "category"
      );
    }
  }

  /*
  -------------------------------------------------------
  QUALITY
  -------------------------------------------------------
  */

  score +=
    product.qualityScore * 0.08;

  /*
  -------------------------------------------------------
  POPULARITY
  -------------------------------------------------------
  */

  score +=
    product.popularity * 0.03;

  return {
    score,
    matched,
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
  let score = 0;
  let matched = 0;

  const fields = [
    ["occasion", 18],
    ["style", 18],
    ["comfort", 12],
    ["color", 12],
    ["coverage", 10],
  ];

  for (
    const [field, weight]
    of fields
  ) {
    const value =
      preferences[field];

    if (!value) {
      continue;
    }

    if (
      field === "color"
    ) {
      if (
        colorMatch(
          product,
          value
        )
      ) {
        score += weight;
        matched += 1;
      }

      continue;
    }

    if (
      productContains(
        product,
        [
          field,
          "tags",
          "style",
          "occasion",
          "aliases",
          "description",
        ],
        value
      )
    ) {
      score += weight;
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

function generateReasons(
  product,
  preferences,
  signals,
  semanticScore,
  intelligence
) {
  const reasons = [];

  if (
    signals.colors.length &&
    signals.colors.some(
      (color) =>
        colorMatch(
          product,
          color
        )
    )
  ) {
    reasons.push(
      "Matches the requested colour"
    );
  }

  if (
    signals.styles.length &&
    signals.styles.some(
      (style) =>
        productContains(
          product,
          [
            "style",
            "tags",
            "aliases",
          ],
          style
        )
    )
  ) {
    reasons.push(
      "Matches the requested style"
    );
  }

  if (
    signals.occasions.length &&
    signals.occasions.some(
      (occasion) =>
        productContains(
          product,
          [
            "occasion",
            "season",
            "tags",
          ],
          occasion
        )
    )
  ) {
    reasons.push(
      "Suitable for the requested occasion"
    );
  }

  if (
    signals.categories.length &&
    signals.categories.some(
      (category) =>
        productContains(
          product,
          [
            "category",
            "subcategory",
            "name",
          ],
          category
        )
    )
  ) {
    reasons.push(
      `Matches the ${product.category.toLowerCase()} category`
    );
  }

  if (
    signals.budget &&
    Number.isFinite(
      Number(product.price)
    ) &&
    Number(product.price) <=
      signals.budget
  ) {
    reasons.push(
      "Fits within your detected budget"
    );
  }

  if (
    semanticScore >= 0.65
  ) {
    reasons.push(
      "Strong semantic match to your request"
    );
  }

  if (
    product.rating >= 4.8
  ) {
    reasons.push(
      "Highly rated product"
    );
  }

  if (!reasons.length) {
    reasons.push(
      "Selected using overall fashion compatibility"
    );
  }

  return reasons.slice(0, 4);
}

/*
=========================================================
MAIN AI RANKING ENGINE
=========================================================
*/

async function personalizedRecommendations(
  query,
  preferences = {}
) {
  if (
    !productEmbeddings.length
  ) {
    return [];
  }

  const queryEmbedding =
    await embedText(query);

  const signals =
    extractQuerySignals(query);

  const budget =
    signals.budget;

  const scored =
    productEmbeddings.map(
      ({
        product,
        embedding,
      }) => {

        const semanticSimilarity =
          cosineSimilarity(
            queryEmbedding,
            embedding
          );

        const intelligence =
          productIntelligenceScore(
            product,
            signals
          );

        const personalization =
          personalizationScore(
            product,
            preferences
          );

        /*
        ---------------------------------------------------
        BASE AI SCORE
        ---------------------------------------------------
        */

        let finalScore =
          semanticSimilarity * 55;

        /*
        ---------------------------------------------------
        STRUCTURED INTELLIGENCE
        ---------------------------------------------------
        */

        finalScore +=
          intelligence.score;

        /*
        ---------------------------------------------------
        PERSONALIZATION
        ---------------------------------------------------
        */

        finalScore +=
          personalization.score * 0.45;

        /*
        ---------------------------------------------------
        BUDGET INTELLIGENCE
        ---------------------------------------------------
        */

        const price =
          Number(product.price);

        if (
          budget &&
          Number.isFinite(price)
        ) {
          if (
            price <= budget
          ) {
            finalScore += 10;
          } else {
            const overBy =
              price - budget;

            const overRatio =
              overBy / budget;

            if (
              overRatio <= 0.10
            ) {
              finalScore -= 5;
            } else if (
              overRatio <= 0.25
            ) {
              finalScore -= 15;
            } else {
              finalScore -= 28;
            }
          }
        }

        /*
        ---------------------------------------------------
        AVAILABILITY
        ---------------------------------------------------
        */

        if (
          normalize(
            product.availability
          ) === "in stock"
        ) {
          finalScore += 3;
        }

        /*
        ---------------------------------------------------
        FINAL CLAMP
        ---------------------------------------------------
        */

        finalScore =
          Math.max(
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
            signals,
            semanticSimilarity,
            intelligence
          );

        return {
          ...product,

          matchScore:
            Math.round(
              finalScore
            ),

          semanticScore:
            Number(
              semanticSimilarity.toFixed(
                4
              )
            ),

          intelligenceScore:
            Math.round(
              intelligence.score
            ),

          personalizationScore:
            Math.round(
              personalization.score
            ),

          matchedSignals:
            intelligence.matched,

          reasons,
        };
      }
    );

  /*
  -------------------------------------------------------
  SORT
  -------------------------------------------------------
  */

  scored.sort(
    (a, b) => {

      if (
        b.matchScore !==
        a.matchScore
      ) {
        return (
          b.matchScore -
          a.matchScore
        );
      }

      if (
        b.qualityScore !==
        a.qualityScore
      ) {
        return (
          b.qualityScore -
          a.qualityScore
        );
      }

      return (
        b.popularity -
        a.popularity
      );
    }
  );

  return scored.slice(
    0,
    8
  );
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

      version:
        "5.0.0",

      ai: {
        enabled:
          Boolean(embedder),

        model:
          MODEL_NAME,

        type:
          "semantic search + product intelligence + personalized ranking",
      },

      products:
        PRODUCTS.length,

      indexedProducts:
        productEmbeddings.length,

      productIntelligence: {
        enabled: true,

        fields: [
          "subcategory",
          "colorFamily",
          "season",
          "fit",
          "comfort",
          "coverage",
          "priceBand",
          "rating",
          "popularity",
          "aliases",
          "qualityScore",
        ],
      },

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

      count:
        PRODUCTS.length,

      products:
        PRODUCTS,
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
        String(
          req.body?.query || ""
        ).trim();

      if (!query) {
        return res.status(400).json({
          error:
            "Search query is required.",
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

      const signals =
        extractQuerySignals(
          query
        );

      res.json({
        success: true,

        query,

        budget:
          signals.budget,

        intelligence: {
          colors:
            signals.colors,

          styles:
            signals.styles,

          occasions:
            signals.occasions,

          categories:
            signals.categories,
        },

        count:
          results.length,

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
STYLIST QUERY
=========================================================
*/

function buildStylistQuery(
  preferences
) {
  const parts = [];

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
    preferences.comfort
  ) {
    parts.push(
      `comfort ${preferences.comfort}`
    );
  }

  if (
    preferences.color
  ) {
    parts.push(
      `colour ${preferences.color}`
    );
  }

  if (
    preferences.coverage
  ) {
    parts.push(
      `coverage ${preferences.coverage}`
    );
  }

  if (
    preferences.description
  ) {
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

      version:
        "5.0.0",

      message:
        "AI fashion discovery backend is running.",

      features: [
        "Semantic Fashion Search",
        "Product Intelligence",
        "Structured Query Understanding",
        "AI Product Ranking",
        "Personalized AI Stylist",
        "Budget Intelligence",
        "Fashion Metadata Intelligence",
      ],

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

      console.log(
        `Product intelligence: ENABLED`
      );
    }
  );
}

startServer();
