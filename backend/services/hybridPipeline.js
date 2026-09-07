import { hybridRetrieve } from "./hybridRetrieval.js";

function rankHybrid(products, query, options = {}) {
  const result = hybridRetrieve(
    products,
    query,
    {
      ...options,
      limit: options.limit ?? products.length
    }
  );

  return result.results.map(item => ({
    ...item.product,
    hybridScore: Number(
      item.score ?? item.fusionScore ?? 0
    ),
    fusionScore: Number(
      item.fusionScore ?? 0
    ),
    hybridSignals: item.signals ?? {},
    hybridSources: item.sources ?? [],
    rank: item.rank
  }));
}

export {
  rankHybrid
};
