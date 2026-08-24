/*
=========================================================
FASHION AI DISCOVERY
DAY 8
EVALUATION RUNNER
=========================================================
*/

import fs from "fs";
import path from "path";
import {
  fileURLToPath,
} from "url";

import {
  evaluationCases,
} from "./evaluation-cases.js";

const __filename =
  fileURLToPath(
    import.meta.url
  );

const __dirname =
  path.dirname(
    __filename
  );

const projectRoot =
  path.resolve(
    __dirname,
    "../.."
  );

const productsPath =
  path.join(
    projectRoot,
    "data",
    "products.json"
  );

const API_BASE_URL =
  process.env.API_BASE_URL ||
  "http://localhost:3000";

/*
=========================================================
LOAD PRODUCTS
=========================================================
*/

const products =
  JSON.parse(
    fs.readFileSync(
      productsPath,
      "utf8"
    )
  );

/*
=========================================================
SEARCH
=========================================================
*/

async function search(
  query
) {
  const response =
    await fetch(
      `${API_BASE_URL}/api/search`,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            query,
          }),
      }
    );

  if (
    !response.ok
  ) {
    throw new Error(
      `Search failed: ${response.status}`
    );
  }

  const data =
    await response.json();

  return data.results || [];
}

/*
=========================================================
NORMALIZE
=========================================================
*/

function normalize(
  value
) {
  return String(
    value || ""
  )
    .toLowerCase()
    .trim();
}

/*
=========================================================
MATCH
=========================================================
*/

function matches(
  product,
  expected
) {
  if (
    expected.category &&
    normalize(
      product.category
    ) !==
      normalize(
        expected.category
      )
  ) {
    return false;
  }

  if (
    expected.color &&
    normalize(
      product.color
    ) !==
      normalize(
        expected.color
      )
  ) {
    return false;
  }

  if (
    expected.style
  ) {
    const styles =
      Array.isArray(
        product.style
      )
        ? product.style.map(
            normalize
          )
        : [];

    if (
      !styles.includes(
        normalize(
          expected.style
        )
      )
    ) {
      return false;
    }
  }

  if (
    expected.occasion
  ) {
    const occasions =
      Array.isArray(
        product.occasion
      )
        ? product.occasion.map(
            normalize
          )
        : [];

    if (
      !occasions.includes(
        normalize(
          expected.occasion
        )
      )
    ) {
      return false;
    }
  }

  if (
    expected.material
  ) {
    const materials =
      Array.isArray(
        product.material
      )
        ? product.material.map(
            normalize
          )
        : [];

    if (
      !materials.includes(
        normalize(
          expected.material
        )
      )
    ) {
      return false;
    }
  }

  return true;
}

/*
=========================================================
METRICS
=========================================================
*/

function calculateMetrics(
  results,
  expected
) {
  if (
    results.length === 0
  ) {
    return {
      precision: 0,
      top1: 0,
      averageScore: 0,
    };
  }

  const relevant =
    results.filter(
      (product) =>
        matches(
          product,
          expected
        )
    );

  const precision =
    relevant.length /
    results.length;

  const top1 =
    matches(
      results[0],
      expected
    )
      ? 1
      : 0;

  const scores =
    results
      .map(
        (product) =>
          Number(
            product.matchScore
          )
      )
      .filter(
        Number.isFinite
      );

  const averageScore =
    scores.length
      ? scores.reduce(
          (
            total,
            score
          ) =>
            total + score,
          0
        ) /
        scores.length
      : 0;

  return {
    precision,
    top1,
    averageScore,
  };
}

/*
=========================================================
RUN
=========================================================
*/

async function main() {
  console.log(
    "\n======================================"
  );

  console.log(
    "FASHION AI DISCOVERY - DAY 8"
  );

  console.log(
    "AI SEARCH EVALUATION"
  );

  console.log(
    "======================================\n"
  );

  const evaluations =
    [];

  for (
    const testCase of
      evaluationCases
  ) {
    try {
      const results =
        await search(
          testCase.query
        );

      const metrics =
        calculateMetrics(
          results,
          testCase.expected
        );

      evaluations.push(
        metrics
      );

      const status =
        metrics.top1 &&
        metrics.precision >=
          0.25
          ? "PASS"
          : "REVIEW";

      console.log(
        `Query: ${testCase.query}`
      );

      console.log(
        `Results: ${results.length}`
      );

      console.log(
        `Precision: ${(metrics.precision * 100).toFixed(1)}%`
      );

      console.log(
        `Top-1: ${metrics.top1 ? "PASS" : "FAIL"}`
      );

      console.log(
        `Average AI Score: ${metrics.averageScore.toFixed(1)}`
      );

      console.log(
        `Status: ${status}`
      );

      console.log(
        "--------------------------------------"
      );

    } catch (error) {
      console.log(
        `ERROR: ${testCase.query}`
      );

      console.log(
        error.message
      );

      console.log(
        "--------------------------------------"
      );
    }
  }

  if (
    evaluations.length === 0
  ) {
    return;
  }

  const averagePrecision =
    evaluations.reduce(
      (
        total,
        item
      ) =>
        total +
        item.precision,
      0
    ) /
    evaluations.length;

  const top1Accuracy =
    evaluations.reduce(
      (
        total,
        item
      ) =>
        total +
        item.top1,
      0
    ) /
    evaluations.length;

  const averageScore =
    evaluations.reduce(
      (
        total,
        item
      ) =>
        total +
        item.averageScore,
      0
    ) /
    evaluations.length;

  console.log(
    "\n======================================"
  );

  console.log(
    "FINAL METRICS"
  );

  console.log(
    "======================================"
  );

  console.log(
    `Average Precision: ${(averagePrecision * 100).toFixed(2)}%`
  );

  console.log(
    `Top-1 Accuracy: ${(top1Accuracy * 100).toFixed(2)}%`
  );

  console.log(
    `Average Match Score: ${averageScore.toFixed(2)}`
  );

  console.log(
    `Queries Evaluated: ${evaluations.length}`
  );

  console.log(
    "======================================\n"
  );
}

main().catch(
  (error) => {
    console.error(
      "Evaluation failed:",
      error
    );

    process.exit(1);
  }
);
