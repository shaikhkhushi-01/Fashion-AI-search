import {
  extractFeatures,
  predictScore
} from "./learningRanker.js";

function safeModel(model) {
  if (
    !model ||
    !Array.isArray(model.weights)
  ) {
    return null;
  }

  return model;
}

function rankWithLearningModel(
  products,
  query,
  model
) {
  const activeModel =
    safeModel(model);

  if (!activeModel) {
    return products;
  }

  return products
    .map((product, index) => {
      const features =
        extractFeatures(
          product,
          query
        );

      const score =
        predictScore(
          activeModel,
          features
        );

      return {
        ...product,
        rankingScore: score,
        _index: index
      };
    })
    .sort((a, b) => {
      if (
        b.rankingScore !==
        a.rankingScore
      ) {
        return (
          b.rankingScore -
          a.rankingScore
        );
      }

      return a._index - b._index;
    })
    .map(product => {
      const result = {
        ...product
      };

      delete result._index;

      return result;
    });
}

function combineHybridAndRanker(
  products,
  query,
  model
) {
  const ranked =
    rankWithLearningModel(
      products,
      query,
      model
    );

  return ranked.map(product => {
    const hybrid =
      Number(product.hybridScore) || 0;

    const ranking =
      Number(product.rankingScore) || 0;

    return {
      ...product,
      finalScore:
        hybrid * 0.4 +
        ranking * 0.6
    };
  }).sort(
    (a, b) =>
      b.finalScore -
      a.finalScore
  );
}

export {
  rankWithLearningModel,
  combineHybridAndRanker
};
