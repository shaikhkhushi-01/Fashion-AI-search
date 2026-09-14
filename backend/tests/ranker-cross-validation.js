import assert from "node:assert/strict";

import dataset from "./ranking-dataset.js";

import {
    createTrainingPairs,
    predictScore,
    extractFeatures,
    trainPairwiseRanker
} from "../services/learningRanker.js";

function mean(values) {
    if (!values.length) {
        return 0;
    }

    return values.reduce(
        (sum, value) => sum + value,
        0
    ) / values.length;
}

function dcg(values) {
    return values.reduce(
        (sum, relevance, index) =>
            sum + ((2 ** relevance - 1) / Math.log2(index + 2)),
        0
    );
}

function ndcgAtK(rows, k = 5) {
    const actual = rows
        .slice(0, k)
        .map(row => row.relevance);

    const ideal = [...rows]
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, k)
        .map(row => row.relevance);

    const idealDcg = dcg(ideal);

    if (idealDcg === 0) {
        return 0;
    }

    return dcg(actual) / idealDcg;
}

function mrr(rows) {
    const index = rows.findIndex(
        row => row.relevance > 0
    );

    return index === -1 ? 0 : 1 / (index + 1);
}

function precisionAtK(rows, k = 5) {
    const top = rows.slice(0, k);

    if (!top.length) {
        return 0;
    }

    return top.filter(
        row => row.relevance > 0
    ).length / top.length;
}

function pairwiseAccuracy(rows) {
    let correct = 0;
    let total = 0;

    for (let left = 0; left < rows.length; left += 1) {
        for (let right = left + 1; right < rows.length; right += 1) {
            if (rows[left].relevance === rows[right].relevance) {
                continue;
            }

            total += 1;

            if (rows[left].relevance > rows[right].relevance) {
                correct += 1;
            }
        }
    }

    return total ? correct / total : 0;
}

function evaluateFold(testExample, model) {
    const query = testExample.query;
    const rows = testExample.products.map(item => {
        const product = item.product ?? item;
        const features = extractFeatures(
            product,
            query,
            undefined
        );

        return {
            product,
            relevance: Number(item.relevance ?? item.label ?? 0),
            score: predictScore(model, features)
        };
    });

    rows.sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }

        return String(a.product.id ?? "").localeCompare(
            String(b.product.id ?? ""),
            undefined,
            { numeric: true }
        );
    });

    return {
        query,
        precisionAt5: precisionAtK(rows, 5),
        mrr: mrr(rows),
        ndcgAt5: ndcgAtK(rows, 5),
        pairwiseAccuracy: pairwiseAccuracy(rows)
    };
}

const folds = [];

for (let testIndex = 0; testIndex < dataset.length; testIndex += 1) {
    const trainingData = dataset.filter(
        (_, index) => index !== testIndex
    );

    const testExample = dataset[testIndex];
    const pairs = createTrainingPairs(trainingData);

    assert.ok(pairs.length > 0);

    const model = trainPairwiseRanker(
        pairs,
        {
            epochs: 1000,
            learningRate: 0.05,
            l2: 0.001
        }
    );

    folds.push(
        evaluateFold(
            testExample,
            model
        )
    );
}

const summary = {
    protocol: "leave-one-query-out cross-validation",
    queries: folds.length,
    trainingPairsPerFold: dataset.map((_, testIndex) =>
        createTrainingPairs(
            dataset.filter((_, index) => index !== testIndex)
        ).length
    ),
    metrics: {
        precisionAt5: Number(mean(folds.map(item => item.precisionAt5)).toFixed(6)),
        mrr: Number(mean(folds.map(item => item.mrr)).toFixed(6)),
        ndcgAt5: Number(mean(folds.map(item => item.ndcgAt5)).toFixed(6)),
        pairwiseAccuracy: Number(mean(folds.map(item => item.pairwiseAccuracy)).toFixed(6))
    },
    folds
};

assert.equal(summary.queries, dataset.length);
assert.ok(summary.metrics.pairwiseAccuracy >= 0.5);
assert.ok(summary.metrics.precisionAt5 >= 0);
assert.ok(summary.metrics.precisionAt5 <= 1);
assert.ok(summary.metrics.ndcgAt5 >= 0);
assert.ok(summary.metrics.ndcgAt5 <= 1);

console.log(JSON.stringify(summary, null, 2));
console.log("Ranker cross-validation passed.");
