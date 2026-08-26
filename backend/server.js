import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import {
  searchProducts
} from "./services/aiSearch.js";

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);

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
  cors({
    origin: "*"
  })
);

app.use(
  express.json({
    limit: "2mb"
  })
);

/*
=========================================================
PRODUCT DATA
=========================================================
*/

const productsPath =
  path.join(
    __dirname,
    "..",
    "data",
    "products.json"
  );

let products = [];

try {

  products =
    JSON.parse(
      fs.readFileSync(
        productsPath,
        "utf8"
      )
    );

  if (
    !Array.isArray(products)
  ) {

    throw new Error(
      "products.json must contain an array"
    );
  }

  console.log(
    `Loaded ${products.length} products`
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
ALL PRODUCTS
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
HYBRID SEARCH
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

        return res
          .status(400)
          .json({

            error:
              "Search query is required",

            results: []
          });
      }

      const requestedLimit =
        Number(
          req.body?.limit
        );

      const limit =
        Number.isFinite(
          requestedLimit
        )
          ? Math.min(
              50,
              Math.max(
                1,
                requestedLimit
              )
            )
          : 20;

      const results =
        searchProducts(
          products,
          query,
          {
            limit
          }
        );

      const budget =
        results.find(
          (item) =>
            item.detectedBudget
        )?.detectedBudget ||
        null;

      return res.json({

        success: true,

        engine:
          "hybrid-retrieval",

        query,

        budget,

        totalCandidates:
          products.length,

        resultCount:
          results.length,

        weights: {

          semantic:
            0.45,

          keyword:
            0.20,

          attributes:
            0.20,

          budget:
            0.10,

          metadata:
            0.05
        },

        results
      });

    } catch (error) {

      console.error(
        "Hybrid search error:",
        error
      );

      return res
        .status(500)
        .json({

          error:
            "Hybrid search failed",

          results: []
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
        "Fashion AI Discovery",

      status:
        "running",

      engine:
        "Hybrid Retrieval",

      endpoints: [

        "GET /api/health",

        "GET /api/products",

        "POST /api/search"
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
      `Fashion AI backend running on port ${PORT}`
    );

    console.log(
      "Hybrid retrieval engine enabled."
    );
  }
);
