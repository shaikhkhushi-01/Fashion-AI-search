import assert from "node:assert/strict";
import {
    parseQuery,
    buildStructuredQuery
} from "../services/queryUnderstanding.js";

const cases = [
    {
        query: "black formal shirt for office under 3000",
        expected: {
            category: "shirt",
            color: "black",
            style: "formal",
            occasion: "office",
            budget: 3000
        }
    },
    {
        query: "comfortable blue sneakers for college",
        expected: {
            category: "sneakers",
            color: "blue",
            occasion: "college"
        }
    },
    {
        query: "red dress for party",
        expected: {
            category: "dress",
            color: "red",
            occasion: "party"
        }
    },
    {
        query: "women cotton casual shirt under 2000",
        expected: {
            category: "shirt",
            gender: "women",
            material: "cotton",
            style: "casual",
            budget: 2000
        }
    }
];

for (const testCase of cases) {
    const result =
        parseQuery(
            testCase.query
        );

    assert.equal(
        result.category,
        testCase.expected.category ??
            null
    );

    assert.equal(
        result.color,
        testCase.expected.color ??
            null
    );

    assert.equal(
        result.gender,
        testCase.expected.gender ??
            null
    );

    if (testCase.expected.style) {
        assert.ok(
            result.style.includes(
                testCase.expected.style
            )
        );
    }

    if (testCase.expected.occasion) {
        assert.ok(
            result.occasion.includes(
                testCase.expected.occasion
            )
        );
    }

    if (testCase.expected.material) {
        assert.ok(
            result.material.includes(
                testCase.expected.material
            )
        );
    }

    if (
        testCase.expected.budget
    ) {
        assert.equal(
            result.budget.max,
            testCase.expected.budget
        );
    }

    assert.ok(
        result.confidence > 0
    );

    console.log(
        JSON.stringify(
            {
                query: testCase.query,
                intent: result,
                structuredQuery:
                    buildStructuredQuery(
                        result
                    )
            },
            null,
            2
        )
    );
}

console.log(
    "Query understanding tests passed."
);
