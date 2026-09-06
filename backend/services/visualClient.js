const DEFAULT_VISUAL_URL =
  process.env.VISUAL_API_URL ||
  process.env.SEMANTIC_API_URL ||
  "http://127.0.0.1:8000";

async function requestJson(
  url,
  options = {},
  timeoutMs = 15000
) {
  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      () => controller.abort(),
      timeoutMs
    );

  try {
    const response =
      await fetch(url, {
        ...options,
        signal: controller.signal
      });

    if (!response.ok) {
      throw new Error(
        `Visual API returned ${response.status}`
      );
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function visualSearch(
  image,
  topK = 20,
  baseUrl = DEFAULT_VISUAL_URL
) {
  const url =
    `${baseUrl.replace(/\/$/, "")}` +
    `/api/visual-search`;

  return requestJson(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json"
      },
      body: JSON.stringify({
        image,
        top_k: Number(topK)
      })
    }
  );
}

function extractVisualResults(
  payload
) {
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

function buildVisualScoreMap(
  payload
) {
  const results =
    extractVisualResults(
      payload
    );

  const map = new Map();

  for (const item of results) {
    const id =
      item?.id ??
      item?.product_id;

    const score =
      Number(
        item?.score ??
        item?.similarity ??
        item?.visualScore
      );

    if (
      id !== undefined &&
      Number.isFinite(score)
    ) {
      map.set(
        String(id),
        Math.max(
          0,
          Math.min(1, score)
        )
      );
    }
  }

  return map;
}

async function attachVisualScores(
  products,
  image,
  topK = 50,
  baseUrl = DEFAULT_VISUAL_URL
) {
  const payload =
    await visualSearch(
      image,
      topK,
      baseUrl
    );

  const scoreMap =
    buildVisualScoreMap(
      payload
    );

  return products.map(
    product => ({
      ...product,
      visualScore:
        scoreMap.get(
          String(product.id)
        ) ?? 0
    })
  );
}

export {
  requestJson,
  visualSearch,
  extractVisualResults,
  buildVisualScoreMap,
  attachVisualScores
};
