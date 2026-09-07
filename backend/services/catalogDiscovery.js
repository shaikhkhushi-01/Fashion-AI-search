```js
import { tokenize } from "./aiSearch.js";

function normalize(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function values(value) {
  if (Array.isArray(value)) {
    return value
      .map(normalize)
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map(normalize)
      .filter(Boolean);
  }

  return [];
}

function matchesValue(productValue, filterValue) {
  const productValues = values(productValue);
  const filterValues = values(filterValue);

  if (!filterValues.length) {
    return true;
  }

  return filterValues.some(filter =>
    productValues.some(product =>
      product === filter
    )
  );
}

function matchesPrice(product, minPrice, maxPrice) {
  const price = Number(product.price);

  if (!Number.isFinite(price)) {
    return false;
  }

  if (
    minPrice !== undefined &&
    minPrice !== null &&
    minPrice !== ""
  ) {
    const minimum = Number(minPrice);

    if (
      !Number.isFinite(minimum) ||
      price < minimum
    ) {
      return false;
    }
  }

  if (
    maxPrice !== undefined &&
    maxPrice !== null &&
    maxPrice !== ""
  ) {
    const maximum = Number(maxPrice);

    if (
      !Number.isFinite(maximum) ||
      price > maximum
    ) {
      return false;
    }
  }

  return true;
}

function matchesSearch(product, query) {
  const tokens = tokenize(query);

  if (!tokens.length) {
    return true;
  }

  const searchableText = [
    product.name,
    product.brand,
    product.category,
    product.gender,
    product.color,
    product.style,
    product.occasion,
    product.material,
    product.fit,
    product.pattern,
    product.description,
    product.tags
  ]
    .flatMap(value => values(value))
    .join(" ");

  return tokens.every(token =>
    searchableText.includes(token)
  );
}

function filterCatalogue(
  products = [],
  options = {}
) {
  const {
    query = "",
    category = "",
    gender = "",
    color = "",
    style = "",
    occasion = "",
    material = "",
    minPrice = "",
    maxPrice = ""
  } = options;

  return products.filter(product => {
    if (!matchesSearch(product, query)) {
      return false;
    }

    if (!matchesValue(product.category, category)) {
      return false;
    }

    if (!matchesValue(product.gender, gender)) {
      return false;
    }

    if (!matchesValue(product.color, color)) {
      return false;
    }

    if (!matchesValue(product.style, style)) {
      return false;
    }

    if (!matchesValue(product.occasion, occasion)) {
      return false;
    }

    if (!matchesValue(product.material, material)) {
      return false;
    }

    if (!matchesPrice(product, minPrice, maxPrice)) {
      return false;
    }

    return true;
  });
}

function numericScore(product, fields) {
  for (const field of fields) {
    const value = Number(product[field]);

    if (Number.isFinite(value)) {
      return value;
    }
  }

  return 0;
}

function sortCatalogue(
  products = [],
  sort = "relevance"
) {
  const result = [...products];

  if (sort === "price-low") {
    return result.sort(
      (a, b) =>
        numericScore(a, ["price"]) -
        numericScore(b, ["price"])
    );
  }

  if (sort === "price-high") {
    return result.sort(
      (a, b) =>
        numericScore(b, ["price"]) -
        numericScore(a, ["price"])
    );
  }

  if (sort === "rating") {
    return result.sort(
      (a, b) =>
        numericScore(
          b,
          ["rating", "averageRating"]
        ) -
        numericScore(
          a,
          ["rating", "averageRating"]
        )
    );
  }

  if (sort === "personalized") {
    return result.sort(
      (a, b) =>
        numericScore(
          b,
          ["personalizedScore"]
        ) -
        numericScore(
          a,
          ["personalizedScore"]
        )
    );
  }

  if (sort === "ai") {
    return result.sort(
      (a, b) =>
        numericScore(
          b,
          [
            "relevanceScore",
            "aiScore",
            "semanticScore",
            "similarity"
          ]
        ) -
        numericScore(
          a,
          [
            "relevanceScore",
            "aiScore",
            "semanticScore",
            "similarity"
          ]
        )
    );
  }

  return result.sort(
    (a, b) =>
      numericScore(
        b,
        [
          "personalizedScore",
          "relevanceScore",
          "aiScore",
          "semanticScore",
          "similarity"
        ]
      ) -
      numericScore(
        a,
        [
          "personalizedScore",
          "relevanceScore",
          "aiScore",
          "semanticScore",
          "similarity"
        ]
      )
  );
}

function paginate(
  products = [],
  page = 1,
  pageSize = 12
) {
  const safePage = Math.max(
    1,
    Number(page) || 1
  );

  const safePageSize = Math.max(
    1,
    Math.min(
      100,
      Number(pageSize) || 12
    )
  );

  const total = products.length;

  const totalPages = Math.max(
    1,
    Math.ceil(total / safePageSize)
  );

  const currentPage = Math.min(
    safePage,
    totalPages
  );

  const start =
    (currentPage - 1) *
    safePageSize;

  return {
    items: products.slice(
      start,
      start + safePageSize
    ),
    pagination: {
      page: currentPage,
      pageSize: safePageSize,
      total,
      totalPages,
      hasNext:
        currentPage < totalPages,
      hasPrevious:
        currentPage > 1
    }
  };
}

function buildDiscoveryResult(
  products = [],
  options = {}
) {
  const filtered = filterCatalogue(
    products,
    options
  );

  const sorted = sortCatalogue(
    filtered,
    options.sort
  );

  return paginate(
    sorted,
    options.page,
    options.pageSize
  );
}

function getFilterValues(products = []) {
  const collect = field => {
    const result = new Set();

    for (const product of products) {
      for (const value of values(
        product[field]
      )) {
        result.add(value);
      }
    }

    return [...result].sort();
  };

  return {
    categories:
      collect("category"),
    genders:
      collect("gender"),
    colors:
      collect("color"),
    styles:
      collect("style"),
    occasions:
      collect("occasion"),
    materials:
      collect("material")
  };
}

function buildSearchSuggestions(
  products = [],
  query = "",
  limit = 8
) {
  const cleanQuery = normalize(query);

  if (!cleanQuery) {
    return [];
  }

  const candidates = new Set();

  for (const product of products) {
    const fields = [
      product.name,
      product.brand,
      product.category,
      product.color,
      product.style,
      product.occasion,
      product.material
    ];

    for (const field of fields) {
      for (const value of values(field)) {
        if (
          value.includes(cleanQuery) ||
          cleanQuery.includes(value)
        ) {
          candidates.add(value);
        }
      }
    }
  }

  return [...candidates]
    .slice(
      0,
      Math.max(1, Number(limit) || 8)
    );
}

export {
  normalize,
  values,
  matchesValue,
  matchesPrice,
  matchesSearch,
  filterCatalogue,
  sortCatalogue,
  paginate,
  buildDiscoveryResult,
  getFilterValues,
  buildSearchSuggestions
};
```
