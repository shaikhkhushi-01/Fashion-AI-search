import crypto from "crypto";

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function hashObject(value) {
  return crypto
    .createHash("sha256")
    .update(stableStringify(value))
    .digest("hex");
}

function datasetFingerprint(products) {
  return hashObject(
    Array.isArray(products)
      ? products.map(product => ({
          id: product?.id,
          name: product?.name,
          brand: product?.brand,
          category: product?.category,
          gender: product?.gender,
          color: product?.color,
          style: product?.style,
          occasion: product?.occasion,
          material: product?.material,
          price: product?.price,
          tags: product?.tags
        }))
      : []
  );
}

function environmentFingerprint() {
  return {
    node: process.version,
    platform: process.platform,
    architecture: process.arch,
    runtime: "node"
  };
}

function createExperimentFingerprint({
  experiment,
  products,
  evaluationCases,
  configuration = {}
}) {
  return hashObject({
    experiment,
    dataset: datasetFingerprint(products),
    evaluationCases,
    configuration,
    environment: environmentFingerprint()
  });
}

function createReproducibilityManifest({
  experiment,
  products,
  evaluationCases,
  configuration = {},
  results = {}
}) {
  const datasetHash =
    datasetFingerprint(products);

  const fingerprint =
    createExperimentFingerprint({
      experiment,
      products,
      evaluationCases,
      configuration
    });

  return {
    experiment,
    datasetSize: Array.isArray(products)
      ? products.length
      : 0,
    evaluationCases:
      Array.isArray(evaluationCases)
        ? evaluationCases.length
        : 0,
    datasetHash,
    experimentFingerprint: fingerprint,
    configuration,
    environment: environmentFingerprint(),
    results,
    generatedAt: new Date().toISOString()
  };
}

export {
  stableStringify,
  hashObject,
  datasetFingerprint,
  environmentFingerprint,
  createExperimentFingerprint,
  createReproducibilityManifest
};
