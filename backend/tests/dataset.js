import assert from "node:assert/strict";
import {
    auditDataset
} from "../services/datasetQuality.js";

const report = auditDataset();

console.log(
    JSON.stringify(
        {
            valid: report.valid,
            qualityScore:
                report.qualityScore,
            statistics:
                report.statistics,
            errorCount:
                report.errors.length,
            warningCount:
                report.warnings.length
        },
        null,
        2
    )
);

assert.ok(
    report.statistics.productCount > 0,
    "Dataset must contain products"
);

assert.equal(
    report.errors.length,
    0,
    `Dataset contains ${report.errors.length} validation errors`
);

assert.ok(
    report.qualityScore >= 90,
    `Dataset quality score is too low: ${report.qualityScore}`
);

console.log(
    "Dataset quality test passed."
);
