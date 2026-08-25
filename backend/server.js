/*
=========================================================
FASHION AI DISCOVERY
DAY 4
PERSONALIZED AI FASHION API
=========================================================
*/

"use strict";

import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import {
  personalizeProducts,
  buildStylistQuery,
  profileFromStylist
} from "./services/personalization.js";

/*
=========================================================
PATHS
=========================================================
*/

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);

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
  cors({
    origin: "*"
  })
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
        "utf8"
      );

    const parsed =
      JSON.parse(raw);

    if (
      !Array.isArray(parsed)
    ) {
      throw new Error(
        "products.json must contain an array"
      );
    }

    products =
      parsed;

    console.log(
      `Loaded ${products.length} products`
    );

  } catch (error) {

    console.error(
      "Unable to load products:",
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
      status: "ok",
      service:
        "fashion-ai-discovery",
      version: "day-4",
      products:
        products.length,
      features: [
        "AI search",
        "personalization",
        "AI stylist",
        "explainable recommendations"
      ]
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
      products
    });
  }
);

/*
=========================================================
SIMPLE SEARCH
=========================================================
*/

app.post(
  "/api/search",
  (req, res) => {

    const query =
      String(
        req.body?.query || ""
      )
        .trim()
        .toLowerCase();

    if (!query) {

      return res.json({
        results: products.slice(
          0,
          12
        )
      });
    }

    const words =
      query
        .split(/\s+/)
        .filter(Boolean);

    const scored =
      products.map(
        (product) => {

          const searchable =
            [
              product.brand,
              product.name,
              product.category,
              product.gender,
              product.color,
              product.description,
              ...(Array.isArray(product.style)
                ? product.style
                : []),
              ...(Array.isArray(product.occasion)
                ? product.occasion
                : []),
              ...(Array.isArray(product.tags)
                ? product.tags
                : [])
            ]
              .join(" ")
              .toLowerCase();

          let score = 0;

          const reasons = [];

          for (
            const word
            of words
          ) {

            if (
              searchable.includes(
                word
              )
            ) {
              score += 10;
            }

            if (
              String(
                product.name ||
                ""
              )
                .toLowerCase()
                .includes(word)
            ) {
              score += 10;
            }

            if (
              String(
                product.category ||
                ""
              )
                .toLowerCase()
                .includes(word)
            ) {
              score += 8;
            }

            if (
              String(
                product.color ||
                ""
              )
                .toLowerCase()
                .includes(word)
            ) {
              score += 8;
            }
          }

          if (score > 0) {

            reasons.push(
              "Matches your natural-language fashion query"
            );
          }

          return {
            ...product,

            matchScore:
              Math.min(
                100,
                score
              ),

            score,

            reasons
          };
        }
      );

    scored.sort(
      (a, b) =>
        b.score -
        a.score
    );

    res.json({
      query,
      results:
        scored
          .filter(
            (item) =>
              item.score > 0
          )
          .slice(
            0,
            12
          )
    });
  }
);

/*
=========================================================
PERSONALIZED RECOMMENDATIONS
=========================================================
*/

app.post(
  "/api/recommendations",
  (req, res) => {

    try {

      const profile =
        req.body?.profile ||
        {};

      const limit =
        Number(
          req.body?.limit
        ) || 12;

      const recommendations =
        personalizeProducts(
          products,
          profile,
          limit
        );

      const results =
        recommendations.map(
          (product) => {

            const personalizationScore =
              Number(
                product.personalizationScore ||
                0
              );

            const matchScore =
              Math.max(
                0,
                Math.min(
                  100,
                  50 +
                    personalizationScore
                )
              );

            return {
              ...product,

              matchScore,

              score:
                personalizationScore,

              reasons:
                product
                  .personalizationReasons ||
                []
            };
          }
        );

      res.json({
        profile,
        results,
        count:
          results.length
      });

    } catch (error) {

      console.error(
        "Recommendation error:",
        error
      );

      res.status(500).json({
        error:
          "Could not generate personalized recommendations."
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
  (req, res) => {

    try {

      const stylist =
        req.body || {};

      const query =
        buildStylistQuery(
          stylist
        );

      if (!query) {

        return res.status(400)
          .json({
            error:
              "Please provide at least one styling preference."
          });
      }

      const profile =
        profileFromStylist(
          stylist
        );

      /*
      ---------------------------------------------------
      Add free-text description to style matching
      ---------------------------------------------------
      */

      const description =
        String(
          stylist.description ||
          ""
        ).toLowerCase();

      const enrichedProducts =
        products.map(
          (product) => {

            let bonus = 0;

            const searchable =
              [
                product.name,
                product.category,
                product.color,
                product.description,
                ...(Array.isArray(product.style)
                  ? product.style
                  : []),
                ...(Array.isArray(product.occasion)
                  ? product.occasion
                  : []),
                ...(Array.isArray(product.tags)
                  ? product.tags
                  : [])
              ]
                .join(" ")
                .toLowerCase();

            if (
              description
            ) {

              const words =
                description
                  .split(/\s+/)
                  .filter(
                    (word) =>
                      word.length > 2
                  );

              for (
                const word
                of words
              ) {

                if (
                  searchable.includes(
                    word
                  )
                ) {
                  bonus += 3;
                }
              }
            }

            return {
              ...product,

              _stylistBonus:
                bonus
            };
          }
        );

      const ranked =
        personalizeProducts(
          enrichedProducts,
          profile,
          12
        );

      const recommendations =
        ranked
          .map(
            (product) => {

              const baseScore =
                Number(
                  product.personalizationScore ||
                  0
                );

              const bonus =
                Number(
                  product._stylistBonus ||
                  0
                );

              const finalScore =
                baseScore +
                bonus;

              return {
                ...product,

                matchScore:
                  Math.max(
                    0,
                    Math.min(
                      100,
                      50 +
                        finalScore
                    )
                  ),

                score:
                  finalScore,

                reasons: [
                  ...(product
                    .personalizationReasons ||
                    []),
                  ...(bonus > 0
                    ? [
                        "Matches details from your styling description"
                      ]
                    : [])
                ],

                _stylistBonus:
                  undefined
              };
            }
          )
          .sort(
            (a, b) =>
              b.score -
              a.score
          );

      res.json({
        query,
        profile,
        recommendations
      });

    } catch (error) {

      console.error(
        "AI Stylist error:",
        error
      );

      res.status(500).json({
        error:
          "AI Stylist failed to generate recommendations."
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
      error:
        "API endpoint not found"
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
      "=========================================="
    );

    console.log(
      "Fashion AI Discovery API"
    );

    console.log(
      `Running on port ${PORT}`
    );

    console.log(
      `Products: ${products.length}`
    );

    console.log(
      "Day 4 personalization enabled"
    );

    console.log(
      "=========================================="
    );
  }
);
