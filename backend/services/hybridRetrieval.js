import {
    parseQuery,
    normalizeText,
    tokenize
} from "./queryUnderstanding.js";

function toNumber(value) {
    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : null;
}

function normalizeArray(value) {
    if (Array.isArray(value)) {
        return value
            .map(item => normalizeText(item))
            .filter(Boolean);
    }

    if (value === null || value === undefined) {
        return [];
    }

    return normalizeText(value)
        .split(/[,\s]+/)
        .filter(Boolean);
}

function productText(product) {
    const values = [
        product.id,
        product.name,
        product.brand,
        product.category,
        product.gender,
        product.color,
        product.material,
        product.style,
        product.occasion,
        product.description,
        ...normalizeArray(product.tags)
    ];

    return normalizeText(
        values
            .filter(value => value !== null && value !== undefined)
            .join(" ")
    );
}

function fieldText(product, fields) {
    return normalizeText(
        fields
            .flatMap(field => {
                const value = product[field];

                if (Array.isArray(value)) {
                    return value;
                }

                return value ?? "";
            })
            .join(" ")
    );
}

function termFrequencyScore(tokens, text) {
    if (!tokens.length || !text) {
        return 0;
    }

    const words = new Set(tokenize(text));

    const matched = tokens.filter(
        token => words.has(token)
    );

    return matched.length / tokens.length;
}

function phraseScore(query, text) {
    const normalizedQuery = normalizeText(query);
    const normalizedText = normalizeText(text);

    if (!normalizedQuery || !normalizedText) {
        return 0;
    }

    if (normalizedText.includes(normalizedQuery)) {
        return 1;
    }

    return 0;
}

function lexicalScore(query, product) {
    const tokens = tokenize(query);
    const text = productText(product);

    if (!tokens.length || !text) {
        return 0;
    }

    const tokenScore =
        termFrequencyScore(
            tokens,
            text
        );

    const exactPhraseScore =
        phraseScore(
            query,
            text
        );

    return Math.min(
        1,
        tokenScore * 0.8 +
        exactPhraseScore * 0.2
    );
}

function attributeMatch(
    value,
    expected
) {
    if (!expected) {
        return 0;
    }

    const productValue =
        normalizeText(value);

    const expectedValue =
        normalizeText(expected);

    if (!productValue || !expectedValue) {
        return 0;
    }

    if (productValue === expectedValue) {
        return 1;
    }

    if (
        productValue.includes(
            expectedValue
        )
    ) {
        return 0.85;
    }

    const productTokens =
        new Set(
            tokenize(productValue)
        );

    const expectedTokens =
        tokenize(expectedValue);

    if (!expectedTokens.length) {
        return 0;
    }

    const matches =
        expectedTokens.filter(
            token =>
                productTokens.has(token)
        ).length;

    return matches /
        expectedTokens.length;
}

function multiAttributeMatch(
    values,
    expected
) {
    if (!Array.isArray(expected) ||
        expected.length === 0) {
        return 0;
    }

    const scores = expected.map(
        item =>
            attributeMatch(
                values,
                item
            )
    );

    return Math.max(
        ...scores,
        0
    );
}

function attributeScore(
    intent,
    product
) {
    const scores = [];

    if (intent.category) {
        scores.push(
            attributeMatch(
                product.category,
                intent.category
            )
        );
    }

    if (intent.gender) {
        scores.push(
            attributeMatch(
                product.gender,
                intent.gender
            )
        );
    }

    if (intent.color) {
        scores.push(
            attributeMatch(
                product.color,
                intent.color
            )
        );
    }

    if (intent.style?.length) {
        scores.push(
            multiAttributeMatch(
                product.style,
                intent.style
            )
        );
    }

    if (intent.occasion?.length) {
        scores.push(
            multiAttributeMatch(
                product.occasion,
                intent.occasion
            )
        );
    }

    if (intent.material?.length) {
        scores.push(
            multiAttributeMatch(
                product.material,
                intent.material
            )
        );
    }

    if (!scores.length) {
        return 0;
    }

    return scores.reduce(
        (sum, value) =>
            sum + value,
        0
    ) / scores.length;
}

