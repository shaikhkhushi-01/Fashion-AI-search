import fs from "fs";
import path from "path";
import {
  hybridSearch
} from "../services/hybridPipeline.js";
import {
  rankWithLearningModel,
  combineHybridAndRanker
} from "../services/rankerPipeline.js";
import {
  loadModel
} from "../services/learningRanker.js";
import {
  products,
  evaluationCases
} from "./evaluation-cases.js";

const semanticUrl =
  process.env.SEMANTIC_API_URL ||
  "http://127.0.0.1:8000";

let model = null;

try {
  model = loadModel();
} catch {
  model = null;
}

const results = [];

for (const testCase of evaluationCases) {
  try {
    const hybrid =
      await hybridSearch(
        products,
        testCase.query,
        {
          topK: 5,
          semanticUrl
        }
      );

    const finalResults =
      model
        ? combineHybridAndRanker(
            hybrid,
            testCase.query,
            model
          )
        : hybrid;

    results.push({
      query: testCase.query,
      relevantIds:
        testCase.relevantIds,
      hybridIds:
        hybrid.map(item =>
          String(item.id)
        ),
      finalIds:
        finalResults.map(item =>
          String(item.id)
        ),
      semanticAvailable:
        hybrid.some(
          item =>
            Number.isFinite(
              Number(item.semanticScore)
            ) &&
            Number(item.semanticScore) > 0
        ),
      rankerAvailable:
        Boolean(model)
    });
  } catch (error) {
    results.push({
      query: testCase.query,
      relevantIds:
        testCase.relevantIds,
      error:
        String(
          error?.message ?? error
        )
    });
  }
}

const report = {
  experiment:
    "semantic-hybrid-ranker-integration",
  semanticUrl,
  modelAvailable: Boolean(model),
  queries: results,
  generatedAt:
    new Date().toISOString()
};

const outputDirectory =
  path.resolve(
    "evaluation-results"
  );

fs.mkdirSync(
  outputDirectory,
  {
    recursive: true
  }
);

fs.writeFileSync(
  path.join(
    outputDirectory,
    "integration-report.json"
  ),
  JSON.stringify(
    report,
    null,
    2
  )
);

console.log(
  JSON.stringify(
    report,
    null,
    2
  )
);
