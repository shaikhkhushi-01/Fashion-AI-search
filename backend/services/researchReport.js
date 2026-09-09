import fs from "fs";
import path from "path";

function round(value, digits = 4) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  const factor = 10 ** digits;

  return (
    Math.round(number * factor) / factor
  );
}

function summarizeConfiguration(
  configuration
) {
  return {
    configuration:
      configuration?.configuration?.name ??
      configuration?.name ??
      "unknown",
    precisionAtK:
      round(
        configuration?.aggregate
          ?.precisionAtK
      ),
    recallAtK:
      round(
        configuration?.aggregate
          ?.recallAtK
      ),
    f1AtK:
      round(
        configuration?.aggregate
          ?.f1AtK
      ),
    mrr:
      round(
        configuration?.aggregate
          ?.mrr
      ),
    ndcgAtK:
      round(
        configuration?.aggregate
          ?.ndcgAtK
      )
  };
}

function rankConfigurations(
  configurations
) {
  return configurations
    .map(
      summarizeConfiguration
    )
    .sort(
      (a, b) =>
        b.ndcgAtK -
        a.ndcgAtK
    )
    .map(
      (item, index) => ({
        rank: index + 1,
        ...item
      })
    );
}

function summarizeStatistics(
  statistics
) {
  const comparisons =
    statistics?.comparisons;

  if (
    !comparisons ||
    typeof comparisons !== "object"
  ) {
    return [];
  }

  return Object.entries(
    comparisons
  ).map(
    ([name, comparison]) => {
      const metrics =
        comparison?.metrics ?? {};

      return {
        comparison: name,
        systemA:
          comparison?.systemA ??
          "unknown",
        systemB:
          comparison?.systemB ??
          "unknown",
        metrics:
          Object.fromEntries(
            Object.entries(
              metrics
            ).map(
              ([metric, value]) => [
                metric,
                {
                  meanDifference:
                    round(
                      value?.meanDifference
                    ),
                  relativeImprovement:
                    round(
                      value?.relativeImprovement
                    ),
                  effectSize:
                    round(
                      value?.effectSize
                    ),
                  confidenceInterval95: {
                    lower:
                      round(
                        value
                          ?.confidenceInterval95
                          ?.lower
                      ),
                    upper:
                      round(
                        value
                          ?.confidenceInterval95
                          ?.upper
                      )
                  }
                }
              ]
            )
          )
      };
    }
  );
}

function generateResearchReport({
  dataset,
  evaluation,
  ablation,
  robustness,
  errors,
  statistics
}) {
  const configurations =
    Array.isArray(
      ablation
    )
      ? ablation
      : [];

  const ranking =
    rankConfigurations(
      configurations
    );

  return {
    project:
      "Fashion AI Discovery",
    experiment:
      "research-evaluation-suite",
    generatedAt:
      new Date().toISOString(),
    dataset,
    evaluation,
    ablation: {
      configurations:
        ranking,
      bestConfiguration:
        ranking[0] || null
    },
    robustness,
    errorAnalysis: errors,
    statistics: {
      ...statistics,
      summaries:
        summarizeStatistics(
          statistics
        )
    }
  };
}

function writeResearchReport(
  report,
  outputDirectory =
    "evaluation-results"
) {
  const directory =
    path.resolve(
      outputDirectory
    );

  fs.mkdirSync(
    directory,
    {
      recursive: true
    }
  );

  const outputPath =
    path.join(
      directory,
      "research-report.json"
    );

  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      report,
      null,
      2
    )
  );

  return outputPath;
}

function generateMarkdownSummary(
  report
) {
  const best =
    report?.ablation
      ?.bestConfiguration;

  const datasetSize =
    report?.dataset
      ?.size ?? 0;

  const testQueries =
    report?.dataset
      ?.testQueries ?? 0;

  const bestName =
    best?.configuration ??
    "not available";

  const ndcg =
    round(
      best?.ndcgAtK
    );

  const mrr =
    round(
      best?.mrr
    );

  const statistics =
    report?.statistics
      ?.summaries ?? [];

  const statisticalLines =
    [];

  for (
    const comparison
      of statistics
  ) {
    const metric =
      comparison
        ?.metrics
        ?.reciprocalRank;

    if (!metric) {
      continue;
    }

    const ci =
      metric
        ?.confidenceInterval95;

    statisticalLines.push(
      `- ${comparison.systemA} vs ${comparison.systemB}: mean difference ${round(metric.meanDifference)}, relative improvement ${round(metric.relativeImprovement * 100, 2)}%, effect size ${round(metric.effectSize)}, 95% CI [${round(ci?.lower)}, ${round(ci?.upper)}]`
    );
  }

  return [
    "# Fashion AI Discovery Research Report",
    "",
    `Dataset size: ${datasetSize}`,
    `Test queries: ${testQueries}`,
    "",
    "## Best Configuration",
    "",
    `Configuration: ${bestName}`,
    `NDCG@K: ${ndcg}`,
    `MRR: ${mrr}`,
    "",
    "## Statistical Analysis",
    "",
    statisticalLines.length
      ? statisticalLines.join("\n")
      : "No pairwise statistical comparisons available.",
    "",
    "## Experimental Components",
    "",
    "- Baseline retrieval",
    "- Semantic retrieval",
    "- Hybrid retrieval",
    "- Learning-to-rank",
    "- Personalization",
    "- Multimodal fusion",
    "- Robustness testing",
    "- Error analysis",
    "- Statistical analysis",
    "",
    "## Reproducibility",
    "",
    "Experiments should be executed with a fixed dataset version, evaluation set and configuration.",
    ""
  ].join("\n");
}

function writeMarkdownSummary(
  report,
  outputDirectory =
    "evaluation-results"
) {
  const directory =
    path.resolve(
      outputDirectory
    );

  fs.mkdirSync(
    directory,
    {
      recursive: true
    }
  );

  const outputPath =
    path.join(
      directory,
      "research-summary.md"
    );

  fs.writeFileSync(
    outputPath,
    generateMarkdownSummary(
      report
    )
  );

  return outputPath;
}

export {
  round,
  summarizeConfiguration,
  rankConfigurations,
  summarizeStatistics,
  generateResearchReport,
  writeResearchReport,
  generateMarkdownSummary,
  writeMarkdownSummary
};
