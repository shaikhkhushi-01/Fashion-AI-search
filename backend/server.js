import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/*
=========================================================
FASHION AI DISCOVERY
DAY 1 - RESEARCH FOUNDATION
=========================================================
*/

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = process.env.PORT || 10000;

const API_VERSION = "1.0.0";

const START_TIME = Date.now();

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

app.use(express.json({ limit: "1mb" }));

/*
=========================================================
LOAD DATASET
=========================================================
*/

const PRODUCTS_PATH =
  path.join(__dirname, "products.json");

let products = [];

try {
  const raw =
    fs.readFileSync(
      PRODUCTS_PATH,
      "utf8"
    );

  products =
    JSON.parse(raw);

  if (!Array.isArray(products)) {
    throw new Error(
      "products.json must contain an array."
    );
  }

  console.log(
    `Loaded ${products.length} products.`
  );

} catch (error) {

  console.error(
    "Unable to load products.json:",
    error.message
  );

  process.exit(1);
}

/*
=========================================================
DATA VALIDATION
=========================================================
*/

function validateProduct(product) {

  const requiredFields = [
    "id",
    "brand",
    "name",
    "category",
    "gender",
    "color",
    "material",
    "style",
    "occasion",
    "sizes",
    "price",
    "currency",
    "availability",
    "tags",
    "description"
  ];

  return requiredFields.every(
    (field) =>
      product[field] !== undefined &&
      product[field] !== null
  );
}

const invalidProducts =
  products.filter(
    (product) =>
      !validateProduct(product)
  );

if (invalidProducts.length) {

  console.warn(
    `${invalidProducts.length} products have missing fields.`
  );
}

/*
=========================================================
DATASET METADATA
=========================================================
*/

function getDatasetStats() {

  const brands =
    new Set(
      products.map(
        (product) =>
          product.brand
      )
    );

  const categories =
    new Set(
      products.map(
        (product) =>
          product.category
      )
    );

  const colors =
    new Set(
      products.map(
        (product) =>
          product.color
      )
    );

  const prices =
    products
      .map(
        (product) =>
          Number(product.price)
      )
      .filter(
        Number.isFinite
      );

  const averagePrice =
    prices.length
      ? prices.reduce(
          (sum, price) =>
            sum + price,
          0
        ) / prices.length
      : 0;

  return {
    totalProducts:
      products.length,

    brands:
      brands.size,

    categories:
      categories.size,

    colors:
      colors.size,

    averagePrice:
      Math.round(
        averagePrice
      ),

    minPrice:
      prices.length
        ? Math.min(...prices)
        : 0,

    maxPrice:
      prices.length
        ? Math.max(...prices)
        : 0
  };
}

/*
=========================================================
NORMALIZATION
=========================================================
*/

function normalize(value) {

  return String(
    value ?? ""
  )
    .toLowerCase()
    .trim();
}

function productSearchText(product) {

  return [
    product.brand,
    product.name,
    product.category,
    product.gender,
    product.color,
    ...(Array.isArray(product.material)
      ? product.material
      : []),
    ...(Array.isArray(product.style)
      ? product.style
      : []),
    ...(Array.isArray(product.occasion)
      ? product.occasion
      : []),
    ...(Array.isArray(product.tags)
      ? product.tags
      : []),
    product.description
  ]
    .join(" ")
    .toLowerCase();
}

/*
=========================================================
BASE SEARCH
=========================================================
*/

function lexicalSearch(query) {

  const normalizedQuery =
    normalize(query);

  if (!normalizedQuery) {
    return [];
  }

  const terms =
    normalizedQuery
      .split(/\s+/)
      .filter(Boolean);

  const results =
    products.map(
      (product) => {

        const text =
          productSearchText(
            product
          );

        let matchedTerms = 0;

        const matched =
          [];

        for (const term of terms) {

          if (
            text.includes(term)
          ) {

            matchedTerms += 1;

            matched.push(term);
          }
        }

        const score =
          terms.length
            ? matchedTerms /
              terms.length
            : 0;

        return {
          ...product,
          matchScore:
            Math.round(
              score * 100
            ),
          matchedTerms:
            matched
        };
      }
    )
    .filter(
      (product) =>
        product.matchScore > 0
    )
    .sort(
      (a, b) =>
        b.matchScore -
        a.matchScore
    );

  return results;
}

