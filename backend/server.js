/*
=========================================================
FASHION AI DISCOVERY
DAY 2 — AI / NLP SEARCH BACKEND
=========================================================
*/

import express from "express";

import cors from "cors";

import fs from "fs";

import path from "path";

import {
  fileURLToPath
} from "url";

import {
  initializeSearchEngine,
  searchProducts,
  parseSearchQuery,
  getSearchEngineStatus
} from "./services/aiSearch.js";

/*
=========================================================
PATHS
=========================================================
*/

const __filename =
  fileURLToPath(
    import.meta.url
  );

const __dirname =
  path.dirname(
    __filename
  );

const DATA_PATH =
  path.join(
    __dirname,
    "..",
    "data",
    "products.json"
  );

/*
=========================================================
APP
=========================================================
*/

const app =
  express();

const PORT =
  process.env.PORT || 10000;

/*
=========================================================
MIDDLEWARE
=========================================================
*/

app.use(
  cors()
);

app.use(
  express.json({
    limit: "1mb"
  })
);

/*
=========================================================
LOAD PRODUCTS
=========================================================
*/

let products = [];

function loadProducts() {

  try {

    const raw =
      fs.readFileSync(
        DATA_PATH,
        "utf-8"
      );

    const parsed =
      JSON.parse(raw);

    if (
      !Array.isArray(parsed)
    ) {

      throw new Error(
        "products.json must contain an array."
      );
    }

    products =
      parsed;

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
}

/*
=========================================================
ROOT
=========================================================
*/

app.get(
  "/",
  (req, res) => {

    res.json({

      name:
        "Fashion AI Discovery API",

      version:
        "2.0.0",

      status:
        "running",

      endpoints: {

        health:
          "GET /api/health",

        products:
          "GET /api/products",

        search:
          "POST /api/search",

        searchInfo:
          "GET /api/search/info"
      }
    });
  }
);

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
        "ok",

      service:
        "fashion-ai-discovery",

      products:
        products.length,

      searchEngine:
        getSearchEngineStatus()
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

      success:
        true,

      count:
        products.length,

      products
    });
  }
);

/*
=========================================================
SEARCH INFO
=========================================================
*/

app.get(
  "/api/search/info",
  (req, res) => {

    res.json({

      success:
        true,

      engine:
        getSearchEngineStatus(),

      ranking: {

        semantic:
          0.55,

        lexical:
          0.15,

        attributes:
          0.20,

        budget:
          0.10
      },

      model:
        "Xenova/all-MiniLM-L6-v2"
    });
  }
);

/*
=========================================================
AI SEARCH
=========================================================
*/

app.post(
  "/api/search",
  async (req, res) => {

    try {

      const query =
        String(
          req.body?.query ??
          ""
        ).trim();

      if (!query) {

        return res.status(400)
          .json({

            success:
              false,

            error:
              "Search query is required."
          });
      }

      if (
        query.length > 500
      ) {

        return res.status(400)
          .json({

            success:
              false,

            error:
              "Search query is too long."
          });
      }

      console.log(
        `AI Search Query: "${query}"`
      );

      const results =
        await searchProducts(
          query,
          20
        );

      const parsedQuery =
        parseSearchQuery(
          query
        );

      return res.json({

        success:
          true,

        query,

        budget:
          parsedQuery.budget,

        detectedAttributes: {

          colors:
            parsedQuery.colors,

          categories:
            parsedQuery.categories,

          styles:
            parsedQuery.styles,

          occasions:
            parsedQuery.occasions
        },

        count:
          results.length,

        results
      });

    } catch (error) {

      console.error(
        "AI Search Error:",
        error
      );

      return res.status(500)
        .json({

          success:
            false,

          error:
            "AI search failed.",

          details:
            error.message
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

    res.status(404)
      .json({

        success:
          false,

        error:
          "Endpoint not found."
      });
  }
);

/*
=========================================================
START
=========================================================
*/

async function startServer() {

  /*
  Load product catalogue.
  */

  loadProducts();

  /*
  Build semantic index.
  */

  try {

    await initializeSearchEngine(
      products
    );

  } catch (error) {

    console.error(
      "Failed to initialize AI search engine:",
      error
    );

    process.exit(1);
  }

  /*
  Start HTTP server.
  */

  app.listen(
    PORT,
    "0.0.0.0",
    () => {

      console.log(
        "=========================================="
      );

      console.log(
        "Fashion AI Discovery Backend"
      );

      console.log(
        "=========================================="
      );

      console.log(
        `Server running on port ${PORT}`
      );

      console.log(
        `Products: ${products.length}`
      );

      console.log(
        "AI Search: READY"
      );

      console.log(
        "Semantic Model: all-MiniLM-L6-v2"
      );

      console.log(
        "=========================================="
      );
    }
  );
}

startServer();