function budgetScore(
    budget,
    product
) {
    if (!budget) {
        return 0.5;
    }

    const price =
        toNumber(product.price);

    if (price === null) {
        return 0;
    }

    if (
        budget.max !== null &&
        price <= budget.max
    ) {
        return 1;
    }

    if (
        budget.min !== null &&
        budget.max !== null &&
        price >= budget.min &&
        price <= budget.max
    ) {
        return 1;
    }

    if (
        budget.max !== null &&
        price > budget.max
    ) {
        const difference =
            price - budget.max;

        return Math.max(
            0,
            1 -
            difference /
            Math.max(
                budget.max,
                1
            )
        );
    }

    if (
        budget.min !== null &&
        price < budget.min
    ) {
        const difference =
            budget.min - price;

        return Math.max(
            0,
            1 -
            difference /
            Math.max(
                budget.min,
                1
            )
        );
    }

    return 0;
}

function normalizeSemanticScore(
    value
) {
    const score = toNumber(value);

    if (score === null) {
        return null;
    }

    if (
        score >= 0 &&
        score <= 1
    ) {
        return score;
    }

    return (
        score + 1
    ) / 2;
}

function semanticScore(
    product
) {
    const possibleFields = [
        "semanticScore",
        "semantic_similarity",
        "similarity",
        "embeddingScore",
        "vectorScore"
    ];

    for (const field of possibleFields) {
        const score =
            normalizeSemanticScore(
                product[field]
            );

        if (score !== null) {
            return score;
        }
    }

    return null;
}

function getMetadataScore(
    product
) {
    const fields = [
        "name",
        "brand",
        "category",
        "description"
    ];

    const present =
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

    return present /
        fields.length;
}

function scoreCandidate(
    product,
    query,
    intent,
    options = {}
) {
    const lexical =
        lexicalScore(
            query,
            product
        );

    const attributes =
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
        getMetadataScore(
            product
        );

    const semantic =
        semanticScore(product);

    const semanticSignal =
        semantic === null
            ? lexical
            : semantic;

    const weights = {
        semantic:
            options.semanticWeight ??
            0.45,
        lexical:
            options.lexicalWeight ??
            0.20,
        attribute:
            options.attributeWeight ??
            0.20,
        budget:
            options.budgetWeight ??
            0.10,
        metadata:
            options.metadataWeight ??
            0.05
    };

    const totalWeight =
        Object.values(
            weights
        ).reduce(
            (sum, value) =>
                sum + value,
            0
        );

    const score =
        (
            semanticSignal *
                weights.semantic +
            lexical *
                weights.lexical +
            attributes *
                weights.attribute +
            budget *
                weights.budget +
            metadata *
                weights.metadata
        ) /
        totalWeight;

    return {
        score: Number(
            score.toFixed(6)
        ),
        signals: {
            semantic: Number(
                semanticSignal.toFixed(6)
            ),
            lexical: Number(
                lexical.toFixed(6)
            ),
            attribute: Number(
                attributes.toFixed(6)
            ),
            budget: Number(
                budget.toFixed(6)
            ),
            metadata: Number(
                metadata.toFixed(6)
            )
        }
    };
}

function applyHardConstraints(
    product,
    intent
) {
    if (
        intent.budget?.max !== null &&
        intent.budget?.max !== undefined
    ) {
        const price =
            toNumber(product.price);

        if (
            price !== null &&
            price > intent.budget.max
        ) {
            return false;
        }
    }

    if (
        intent.budget?.min !== null &&
        intent.budget?.min !== undefined
    ) {
        const price =
            toNumber(product.price);

        if (
            price !== null &&
            price < intent.budget.min
        ) {
            return false;
        }
    }

    return true;
}

function rankCandidates(
    products,
    query,
    options = {}
) {
    const intent =
        options.intent ||
        parseQuery(query);

    const candidates =
        products
            .filter(
                product =>
                    applyHardConstraints(
                        product,
                        intent
                    )
            )
            .map(
                product => {
                    const scored =
                        scoreCandidate(
                            product,
                            query,
                            intent,
                            options
                        );

                    return {
                        product,
                        score:
                            scored.score,
                        signals:
                            scored.signals
                    };
                }
            );

    candidates.sort(
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

            const aId =
                String(
                    a.product.id ?? ""
                );

            const bId =
                String(
                    b.product.id ?? ""
                );

            return aId.localeCompare(
                bId,
                undefined,
                {
                    numeric: true
                }
            );
        }
    );

    const limit =
        Number.isInteger(
            options.limit
        )
            ? options.limit
            : 20;

    return {
        query,
        intent,
        totalCandidates:
            candidates.length,
        results:
            candidates
                .slice(
                    0,
                    limit
                )
                .map(
                    (item, index) => ({
                        ...item,
                        rank:
                            index + 1
                    })
                )
    };
}

