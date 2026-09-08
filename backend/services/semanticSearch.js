import {
  pipeline
} from "@huggingface/transformers";

const MODEL_NAME =
  process.env.SEMANTIC_MODEL ||
  "Xenova/all-MiniLM-L6-v2";

const MAX_CACHE_SIZE =
  Number(process.env.SEMANTIC_CACHE_SIZE) || 5000;

let extractor = null;
let extractorPromise = null;

const productCache = new Map();

function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeArray(value) {
  if (Array.isArray(value)) {
    return value
      .map(item => String(item ?? "").trim())
      .filter(Boolean);
  }

  if (
    typeof value === "string" &&
    value.trim()
  ) {
    return value
      .split(",")
      .map(item => item.trim())
      .filter(Boolean);
  }

  return [];
}

function productToText(product) {
  const fields = [
    ["name", product?.name],
    ["brand", product?.brand],
    ["category", product?.category],
    ["description", product?.description],
    ["color", product?.color],
    ["style", product?.style],
    ["occasion", product?.occasion],
    ["material", product?.material],
    ["gender", product?.gender],
    ["fit", product?.fit],
    ["pattern", product?.pattern],
    ["fabric", product?.fabric],
    ["tags", product?.tags]
  ];

  return fields
    .flatMap(([label, value]) => {
      const values = normalizeArray(value);

      if (!values.length) {
        return [];
      }

      return [`${label}: ${values.join(" ")}`];
    })
    .join(" | ");
}

async function getExtractor() {
  if (extractor) {
    return extractor;
  }

  if (!extractorPromise) {
    extractorPromise = pipeline(
      "feature-extraction",
      MODEL_NAME
    );
  }

  extractor = await extractorPromise;

  return extractor;
}

function vectorFromOutput(output) {
  if (!output) {
    return null;
  }

  if (
    typeof output.tolist === "function"
  ) {
    const values = output.tolist();

    if (
      Array.isArray(values) &&
      Array.isArray(values[0])
    ) {
      if (Array.isArray(values[0][0])) {
        return values[0][0];
      }

      return values[0];
    }

    if (Array.isArray(values)) {
      return values;
    }
  }

  if (
    Array.isArray(output)
  ) {
    if (
      Array.isArray(output[0])
    ) {
      return output[0];
    }

    return output;
  }

  return null;
}

function normalizeVector(vector) {
  if (
    !Array.isArray(vector) ||
    !vector.length
  ) {
    return [];
  }

  let magnitude = 0;

  for (const value of vector) {
    const number = Number(value);

    if (Number.isFinite(number)) {
      magnitude += number * number;
    }
  }

  magnitude = Math.sqrt(magnitude);

  if (
    !Number.isFinite(magnitude) ||
    magnitude === 0
  ) {
    return vector.map(() => 0);
  }

  return vector.map(
    value =>
      Number(value) / magnitude
  );
}

function cosineSimilarity(
  vectorA,
  vectorB
) {
  if (
    !vectorA?.length ||
    !vectorB?.length ||
    vectorA.length !== vectorB.length
  ) {
    return 0;
  }

  let score = 0;

  for (
    let index = 0;
    index < vectorA.length;
    index++
  ) {
    score +=
      Number(vectorA[index]) *
      Number(vectorB[index]);
  }

  return Math.max(
    -1,
    Math.min(
      1,
      score
    )
  );
}

function cacheSet(
  key,
  value
) {
  if (
    productCache.has(key)
  ) {
    productCache.delete(key);
  }

  productCache.set(
    key,
    value
  );

  while (
    productCache.size >
    MAX_CACHE_SIZE
  ) {
    const firstKey =
      productCache.keys().next().value;

    productCache.delete(
      firstKey
    );
  }
}

async function embedText(
  text
) {
  const cleanText =
    String(text ?? "").trim();

  if (!cleanText) {
    return [];
  }

  const model =
    await getExtractor();

  const output =
    await model(
      cleanText,
      {
        pooling: "mean",
        normalize: true
      }
    );

  return normalizeVector(
    vectorFromOutput(output)
  );
}

async function embedProducts(
  products
) {
  if (
    !Array.isArray(products) ||
    !products.length
  ) {
    return [];
  }

  const results = [];

  for (
    const product of products
  ) {
    const id =
      String(
        product?.id ?? ""
      );

    const text =
      productToText(
        product
      );

    const cacheKey =
      `${id}::${text}`;

    let embedding =
      productCache.get(
        cacheKey
      );

    if (!embedding) {
      embedding =
        await embedText(
          text
        );

      cacheSet(
        cacheKey,
        embedding
      );
    }

    results.push({
      product,
      embedding
    });
  }

  return results;
}

async function semanticSearch(
  products,
  query,
  options = {}
) {
  if (
    !Array.isArray(products) ||
    !products.length
  ) {
    return [];
  }

  const cleanQuery =
    normalizeText(
      query
    );

  if (!cleanQuery) {
    return [];
  }

  const limit =
    Math.max(
      1,
      Math.min(
        Number(options.limit) || 10,
        100
      )
    );

  const queryEmbedding =
    await embedText(
      cleanQuery
    );

  if (
    !queryEmbedding.length
  ) {
    return [];
  }

  const embeddedProducts =
    await embedProducts(
      products
    );

  return embeddedProducts
    .map(
      ({
        product,
        embedding
      }) => ({
        product,
        score:
          cosineSimilarity(
            queryEmbedding,
            embedding
          )
      })
    )
    .sort(
      (a, b) =>
        b.score - a.score
    )
    .slice(
      0,
      limit
    )
    .map(
      (
        item,
        index
      ) => ({
        product:
          item.product,
        score:
          Number(
            item.score.toFixed(6)
          ),
        rank:
          index + 1
      })
    );
}

async function getSemanticScoreMap(
  products,
  query
) {
  const results =
    await semanticSearch(
      products,
      query,
      {
        limit:
          Array.isArray(products)
            ? products.length
            : 100
      }
    );

  const scoreMap =
    new Map();

  for (
    const result of results
  ) {
    const id =
      String(
        result?.product?.id ??
        ""
      );

    if (id) {
      scoreMap.set(
        id,
        Number(
          result.score
        )
      );
    }
  }

  return scoreMap;
}

function getModelName() {
  return MODEL_NAME;
}

function getSemanticStatus() {
  return {
    model:
      MODEL_NAME,
    loaded:
      Boolean(extractor),
    cachedProducts:
      productCache.size
  };
}

export {
  semanticSearch,
  getSemanticScoreMap,
  getModelName,
  getSemanticStatus,
  productToText
};
