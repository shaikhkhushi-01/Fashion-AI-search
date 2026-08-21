const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const {
  buildProductIndex,
  semanticSearch,
  understandFashionQuery
} = require("./services/aiSearch");


/* =========================================================
   APP
========================================================= */

const app = express();

const PORT =
  process.env.PORT || 10000;


/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(cors());

app.use(
  express.json({
    limit: "5mb"
  })
);


/* =========================================================
   PRODUCTS
========================================================= */

const productsPath =
  path.join(
    __dirname,
    "..",
    "data",
    "products.json"
  );


let products = [];

let indexedProducts = [];

let aiReady = false;


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

    products = [];

  }


  console.log(
    `Loaded ${products.length} products.`
  );

} catch (error) {

  console.error(
    "Could not load products.json:",
    error.message
  );

  products = [];

}


/* =========================================================
   ROOT
========================================================= */

app.get(
  "/",
  (req, res) => {

    res.json({

      status: "online",

      service:
        "Fashion AI Discovery",

      version:
        "2.0.0",

      ai: {

        enabled: true,

        model:
          "Xenova/all-MiniLM-L6-v2",

        type:
          "semantic-embedding-search"

      },

      products:
        products.length,

      aiReady,

      endpoints: [

        "GET /",

        "GET /api/health",

        "GET /api/products",

        "POST /api/search",

        "POST /api/understand"

      ],

      message:
        "Fashion AI Discovery API is running."

    });

  }
);


/* =========================================================
   HEALTH
========================================================= */

app.get(
  "/api/health",
  (req, res) => {

    res.json({

      success: true,

      service:
        "Fashion AI Discovery",

      aiReady,

      productCount:
        products.length,

      indexedProducts:
        indexedProducts.length

    });

  }
);


/* =========================================================
   PRODUCTS
========================================================= */

app.get(
  "/api/products",
  (req, res) => {

    res.json({

      success: true,

      count:
        products.length,

      products

    });

  }
);


/* =========================================================
   QUERY UNDERSTANDING
========================================================= */

app.post(
  "/api/understand",
  (req, res) => {

    try {

      const query =
        String(
          req.body?.query || ""
        ).trim();


      if (!query) {

        return res
          .status(400)
          .json({

            success: false,

            error:
              "Search query is required."

          });

      }


      const intent =
        understandFashionQuery(
          query
        );


      res.json({

        success: true,

        query,

        intent

      });

    } catch (error) {

      console.error(
        "Understanding error:",
        error
      );


      res
        .status(500)
        .json({

          success: false,

          error:
            "Could not understand query."

        });

    }

  }
);


/* =========================================================
   AI SEARCH
========================================================= */

app.post(
  "/api/search",
  async (req, res) => {

    try {

      const query =
        String(
          req.body?.query || ""
        ).trim();


      if (!query) {

        return res
          .status(400)
          .json({

            success: false,

            error:
              "Search query is required."

          });

      }


      if (!aiReady) {

        return res
          .status(503)
          .json({

            success: false,

            error:
              "AI search engine is still starting. Please try again in a few seconds.",

            aiReady: false

          });

      }


      const intent =
        understandFashionQuery(
          query
        );


      const results =
        await semanticSearch(
          query,
          indexedProducts,
          20
        );


      res.json({

        success: true,

        query,

        ai: {

          model:
            "Xenova/all-MiniLM-L6-v2",

          searchType:
            "hybrid-semantic-ranking",

          semanticWeight:
            0.65,

          attributeWeight:
            0.35

        },

        understoodQuery:
          intent,

        count:
          results.length,

        results

      });

    } catch (error) {

      console.error(
        "AI search error:",
        error
      );


      res
        .status(500)
        .json({

          success: false,

          error:
            "AI search failed.",

          details:
            process.env.NODE_ENV ===
            "development"
              ? error.message
              : undefined

        });

    }

  }
);


/* =========================================================
   404
========================================================= */

app.use(
  (req, res) => {

    res
      .status(404)
      .json({

        success: false,

        error:
          "Endpoint not found."

      });

  }
);


/* =========================================================
   START SERVER
========================================================= */

async function startServer() {

  try {

    console.log(
      "Starting Fashion AI Discovery..."
    );


    console.log(
      "Preparing AI semantic search model..."
    );


    indexedProducts =
      await buildProductIndex(
        products
      );


    aiReady = true;


    app.listen(
      PORT,
      () => {

        console.log(
          `Fashion AI Discovery running on port ${PORT}`
        );

        console.log(
          `AI indexed products: ${indexedProducts.length}`
        );

      }
    );

  } catch (error) {

    console.error(
      "Failed to initialise AI:",
      error
    );


    process.exit(1);

  }

}


startServer();
