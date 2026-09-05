import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKEND_DIR = path.join(__dirname, "..");
const ROOT_DIR = path.join(BACKEND_DIR, "..");

const files = {
  aiSearch: path.join(BACKEND_DIR, "services", "aiSearch.js"),
  evaluation: path.join(BACKEND_DIR, "services", "evaluation.js"),
  products: path.join(ROOT_DIR, "data", "products.json"),
  package: path.join(BACKEND_DIR, "package.json"),
  evaluate: path.join(BACKEND_DIR, "tests", "evaluate.js"),
  ablation: path.join(BACKEND_DIR, "tests", "ablation.js"),
  robustness: path.join(BACKEND_DIR, "tests", "robustness.js"),
  reproducibility: path.join(
    BACKEND_DIR,
    "tests",
    "reproducibility.js"
  ),
  evaluationCases: path.join(
    BACKEND_DIR,
    "tests",
    "evaluation-cases.js"
  )
};

const requiredProductFields = [
  "name",
  "category",
  "description",
  "brand",
  "price",
  "color",
  "material",
  "occasion",
  "style"
];

const aiFields = [
  "embedding",
  "embeddingScore",
  "semanticScore",
  "semantic_similarity",
  "similarity",
  "vectorScore"
];

let passed = 0;
let warnings = 0;
let critical = 0;

function exists(file) {
  return fs.existsSync(file);
}

