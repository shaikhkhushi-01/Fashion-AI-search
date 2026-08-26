/*
=========================================================
FASHION AI DISCOVERY
DAY 5 - HYBRID RETRIEVAL BACKEND
=========================================================
*/

import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = process.env.PORT || 10000;

/*
=========================================================
MIDDLEWARE
=========================================================
*/

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"]
  })
);

app.use(express.json({ limit: "2mb" }));

/*
=========================================================
DATA
=========================================================
*/

const PRODUCTS_PATH = path.join(
  __dirname,
  "..",
  "data",
  "products.json"
);

let products = [];

/*
=========================================================
LOAD PRODUCTS
=========================================================
*/

function loadProducts() {
  try {
    const raw = fs.readFileSync(
      PRODUCTS_PATH,
      "utf-8"
    );

    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      products = parsed;
    } else if (
      parsed &&
      Array.isArray(parsed.products)
    ) {
      products = parsed.products;
    } else {
      products = [];
    }

    console.log(
      `Loaded ${products.length} products from data/products.json`
    );
  } catch (error) {
    console.error(
      "Unable to load products.json:",
      error.message
    );

    products = [];
  }
}

loadProducts();

/*
=========================================================
NORMALIZATION
=========================================================
*/

function text(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (Array.isArray(value)) {
    return value.join(" ");
  }

  if (typeof value === "object") {
    return Object.values(value).join(" ");
  }

  return String(value);
}

