import assert from "node:assert/strict";

import {
    fuseRankedLists,
    hybridRetrieve,
    lexicalScore,
    rankCandidates
} from "../services/hybridRetrieval.js";

const products = [
    {
        id: 1,
        name: "Black Formal Shirt",
        brand: "Urban Mode",
        category: "shirt",
        gender: "men",
        color: "black",
        material: "cotton",
        style: "formal",
        occasion: "office",
        price: 1999,
        description:
            "Classic black formal cotton shirt for office wear",
        tags: [
            "formal",
            "office",
            "black"
        ],
        semanticScore: 0.92
    },
    {
        id: 2,
        name: "Blue Casual Shirt",
        brand: "Daily Wear",
        category: "shirt",
        gender: "men",
        color: "blue",
        material: "cotton",
        style: "casual",
        occasion: "college",
        price: 1499,
        description:
            "Comfortable blue casual shirt",
        tags: [
            "casual",
            "college",
            "blue"
        ],
        semanticScore: 0.55
    },
    {
        id: 3,
        name: "Black Party Dress",
        brand: "Style House",
        category: "dress",
        gender: "women",
        color: "black",
        material: "polyester",
        style: "party",
        occasion: "party",
        price: 2499,
        description:
            "Elegant black party dress",
        tags: [
            "party",
            "black"
        ],
        semanticScore: 0.48
    }
];

const query =
    "black formal shirt for office under 3000";

const lexical =
    lexicalScore(
        query,
        products[0]
    );

assert.ok(
    lexical > 0
);

const ranked =
    rankCandidates(
        products,
        query,
        {
            limit: 3
        }
    );

assert.equal(
    ranked.results[0].product.id,
    1
);

const hybrid =
    hybridRetrieve(
        products,
        query,
        {
            limit: 3,
            candidateLimit: 3
        }
    );

assert.ok(
    hybrid.results.length > 0
);

assert.equal(
    hybrid.results[0].product.id,
    1
);

assert.equal(
    hybrid.retrieval.method,
    "semantic-lexical-rrf"
);

const fused =
    fuseRankedLists(
        [
            [
                {
                    product: products[0],
                    score: 0.9
                },
                {
                    product: products[1],
                    score: 0.7
                }
            ],
            [
                {
                    product: products[1],
                    score: 0.95
                },
                {
                    product: products[0],
                    score: 0.8
                }
            ]
        ]
    );

assert.equal(
    fused.length,
    2
);

assert.equal(
    fused[0].product.id,
    1
);

console.log(
    "Hybrid retrieval tests passed."
);
