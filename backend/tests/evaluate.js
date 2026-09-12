import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import {
  compareSystems,
  createEvaluationReport
} from "../services/evaluation.js";

import {
  evaluationCases
} from "./evaluation-cases.js";

import {
  keywordBaseline,
  categoryBaseline,
  priceBaseline,
  popularityBaseline
} from "../services/baselines.js";

import {
  lexicalScore,
  attributeScore,
  budgetScore,
  hybridRetrieve
} from "../services/hybridRetrieval.js";

import {
  getSemanticScoreMap
} from "../services/semanticSearch.js";

import {
  compareMetricSamples
} from "../services/statistics.js";

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);

const products =
  JSON.parse(
    fs.readFileSync(
      path.join(
        __dirname,
        "..",
        "data",
        "products.json"
      ),
      "utf8"
    )
  );

function rankByScore(
  items,
  scoreFunction
) {
  return items
    .map((product, index) => ({
      product,
      score: Number(
        scoreFunction(product)
      ) || 0,
      index
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.index - b.index
    )
    .map(item =>
      String(item.product.id)
    );
}

function baselineSystem(query) {
  return keywordBaseline(
    products,
    query
  ).map(item =>
    String(item.id)
  );
}

function categorySystem(query) {
  return categoryBaseline(
    products,
    query
  ).map(item =>
    String(item.id)
  );
}

function priceSystem(query) {
  return priceBaseline(
    products,
    query
  ).map(item =>
    String(item.id)
  );
}

function popularitySystem() {
  return popularityBaseline(
    products
  ).map(item =>
    String(item.id)
  );
}

function lexicalSystem(query) {
  return rankByScore(
    products,
    product =>
      lexicalScore(
        query,
        product
      )
  );
}

function attributeSystem(query) {
  return rankByScore(
    products,
    product =>
      attributeScore(
        query,
        product
      )
  );
}

function semanticSystem(
  query,
  semanticProducts
) {
  return rankByScore(
    semanticProducts,
    product =>
      product.semanticScore
  );
}

function hybridSystem(
  query,
  semanticProducts
) {
  return hybridRetrieve(
    semanticProducts,
    query,
    {
      limit: products.length,
      candidateLimit:
        products.length,
      lexicalLimit:
        products.length,
      semanticLimit:
        products.length
    }
  ).results.map(
    item =>
      String(
        item.product.id
      )
  );
}

async function buildSemanticProducts() {
  const cache = new Map();

  for (
    const testCase of evaluationCases
  ) {
    const scoreMap =
      await getSemanticScoreMap(
        products,
        testCase.query
      );

    const enriched =
      products.map(product => ({
        ...product,
        semanticScore:
          Number(
            scoreMap.get(
              String(product.id)
            ) ?? 0
          )
      }));

    cache.set(
      testCase.query,
      enriched
    );
  }

  return cache;
}

function printComparison(report) {
  console.log(
    "\n======================================"
  );

  console.log(
    " Fashion Retrieval Baseline Comparison"
  );

  console.log(
    "======================================"
  );

  console.table(
    Object.entries(
      report.systems
    ).map(
      ([system, metrics]) => ({
        system,
        PrecisionAt5:
          metrics.precisionAtK,
        RecallAt5:
          metrics.recallAtK,
        F1At5:
          metrics.f1AtK,
        MRR:
          metrics.mrr,
        NDCGAt5:
          metrics.ndcgAtK,
        MAP:
          metrics.map
      })
    )
  );

  if (
    report.statisticalAnalysis
  ) {
    console.log(
      "\nStatistical Comparisons"
    );

    console.table(
      Object.entries(
        report.statisticalAnalysis
          .comparisons
      ).map(
        ([comparison, value]) => ({
          comparison,
          MRR:
            value.metrics.mrr
              .meanDifference,
          MRR_CI_Lower:
            value.metrics.mrr
              .confidenceInterval95.lower,
          MRR_CI_Upper:
            value.metrics.mrr
              .confidenceInterval95.upper,
          MRR_EffectSize:
            value.metrics.mrr
              .effectSize,
          NDCG:
            value.metrics.ndcgAtK
              .meanDifference,
          NDCG_CI_Lower:
            value.metrics.ndcgAtK
              .confidenceInterval95.lower,
          NDCG_CI_Upper:
            value.metrics.ndcgAtK
              .confidenceInterval95.upper,
          NDCG_EffectSize:
            value.metrics.ndcgAtK
              .effectSize
        })
      )
    );
  }
}

function buildStatisticalComparisons(
  results
) {
  const statisticalComparisons = {};

  const comparisonPairs = [
    ["hybrid", "lexical"],
    ["hybrid", "semantic"],
    ["hybrid", "keyword"],
    ["hybrid", "category"]
  ];

  for (
    const [systemA, systemB]
      of comparisonPairs
  ) {
    const resultA =
      results[systemA];

    const resultB =
      results[systemB];

    if (
      !resultA ||
      !resultB
    ) {
      continue;
    }

    statisticalComparisons[
      `${systemA}_vs_${systemB}`
    ] = {
      systemA,
      systemB,
      metrics: {
        precisionAtK:
          compareMetricSamples(
            resultA.queries.map(
              item =>
                item.metrics
                  .precisionAtK
            ),
            resultB.queries.map(
              item =>
                item.metrics
                  .precisionAtK
            )
          ),
        recallAtK:
          compareMetricSamples(
            resultA.queries.map(
              item =>
                item.metrics
                  .recallAtK
            ),
            resultB.queries.map(
              item =>
                item.metrics
                  .recallAtK
            )
          ),
        f1AtK:
          compareMetricSamples(
            resultA.queries.map(
              item =>
                item.metrics
                  .f1AtK
            ),
            resultB.queries.map(
              item =>
                item.metrics
                  .f1AtK
            )
          ),
        mrr:
          compareMetricSamples(
            resultA.queries.map(
              item =>
                item.metrics
                  .reciprocalRank
            ),
            resultB.queries.map(
              item =>
                item.metrics
                  .reciprocalRank
            )
          ),
        ndcgAtK:
          compareMetricSamples(
            resultA.queries.map(
              item =>
                item.metrics
                  .ndcgAtK
            ),
            resultB.queries.map(
              item =>
                item.metrics
                  .ndcgAtK
            )
          )
      }
    };
  }

  return statisticalComparisons;
}

function buildStatisticalAnalysis(
  comparisons
) {
  return {
    confidenceLevel: 0.95,
    bootstrapIterations: 2000,
    comparisonUnit:
      "paired evaluation query",
    effectSize:
      "standardized paired mean difference",
    relativeImprovement:
      "mean difference divided by comparison system mean",
    interpretationRule:
      "A 95% confidence interval excluding zero indicates evidence of a non-zero paired difference.",
    comparisons
  };
}

async function main() {
  const semanticProducts =
    await buildSemanticProducts();

  const systems = {
    keyword: query =>
      baselineSystem(query),

    category: query =>
      categorySystem(query),

    price: query =>
      priceSystem(query),

    popularity: query =>
      popularitySystem(query),

    lexical: query =>
      lexicalSystem(query),

    attribute: query =>
      attributeSystem(query),

    semantic: query =>
      semanticSystem(
        query,
        semanticProducts.get(
          query
        ) || products
      ),

    hybrid: query =>
      hybridSystem(
        query,
        semanticProducts.get(
          query
        ) || products
      )
  };

  const results =
    compareSystems(
      evaluationCases,
      systems,
      {
        k: 5
      }
    );

  const report =
    createEvaluationReport(
      results
    );

  report.experiment =
    "fashion-retrieval-baseline-comparison";

  report.datasetSize =
    products.length;

  report.evaluationQueries =
    evaluationCases.length;

  report.systemOrder = [
    "keyword",
    "category",
    "price",
    "popularity",
    "lexical",
    "attribute",
    "semantic",
    "hybrid"
  ];

  const statisticalComparisons =
    buildStatisticalComparisons(
      results
    );

  report.statisticalAnalysis =
    buildStatisticalAnalysis(
      statisticalComparisons
    );

  report.statisticalAnalysisGenerated =
    true;

  const outputDirectory =
    path.join(
      __dirname,
      "..",
      "evaluation-results"
    );

  fs.mkdirSync(
    outputDirectory,
    {
      recursive: true
    }
  );

  const outputPath =
    path.join(
      outputDirectory,
      "baseline-comparison-report.json"
    );

  const statisticalOutputPath =
    path.join(
      outputDirectory,
      "statistical-analysis-report.json"
    );

  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      report,
      null,
      2
    )
  );

  fs.writeFileSync(
    statisticalOutputPath,
    JSON.stringify(
      {
        experiment:
          report.experiment,
        datasetSize:
          report.datasetSize,
        evaluationQueries:
          report.evaluationQueries,
        methodology:
          report.statisticalAnalysis
      },
      null,
      2
    )
  );

  printComparison(
    report
  );

  console.log(
    `\nReport written to ${outputPath}`
  );

  console.log(
    `Statistical report written to ${statisticalOutputPath}`
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
