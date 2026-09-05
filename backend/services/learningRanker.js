import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
    hybridRetrieve,
    lexicalScore,
    attributeScore,
    budgetScore
} from "./hybridRetrieval.js";

import {
    parseQuery
} from "./queryUnderstanding.js";

const __filename =
    fileURLToPath(import.meta.url);

const __dirname =
    path.dirname(__filename);

const DEFAULT_MODEL_PATH =
    path.resolve(
        __dirname,
        "../evaluation-results/ranker-model.json"
    );

const FEATURE_NAMES = [
    "semantic",
    "lexical",
    "attribute",
    "budget",
    "metadata",
    "fusion"
];

function clamp(
    value,
    min,
    max
) {
    return Math.min(
        max,
        Math.max(min, value)
    );
}

function sigmoid(value) {
    if (value >= 0) {
        const z =
            Math.exp(-value);

        return 1 /
            (1 + z);
    }

    const z =
        Math.exp(value);

    return z /
        (1 + z);
}

function dot(
    weights,
    features
) {
    let total = 0;

    for (
        let index = 0;
        index < weights.length;
        index += 1
    ) {
        total +=
            weights[index] *
            features[index];
    }

    return total;
}

function mean(
    values
) {
    if (!values.length) {
        return 0;
    }

    return values.reduce(
        (sum, value) =>
            sum + value,
        0
    ) / values.length;
}

function standardDeviation(
    values
) {
    if (values.length < 2) {
        return 0;
    }

    const average =
        mean(values);

    const variance =
        mean(
            values.map(
                value =>
                    (value - average) ** 2
            )
        );

    return Math.sqrt(
        variance
    );
}

function normalizeFeature(
    value
) {
    return clamp(
        Number(value) || 0,
        0,
        1
    );
}

function getFusionScore(
    product,
    query,
    options = {}
) {
    const result =
        hybridRetrieve(
            [product],
            query,
            {
                ...options,
                limit: 1,
                candidateLimit: 1
            }
        );

    return (
        result.results[0]?.fusionScore ??
        0
    );
}

function getSemanticSignal(
    product
) {
    const fields = [
        "semanticScore",
        "semantic_similarity",
        "similarity",
        "embeddingScore",
        "vectorScore"
    ];

    for (const field of fields) {
        const value =
            Number(product[field]);

        if (
            Number.isFinite(value)
        ) {
            if (
                value >= 0 &&
                value <= 1
            ) {
                return value;
            }

            return clamp(
                (value + 1) / 2,
                0,
                1
            );
        }
    }

    return 0;
}

function getMetadataSignal(
    product
) {
    const fields = [
        "name",
        "brand",
        "category",
        "description"
    ];

    const available =
        fields.filter(
            field =>
                product[field] !==
                    undefined &&
                product[field] !==
                    null &&
                String(
                    product[field]
                ).trim() !== ""
        ).length;

    return available /
        fields.length;
}

function extractFeatures(
    product,
    query,
    intent,
    options = {}
) {
    const semantic =
        getSemanticSignal(
            product
        );

    const lexical =
        lexicalScore(
            query,
            product
        );

    const attribute =
        attributeScore(
            intent,
            product
        );

    const budget =
        budgetScore(
            intent.budget,
            product
        );

    const metadata =
        getMetadataSignal(
            product
        );

    const fusion =
        getFusionScore(
            product,
            query,
            options
        );

    return [
        normalizeFeature(
            semantic
        ),
        normalizeFeature(
            lexical
        ),
        normalizeFeature(
            attribute
        ),
        normalizeFeature(
            budget
        ),
        normalizeFeature(
            metadata
        ),
        normalizeFeature(
            fusion
        )
    ];
}

function relevanceToScore(
    relevance
) {
    const value =
        Number(relevance);

    if (
        !Number.isFinite(value)
    ) {
        return 0;
    }

    if (value <= 0) {
        return 0;
    }

    if (value === 1) {
        return 1;
    }

    return clamp(
        value / 3,
        0,
        1
    );
}