function normalize(value) {
  return text(value)
    .toLowerCase()
    .replace(/[^a-z0-9₹\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(value) {
  return normalize(value)
    .split(" ")
    .filter(Boolean);
}

function arrayValue(value) {
  if (Array.isArray(value)) {
    return value.map(normalize);
  }

  if (value === null || value === undefined) {
    return [];
  }

  return [normalize(value)];
}

/*
=========================================================
SYNONYMS
=========================================================
*/

const SYNONYMS = {
  tshirt: [
    "t shirt",
    "tee",
    "tshirt",
    "top"
  ],

  t: [
    "tshirt",
    "t shirt",
    "tee"
  ],

  shirt: [
    "shirt",
    "formal shirt",
    "casual shirt"
  ],

  jeans: [
    "jeans",
    "denim"
  ],

  denim: [
    "denim",
    "jeans"
  ],

  dress: [
    "dress",
    "gown",
    "maxi"
  ],

  kurti: [
    "kurti",
    "kurta",
    "ethnic"
  ],

  ethnic: [
    "ethnic",
    "traditional",
    "kurti",
    "kurta"
  ],

  casual: [
    "casual",
    "everyday",
    "daily"
  ],

  formal: [
    "formal",
    "office",
    "workwear"
  ],

  party: [
    "party",
    "evening",
    "night"
  ],

  wedding: [
    "wedding",
    "bridal",
    "ethnic",
    "traditional"
  ],

  black: [
    "black"
  ],

  white: [
    "white",
    "ivory",
    "cream"
  ],

  blue: [
    "blue",
    "navy",
    "denim"
  ],

  red: [
    "red",
    "maroon",
    "burgundy"
  ],

  pink: [
    "pink",
    "rose"
  ],

  green: [
    "green",
    "olive"
  ]
};

/*
=========================================================
EXPAND QUERY
=========================================================
*/

function expandQuery(query) {
  const originalTokens = tokens(query);

  const expanded = new Set(
    originalTokens
  );

  for (const token of originalTokens) {
    const related =
      SYNONYMS[token] || [];

    for (const item of related) {
      for (const t of tokens(item)) {
        expanded.add(t);
      }
    }
  }

  return Array.from(expanded);
}

/*
=========================================================
PRODUCT TEXT
=========================================================
*/

function productText(product) {
  return normalize(
    [
      product.name,
      product.brand,
      product.category,
      product.description,
      product.color,
      product.colour,
      product.style,
      product.styles,
      product.occasion,
      product.occasions,
      product.material,
      product.materials,
      product.gender,
      product.fit,
      product.pattern
    ].join(" ")
  );
}

/*
=========================================================
ATTRIBUTE MATCH
=========================================================
*/

function attributeMatch(
  product,
  queryTokens
) {
  let score = 0;

  const fields = [
    {
      value: product.name,
      weight: 6
    },
    {
      value: product.category,
      weight: 5
    },
    {
      value: product.brand,
      weight: 3
    },
    {
      value: product.color ||
        product.colour,
      weight: 5
    },
    {
      value: product.style ||
        product.styles,
      weight: 4
    },
    {
      value: product.occasion ||
        product.occasions,
      weight: 4
    },
    {
      value: product.material ||
        product.materials,
      weight: 2
    },
    {
      value: product.description,
      weight: 2
    }
  ];

  for (const field of fields) {
    const fieldTokens =
      new Set(
        tokens(field.value)
      );

    for (const queryToken of queryTokens) {
      if (fieldTokens.has(queryToken)) {
        score += field.weight;
      }
    }
  }

  return score;
}

/*
=========================================================
KEYWORD MATCH
=========================================================
*/

function keywordMatch(
  product,
  queryTokens
) {
  const productTokens =
    new Set(
      tokens(productText(product))
    );

  let matches = 0;

  for (const token of queryTokens) {
    if (productTokens.has(token)) {
      matches++;
    }
  }

  if (!queryTokens.length) {
    return 0;
  }

  return (
    matches / queryTokens.length
  );
}

/*
=========================================================
PRICE EXTRACTION
=========================================================
*/

function extractBudget(query) {
  const normalized =
    String(query || "")
      .toLowerCase()
      .replace(/,/g, "");

  const patterns = [
    /under\s*(?:₹|rs\.?|inr)?\s*(\d+)/i,
    /below\s*(?:₹|rs\.?|inr)?\s*(\d+)/i,
    /within\s*(?:₹|rs\.?|inr)?\s*(\d+)/i,
    /budget\s*(?:₹|rs\.?|inr)?\s*(\d+)/i,
    /less\s*than\s*(?:₹|rs\.?|inr)?\s*(\d+)/i,
    /(\d+)\s*(?:rupees|rs|inr|₹)/
  ];

  for (const pattern of patterns) {
    const match =
      normalized.match(pattern);

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
PRICE SCORE
=========================================================
*/

function priceScore(
  product,
  budget
) {
  if (!budget) {
    return 0;
  }

  const price =
    Number(product.price);

  if (!Number.isFinite(price)) {
    return 0;
  }

  if (price <= budget) {
    return 1;
  }

  const difference =
    (price - budget) /
    Math.max(budget, 1);

  return Math.max(
    0,
    1 - difference
  );
}

/*
=========================================================
REASON GENERATION
=========================================================
*/

function getReasons(
  product,
  query,
  budget,
  keyword,
  attribute
) {
  const reasons = [];

  const q =
    normalize(query);

  const category =
    normalize(product.category);

  const color =
    normalize(
      product.color ||
      product.colour
    );

  const style =
    normalize(
      product.style ||
      product.styles
    );

  if (
    category &&
    q.includes(category)
  ) {
    reasons.push(
      `Category matches your request: ${product.category}`
    );
  }

  if (
    color &&
    q.includes(color)
  ) {
    reasons.push(
      `Colour matches your search: ${product.color || product.colour}`
    );
  }

  if (style && q.includes(style)) {
    reasons.push(
      `Style preference matches: ${product.style || product.styles}`
    );
  }

  if (
    budget &&
    Number(product.price) <= budget
  ) {
    reasons.push(
      `Within your ₹${budget.toLocaleString("en-IN")} budget`
    );
  }

  if (
    keyword > 0
  ) {
    reasons.push(
      "Relevant keywords found in the product catalogue"
    );
  }

  if (
    attribute > 0
  ) {
    reasons.push(
      "Product attributes match your query"
    );
  }

  if (!reasons.length) {
    reasons.push(
      "Ranked as a relevant fashion match"
    );
  }

  return reasons.slice(0, 3);
}

/*
=========================================================
HYBRID RETRIEVAL
=========================================================
*/

function hybridSearch(
  query,
  limit = 12
) {
  const cleanQuery =
    normalize(query);

  if (!cleanQuery) {
    return [];
  }

  const queryTokens =
    expandQuery(cleanQuery);

  const budget =
    extractBudget(cleanQuery);

  const ranked =
    products.map((product) => {
      const keyword =
        keywordMatch(
          product,
          queryTokens
        );

      const attribute =
        attributeMatch(
          product,
          queryTokens
        );

      const price =
        priceScore(
          product,
          budget
        );

      /*
      Hybrid score:

      45% keyword relevance
      35% attribute relevance
      20% budget compatibility
      */

      const rawScore =
        keyword * 45 +
        Math.min(
          attribute / 30,
          1
        ) * 35 +
        price * 20;

      const score =
        Math.max(
          0,
          Math.min(
            100,
            rawScore
          )
        );

      return {
        ...product,

        matchScore:
          Math.round(score),

        score:
          Math.round(score),

        reasons:
          getReasons(
            product,
            cleanQuery,
            budget,
            keyword,
            attribute
          )
      };
    });

  return ranked
    .filter(
      (product) =>
        product.matchScore > 0
    )
    .sort(
      (a, b) =>
        b.matchScore -
        a.matchScore
    )
    .slice(0, limit);
}

/*
=========================================================
PERSONALIZED RECOMMENDATIONS
=========================================================
*/

function buildPersonalizedQuery(
  body = {}
) {
  return [
    body.occasion,
    body.style,
    body.comfort,
    body.color,
    body.coverage,
    body.description
  ]
    .filter(Boolean)
    .join(" ");
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
      status: "ok",
      service:
        "Fashion AI Discovery",
      version:
        "day-5-hybrid-retrieval",
      products:
        products.length,
      timestamp:
        new Date().toISOString()
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
      products
    });
  }
);

/*
=========================================================
SINGLE PRODUCT
=========================================================
*/

app.get(
  "/api/products/:id",
  (req, res) => {
    const id =
      String(req.params.id);

    const product =
      products.find(
        (item) =>
          String(
            item.id ??
            item.productId
          ) === id
      );

    if (!product) {
      return res.status(404).json({
        success: false,
        error:
          "Product not found"
      });
    }

    res.json({
      success: true,
      product
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
  (req, res) => {
    try {
      const query =
        String(
          req.body?.query || ""
        ).trim();

      if (!query) {
        return res.status(400).json({
          success: false,
          error:
            "Search query is required"
        });
      }

      const budget =
        extractBudget(query);

      const results =
        hybridSearch(
          query,
          12
        );

      res.json({
        success: true,
        query,
        budget,
        method:
          "hybrid-keyword-attribute-ranking",
        results
      });
    } catch (error) {
      console.error(
        "Search error:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          "Search failed"
      });
    }
  }
);

/*
=========================================================
RECOMMENDATIONS
=========================================================
*/

app.post(
  "/api/recommendations",
  (req, res) => {
    try {
      const query =
        buildPersonalizedQuery(
          req.body || {}
        );

      if (!query.trim()) {
        return res.json({
          success: true,
          query: "",
          results:
            products
              .slice(0, 6)
              .map(
                (product) => ({
                  ...product,
                  matchScore: 50,
                  score: 50,
                  reasons: [
                    "Popular catalogue recommendation"
                  ]
                })
              )
        });
      }

      const results =
        hybridSearch(
          query,
          8
        );

      res.json({
        success: true,
        query,
        method:
          "personalized-hybrid-retrieval",
        results
      });
    } catch (error) {
      console.error(
        "Recommendation error:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          "Recommendation failed"
      });
    }
  }
);

/*
=========================================================
STYLIST
=========================================================
*/

app.post(
  "/api/stylist",
  (req, res) => {
    try {
      const query =
        buildPersonalizedQuery(
          req.body || {}
        );

      if (!query.trim()) {
        return res.status(400).json({
          success: false,
          error:
            "Please provide at least one styling preference"
        });
      }

      const recommendations =
        hybridSearch(
          query,
          8
        );

      res.json({
        success: true,
        query,
        recommendations,
        method:
          "ai-stylist-hybrid-retrieval"
      });
    } catch (error) {
      console.error(
        "Stylist error:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          "Stylist request failed"
      });
    }
  }
);

/*
=========================================================
404
=========================================================
*/

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,
      error:
        "API route not found",
      path: req.originalUrl
    });
  }
);

/*
=========================================================
ERROR HANDLER
=========================================================
*/

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      "Server error:",
      error
    );

    res.status(500).json({
      success: false,
      error:
        "Internal server error"
    });
  }
);

/*
=========================================================
START
=========================================================
*/

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      "================================================="
    );

    console.log(
      "Fashion AI Discovery Day 5"
    );

    console.log(
      "Hybrid Retrieval Backend"
    );

    console.log(
      `Server running on port ${PORT}`
    );

    console.log(
      `Products loaded: ${products.length}`
    );

    console.log(
      "================================================="
    );
  }
);
