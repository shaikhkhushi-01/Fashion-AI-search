import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PRODUCTS_PATH = path.join(
    __dirname,
    "..",
    "..",
    "data",
    "products.json"
);

const REQUIRED_FIELDS = [
    "id",
    "name",
    "category",
    "gender",
    "color",
    "price",
    "description"
];

const ARRAY_FIELDS = [
    "style",
    "occasion",
    "material",
    "tags"
];

function normalizeText(value) {
    return String(value ?? "")
        .replace(/\s+/g, " ")
        .trim();
}

function normalizeKey(value) {
    return normalizeText(value)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

function normalizeArray(value) {
    if (Array.isArray(value)) {
        return [
            ...new Set(
                value
                    .map(normalizeText)
                    .filter(Boolean)
            )
        ];
    }

    if (value === undefined || value === null) {
        return [];
    }

    return normalizeText(value)
        .split(",")
        .map(normalizeText)
        .filter(Boolean);
}

function normalizeProduct(product) {
    const normalized = {
        ...product,
        id: normalizeText(product.id),
        name: normalizeText(product.name),
        brand: normalizeText(product.brand),
        category: normalizeText(product.category),
        gender: normalizeText(product.gender),
        color: normalizeText(product.color),
        description: normalizeText(product.description),
        price: Number(product.price)
    };

    for (const field of ARRAY_FIELDS) {
        normalized[field] = normalizeArray(product[field]);
    }

    normalized.searchText = [
        normalized.brand,
        normalized.name,
        normalized.category,
        normalized.gender,
        normalized.color,
        ...normalized.style,
        ...normalized.occasion,
        ...normalized.material,
        ...normalized.tags,
        normalized.description
    ]
        .filter(Boolean)
        .join(" ");

    normalized.searchKey = normalizeKey(
        normalized.searchText
    );

    return normalized;
}

function loadRawProducts() {
    if (!fs.existsSync(PRODUCTS_PATH)) {
        throw new Error(
            `Dataset not found: ${PRODUCTS_PATH}`
        );
    }

    const raw = fs.readFileSync(
        PRODUCTS_PATH,
        "utf8"
    );

    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
        return parsed;
    }

    if (
        parsed &&
        Array.isArray(parsed.products)
    ) {
        return parsed.products;
    }

    throw new Error(
        "products.json must contain an array or a products array."
    );
}

function validateProducts(products) {
    const errors = [];
    const warnings = [];
    const ids = new Set();
    const normalized = [];

    products.forEach((product, index) => {
        if (
            !product ||
            typeof product !== "object" ||
            Array.isArray(product)
        ) {
            errors.push({
                index,
                issue: "Invalid product object"
            });
            return;
        }

        const item = normalizeProduct(product);

        for (const field of REQUIRED_FIELDS) {
            if (
                field === "price"
            ) {
                if (
                    !Number.isFinite(
                        item.price
                    ) ||
                    item.price < 0
                ) {
                    errors.push({
                        index,
                        id: item.id,
                        field,
                        issue: "Invalid price"
                    });
                }

                continue;
            }

            if (!item[field]) {
                errors.push({
                    index,
                    id: item.id,
                    field,
                    issue: "Missing required field"
                });
            }
        }

        if (item.id) {
            if (ids.has(item.id)) {
                errors.push({
                    index,
                    id: item.id,
                    issue: "Duplicate product ID"
                });
            }

            ids.add(item.id);
        }

        for (const field of ARRAY_FIELDS) {
            if (
                !Array.isArray(
                    item[field]
                )
            ) {
                errors.push({
                    index,
                    id: item.id,
                    field,
                    issue: "Field must be an array"
                });
            }

            if (
                Array.isArray(item[field]) &&
                item[field].length === 0
            ) {
                warnings.push({
                    index,
                    id: item.id,
                    field,
                    issue: "Empty array field"
                });
            }
        }

        if (
            item.description.length < 20
        ) {
            warnings.push({
                index,
                id: item.id,
                field: "description",
                issue: "Description is very short"
            });
        }

        if (
            !item.brand
        ) {
            warnings.push({
                index,
                id: item.id,
                field: "brand",
                issue: "Brand is missing"
            });
        }

        normalized.push(item);
    });

    return {
        normalized,
        errors,
        warnings
    };
}

function calculateStatistics(products) {
    const prices = products
        .map(product => product.price)
        .filter(Number.isFinite);

    const categories = new Set();
    const genders = new Set();
    const colors = new Set();
    const styles = new Set();
    const occasions = new Set();
    const materials = new Set();
    const tags = new Set();

    products.forEach(product => {
        if (product.category) {
            categories.add(
                normalizeKey(product.category)
            );
        }

        if (product.gender) {
            genders.add(
                normalizeKey(product.gender)
            );
        }

        if (product.color) {
            colors.add(
                normalizeKey(product.color)
            );
        }

        product.style.forEach(value =>
            styles.add(
                normalizeKey(value)
            )
        );

        product.occasion.forEach(value =>
            occasions.add(
                normalizeKey(value)
            )
        );

        product.material.forEach(value =>
            materials.add(
                normalizeKey(value)
            )
        );

        product.tags.forEach(value =>
            tags.add(
                normalizeKey(value)
            )
        );
    });

    return {
        productCount: products.length,
        categoryCount: categories.size,
        genderCount: genders.size,
        colorCount: colors.size,
        styleCount: styles.size,
        occasionCount: occasions.size,
        materialCount: materials.size,
        tagCount: tags.size,
        price: {
            min: prices.length
                ? Math.min(...prices)
                : null,
            max: prices.length
                ? Math.max(...prices)
                : null,
            mean: prices.length
                ? Number(
                    (
                        prices.reduce(
                            (sum, price) =>
                                sum + price,
                            0
                        ) / prices.length
                    ).toFixed(2)
                )
                : null
        }
    };
}

function calculateQualityScore(
    productCount,
    errors,
    warnings
) {
    if (productCount === 0) {
        return 0;
    }

    const errorPenalty =
        Math.min(
            70,
            (errors.length / productCount) *
            100
        );

    const warningPenalty =
        Math.min(
            30,
            (warnings.length / productCount) *
            20
        );

    return Number(
        Math.max(
            0,
            100 -
            errorPenalty -
            warningPenalty
        ).toFixed(2)
    );
}

function auditDataset() {
    const rawProducts =
        loadRawProducts();

    const result =
        validateProducts(
            rawProducts
        );

    const statistics =
        calculateStatistics(
            result.normalized
        );

    const qualityScore =
        calculateQualityScore(
            rawProducts.length,
            result.errors,
            result.warnings
        );

    return {
        valid:
            result.errors.length === 0,
        qualityScore,
        errors: result.errors,
        warnings: result.warnings,
        statistics,
        products: result.normalized
    };
}

function getDatasetPath() {
    return PRODUCTS_PATH;
}

export {
    auditDataset,
    calculateQualityScore,
    calculateStatistics,
    getDatasetPath,
    loadRawProducts,
    normalizeArray,
    normalizeProduct,
    normalizeText,
    validateProducts
};