function createTrainingPairs(
    dataset,
    options = {}
) {
    const pairs = [];

    for (
        const example of dataset
    ) {
        const query =
            String(
                example.query ?? ""
            ).trim();

        if (!query) {
            continue;
        }

        const intent =
            parseQuery(query);

        const products =
            example.products ??
            [];

        const featureRows =
            products.map(
                item => ({
                    product:
                        item.product ??
                        item,
                    features:
                        extractFeatures(
                            item.product ??
                                item,
                            query,
                            intent,
                            options
                        ),
                    relevance:
                        Number(
                            item.relevance ??
                            item.label ??
                            0
                        )
                })
            );

        for (
            let left = 0;
            left < featureRows.length;
            left += 1
        ) {
            for (
                let right =
                    left + 1;
                right <
                    featureRows.length;
                right += 1
            ) {
                const first =
                    featureRows[left];

                const second =
                    featureRows[right];

                if (
                    first.relevance ===
                    second.relevance
                ) {
                    continue;
                }

                if (
                    first.relevance >
                    second.relevance
                ) {
                    pairs.push({
                        positive:
                            first.features,
                        negative:
                            second.features
                    });
                } else {
                    pairs.push({
                        positive:
                            second.features,
                        negative:
                            first.features
                    });
                }
            }
        }
    }

    return pairs;
}

function trainPairwiseRanker(
    pairs,
    options = {}
) {
    const learningRate =
        options.learningRate ??
        0.05;

    const epochs =
        options.epochs ??
        500;

    const l2 =
        options.l2 ??
        0.001;

    const weights =
        Array(
            FEATURE_NAMES.length
        ).fill(0);

    let bias = 0;

    const losses = [];

    for (
        let epoch = 0;
        epoch < epochs;
        epoch += 1
    ) {
        let loss = 0;

        for (
            const pair of pairs
        ) {
            const difference =
                pair.positive.map(
                    (
                        value,
                        index
                    ) =>
                        value -
                        pair.negative[
                            index
                        ]
                );

            const margin =
                dot(
                    weights,
                    difference
                ) + bias;

            const probability =
                sigmoid(
                    margin
                );

            const error =
                1 - probability;

            for (
                let index = 0;
                index <
                    weights.length;
                index += 1
            ) {
                weights[index] +=
                    learningRate *
                    (
                        error *
                        difference[index] -
                        l2 *
                        weights[index]
                    );
            }

            bias +=
                learningRate *
                error;

            loss +=
                -Math.log(
                    Math.max(
                        probability,
                        1e-12
                    )
                );
        }

        losses.push(
            loss /
            Math.max(
                pairs.length,
                1
            )
        );
    }

    return {
        version: 1,
        algorithm:
            "pairwise-logistic-ranking",
        featureNames:
            FEATURE_NAMES,
        weights,
        bias,
        training: {
            epochs,
            learningRate,
            l2,
            pairs:
                pairs.length,
            finalLoss:
                losses[
                    losses.length - 1
                ] ?? 0
        }
    };
}

function predictScore(
    model,
    features
) {
    if (
        !model ||
        !Array.isArray(
            model.weights
        )
    ) {
        throw new Error(
            "Invalid ranker model"
        );
    }

    const raw =
        dot(
            model.weights,
            features
        ) +
        Number(
            model.bias ?? 0
        );

    return Number(
        sigmoid(raw).toFixed(6)
    );
}

function rankWithModel(
    products,
    query,
    model,
    options = {}
) {
    if (
        !Array.isArray(products)
    ) {
        throw new TypeError(
            "Products must be an array"
        );
    }

    const intent =
        parseQuery(query);

    const ranked =
        products.map(
            product => {
                const features =
                    extractFeatures(
                        product,
                        query,
                        intent,
                        options
                    );

                const score =
                    predictScore(
                        model,
                        features
                    );

                return {
                    product,
                    score,
                    features
                };
            }
        );

    ranked.sort(
        (a, b) => {
            if (
                b.score !==
                a.score
            ) {
                return (
                    b.score -
                    a.score
                );
            }

            return String(
                a.product.id ?? ""
            ).localeCompare(
                String(
                    b.product.id ?? ""
                ),
                undefined,
                {
                    numeric: true
                }
            );
        }
    );

    const limit =
        options.limit ?? 20;

    return {
        query,
        intent,
        model:
            "pairwise-logistic-ranking",
        results:
            ranked
                .slice(
                    0,
                    limit
                )
                .map(
                    (
                        item,
                        index
                    ) => ({
                        ...item,
                        rank:
                            index + 1
                    })
                )
    };
}