function read(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

function pass(message) {
  passed++;
  console.log(`PASS  ${message}`);
}

function warn(message) {
  warnings++;
  console.log(`WARN  ${message}`);
}

function fail(message) {
  critical++;
  console.log(`CRITICAL  ${message}`);
}

function info(message) {
  console.log(`INFO  ${message}`);
}

console.log("\n========================================");
console.log("PROJECT STRUCTURE");
console.log("========================================");

for (const [name, file] of Object.entries(files)) {
  if (exists(file)) {
    pass(`${name}: ${path.relative(ROOT_DIR, file)}`);
  } else {
    warn(`${name}: ${path.relative(ROOT_DIR, file)}`);
  }
}

console.log("\n========================================");
console.log("BACKEND CONFIGURATION");
console.log("========================================");

if (exists(files.package)) {
  try {
    const pkg = JSON.parse(read(files.package));

    if (pkg.type === "module") {
      pass('package.json uses "type": "module"');
    } else {
      warn('package.json does not use "type": "module"');
    }

    if (pkg.dependencies?.["@huggingface/transformers"]) {
      pass("@huggingface/transformers dependency detected");
    } else {
      warn("@huggingface/transformers dependency not detected");
    }

    const scripts = pkg.scripts || {};

    [
      "start",
      "evaluate",
      "ablation",
      "robustness",
      "reproducibility",
      "smoke"
    ].forEach((script) => {
      if (scripts[script]) {
        pass(`npm script: ${script}`);
      } else {
        warn(`npm script missing: ${script}`);
      }
    });
  } catch (error) {
    fail(`package.json parse error: ${error.message}`);
  }
}

console.log("\n========================================");
console.log("DATASET");
console.log("========================================");

let products = [];

if (!exists(files.products)) {
  fail("products.json not found");
} else {
  try {
    products = JSON.parse(read(files.products));

    if (!Array.isArray(products)) {
      fail("products.json must contain an array");
      products = [];
    } else {
      pass(`Dataset loaded: ${products.length} products`);

      if (products.length < 50) {
        warn(
          `Dataset size is ${products.length}. A larger dataset is required for stronger retrieval experiments`
        );
      } else if (products.length < 500) {
        warn(
          `Dataset size is ${products.length}. More data would improve research reliability`
        );
      } else {
        pass(`Dataset size: ${products.length} products`);
      }
    }
  } catch (error) {
    fail(`products.json parse error: ${error.message}`);
  }
}

console.log("\n========================================");
console.log("PRODUCT SCHEMA");
console.log("========================================");

if (products.length > 0) {
  for (const field of requiredProductFields) {
    const count = products.filter(
      (product) =>
        product &&
        product[field] !== undefined &&
        product[field] !== null &&
        String(product[field]).trim() !== ""
    ).length;

    const percentage = ((count / products.length) * 100).toFixed(1);

    if (count === products.length) {
      pass(`${field}: ${count}/${products.length} (${percentage}%)`);
    } else {
      warn(`${field}: ${count}/${products.length} (${percentage}%)`);
    }
  }

  let aiFieldFound = false;

  for (const field of aiFields) {
    const count = products.filter(
      (product) =>
        product &&
        product[field] !== undefined &&
        product[field] !== null
    ).length;

    if (count > 0) {
      aiFieldFound = true;
      info(`${field}: ${count}/${products.length}`);
    }
  }

  if (!aiFieldFound) {
    warn("No embedding or semantic vector fields detected");
  }
}

console.log("\n========================================");
console.log("SEMANTIC SEARCH");
console.log("========================================");

const aiSearchCode = read(files.aiSearch);

if (!aiSearchCode) {
  fail("aiSearch.js could not be read");
} else {
  const semanticFunction =
    /function\s+getSemanticScore|const\s+getSemanticScore|export\s+function\s+getSemanticScore/.test(
      aiSearchCode
    );

  if (semanticFunction) {
    pass("getSemanticScore detected");
  } else {
    warn("getSemanticScore not detected");
  }

  const keywordFallback =
    /keywordScore\s*\(\s*tokenize\s*\(\s*query\s*\)/.test(
      aiSearchCode
    );

  if (keywordFallback) {
    fail(
      "Semantic score uses keyword-based fallback"
    );
  } else {
    pass("No keyword-based semantic fallback detected");
  }

  const embeddingEvidence = [
    "embedding",
    "vector",
    "cosine",
    "similarity",
    "transformers"
  ].filter((term) =>
    aiSearchCode.toLowerCase().includes(term)
  );

  if (embeddingEvidence.length > 0) {
    info(
      `Vector-related implementation detected: ${embeddingEvidence.join(
        ", "
      )}`
    );
  } else {
    warn("No vector implementation detected");
  }

  if (/0\.45/.test(aiSearchCode)) {
    info("A 0.45 ranking weight is present in the search logic");
  }
}

console.log("\n========================================");
console.log("METADATA SCORING");
console.log("========================================");

const metadataFunction =
  /function\s+metadataScore|const\s+metadataScore|metadataScore\s*=/.test(
    aiSearchCode
  );

if (metadataFunction) {
  pass("metadataScore detected");

  const metadataFields = [
    "name",
    "category",
    "description",
    "brand",
    "price",
    "color",
    "style",
    "occasion"
  ];

  const detectedFields = metadataFields.filter((field) => {
    return (
      aiSearchCode.includes(`product.${field}`) ||
      aiSearchCode.includes(`product?.${field}`) ||
      aiSearchCode.includes(`product["${field}"]`)
    );
  });

  if (detectedFields.length >= 3) {
    warn(
      `Metadata scoring references product fields: ${detectedFields.join(
        ", "
      )}`
    );
  }
} else {
  info("metadataScore not detected");
}

console.log("\n========================================");
console.log("ATTRIBUTE MATCHING");
console.log("========================================");

const attributes = [
  "category",
  "color",
  "style",
  "occasion",
  "material",
  "fit",
  "pattern"
];

const detectedAttributes = attributes.filter((attribute) =>
  aiSearchCode.toLowerCase().includes(attribute)
);

if (detectedAttributes.length >= 4) {
  pass(
    `Attribute matching detected: ${detectedAttributes.join(", ")}`
  );
} else {
  warn(
    `Limited attribute matching detected: ${detectedAttributes.join(
      ", "
    )}`
  );
}

console.log("\n========================================");
console.log("EVALUATION");
console.log("========================================");

[
  ["evaluate", files.evaluate],
  ["ablation", files.ablation],
  ["robustness", files.robustness],
  ["reproducibility", files.reproducibility],
  ["evaluationCases", files.evaluationCases]
].forEach(([name, file]) => {
  if (exists(file)) {
    pass(`${name} exists`);
  } else {
    warn(`${name} is missing`);
  }
});

if (exists(files.evaluation)) {
  const evaluationCode = read(files.evaluation);

  const metrics = [
    "precision",
    "recall",
    "f1",
    "mrr",
    "ndcg"
  ];

  const detectedMetrics = metrics.filter((metric) =>
    evaluationCode.toLowerCase().includes(metric)
  );

  if (detectedMetrics.length >= 3) {
    pass(
      `Evaluation metrics: ${detectedMetrics.join(", ")}`
    );
  } else {
    warn(
      `Limited evaluation metrics: ${detectedMetrics.join(", ")}`
    );
  }
}

console.log("\n========================================");
console.log("ABLATION");
console.log("========================================");

if (exists(files.ablation)) {
  const ablationCode = read(files.ablation);

  const components = [
    "semantic",
    "keyword",
    "attribute",
    "personal",
    "budget",
    "metadata"
  ];

  const detectedComponents = components.filter((component) =>
    ablationCode.toLowerCase().includes(component)
  );

  if (detectedComponents.length > 0) {
    pass(
      `Ablation components: ${detectedComponents.join(", ")}`
    );
  } else {
    warn("No ablation components detected");
  }
}

console.log("\n========================================");
console.log("REPRODUCIBILITY");
console.log("========================================");

if (exists(files.reproducibility)) {
  const reproducibilityCode = read(files.reproducibility);

  const signals = [
    "seed",
    "deterministic",
    "config",
    "version",
    "dataset"
  ];

  const detectedSignals = signals.filter((signal) =>
    reproducibilityCode.toLowerCase().includes(signal)
  );

  if (detectedSignals.length >= 3) {
    pass(
      `Reproducibility signals: ${detectedSignals.join(", ")}`
    );
  } else {
    warn(
      `Limited reproducibility signals: ${detectedSignals.join(
        ", "
      )}`
    );
  }
}

console.log("\n========================================");
console.log("V2 ARCHITECTURE");
console.log("========================================");

const targetServices = [
  "queryUnderstanding.js",
  "embeddingService.js",
  "vectorStore.js",
  "personalization.js",
  "stylist.js",
  "explanation.js"
];

targetServices.forEach((service) => {
  const servicePath = path.join(
    BACKEND_DIR,
    "services",
    service
  );

  if (exists(servicePath)) {
    pass(`services/${service}`);
  } else {
    info(`services/${service} not created yet`);
  }
});

console.log("\n========================================");
console.log("AUDIT RESULT");
console.log("========================================");

console.log(`PASS: ${passed}`);
console.log(`WARN: ${warnings}`);
console.log(`CRITICAL: ${critical}`);

if (critical > 0) {
  console.log("STATUS: CURRENT SYSTEM NEEDS V2 IMPROVEMENTS");
} else if (warnings > 0) {
  console.log("STATUS: CURRENT SYSTEM IS FUNCTIONAL WITH IMPROVEMENT AREAS");
} else {
  console.log("STATUS: CURRENT SYSTEM HAS A STRONG BASELINE");
}

console.log("\n========================================");
console.log("TARGET ARCHITECTURE");
console.log("========================================");

console.log(`
USER QUERY
    |
    v
QUERY UNDERSTANDING
    |
    +-----------------------+
    |                       |
    v                       v
QUERY EMBEDDING        STRUCTURED ATTRIBUTES
    |                       |
    v                       v
SEMANTIC RETRIEVAL    ATTRIBUTE RETRIEVAL
    |                       |
    +-----------+-----------+
                |
                v
        CANDIDATE FUSION
                |
                v
            ML RANKER
                |
        +-------+-------+
        |               |
        v               v
 USER PREFERENCES   CONSTRAINTS
        |               |
        +-------+-------+
                |
                v
      PERSONALIZED RANKING
                |
                v
      EXPLAINABLE RESULTS
                |
                v
           AI STYLIST
                |
                v
           EVALUATION
                |
        +-------+-------+
        |               |
        v               v
      ABLATION      ROBUSTNESS
                |
                v
        REPRODUCIBILITY
`);

console.log("========================================\n");
