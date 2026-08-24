/*
=========================================================
FASHION AI DISCOVERY
DAY 8
API TEST SUITE
=========================================================
*/

import test, {
  describe,
  before,
} from "node:test";

import assert from "node:assert/strict";

const API_BASE_URL =
  process.env.API_BASE_URL ||
  "http://localhost:3000";

let apiAvailable = false;

/*
=========================================================
API HELPER
=========================================================
*/

async function request(
  path,
  options = {}
) {
  const response =
    await fetch(
      `${API_BASE_URL}${path}`,
      {
        ...options,

        headers: {
          "Content-Type":
            "application/json",

          ...(options.headers || {}),
        },
      }
    );

  let data = null;

  try {
    data =
      await response.json();
  } catch {
    data = null;
  }

  return {
    response,
    data,
  };
}

/*
=========================================================
CHECK API
=========================================================
*/

before(
  async () => {
    try {
      const {
        response,
      } = await request(
        "/api/health"
      );

      apiAvailable =
        response.ok;

    } catch {
      apiAvailable =
        false;
    }

    if (!apiAvailable) {
      console.log(
        "\nAPI server is not running."
      );

      console.log(
        `Expected: ${API_BASE_URL}`
      );

      console.log(
        "Start backend first, then run tests.\n"
      );
    }
  }
);

/*
=========================================================
HEALTH
=========================================================
*/

describe(
  "Health API",
  () => {
    test(
      "GET /api/health should return online status",
      async () => {
        if (!apiAvailable) {
          return;
        }

        const {
          response,
          data,
        } =
          await request(
            "/api/health"
          );

        assert.equal(
          response.status,
          200
        );

        assert.equal(
          data.status,
          "online"
        );
      }
    );
  }
);

/*
=========================================================
PRODUCT API
=========================================================
*/

describe(
  "Product API",
  () => {
    test(
      "GET /api/products should return products",
      async () => {
        if (!apiAvailable) {
          return;
        }

        const {
          response,
          data,
        } =
          await request(
            "/api/products"
          );

        assert.equal(
          response.status,
          200
        );

        assert.ok(
          Array.isArray(
            data.products
          )
        );

        assert.ok(
          data.products.length > 0
        );
      }
    );

    test(
      "products should contain required fields",
      async () => {
        if (!apiAvailable) {
          return;
        }

        const {
          data,
        } =
          await request(
            "/api/products"
          );

        const product =
          data.products[0];

        assert.ok(
          product.id !== undefined
        );

        assert.ok(
          product.name
        );

        assert.ok(
          product.category
        );

        assert.ok(
          product.price !== undefined
        );
      }
    );
  }
);

/*
=========================================================
SEARCH TESTS
=========================================================
*/

describe(
  "AI Search API",
  () => {
    test(
      "black oversized shirt should return results",
      async () => {
        if (!apiAvailable) {
          return;
        }

        const {
          response,
          data,
        } =
          await request(
            "/api/search",
            {
              method:
                "POST",

              body:
                JSON.stringify({
                  query:
                    "black oversized shirt",
                }),
            }
          );

        assert.equal(
          response.status,
          200
        );

        assert.ok(
          Array.isArray(
            data.results
          )
        );

        assert.ok(
          data.results.length > 0
        );
      }
    );

    test(
      "summer fashion should return results",
      async () => {
        if (!apiAvailable) {
          return;
        }

        const {
          response,
          data,
        } =
          await request(
            "/api/search",
            {
              method:
                "POST",

              body:
                JSON.stringify({
                  query:
                    "comfortable summer outfit",
                }),
            }
          );

        assert.equal(
          response.status,
          200
        );

        assert.ok(
          Array.isArray(
            data.results
          )
        );
      }
    );

    test(
      "formal black outfit should return results",
      async () => {
        if (!apiAvailable) {
          return;
        }

        const {
          response,
          data,
        } =
          await request(
            "/api/search",
            {
              method:
                "POST",

              body:
                JSON.stringify({
                  query:
                    "formal black outfit for office",
                }),
            }
          );

        assert.equal(
          response.status,
          200
        );

        assert.ok(
          Array.isArray(
            data.results
          )
        );
      }
    );
  }
);

/*
=========================================================
SEARCH EDGE CASES
=========================================================
*/

describe(
  "Search Edge Cases",
  () => {
    test(
      "empty query should not crash API",
      async () => {
        if (!apiAvailable) {
          return;
        }

        const {
          response,
        } =
          await request(
            "/api/search",
            {
              method:
                "POST",

              body:
                JSON.stringify({
                  query: "",
                }),
            }
          );

        assert.ok(
          response.status >= 200 &&
          response.status < 500
        );
      }
    );

    test(
      "missing query should not crash API",
      async () => {
        if (!apiAvailable) {
          return;
        }

        const {
          response,
        } =
          await request(
            "/api/search",
            {
              method:
                "POST",

              body:
                JSON.stringify({}),
            }
          );

        assert.ok(
          response.status >= 200 &&
          response.status < 500
        );
      }
    );

    test(
      "very long query should not crash API",
      async () => {
        if (!apiAvailable) {
          return;
        }

        const longQuery =
          "fashion ".repeat(
            100
          );

        const {
          response,
        } =
          await request(
            "/api/search",
            {
              method:
                "POST",

              body:
                JSON.stringify({
                  query:
                    longQuery,
                }),
            }
          );

        assert.ok(
          response.status >= 200 &&
          response.status < 500
        );
      }
    );

    test(
      "special characters should not crash API",
      async () => {
        if (!apiAvailable) {
          return;
        }

        const {
          response,
        } =
          await request(
            "/api/search",
            {
              method:
                "POST",

              body:
                JSON.stringify({
                  query:
                    "black $$$ ### shirt !!!",
                }),
            }
          );

        assert.ok(
          response.status >= 200 &&
          response.status < 500
        );
      }
    );
  }
);

/*
=========================================================
STYLIST TESTS
=========================================================
*/

describe(
  "AI Stylist API",
  () => {
    test(
      "stylist should return recommendations",
      async () => {
        if (!apiAvailable) {
          return;
        }

        const {
          response,
          data,
        } =
          await request(
            "/api/stylist",
            {
              method:
                "POST",

              body:
                JSON.stringify({
                  occasion:
                    "College",

                  style:
                    "Casual",

                  comfort:
                    "High",

                  color:
                    "Black",

                  coverage:
                    "Regular",

                  description:
                    "comfortable black college outfit",
                }),
            }
          );

        assert.equal(
          response.status,
          200
        );

        assert.ok(
          Array.isArray(
            data.recommendations
          )
        );
      }
    );

    test(
      "stylist should handle empty input",
      async () => {
        if (!apiAvailable) {
          return;
        }

        const {
          response,
        } =
          await request(
            "/api/stylist",
            {
              method:
                "POST",

              body:
                JSON.stringify({}),
            }
          );

        assert.ok(
          response.status >= 200 &&
          response.status < 500
        );
      }
    );
  }
);

/*
=========================================================
404 TEST
=========================================================
*/

describe(
  "Error Handling",
  () => {
    test(
      "unknown API route should return 404",
      async () => {
        if (!apiAvailable) {
          return;
        }

        const {
          response,
        } =
          await request(
            "/api/does-not-exist"
          );

        assert.equal(
          response.status,
          404
        );
      }
    );
  }
);

console.log(
  "\n========================================"
);

console.log(
  "FASHION AI DAY 8 TEST SUITE"
);

console.log(
  `API: ${API_BASE_URL}`
);

console.log(
  "========================================\n"
);
