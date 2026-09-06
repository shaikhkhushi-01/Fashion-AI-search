import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

function hashFile(filePath) {
  const buffer = fs.readFileSync(filePath);

  return crypto
    .createHash("sha256")
    .update(buffer)
    .digest("hex");
}

function collectFiles(rootDir, relativeFiles) {
  return relativeFiles
    .filter(file => fs.existsSync(path.join(rootDir, file)))
    .map(file => ({
      file,
      sha256: hashFile(path.join(rootDir, file))
    }));
}

function createProjectManifest({
  rootDir,
  version = "1.0.0"
}) {
  const files = collectFiles(rootDir, [
    "package.json",
    "services/aiSearch.js",
    "services/personalization.js",
    "services/personalizationV2.js",
    "services/baselines.js",
    "services/evaluation.js",
    "services/statistics.js",
    "services/errorAnalysis.js",
    "services/researchPipeline.js",
    "services/researchReport.js",
    "services/datasetSplit.js"
  ]);

  return {
    project: "Fashion AI Discovery",
    version,
    generatedAt: new Date().toISOString(),
    runtime: {
      node: process.version,
      platform: process.platform,
      architecture: process.arch
    },
    files
  };
}

function writeProjectManifest({
  rootDir,
  outputPath,
  version = "1.0.0"
}) {
  const manifest = createProjectManifest({
    rootDir,
    version
  });

  fs.mkdirSync(path.dirname(outputPath), {
    recursive: true
  });

  fs.writeFileSync(
    outputPath,
    JSON.stringify(manifest, null, 2)
  );

  return manifest;
}

export {
  hashFile,
  collectFiles,
  createProjectManifest,
  writeProjectManifest
};
