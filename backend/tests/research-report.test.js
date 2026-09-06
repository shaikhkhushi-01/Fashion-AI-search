import assert from "assert";
import {
  rankConfigurations,
  generateResearchReport,
  generateMarkdownSummary
} from "../services/researchReport.js";

const ablation = [
  {
    configuration: {
      name: "lexical-only"
    },
    aggregate: {
      precisionAtK: 0.4,
      recallAtK: 0.5,
      f1AtK: 0.44,
      mrr: 0.5,
      ndcgAtK: 0.55
    }
  },
  {
    configuration: {
      name: "full-hybrid"
    },
    aggregate: {
      precisionAtK: 0.6,
      recallAtK: 0.7,
      f1AtK: 0.64,
      mrr: 0.75,
      ndcgAtK: 0.78
    }
  }
];

const ranking =
  rankConfigurations(
    ablation
  );

assert.strictEqual(
  ranking[0].configuration,
  "full-hybrid"
);

const report =
  generateResearchReport({
    dataset: {
      size: 100,
      testQueries: 20
    },
    evaluation: {},
    ablation,
    robustness: {},
    errors: {},
    statistics: {}
  });

assert.strictEqual(
  report.ablation
    .bestConfiguration
    .configuration,
  "full-hybrid"
);

const markdown =
  generateMarkdownSummary(
    report
  );

assert.ok(
  markdown.includes(
    "Fashion AI Discovery Research Report"
  )
);

assert.ok(
  markdown.includes(
    "full-hybrid"
  )
);

console.log(
  "Research report tests passed"
);