function fuseRankedLists(
    rankedLists,
    options = {}
) {
    const rrfK =
        options.rrfK ?? 60;

    const fused =
        new Map();

    for (
        const list of rankedLists
    ) {
        for (
            let index = 0;
            index < list.length;
            index += 1
        ) {
            const item = list[index];

            const product =
                item.product ||
                item;

            const id =
                String(
                    product.id
                );

            if (!fused.has(id)) {
                fused.set(
                    id,
                    {
                        product,
                        fusionScore: 0,
                        sources: []
                    }
                );
            }

            const entry =
                fused.get(id);

            entry.fusionScore +=
                1 /
                (
                    rrfK +
                    index +
                    1
                );

            entry.sources.push(
                {
                    rank:
                        index + 1,
                    score:
                        item.score ??
                        null
                }
            );
        }
    }

    const results =
        [...fused.values()]
            .sort(
                (a, b) =>
                    b.fusionScore -
                    a.fusionScore
            )
            .map(
                (item, index) => ({
                    ...item,
                    rank:
                        index + 1,
                    fusionScore:
                        Number(
                            item.fusionScore.toFixed(
                                8
                            )
                        )
                })
            );

    const limit =
        Number.isInteger(
            options.limit
        )
            ? options.limit
            : 20;

    return results.slice(
        0,
        limit
    );
}

function hybridRetrieve(
    products,
    query,
    options = {}
) {
    const intent =
        options.intent ||
        parseQuery(query);

    const lexicalLimit =
        options.lexicalLimit ?? 50;

    const semanticLimit =
        options.semanticLimit ?? 50;

    const lexical =
        products
            .filter(
                product =>
                    applyHardConstraints(
                        product,
                        intent
                    )
            )
            .map(
                product => {
                    const score =
                        lexicalScore(
                            query,
                            product
                        );

                    return {
                        product,
                        score
                    };
                }
            )
            .sort(
                (a, b) =>
                    b.score -
                    a.score
            )
            .slice(
                0,
                lexicalLimit
            );

    const semantic =
        products
            .filter(
                product =>
                    applyHardConstraints(
                        product,
                        intent
                    )
            )
            .map(
                product => {
                    const rawSemantic =
                        semanticScore(
                            product
                        );

                    const score =
                        rawSemantic === null
                            ? lexicalScore(
                                query,
                                product
                            )
                            : rawSemantic;

                    return {
                        product,
                        score
                    };
                }
            )
            .sort(
                (a, b) =>
                    b.score -
                    a.score
            )
            .slice(
                0,
                semanticLimit
            );

    const fused =
        fuseRankedLists(
            [
                semantic,
                lexical
            ],
            {
                rrfK:
                    options.rrfK ??
                    60,
                limit:
                    options.candidateLimit ??
                    50
            }
        );

    const reranked =
        fused.map(item => {
            const scored =
                scoreCandidate(
                    item.product,
                    query,
                    intent,
                    options
                );

            return {
                product:
                    item.product,
                score:
                    scored.score,
                fusionScore:
                    item.fusionScore,
                signals:
                    scored.signals,
                sources:
                    item.sources
            };
        });

    reranked.sort(
        (a, b) =>
            b.score -
            a.score
    );

    const limit =
        options.limit ?? 20;

    return {
        query,
        intent,
        retrieval: {
            semanticCandidates:
                semantic.length,
            lexicalCandidates:
                lexical.length,
            fusedCandidates:
                fused.length,
            method:
                "semantic-lexical-rrf"
        },
        results:
            reranked
                .slice(
                    0,
                    limit
                )
                .map(
                    (item, index) => ({
                        ...item,
                        rank:
                            index + 1
                    })
                )
    };
}

export {
    applyHardConstraints,
    attributeScore,
    budgetScore,
    fuseRankedLists,
    hybridRetrieve,
    lexicalScore,
    productText,
    rankCandidates,
    scoreCandidate,
    semanticScore
};
