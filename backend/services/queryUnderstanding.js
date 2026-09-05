const CATEGORY_ALIASES = {
    shirt: ["shirt", "shirts", "tee", "tees", "tshirt", "t-shirt"],
    dress: ["dress", "dresses", "gown"],
    trousers: ["trouser", "trousers", "pants", "pant"],
    jeans: ["jean", "jeans", "denim"],
    hoodie: ["hoodie", "hoodies", "sweatshirt"],
    blazer: ["blazer", "blazers", "jacket"],
    sneakers: ["sneaker", "sneakers", "shoes", "shoe", "trainers"]
};

const GENDER_ALIASES = {
    men: ["men", "mens", "man", "male", "gents", "boys"],
    women: ["women", "womens", "woman", "female", "ladies", "girls"],
    unisex: ["unisex"]
};

const COLOR_ALIASES = {
    black: ["black", "jet black"],
    white: ["white", "ivory", "off white", "off-white"],
    red: ["red", "maroon", "burgundy"],
    blue: ["blue", "navy", "navy blue", "sky blue"],
    green: ["green", "olive", "mint"],
    yellow: ["yellow", "mustard"],
    pink: ["pink", "rose"],
    purple: ["purple", "violet"],
    brown: ["brown", "beige", "tan"],
    grey: ["grey", "gray", "charcoal"]
};

const STYLE_ALIASES = {
    casual: ["casual", "everyday", "relaxed"],
    formal: ["formal", "professional", "office", "business"],
    streetwear: ["streetwear", "street", "urban"],
    party: ["party", "glam", "glamorous"],
    sporty: ["sporty", "athletic", "sports", "activewear"],
    classic: ["classic", "timeless"],
    minimalist: ["minimalist", "minimal", "simple"],
    oversized: ["oversized", "baggy", "loose"]
};

const OCCASION_ALIASES = {
    office: ["office", "work", "workplace", "professional", "meeting"],
    college: ["college", "university", "campus"],
    party: ["party", "club", "night out"],
    wedding: ["wedding", "marriage", "reception"],
    casual: ["casual", "everyday", "daily"],
    travel: ["travel", "trip", "vacation", "holiday"],
    gym: ["gym", "workout", "exercise", "training"],
    date: ["date", "dating"]
};

const MATERIAL_ALIASES = {
    cotton: ["cotton"],
    denim: ["denim"],
    linen: ["linen"],
    wool: ["wool"],
    polyester: ["polyester"],
    leather: ["leather"],
    silk: ["silk"]
};

const STOP_WORDS = new Set([
    "a",
    "an",
    "the",
    "for",
    "with",
    "under",
    "below",
    "less",
    "than",
    "around",
    "between",
    "and",
    "or",
    "please",
    "show",
    "find",
    "me",
    "i",
    "want",
    "need",
    "looking",
    "look",
    "something",
    "some",
    "best",
    "good",
    "fashion",
    "clothes",
    "clothing",
    "wear",
    "outfit"
]);

