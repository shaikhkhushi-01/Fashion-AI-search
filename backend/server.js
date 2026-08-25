/*
=========================================================
FASHION AI DISCOVERY
RESEARCH-GRADE BACKEND
DAY 1
=========================================================
*/

import express from "express";
import cors from "cors";

import {
  getProducts,
  getCatalogStats,
  filterCatalog,
  reloadCatalog
} from "./services/catalog.js";

import {
  searchProducts,
  understandQuery
} from "./services/aiSearch.js";

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
REQUEST LOGGER
=========================================================
*/

app.use(
  (
    request,
    response,
    next
  ) => {

    const start =
      Date.now();

    response.on(
      "finish",
      () => {

        const duration =
          Date.now() -
          start;

        console.log(
          `${request.method} ${request.originalUrl} ${response.statusCode} ${duration}ms`
        );
      }
    );

    next();
  }
);

/*
=========================================================
ROOT
=========================================================
*/

app.get(
  "/",
  (
    request,
    response
  ) => {

    response.json({

      service:
        "Fashion AI Discovery",

      version:
        "5.0.0",

      status:
        "running",

      description:
        "Research-grade AI fashion discovery backend",

      endpoints: [
        "/api/health",
        "/api/products",
        "/api/catalog/stats",
        "/api/search",
        "/api/query/understand",
        "/api/products/filter"
      ]
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
  (
    request,
    response
  ) => {

    try {

      const products =
        getProducts();

      response.json({

        status:
          "ok",

        service:
          "Fashion AI Discovery",

        version:
          "5.0.0",

        products:
          products.length,

        timestamp:
          new Date().toISOString()
      });

    } catch (error) {

      response.status(
        500
      ).json({

        status:
          "error",

        error:
          error.message
      });
    }
  }
);

/*
=========================================================
PRODUCTS
=========================================================
*/

app.get(
  "/api/products",
  (
    request,
    response
  ) => {

    try {

      const products =
        getProducts();

      response.json({

        success:
          true,

        count:
          products.length,

        products
      });

    } catch (error) {

      response.status(
        500
      ).json({

        success:
          false,

        error:
          error.message
      });
    }
  }
);

/*
=========================================================
CATALOG STATS
=========================================================
*/

app.get(
  "/api/catalog/stats",
  (
    request,
    response
  ) => {

    try {

      response.json({

        success:
          true,

        stats:
          getCatalogStats()
      });

    } catch (error) {

      response.status(
        500
      ).json({

        success:
          false,

        error:
          error.message
      });
    }
  }
);

/*
=========================================================
SEARCH
=========================================================
*/

app.post(
  "/api/search",
  (
    request,
    response
  ) => {

    try {

      const {
        query,
        limit
      } =
        request.body || {};

      if (
        typeof query !==
        "string" ||
        !query.trim()
      ) {

        return response
          .status(400)
          .json({

            success:
              false,

            error:
              "Search query is required."
          });
      }

      const result =
        searchProducts(
          query,
          {
            limit:
              Math.min(
                Math.max(
                  Number(limit) ||
                    20,
                  1
                ),
                50
              )
          }
        );

      response.json({

        success:
          true,

        ...result
      });

    } catch (error) {

      console.error(
        "Search error:",
        error
      );

      response
        .status(500)
        .json({

          success:
            false,

          error:
            error.message
        });
    }
  }
);

/*
=========================================================
QUERY UNDERSTANDING
=========================================================
*/

app.post(
  "/api/query/understand",
  (
    request,
    response
  ) => {

    try {

      const {
        query
      } =
        request.body || {};

      if (
        typeof query !==
        "string" ||
        !query.trim()
      ) {

        return response
          .status(400)
          .json({

            success:
              false,

            error:
              "Query is required."
          });
      }

      response.json({

        success:
          true,

        query,

        interpretation:
          understandQuery(
            query
          )
      });

    } catch (error) {

      response
        .status(500)
        .json({

          success:
            false,

          error:
            error.message
        });
    }
  }
);

/*
=========================================================
FILTER PRODUCTS
=========================================================
*/

app.get(
  "/api/products/filter",
  (
    request,
    response
  ) => {

    try {

      const products =
        filterCatalog(
          request.query
        );

      response.json({

        success:
          true,

        count:
          products.length,

        products
      });

    } catch (error) {

      response
        .status(500)
        .json({

          success:
            false,

          error:
            error.message
        });
    }
  }
);

/*
=========================================================
RELOAD DATASET
=========================================================
*/

app.post(
  "/api/catalog/reload",
  (
    request,
    response
  ) => {

    try {

      const products =
        reloadCatalog();

      response.json({

        success:
          true,

        message:
          "Catalog reloaded successfully.",

        count:
          products.length
      });

    } catch (error) {

      response
        .status(500)
        .json({

          success:
            false,

          error:
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
  (
    request,
    response
  ) => {

    response
      .status(404)
      .json({

        success:
          false,

        error:
          "Endpoint not found.",

        path:
          request.originalUrl
      });
  }
);

/*
=========================================================
GLOBAL ERROR
=========================================================
*/

app.use(
  (
    error,
    request,
    response,
    next
  ) => {

    console.error(
      "Unhandled server error:",
      error
    );

    response
      .status(500)
      .json({

        success:
          false,

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
      "=========================================="
    );

    console.log(
      "Fashion AI Discovery Backend"
    );

    console.log(
      "Research Foundation v5.0.0"
    );

    console.log(
      `Server running on port ${PORT}`
    );

    try {

      const stats =
        getCatalogStats();

      console.log(
        `Products loaded: ${stats.totalProducts}`
      );

      console.log(
        `Brands: ${stats.uniqueBrands}`
      );

      console.log(
        `Categories: ${stats.uniqueCategories}`
      );

    } catch (error) {

      console.error(
        "Dataset loading failed:",
        error.message
      );
    }

    console.log(
      "=========================================="
    );
  }
);
