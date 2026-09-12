import fs from "fs";
import path from "path";
import {
  datasetFingerprint,
  createExperimentFingerprint,
  createReproducibilityManifest
} from "../services/reproducibility.js";
import {
  evaluationCases
} from "./evaluation-cases.js";

const productsPath =
  path.resolve("data/products.json");

const products =
  JSON.parse(
    fs.readFileSync(
      productsPath,
      "utf8"
    )
  );

const configuration = {
  k: 5,
  evaluation: "ranking",
  metrics: [
    "precisionAtK",
    "recallAtK",
    "f1AtK",
    "mrr",
    "ndcgAtK"
  ]
};

const firstDatasetHash =
  datasetFingerprint(products);

const secondDatasetHash =
  datasetFingerprint(products);

const firstExperimentHash =
  createExperimentFingerprint({
    experiment: "fashion-ai-evaluation",
    products,
    evaluationCases,
    configuration
  });

const secondExperimentHash =
  createExperimentFingerprint({
    experiment: "fashion-ai-evaluation",
    products,
    evaluationCases,
    configuration
  });

if (firstDatasetHash !== secondDatasetHash) {
  throw new Error(
    "Dataset fingerprint is not deterministic"
  );
}

if (
  firstExperimentHash !==
  secondExperimentHash
) {
  throw new Error(
    "Experiment fingerprint is not deterministic"
  );
}

const manifest =
  createReproducibilityManifest({
    experiment: "fashion-ai-evaluation",
    products,
    evaluationCases,
    configuration,
    results: {
      deterministic: true
    }
  });

const outputDirectory =
  path.resolve("evaluation-results");

fs.mkdirSync(outputDirectory, {
  recursive: true
});

fs.writeFileSync(
  path.join(
    outputDirectory,
    "reproducibility-manifest.json"
  ),
  JSON.stringify(manifest, null, 2)
);

console.log(
  JSON.stringify(
    {
      deterministic: true,
      datasetHash: manifest.datasetHash,
      experimentFingerprint:
        manifest.experimentFingerprint
    },
    null,
    2
  )
);
