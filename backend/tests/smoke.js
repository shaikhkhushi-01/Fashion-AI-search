/*
=========================================================
FASHION AI DISCOVERY
DAY 13 - SMOKE TEST
=========================================================
*/

const BASE_URL =
  process.env.API_BASE_URL ||
  "http://localhost:10000";

const checks = [
  {
    name: "health",
    path: "/api/health"
  },
  {
    name: "ready",
    path: "/api/ready"
  },
  {
    name: "version",
    path: "/api/version"
  },
  {
    name: "manifest",
    path: "/api/manifest"
  },
  {
    name: "products",
    path: "/api/products"
  },
  {
    name: "filters",
    path: "/api/filters"
  }
];

async function checkEndpoint(
  check
) {
  const started =
    performance.now();

  try {
    const response =
      await fetch(
        `${BASE_URL}${check.path}`
      );

    const duration =
      performance.now() -
      started;

    let body = null;

    try {
      body =
        await response.json();
    } catch {
      body = null;
    }

    return {
      name:
        check.name,

      path:
        check.path,

      status:
        response.status,

      ok:
        response.ok,

      latencyMs:
        Number(
          duration.toFixed(2)
        ),

      body
    };
  } catch (error) {
    return {
      name:
        check.name,

      path:
        check.path,

      status:
        null,

      ok:
        false,

      latencyMs:
        null,

      error:
        error instanceof Error
          ? error.message
          : String(error)
    };
  }
}

async function checkSearch() {
  const started =
    performance.now();

  try {
    const response =
      await fetch(
        `${BASE_URL}/api/search`,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              query:
                "black shirt",

              limit:
                5
            })
        }
      );

    const duration =
      performance.now() -
      started;

    const body =
      await response.json();

    return {
      name:
        "search",

      path:
        "/api/search",

      status:
        response.status,

      ok:
        response.ok &&
        Array.isArray(
          body.results
        ),

      latencyMs:
        Number(
          duration.toFixed(2)
        ),

      resultCount:
        Array.isArray(
          body.results
        )
          ? body.results.length
          : 0
    };
  } catch (error) {
    return {
      name:
        "search",

      path:
        "/api/search",

      status:
        null,

      ok:
        false,

      latencyMs:
        null,

      error:
        error instanceof Error
          ? error.message
          : String(error)
    };
  }
}

async function main() {
  console.log(
    "\n========================================================="
  );

  console.log(
    "DAY 13 — API SMOKE TEST"
  );

  console.log(
    `Target: ${BASE_URL}`
  );

  console.log(
    "=========================================================\n"
  );

  const results = [];

  for (
    const check of checks
  ) {
    results.push(
      await checkEndpoint(
        check
      )
    );
  }

  results.push(
    await checkSearch()
  );

  for (
    const result of results
  ) {
    console.log(
      `${result.ok ? "PASS" : "FAIL"} | ` +
      `${result.name} | ` +
      `${result.status ?? "ERROR"} | ` +
      `${result.latencyMs ?? "-"}ms`
    );
  }

  const failed =
    results.filter(
      result =>
        !result.ok
    );

  console.log(
    `\nPassed: ${
      results.length -
      failed.length
    }/${results.length}`
  );

  if (failed.length) {
    console.error(
      "\nSmoke test FAILED."
    );

    process.exitCode = 1;
    return;
  }

  console.log(
    "\nSmoke test PASSED."
  );
}

main();