function evaluateRanker(
    dataset,
    model,
    options = {}
) {
    const queryResults = [];

    for (
        const example of dataset
    ) {
        const query =
            String(
                example.query ?? ""
            ).trim();

        if (!query) {
            continue;
        }

        const intent =
            parseQuery(query);

        const rows =
            (
                example.products ??
                []
            ).map(
                item => {
                    const product =
                        item.product ??
                        item;

                    const features =
                        extractFeatures(
                            product,
                            query,
                            intent,
                            options
                        );

                    const score =
                        predictScore(
                            model,
                            features
                        );

                    return {
                        product,
                        score,
                        relevance:
                            Number(
                                item.relevance ??
                                item.label ??
                                0
                            )
                    };
                }
            );

        rows.sort(
            (a, b) =>
                b.score -
                a.score
        );

        const rankedRelevant =
            rows.filter(
                item =>
                    item.relevance > 0
            );

        let correctOrder = 0;
        let comparisons = 0;

        for (
            let left = 0;
            left < rows.length;
            left += 1
        ) {
            for (
                let right =
                    left + 1;
                right <
                    rows.length;
                right += 1
            ) {
                if (
                    rows[left]
                        .relevance ===
                    rows[right]
                        .relevance
                ) {
                    continue;
                }

                comparisons += 1;

                if (
                    rows[left]
                        .relevance >
                    rows[right]
                        .relevance
                ) {
                    correctOrder += 1;
                }
            }
        }

        const precision =
            rows.length
                ? rankedRelevant.length /
                  rows.length
                : 0;

        queryResults.push({
            query,
            precision:
                Number(
                    precision.toFixed(6)
                ),
            pairwiseAccuracy:
                comparisons
                    ? Number(
                        (
                            correctOrder /
                            comparisons
                        ).toFixed(6)
                    )
                    : 0
        });
    }

    return {
        queries:
            queryResults.length,
        meanPrecision:
            Number(
                mean(
                    queryResults.map(
                        item =>
                            item.precision
                    )
                ).toFixed(6)
            ),
        meanPairwiseAccuracy:
            Number(
                mean(
                    queryResults.map(
                        item =>
                            item.pairwiseAccuracy
                    )
                ).toFixed(6)
            ),
        queryResults
    };
}

function saveModel(
    model,
    filePath = DEFAULT_MODEL_PATH
) {
    const directory =
        path.dirname(filePath);

    fs.mkdirSync(
        directory,
        {
            recursive: true
        }
    );

    fs.writeFileSync(
        filePath,
        JSON.stringify(
            model,
            null,
            2
        ),
        "utf-8"
    );

    return filePath;
}

function loadModel(
    filePath = DEFAULT_MODEL_PATH
) {
    if (
        !fs.existsSync(
            filePath
        )
    ) {
        return null;
    }

    return JSON.parse(
        fs.readFileSync(
            filePath,
            "utf-8"
        )
    );
}

function modelSummary(
    model
) {
    if (!model) {
        return null;
    }

    return {
        algorithm:
            model.algorithm,
        featureNames:
            model.featureNames,
        weights:
            model.weights,
        bias:
            model.bias,
        training:
            model.training
    };
}

export {
    FEATURE_NAMES,
    createTrainingPairs,
    evaluateRanker,
    extractFeatures,
    loadModel,
    modelSummary,
    predictScore,
    rankWithModel,
    saveModel,
    trainPairwiseRanker
};
