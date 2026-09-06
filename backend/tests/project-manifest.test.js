import assert from "node:assert/strict";
import path from "node:path";
import {
  createProjectManifest
} from "../services/projectManifest.js";

const rootDir = path.resolve(".");

const manifest = createProjectManifest({
  rootDir
});

assert.equal(
  manifest.project,
  "Fashion AI Discovery"
);

assert.ok(manifest.version);
assert.ok(Array.isArray(manifest.files));
assert.ok(manifest.runtime.node);

console.log("Project manifest tests completed");
