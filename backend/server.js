/*
=========================================================
FASHION AI DISCOVERY
BACKEND SERVER
DAY 3
=========================================================
*/

"use strict";

import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import {
  searchProducts
} from "./services/aiSearch.js";

import {
  rankProducts,
  rankWithAblation,
  RANKING_VERSION,
  WEIGHTS
} from "./services/ranking.js";

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

const PRODUCTS_PATH =
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
  process.env.PORT ||
  10000;

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
        PRODUCTS_PATH,
        "utf8"
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

    products = [];
  }
}

loadProducts();

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

      rankingVersion:
        RANKING_VERSION,

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
      products,
      count:
        products.length,

      rankingVersion:
        RANKING_VERSION
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
          req.body?.query ||
          ""
        ).trim();

      if (!query) {

        return res.status(400).json({
          error:
            "Search query is required."
        });
      }

      const limit =
        Number(
          req.body?.limit ||
          20
        );

      const result =
        searchProducts(
          products,
          query,
          {
            limit
          }
        );

      res.json({
        query,

        results:
          result.results,

        budget:
          result.budget,

        totalCandidates:
          result.totalCandidates,

        rankingVersion:
          result.rankingVersion
      });

    } catch (error) {

      console.error(
        "Search error:",
        error
      );

      res.status(500).json({
        error:
          "Search failed.",
        message:
          error.message
      });
    }
  }
);

/*
=========================================================
RANKING DEBUG
=========================================================

Useful for:
- research
- debugging
- experiments
- screenshots
- thesis/report
=========================================================
*/

app.post(
  "/api/ranking/debug",
  (req, res) => {

    try {

      const query =
        String(
          req.body?.query ||
          ""
        ).trim();

      if (!query) {

        return res.status(400).json({
          error:
            "Query is required."
        });
      }

      const ranked =
        rankProducts(
          products,
          query
        );

      res.json({
        query,

        rankingVersion:
          RANKING_VERSION,

        weights:
          WEIGHTS,

        results:
          ranked.slice(
            0,
            20
          )
      });

    } catch (error) {

      console.error(
        "Ranking debug error:",
        error
      );

      res.status(500).json({
        error:
          error.message
      });
    }
  }
);

/*
=========================================================
ABLATION EXPERIMENT
=========================================================

Example:

POST /api/ranking/ablation

{
  "query": "black casual outfit",
  "disable": ["semantic"]
}

=========================================================
*/

app.post(
  "/api/ranking/ablation",
  (req, res) => {

    try {

      const query =
        String(
          req.body?.query ||
          ""
        ).trim();

      const disabled =
        Array.isArray(
          req.body?.disable
        )
          ? req.body.disable
          : [];

      if (!query) {

        return res.status(400).json({
          error:
            "Query is required."
        });
      }

      const ranked =
        rankWithAblation(
          products,
          query,
          disabled
        );

      res.json({
        query,

        disabledSignals:
          disabled,

        results:
          ranked.slice(
            0,
            20
          )
      });

    } catch (error) {

      console.error(
        "Ablation error:",
        error
      );

      res.status(500).json({
        error:
          error.message
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

      const {
        occasion = "",
        style = "",
        comfort = "",
        color = "",
        coverage = "",
        description = ""
      } = req.body || {};

      const query =
        [
          occasion,
          style,
          comfort,
          color,
          coverage,
          description
        ]
          .filter(Boolean)
          .join(" ");

      if (!query.trim()) {

        return res.status(400).json({
          error:
            "Please provide styling preferences."
        });
      }

      const result =
        searchProducts(
          products,
          query,
          {
            limit: 12
          }
        );

      res.json({
        query,

        recommendations:
          result.results,

        rankingVersion:
          result.rankingVersion
      });

    } catch (error) {

      console.error(
        "Stylist error:",
        error
      );

      res.status(500).json({
        error:
          "Stylist request failed.",
        message:
          error.message
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
      name:
        "Fashion AI Discovery API",

      version:
        "Day 3",

      status:
        "running",

      ranking:
        RANKING_VERSION,

      endpoints: [
        "GET /api/health",
        "GET /api/products",
        "POST /api/search",
        "POST /api/stylist",
        "POST /api/ranking/debug",
        "POST /api/ranking/ablation"
      ]
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
      "================================================="
    );

    console.log(
      "Fashion AI Discovery Backend"
    );

    console.log(
      `Server running on port ${PORT}`
    );

    console.log(
      `Products loaded: ${products.length}`
    );

    console.log(
      `Ranking: ${RANKING_VERSION}`
    );

    console.log(
      "================================================="
    );
  }
);
