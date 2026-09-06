const DEFAULT_SEMANTIC_URL =
  process.env.SEMANTIC_API_URL ||
  "http://127.0.0.1:8000";

async function requestJson(
  url,
  options = {},
  timeoutMs = 10000
) {
  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      () => controller.abort(),
      timeoutMs
    );

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(
        `Semantic API returned ${response.status}`
      );
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function semanticSearch(
  query,
  topK = 20,
  baseUrl = DEFAULT_SEMANTIC_URL
) {
  const url =
    `${baseUrl.replace(/\/$/, "")}` +
    `/api/semantic-search`;

  return requestJson(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query: String(query ?? ""),
      top_k: Number(topK)
    })
  });
}

async function semanticHealth(
  baseUrl = DEFAULT_SEMANTIC_URL
) {
  const url =
    `${baseUrl.replace(/\/$/, "")}/health`;

  return requestJson(url, {
    method: "GET"
  });
}

function extractSemanticResults(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (
    payload &&
    Array.isArray(payload.results)
  ) {
    return payload.results;
  }

  if (
    payload &&
    Array.isArray(payload.products)
  ) {
    return payload.products;
  }

  return [];
}

function buildSemanticScoreMap(payload) {
  const results =
    extractSemanticResults(payload);

  const map = new Map();

  for (const item of results) {
    const id =
      item?.id ??
      item?.product_id;

    const score =
      Number(
        item?.score ??
        item?.similarity ??
        item?.semanticScore
      );

    if (
      id !== undefined &&
      Number.isFinite(score)
    ) {
      map.set(
        String(id),
        Math.max(0, Math.min(1, score))
      );
    }
  }

  return map;
}

async function attachSemanticScores(
  products,
  query,
  topK = 50,
  baseUrl = DEFAULT_SEMANTIC_URL
) {
  const payload =
    await semanticSearch(
      query,
      topK,
      baseUrl
    );

  const scoreMap =
    buildSemanticScoreMap(payload);

  return products.map(product => ({
    ...product,
    semanticScore:
      scoreMap.get(String(product.id)) ?? 0
  }));
}

export {
  requestJson,
  semanticSearch,
  semanticHealth,
  extractSemanticResults,
  buildSemanticScoreMap,
  attachSemanticScores
};
