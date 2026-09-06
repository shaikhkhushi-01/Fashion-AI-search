import fs from "fs";
import path from "path";

function round(value, digits = 4) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  const factor =
    10 ** digits;

  return (
    Math.round(
      number * factor
    ) / factor
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
    statistics
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
  generateResearchReport,
  writeResearchReport,
  generateMarkdownSummary,
  writeMarkdownSummary
};
