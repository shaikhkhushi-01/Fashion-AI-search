import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import dataset from "./ranking-dataset.js";

import {
    createTrainingPairs,
    predictScore,
    extractFeatures,
    trainPairwiseRanker
} from "../services/learningRanker.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputPath = path.resolve(__dirname, "../evaluation-results/ranker-research-report.json");

function mean(values) {
    if (!values.length) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function dcg(values) {
    return values.reduce((sum, relevance, index) => sum + ((2 ** relevance - 1) / Math.log2(index + 2)), 0);
}

function ndcgAtK(rows, k = 5) {
    const actual = rows.slice(0, k).map(row => row.relevance);
    const ideal = [...rows].sort((a, b) => b.relevance - a.relevance).slice(0, k).map(row => row.relevance);
    const idealDcg = dcg(ideal);
    return idealDcg ? dcg(actual) / idealDcg : 0;
}

function mrr(rows) {
    const index = rows.findIndex(row => row.relevance > 0);
    return index === -1 ? 0 : 1 / (index + 1);
}

function precisionAtK(rows, k = 5) {
    const top = rows.slice(0, k);
    return top.length ? top.filter(row => row.relevance > 0).length / top.length : 0;
}

function pairwiseAccuracy(rows) {
    let correct = 0;
    let total = 0;

    for (let left = 0; left < rows.length; left += 1) {
        for (let right = left + 1; right < rows.length; right += 1) {
            if (rows[left].relevance === rows[right].relevance) continue;
            total += 1;
            if (rows[left].relevance > rows[right].relevance) correct += 1;
        }
    }

    return total ? correct / total : 0;
}

function evaluateFold(testExample, model) {
    const rows = testExample.products.map(item => {
        const product = item.product ?? item;
        const features = extractFeatures(product, testExample.query);
        return {
            product,
            relevance: Number(item.relevance ?? item.label ?? 0),
            score: predictScore(model, features)
        };
    });

    rows.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return String(a.product.id ?? "").localeCompare(String(b.product.id ?? ""), undefined, { numeric: true });
    });

    return {
        query: testExample.query,
        precisionAt5: precisionAtK(rows),
        mrr: mrr(rows),
        ndcgAt5: ndcgAtK(rows),
        pairwiseAccuracy: pairwiseAccuracy(rows),
        ranking: rows.map((row, index) => ({ id: row.product.id, rank: index + 1, relevance: row.relevance, score: row.score }))
    };
}

const folds = [];

for (let testIndex = 0; testIndex < dataset.length; testIndex += 1) {
    const trainingData = dataset.filter((_, index) => index !== testIndex);
    const model = trainPairwiseRanker(createTrainingPairs(trainingData), {
        epochs: 1000,
        learningRate: 0.05,
        l2: 0.001
    });
    folds.push(evaluateFold(dataset[testIndex], model));
}

const report = {
    experiment: "learning-to-rank-research-evaluation",
    protocol: "leave-one-query-out cross-validation",
    datasetQueries: dataset.length,
    featureNames: ["semantic", "lexical", "attribute", "budget", "metadata", "fusion"],
    training: {
        algorithm: "pairwise-logistic-ranking",
        epochs: 1000,
        learningRate: 0.05,
        l2: 0.001
    },
    metrics: {
        precisionAt5: Number(mean(folds.map(item => item.precisionAt5)).toFixed(6)),
        mrr: Number(mean(folds.map(item => item.mrr)).toFixed(6)),
        ndcgAt5: Number(mean(folds.map(item => item.ndcgAt5)).toFixed(6)),
        pairwiseAccuracy: Number(mean(folds.map(item => item.pairwiseAccuracy)).toFixed(6))
    },
    folds,
    limitations: [
        "The current ranking dataset contains three labeled queries.",
        "The evaluation is intended as a reproducible prototype ranking experiment rather than broad empirical evidence.",
        "The semantic feature in the ranking dataset is currently a supplied benchmark signal and should be replaced with independently generated embedding features for larger experiments."
    ]
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), "utf-8");

if (report.metrics.pairwiseAccuracy < 0.5) {
    throw new Error("Ranker research evaluation failed");
}

console.log(JSON.stringify(report, null, 2));
console.log(`Ranker research report written to ${outputPath}`);
