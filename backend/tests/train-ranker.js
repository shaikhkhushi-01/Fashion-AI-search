import dataset from "./ranking-dataset.js";

import {
    createTrainingPairs,
    evaluateRanker,
    modelSummary,
    saveModel,
    trainPairwiseRanker
} from "../services/learningRanker.js";

const pairs =
    createTrainingPairs(
        dataset
    );

if (
    pairs.length === 0
) {
    throw new Error(
        "No training pairs generated"
    );
}

const model =
    trainPairwiseRanker(
        pairs,
        {
            epochs: 1000,
            learningRate: 0.05,
            l2: 0.001
        }
    );

const evaluation =
    evaluateRanker(
        dataset,
        model
    );

const output =
    {
        model:
            modelSummary(
                model
            ),
        evaluation
    };

saveModel(
    model
);

console.log(
    JSON.stringify(
        output,
        null,
        2
    )
);

if (
    !Number.isFinite(
        evaluation.meanPairwiseAccuracy
    )
) {
    throw new Error(
        "Invalid ranker evaluation"
    );
}

if (
    evaluation.meanPairwiseAccuracy <
    0.5
) {
    throw new Error(
        "Ranker failed to learn meaningful ordering"
    );
}

console.log(
    "Learning-to-rank training passed."
);
