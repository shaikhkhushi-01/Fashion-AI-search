import assert from "node:assert/strict";

import dataset from "./ranking-dataset.js";

import {
    loadModel,
    rankWithModel
} from "../services/learningRanker.js";

const model =
    loadModel();

assert.ok(
    model
);

assert.ok(
    Array.isArray(
        model.weights
    )
);

assert.equal(
    model.weights.length,
    6
);

const example =
    dataset[0];

const products =
    example.products.map(
        item =>
            item.product
    );

const result =
    rankWithModel(
        products,
        example.query,
        model,
        {
            limit: 3
        }
    );

assert.ok(
    result.results.length > 0
);

assert.equal(
    result.results[0]
        .product.id,
    1
);

const scores =
    result.results.map(
        item =>
            item.score
    );

assert.deepEqual(
    scores,
    [...scores].sort(
        (a, b) =>
            b - a
    )
);

assert.ok(
    scores.every(
        score =>
            score >= 0 &&
            score <= 1
    )
);

console.log(
    JSON.stringify(
        result,
        null,
        2
    )
);

console.log(
    "Ranker inference test passed."
);