function normalizeText(value) {
    return String(value ?? "")
        .toLowerCase()
        .replace(/[₹$€£]/g, " ")
        .replace(/[^a-z0-9\s-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function tokenize(query) {
    return normalizeText(query)
        .split(/\s+/)
        .filter(Boolean);
}

function escapeRegex(value) {
    return String(value).replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );
}

function containsPhrase(text, phrase) {
    const normalizedText = normalizeText(text);
    const normalizedPhrase = normalizeText(phrase);

    if (!normalizedPhrase) {
        return false;
    }

    const pattern = new RegExp(
        `(^|\\s)${escapeRegex(normalizedPhrase)}(\\s|$)`
    );

    return pattern.test(normalizedText);
}

function findAliasMatches(query, aliases) {
    const matches = [];

    for (const [canonical, values] of Object.entries(aliases)) {
        for (const value of values) {
            if (containsPhrase(query, value)) {
                matches.push({
                    value: canonical,
                    matchedTerm: value
                });
                break;
            }
        }
    }

    return matches;
}

function extractBudget(query) {
    const text = normalizeText(query);

    const patterns = [
        {
            type: "max",
            regex: /(?:under|below|less than|max|maximum|upto|up to)\s*(?:rs|inr)?\s*(\d+(?:\.\d+)?)/
        },
        {
            type: "max",
            regex: /(?:rs|inr)\s*(\d+(?:\.\d+)?)\s*(?:or less)?/
        },
        {
            type: "max",
            regex: /(\d+(?:\.\d+)?)\s*(?:rupees|rs)\s*(?:or less|maximum|max)?/
        },
        {
            type: "range",
            regex: /(?:between)\s*(?:rs|inr)?\s*(\d+(?:\.\d+)?)\s*(?:and|-|to)\s*(?:rs|inr)?\s*(\d+(?:\.\d+)?)/
        }
    ];

    for (const item of patterns) {
        const match = text.match(item.regex);

        if (!match) {
            continue;
        }

        if (item.type === "range") {
            return {
                type: "range",
                min: Number(match[1]),
                max: Number(match[2]),
                value: Number(match[2])
            };
        }

        return {
            type: "max",
            min: null,
            max: Number(match[1]),
            value: Number(match[1])
        };
    }

    return {
        type: null,
        min: null,
        max: null,
        value: null
    };
}

function removeMatchedTerms(
    query,
    extractedTerms
) {
    let text = normalizeText(query);

    for (const term of extractedTerms) {
        if (!term) {
            continue;
        }

        text = text.replace(
            new RegExp(
                `(^|\\s)${escapeRegex(
                    normalizeText(term)
                )}(?=\\s|$)`,
                "g"
            ),
            " "
        );
    }

    return text
        .replace(/\s+/g, " ")
        .trim();
}

function extractKeywords(
    query,
    matchedTerms = []
) {
    const remaining = removeMatchedTerms(
        query,
        matchedTerms
    );

    return [
        ...new Set(
            tokenize(remaining)
                .filter(
                    token =>
                        !STOP_WORDS.has(token)
                )
                .filter(
                    token =>
                        token.length > 1
                )
        )
    ];
}

function buildIntentConfidence(result) {
    let score = 0;

    if (result.category) {
        score += 0.2;
    }

    if (result.gender) {
        score += 0.1;
    }

    if (result.color) {
        score += 0.15;
    }

    if (result.style.length > 0) {
        score += 0.15;
    }

    if (result.occasion.length > 0) {
        score += 0.15;
    }

    if (result.material.length > 0) {
        score += 0.1;
    }

    if (
        result.budget.min !== null ||
        result.budget.max !== null
    ) {
        score += 0.1;
    }

    if (result.keywords.length > 0) {
        score += 0.05;
    }

    return Number(
        Math.min(1, score).toFixed(2)
    );
}

function parseQuery(query) {
    const originalQuery =
        String(query ?? "").trim();

    const normalizedQuery =
        normalizeText(originalQuery);

    const categoryMatches =
        findAliasMatches(
            normalizedQuery,
            CATEGORY_ALIASES
        );

    const genderMatches =
        findAliasMatches(
            normalizedQuery,
            GENDER_ALIASES
        );

    const colorMatches =
        findAliasMatches(
            normalizedQuery,
            COLOR_ALIASES
        );

    const styleMatches =
        findAliasMatches(
            normalizedQuery,
            STYLE_ALIASES
        );

    const occasionMatches =
        findAliasMatches(
            normalizedQuery,
            OCCASION_ALIASES
        );

    const materialMatches =
        findAliasMatches(
            normalizedQuery,
            MATERIAL_ALIASES
        );

    const budget =
        extractBudget(normalizedQuery);

    const matchedTerms = [
        ...categoryMatches.map(
            item => item.matchedTerm
        ),
        ...genderMatches.map(
            item => item.matchedTerm
        ),
        ...colorMatches.map(
            item => item.matchedTerm
        ),
        ...styleMatches.map(
            item => item.matchedTerm
        ),
        ...occasionMatches.map(
            item => item.matchedTerm
        ),
        ...materialMatches.map(
            item => item.matchedTerm
        )
    ];

    const keywords =
        extractKeywords(
            normalizedQuery,
            matchedTerms
        );

    const result = {
        query: originalQuery,
        normalizedQuery,
        category:
            categoryMatches[0]?.value || null,
        gender:
            genderMatches[0]?.value || null,
        color:
            colorMatches[0]?.value || null,
        style: [
            ...new Set(
                styleMatches.map(
                    item => item.value
                )
            )
        ],
        occasion: [
            ...new Set(
                occasionMatches.map(
                    item => item.value
                )
            )
        ],
        material: [
            ...new Set(
                materialMatches.map(
                    item => item.value
                )
            )
        ],
        budget,
        keywords,
        matchedTerms: [
            ...new Set(matchedTerms)
        ]
    };

    return {
        ...result,
        confidence:
            buildIntentConfidence(result)
    };
}

function buildStructuredQuery(intent) {
    const parts = [];

    if (intent.category) {
        parts.push(
            `category ${intent.category}`
        );
    }

    if (intent.gender) {
        parts.push(
            `gender ${intent.gender}`
        );
    }

    if (intent.color) {
        parts.push(
            `color ${intent.color}`
        );
    }

    if (intent.style?.length) {
        parts.push(
            `style ${intent.style.join(" ")}`
        );
    }

    if (intent.occasion?.length) {
        parts.push(
            `occasion ${intent.occasion.join(" ")}`
        );
    }

    if (intent.material?.length) {
        parts.push(
            `material ${intent.material.join(" ")}`
        );
    }

    if (intent.keywords?.length) {
        parts.push(
            intent.keywords.join(" ")
        );
    }

    return parts.join(" ").trim();
}

export {
    CATEGORY_ALIASES,
    COLOR_ALIASES,
    GENDER_ALIASES,
    MATERIAL_ALIASES,
    OCCASION_ALIASES,
    STYLE_ALIASES,
    buildStructuredQuery,
    extractBudget,
    extractKeywords,
    normalizeText,
    parseQuery,
    tokenize
};