/*
=========================================================
API: HEALTH
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
        API_VERSION,

      uptimeSeconds:
        Math.floor(
          (Date.now() -
            START_TIME) /
            1000
        ),

      dataset:
        getDatasetStats(),

      architecture:
        {
          search:
            "lexical-baseline",
          ai:
            "Day 2+",
          personalization:
            "Day 6+",
          evaluation:
            "Day 8+"
        }
    });
  }
);

/*
=========================================================
API: PRODUCTS
=========================================================
*/

app.get(
  "/api/products",
  (req, res) => {

    res.json({
      count:
        products.length,

      products
    });
  }
);

/*
=========================================================
API: PRODUCT BY ID
=========================================================
*/

app.get(
  "/api/products/:id",
  (req, res) => {

    const id =
      Number(req.params.id);

    const product =
      products.find(
        (item) =>
          Number(item.id) === id
      );

    if (!product) {

      return res
        .status(404)
        .json({
          error:
            "Product not found."
        });
    }

    res.json({
      product
    });
  }
);

/*
=========================================================
API: DATASET STATS
=========================================================
*/

app.get(
  "/api/dataset/stats",
  (req, res) => {

    res.json(
      getDatasetStats()
    );
  }
);

/*
=========================================================
API: SEARCH
=========================================================
*/

app.post(
  "/api/search",
  (req, res) => {

    const query =
      typeof req.body?.query ===
      "string"
        ? req.body.query.trim()
        : "";

    if (!query) {

      return res
        .status(400)
        .json({
          error:
            "Search query is required."
        });
    }

    const results =
      lexicalSearch(query);

    res.json({

      query,

      method:
        "lexical-baseline",

      count:
        results.length,

      results
    });
  }
);

/*
=========================================================
API: FILTER
=========================================================
*/

app.post(
  "/api/filter",
  (req, res) => {

    const {
      category,
      brand,
      color,
      gender,
      minPrice,
      maxPrice
    } = req.body || {};

    let filtered =
      [...products];

    if (category) {

      filtered =
        filtered.filter(
          (product) =>
            normalize(
              product.category
            ) ===
            normalize(category)
        );
    }

    if (brand) {

      filtered =
        filtered.filter(
          (product) =>
            normalize(
              product.brand
            ) ===
            normalize(brand)
        );
    }

    if (color) {

      filtered =
        filtered.filter(
          (product) =>
            normalize(
              product.color
            ) ===
            normalize(color)
        );
    }

    if (gender) {

      filtered =
        filtered.filter(
          (product) =>
            normalize(
              product.gender
            ) ===
            normalize(gender)
        );
    }

    if (
      minPrice !==
      undefined
    ) {

      filtered =
        filtered.filter(
          (product) =>
            Number(
              product.price
            ) >=
            Number(minPrice)
        );
    }

    if (
      maxPrice !==
      undefined
    ) {

      filtered =
        filtered.filter(
          (product) =>
            Number(
              product.price
            ) <=
            Number(maxPrice)
        );
    }

    res.json({

      count:
        filtered.length,

      filters: {
        category:
          category || null,
        brand:
          brand || null,
        color:
          color || null,
        gender:
          gender || null,
        minPrice:
          minPrice ?? null,
        maxPrice:
          maxPrice ?? null
      },

      products:
        filtered
    });
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
      error:
        "API endpoint not found.",
      path:
        req.originalUrl
    });
  }
);

/*
=========================================================
ERROR HANDLER
=========================================================
*/

app.use(
  (error, req, res, next) => {

    console.error(
      "Server error:",
      error
    );

    res
      .status(500)
      .json({
        error:
          "Internal server error."
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
  () => {

    console.log(
      "========================================"
    );

    console.log(
      "Fashion AI Discovery Backend"
    );

    console.log(
      `Running on port ${PORT}`
    );

    console.log(
      `Products: ${products.length}`
    );

    console.log(
      "Research foundation ready."
    );

    console.log(
      "========================================"
    );
  }
);
